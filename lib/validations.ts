import { z } from 'zod';

export const pasoIdentificacionSchema = z.object({
  nombres_apellidos: z.string().trim().min(5, 'Escriba el nombre completo'),
  numero_documento: z.string().trim().regex(/^\d{5,15}$/, 'Cédula inválida'),
  lugar_expedicion: z.string().trim().min(2, 'Requerido'),
  telefono_contacto: z.string().trim().regex(/^\d{7,10}$/, 'Teléfono inválido'),
  inscrito_rud: z.enum(['si', 'no'], { required_error: 'Seleccione una opción' }),
  condicion_tenencia: z.enum(['propietario', 'poseedor', 'arrendatario']),
  predio_fuera_riesgo: z.enum(['si', 'no'], { required_error: 'Seleccione una opción' }),
});
export type PasoIdentificacion = z.infer<typeof pasoIdentificacionSchema>;

export const pasoUbicacionSchema = z.object({
  zona: z.enum(['cabecera_municipal', 'rural']),
  nombre_sector: z.string().trim().min(2, 'Requerido'),
  direccion: z.string().trim().min(5, 'Describa la dirección o el acceso'),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
});
export type PasoUbicacion = z.infer<typeof pasoUbicacionSchema>;

export const pasoConstruccionSchema = z.object({
  sistema_constructivo: z.enum(['mamposteria', 'madera']),
  material_muro: z.enum(['ladrillo', 'bloque', 'madera', 'guadua', 'bahareque', 'otro']),
  material_piso: z.enum(['cemento', 'baldosa', 'madera', 'tierra', 'otro']),
  material_estructura: z.enum(['madera', 'concreto', 'mamposteria', 'otro']),
  material_cubierta: z.enum(['placa_concreto', 'madera', 'asbesto_cemento', 'teja_barro', 'zinc', 'palma', 'otro']),
});
export type PasoConstruccion = z.infer<typeof pasoConstruccionSchema>;

export const pasoDeclaracionSchema = z.object({
  habeas_data_aceptado: z.literal(true, { errorMap: () => ({ message: 'Debe aceptar el tratamiento de datos' }) }),
  declaracion_veracidad_aceptada: z.literal(true, { errorMap: () => ({ message: 'Debe declarar bajo gravedad de juramento' }) }),
  descripcion_danos_ciudadano: z.string().trim().max(2000).optional(),
});
export type PasoDeclaracion = z.infer<typeof pasoDeclaracionSchema>;

export const solicitudCompletaSchema = z.object({
  identificacion: pasoIdentificacionSchema,
  ubicacion: pasoUbicacionSchema,
  construccion: pasoConstruccionSchema,
  declaracion: pasoDeclaracionSchema,
});
export type SolicitudCompleta = z.infer<typeof solicitudCompletaSchema>;

export const elementoEvaluadoSchema = z.object({
  elemento: z.enum([
    'vigas_columnas', 'muros_carga', 'muros_divisorios', 'placa_piso',
    'cubierta', 'instalaciones_electricas', 'instalaciones_hidrosanitarias',
    'entrepisos', 'muros_madera',
  ]),
  fue_afectado: z.boolean(),
  nivel_dano: z.enum(['leve', 'moderado', 'severo']).nullable(),
}).refine((e) => !e.fue_afectado || e.nivel_dano !== null, {
  message: 'Si el elemento fue afectado debe indicar el nivel de daño',
  path: ['nivel_dano'],
});

export const inspeccionSchema = z.object({
  cumple_requisitos: z.boolean(),
  motivo_no_elegible: z.string().trim().optional(),
  tipo_evento_confirmado: z.enum(['inundacion', 'vendaval', 'sismo', 'avenida_torrencial', 'remocion_en_masa', 'otro']),
  sistema_constructivo_confirmado: z.enum(['mamposteria', 'madera']),
  material_cubierta_confirmado: z.enum(['placa_concreto', 'madera', 'asbesto_cemento', 'teja_barro', 'zinc', 'palma', 'otro']),
  nombre_persona_entrevistada: z.string().trim().optional(),
  documento_persona_entrevistada: z.string().trim().optional(),
  parentesco_persona_entrevistada: z.string().trim().optional(),
  telefono_persona_entrevistada: z.string().trim().optional(),
  nombre_profesional: z.string().trim().min(3),
  tarjeta_profesional: z.string().trim().min(2),
  profesion: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
  elementos: z.array(elementoEvaluadoSchema).min(1),
}).refine((v) => v.cumple_requisitos || !!v.motivo_no_elegible, {
  message: 'Debe describir el motivo cuando no cumple los requisitos',
  path: ['motivo_no_elegible'],
});
export type InspeccionInput = z.infer<typeof inspeccionSchema>;

export const aprobacionSchema = z.object({
  aprobado: z.boolean(),
  observaciones: z.string().trim().optional(),
}).refine((v) => v.aprobado || !!v.observaciones, {
  message: 'Debe indicar el motivo del rechazo',
  path: ['observaciones'],
});
