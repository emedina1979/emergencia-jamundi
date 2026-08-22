import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * GET /api/export?estado=aprobada
 * Versión "en vivo" del mismo export que hace scripts/export_ungrd.ts, para
 * que el panel de coordinación pueda descargar el JSON sin acceso a servidor.
 * Protegido por RLS: solo staff activo puede leer estas tablas (02_rls.sql).
 */
export async function GET(req: NextRequest) {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const estado = req.nextUrl.searchParams.get('estado') ?? 'aprobada';

  const { data, error } = await supabase
    .from('solicitudes')
    .select(`
      id, codigo_radicado, tipo_evento, estado, descripcion_danos_ciudadano, created_at,
      beneficiarios ( nombres_apellidos, numero_documento, lugar_expedicion, telefono_contacto,
                       inscrito_rud, condicion_tenencia, predio_fuera_riesgo ),
      viviendas ( departamento, municipio, zona, nombre_sector, direccion, latitud, longitud,
                  sistema_constructivo, material_muro, material_piso, material_estructura, material_cubierta ),
      inspecciones ( fecha_inspeccion, cumple_requisitos, tipo_evento_confirmado,
                     sistema_constructivo_confirmado, material_cubierta_confirmado,
                     nombre_profesional, tarjeta_profesional, nivel_dano_general,
                     elementos_evaluados ( elemento, fue_afectado, nivel_dano ) ),
      solicitud_materiales ( categoria, kit_nombre, item_descripcion, unidad, cantidad ),
      aprobaciones ( aprobado, observaciones, fecha_aprobacion )
    `)
    .eq('estado', estado)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ estado, total: data?.length ?? 0, solicitudes: data });
}
