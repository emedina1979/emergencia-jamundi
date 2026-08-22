import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requiereStaff } from '@/lib/auth-staff';
import { manejarRuta } from '@/lib/api-response';

// requiereStaff() lee cookies() (sesión del usuario) para verificar el rol —
// Next.js no puede pre-renderizarla estáticamente en build.
export const dynamic = 'force-dynamic';

/**
 * GET /api/inspeccion/[id]/evidencias
 * El bucket de evidencias es privado (fotos/documentos de personas afectadas).
 * Se generan URLs firmadas de solo-lectura, de corta duración, únicamente
 * para personal activo — nunca se hace público el bucket completo.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return manejarRuta(async () => {
    const staff = await requiereStaff(['inspector', 'coordinador', 'admin']);
    if (!staff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const supabase = supabaseAdmin();
    const bucket = process.env.SUPABASE_EVIDENCIAS_BUCKET ?? 'evidencias-viviendas';

    const { data: evidencias, error } = await supabase
      .from('evidencias')
      .select('id, tipo, storage_path, mime_type')
      .eq('solicitud_id', params.id);
    if (error) {
      console.error('[api/inspeccion/evidencias] error consultando evidencias:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const conUrl = await Promise.all(
      (evidencias ?? []).map(async (e) => {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(e.storage_path, 300);
        return { ...e, url: data?.signedUrl ?? null };
      })
    );

    return NextResponse.json({ evidencias: conUrl });
  });
}
