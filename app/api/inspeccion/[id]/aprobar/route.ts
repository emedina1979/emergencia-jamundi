import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requiereStaff } from '@/lib/auth-staff';
import { aprobacionSchema } from '@/lib/validations';
import { manejarRuta } from '@/lib/api-response';

/**
 * POST /api/inspeccion/[id]/aprobar
 * F1 sección 9 — firma del coordinador del Consejo Territorial. Solo procede
 * sobre solicitudes que ya pasaron por la evaluación técnica del inspector.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return manejarRuta(async () => {
    const staff = await requiereStaff(['coordinador', 'admin']);
    if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await req.json();
    const parsed = aprobacionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', detalles: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: solicitud } = await supabase.from('solicitudes').select('id, estado').eq('id', params.id).maybeSingle();
    if (!solicitud) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    if (solicitud.estado !== 'evaluada') {
      return NextResponse.json({ error: `La solicitud debe estar "evaluada" antes de aprobar (estado actual: ${solicitud.estado})` }, { status: 409 });
    }

    const { error: errAprobacion } = await supabase
      .from('aprobaciones')
      .upsert({
        solicitud_id: params.id,
        coordinador_id: staff.id,
        aprobado: parsed.data.aprobado,
        observaciones: parsed.data.observaciones ?? null,
      }, { onConflict: 'solicitud_id' });
    if (errAprobacion) {
      console.error('[api/inspeccion/aprobar] error guardando aprobación:', errAprobacion);
      return NextResponse.json({ error: errAprobacion.message }, { status: 500 });
    }

    await supabase
      .from('solicitudes')
      .update({ estado: parsed.data.aprobado ? 'aprobada' : 'rechazada' })
      .eq('id', params.id);

    return NextResponse.json({ estado: parsed.data.aprobado ? 'aprobada' : 'rechazada' });
  });
}
