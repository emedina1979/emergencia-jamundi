import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { solicitudCompletaSchema } from '@/lib/validations';

async function generarCodigoRadicado(supabase: ReturnType<typeof supabaseAdmin>) {
  const prefijo = process.env.CODIGO_RADICADO_PREFIJO ?? 'JAM';
  // Usa la secuencia atómica de Postgres (siguiente_codigo_radicado en 01_schema.sql)
  // en vez de contar filas desde el cliente, que sí sería vulnerable a condiciones
  // de carrera con muchas familias enviando el formulario al mismo tiempo.
  const { data, error } = await supabase.rpc('siguiente_codigo_radicado', { prefijo });
  if (error) throw error;
  return data as string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = solicitudCompletaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', detalles: parsed.error.flatten() }, { status: 400 });
  }
  const { identificacion, ubicacion, construccion, declaracion } = parsed.data;

  const supabase = supabaseAdmin();

  // Un beneficiario no puede tener dos solicitudes activas — la restricción real
  // vive en la base (solicitudes_beneficiario_activa_uk); aquí solo damos un
  // mensaje claro en vez de dejar burbujear el error 23505 de Postgres.
  const { data: beneficiarioExistente } = await supabase
    .from('beneficiarios')
    .select('id')
    .eq('numero_documento', identificacion.numero_documento)
    .maybeSingle();

  let beneficiarioId = beneficiarioExistente?.id as string | undefined;

  if (beneficiarioId) {
    const { data: solicitudActiva } = await supabase
      .from('solicitudes')
      .select('codigo_radicado, estado')
      .eq('beneficiario_id', beneficiarioId)
      .neq('estado', 'rechazada')
      .maybeSingle();
    if (solicitudActiva) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud en trámite para esta cédula', codigo_radicado: solicitudActiva.codigo_radicado },
        { status: 409 }
      );
    }
  } else {
    const { data: nuevoBeneficiario, error: errBeneficiario } = await supabase
      .from('beneficiarios')
      .insert({
        nombres_apellidos: identificacion.nombres_apellidos,
        numero_documento: identificacion.numero_documento,
        lugar_expedicion: identificacion.lugar_expedicion,
        telefono_contacto: identificacion.telefono_contacto,
        inscrito_rud: identificacion.inscrito_rud === 'si',
        condicion_tenencia: identificacion.condicion_tenencia,
        predio_fuera_riesgo: identificacion.predio_fuera_riesgo === 'si',
      })
      .select('id')
      .single();
    if (errBeneficiario) return NextResponse.json({ error: errBeneficiario.message }, { status: 500 });
    beneficiarioId = nuevoBeneficiario.id;
  }

  const { data: vivienda, error: errVivienda } = await supabase
    .from('viviendas')
    .insert({
      zona: ubicacion.zona,
      nombre_sector: ubicacion.nombre_sector,
      direccion: ubicacion.direccion,
      latitud: ubicacion.latitud ?? null,
      longitud: ubicacion.longitud ?? null,
      sistema_constructivo: construccion.sistema_constructivo,
      material_muro: construccion.material_muro,
      material_piso: construccion.material_piso,
      material_estructura: construccion.material_estructura,
      material_cubierta: construccion.material_cubierta,
    })
    .select('id')
    .single();
  if (errVivienda) return NextResponse.json({ error: errVivienda.message }, { status: 500 });

  let codigoRadicado: string;
  try {
    codigoRadicado = await generarCodigoRadicado(supabase);
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo generar el código de radicado' }, { status: 500 });
  }

  const { data: solicitud, error: errSolicitud } = await supabase
    .from('solicitudes')
    .insert({
      codigo_radicado: codigoRadicado,
      beneficiario_id: beneficiarioId,
      vivienda_id: vivienda.id,
      descripcion_danos_ciudadano: declaracion.descripcion_danos_ciudadano ?? null,
      habeas_data_aceptado: declaracion.habeas_data_aceptado,
      declaracion_veracidad_aceptada: declaracion.declaracion_veracidad_aceptada,
    })
    .select('id, codigo_radicado')
    .single();
  if (errSolicitud) return NextResponse.json({ error: errSolicitud.message }, { status: 500 });

  return NextResponse.json({ solicitud }, { status: 201 });
}
