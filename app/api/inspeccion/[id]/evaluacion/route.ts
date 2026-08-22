import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requiereStaff } from '@/lib/auth-staff';
import { inspeccionSchema } from '@/lib/validations';
import { calcularCombo } from '@/lib/combos';
import { manejarRuta } from '@/lib/api-response';

/**
 * POST /api/inspeccion/[id]/evaluacion
 * Registra la evaluación técnica (F1 secciones 4, 5, 9) hecha por un
 * inspector con tarjeta profesional y calcula el combo de materiales a
 * partir del catálogo (ANEXO 2) — el nivel de daño NUNCA lo decide el
 * ciudadano, solo llega hasta aquí.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return manejarRuta(async () => {
    const staff = await requiereStaff(['inspector', 'admin']);
    if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await req.json();
    const parsed = inspeccionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', detalles: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;
    const solicitudId = params.id;
    const supabase = supabaseAdmin();

    const { data: solicitud } = await supabase.from('solicitudes').select('id, estado').eq('id', solicitudId).maybeSingle();
    if (!solicitud) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });

    const { data: inspeccion, error: errInspeccion } = await supabase
      .from('inspecciones')
      .upsert({
        solicitud_id: solicitudId,
        inspector_id: staff.id,
        cumple_requisitos: input.cumple_requisitos,
        motivo_no_elegible: input.motivo_no_elegible ?? null,
        tipo_evento_confirmado: input.tipo_evento_confirmado,
        sistema_constructivo_confirmado: input.sistema_constructivo_confirmado,
        material_cubierta_confirmado: input.material_cubierta_confirmado,
        nombre_persona_entrevistada: input.nombre_persona_entrevistada ?? null,
        documento_persona_entrevistada: input.documento_persona_entrevistada ?? null,
        parentesco_persona_entrevistada: input.parentesco_persona_entrevistada ?? null,
        telefono_persona_entrevistada: input.telefono_persona_entrevistada ?? null,
        nombre_profesional: input.nombre_profesional,
        tarjeta_profesional: input.tarjeta_profesional,
        profesion: input.profesion ?? null,
        observaciones: input.observaciones ?? null,
      }, { onConflict: 'solicitud_id' })
      .select('id')
      .single();
    if (errInspeccion) {
      console.error('[api/inspeccion/evaluacion] error guardando inspección:', errInspeccion);
      return NextResponse.json({ error: errInspeccion.message }, { status: 500 });
    }

    await supabase.from('elementos_evaluados').delete().eq('inspeccion_id', inspeccion.id);
    const { error: errElementos } = await supabase.from('elementos_evaluados').insert(
      input.elementos.map((e) => ({
        inspeccion_id: inspeccion.id,
        elemento: e.elemento,
        fue_afectado: e.fue_afectado,
        nivel_dano: e.nivel_dano,
      }))
    );
    if (errElementos) {
      console.error('[api/inspeccion/evaluacion] error guardando elementos evaluados:', errElementos);
      return NextResponse.json({ error: errElementos.message }, { status: 500 });
    }

    if (!input.cumple_requisitos) {
      await supabase.from('solicitudes').update({ estado: 'no_elegible' }).eq('id', solicitudId);
      return NextResponse.json({ estado: 'no_elegible' });
    }

    let resultadoCombo;
    try {
      resultadoCombo = await calcularCombo(supabase, {
        sistema_constructivo: input.sistema_constructivo_confirmado,
        material_cubierta: input.material_cubierta_confirmado,
        elementos: input.elementos,
      });
    } catch (e) {
      // No dejamos que la solicitud pase a "evaluada" con un combo incompleto o inexistente.
      console.error('[api/inspeccion/evaluacion] error calculando combo:', e);
      return NextResponse.json({ error: (e as Error).message }, { status: 422 });
    }

    await supabase.from('inspecciones').update({ nivel_dano_general: resultadoCombo.nivel_dano_general }).eq('id', inspeccion.id);
    await supabase.from('solicitud_materiales').delete().eq('solicitud_id', solicitudId);
    if (resultadoCombo.items.length > 0) {
      await supabase.from('solicitud_materiales').insert(
        resultadoCombo.items.map((it) => ({ solicitud_id: solicitudId, ...it }))
      );
    }
    await supabase.from('solicitudes').update({ estado: 'evaluada' }).eq('id', solicitudId);

    return NextResponse.json({
      estado: 'evaluada',
      nivel_dano_general: resultadoCombo.nivel_dano_general,
      materiales: resultadoCombo.items,
      advertencias: resultadoCombo.advertencias,
    });
  });
}
