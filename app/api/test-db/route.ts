import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { manejarRuta } from '@/lib/api-response';

// No usa cookies()/headers(), así que Next.js podría intentar generarla
// estáticamente en build (y hasta cachear el resultado para siempre). Debe
// ejecutarse en cada request para que sea un chequeo de conexión real.
export const dynamic = 'force-dynamic';

/**
 * GET /api/test-db
 * Diagnóstico rápido de conectividad Supabase. A propósito NO devuelve datos
 * de beneficiarios (cédulas, teléfonos) — solo un conteo — para no abrir un
 * segundo punto de fuga de PII mientras RLS esté deshabilitada.
 *
 * Temporal: pensado para depurar el despliegue. Considera quitarla o
 * protegerla con requiereStaff() una vez que el flujo esté estable.
 */
export async function GET() {
  return manejarRuta(async () => {
    const supabase = supabaseAdmin();
    const { count, error } = await supabase
      .from('beneficiarios')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[api/test-db] error de conexión:', error, (error as any)?.cause);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tabla: 'beneficiarios', filas: count ?? 0 });
  });
}
