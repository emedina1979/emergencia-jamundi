/**
 * Exporta las solicitudes aprobadas a un JSON estructurado, listo para
 * alimentar scripts/populate_f1_excel.ts (o cualquier otro pipeline, p.ej.
 * un DataFrame de pandas leyendo el mismo JSON).
 *
 * Uso:
 *   npm run export:ungrd -- --estado=aprobada --out=export.json
 *
 * Requiere las mismas variables de entorno que la app (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

function argValor(nombre: string, porDefecto: string): string {
  const arg = process.argv.find((a) => a.startsWith(`--${nombre}=`));
  return arg ? arg.split('=')[1] : porDefecto;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY antes de ejecutar este script');
  }
  const supabase = createClient(url, key);

  const estado = argValor('estado', 'aprobada');
  const outPath = argValor('out', `export-ungrd-${estado}.json`);

  const { data: solicitudes, error } = await supabase
    .from('solicitudes')
    .select(`
      id, codigo_radicado, tipo_evento, estado, descripcion_danos_ciudadano,
      habeas_data_aceptado, declaracion_veracidad_aceptada, created_at,
      beneficiarios ( nombres_apellidos, numero_documento, lugar_expedicion, telefono_contacto,
                       inscrito_rud, condicion_tenencia, predio_fuera_riesgo ),
      viviendas ( departamento, municipio, zona, nombre_sector, direccion, latitud, longitud,
                  sistema_constructivo, material_muro, material_piso, material_estructura, material_cubierta ),
      inspecciones ( fecha_inspeccion, cumple_requisitos, motivo_no_elegible, tipo_evento_confirmado,
                     sistema_constructivo_confirmado, material_cubierta_confirmado,
                     nombre_persona_entrevistada, documento_persona_entrevistada,
                     parentesco_persona_entrevistada, telefono_persona_entrevistada,
                     nombre_profesional, tarjeta_profesional, profesion, nivel_dano_general, observaciones,
                     elementos_evaluados ( elemento, fue_afectado, nivel_dano ) ),
      solicitud_materiales ( categoria, kit_nombre, item_descripcion, unidad, cantidad ),
      aprobaciones ( aprobado, observaciones, fecha_aprobacion )
    `)
    .eq('estado', estado)
    .order('created_at', { ascending: true });

  if (error) throw error;

  writeFileSync(outPath, JSON.stringify(solicitudes, null, 2), 'utf-8');
  console.log(`Exportadas ${solicitudes?.length ?? 0} solicitudes (estado="${estado}") a ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
