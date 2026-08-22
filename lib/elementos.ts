/** Elementos estructurales evaluables, según F1 5.4 (mampostería) y 5.5 (madera). */
export const ELEMENTOS_LABEL: Record<string, string> = {
  vigas_columnas: 'Vigas y columnas',
  muros_carga: 'Muros de carga',
  muros_divisorios: 'Muros divisorios',
  placa_piso: 'Placa de piso',
  cubierta: 'Cubierta',
  instalaciones_electricas: 'Instalaciones eléctricas',
  instalaciones_hidrosanitarias: 'Instalaciones hidrosanitarias',
  entrepisos: 'Entrepisos',
  muros_madera: 'Muros en madera',
};

export const ELEMENTOS_MAMPOSTERIA = [
  'vigas_columnas', 'muros_carga', 'muros_divisorios', 'placa_piso',
  'cubierta', 'instalaciones_electricas', 'instalaciones_hidrosanitarias',
];

export const ELEMENTOS_MADERA = [
  'vigas_columnas', 'entrepisos', 'muros_madera', 'cubierta', 'instalaciones_hidrosanitarias',
];

export function elementosPara(sistema: 'mamposteria' | 'madera') {
  return sistema === 'mamposteria' ? ELEMENTOS_MAMPOSTERIA : ELEMENTOS_MADERA;
}
