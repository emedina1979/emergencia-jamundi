import type { SupabaseClient } from '@supabase/supabase-js';

export type NivelDano = 'leve' | 'moderado' | 'severo';
export type SistemaConstructivo = 'mamposteria' | 'madera';
export type MaterialCubierta =
  | 'placa_concreto' | 'madera' | 'asbesto_cemento' | 'teja_barro' | 'zinc' | 'palma' | 'otro';

export interface ElementoEvaluadoInput {
  elemento: string;
  fue_afectado: boolean;
  nivel_dano: NivelDano | null;
}

export interface ItemCombo {
  categoria: 'estructura' | 'cubierta_zinc' | 'cubierta_fibrocemento' | 'herramientas';
  kit_nombre: string;
  item_descripcion: string;
  unidad: string;
  cantidad: number;
}

export interface ResultadoCombo {
  nivel_dano_general: NivelDano | null;
  items: ItemCombo[];
  advertencias: string[];
}

const SEVERIDAD: Record<NivelDano, number> = { leve: 1, moderado: 2, severo: 3 };

/**
 * El Excel fuente (ANEXO 2) asigna el combo de materiales de ESTRUCTURA a un
 * único nivel de daño "de la vivienda", no uno por elemento. El formato F1
 * permite calificar cada elemento (vigas, muros, cubierta, instalaciones) por
 * separado, así que alguien tiene que definir cómo pasar de "N calificaciones
 * por elemento" a "1 nivel de daño de la vivienda".
 *
 * Regla implementada (ASUNCIÓN, no viene explícita en el Excel): se usa el
 * peor nivel de daño entre los elementos marcados como afectados. Esto es
 * conservador (nunca sub-asigna materiales) pero debe confirmarse contra el
 * Manual Operativo de la UNGRD antes de producción — si el manual define otra
 * regla (p.ej. promedio ponderado, o solo elementos portantes), cambiar solo
 * esta función.
 */
export function calcularNivelDanoGeneral(elementos: ElementoEvaluadoInput[]): NivelDano | null {
  const afectados = elementos.filter((e) => e.fue_afectado && e.nivel_dano);
  if (afectados.length === 0) return null;
  return afectados.reduce<NivelDano>((peor, e) => {
    const actual = e.nivel_dano as NivelDano;
    return SEVERIDAD[actual] > SEVERIDAD[peor] ? actual : peor;
  }, 'leve');
}

const CATEGORIA_POR_MATERIAL_CUBIERTA: Partial<Record<MaterialCubierta, 'cubierta_zinc' | 'cubierta_fibrocemento'>> = {
  zinc: 'cubierta_zinc',
  asbesto_cemento: 'cubierta_fibrocemento',
};

/**
 * Calcula el combo de materiales para una solicitud ya evaluada.
 * Lanza un error explícito (en vez de devolver una lista vacía) cuando falta
 * información en el catálogo — p.ej. sistema_constructivo = 'madera', para el
 * cual el Excel fuente no trae cantidades. Una lista vacía se vería en la UI
 * como "sin materiales asignados", que es indistinguible de "vivienda sin
 * daño"; eso sería peligroso para un caso que sí necesita materiales.
 */
export async function calcularCombo(
  supabase: SupabaseClient,
  params: {
    sistema_constructivo: SistemaConstructivo;
    material_cubierta: MaterialCubierta;
    elementos: ElementoEvaluadoInput[];
  }
): Promise<ResultadoCombo> {
  const { sistema_constructivo, material_cubierta, elementos } = params;
  const advertencias: string[] = [];
  const nivel_dano_general = calcularNivelDanoGeneral(elementos);

  if (!nivel_dano_general) {
    return { nivel_dano_general: null, items: [], advertencias: ['Ningún elemento fue reportado como afectado; no se asigna combo.'] };
  }

  if (sistema_constructivo === 'madera') {
    throw new Error(
      'El catálogo de materiales (ANEXO 2) no incluye cantidades para vivienda en MADERA. ' +
      'El Excel fuente solo trae la tabla para MAMPOSTERÍA. Se requiere que la Alcaldía / UNGRD ' +
      'suministre las cantidades de los Combo 4/5/6 antes de poder calcular este caso automáticamente. ' +
      'No se genera un combo vacío para evitar que una vivienda dañada quede sin materiales asignados.'
    );
  }

  const categoriaCubierta = CATEGORIA_POR_MATERIAL_CUBIERTA[material_cubierta];
  const categorias: Array<'estructura' | 'cubierta_zinc' | 'cubierta_fibrocemento' | 'herramientas'> = ['estructura', 'herramientas'];
  if (categoriaCubierta) {
    categorias.push(categoriaCubierta);
  } else {
    advertencias.push(
      `No hay kit de cubierta en el catálogo para el material "${material_cubierta}". ` +
      'Solo están cargados zinc y fibrocemento (asbesto-cemento). Se omite el kit de cubierta; revisar manualmente.'
    );
  }

  const { data, error } = await supabase
    .from('materiales_combo_lookup')
    .select('categoria, kit_nombre, item_descripcion, unidad, cantidad, orden')
    .eq('tipo_vivienda', sistema_constructivo)
    .eq('nivel_dano', nivel_dano_general)
    .in('categoria', categorias)
    .order('categoria', { ascending: true })
    .order('orden', { ascending: true });

  if (error) throw error;

  const items: ItemCombo[] = (data ?? []).map((r) => ({
    categoria: r.categoria,
    kit_nombre: r.kit_nombre,
    item_descripcion: r.item_descripcion,
    unidad: r.unidad,
    cantidad: Number(r.cantidad),
  }));

  return { nivel_dano_general, items, advertencias };
}
