import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TIPOS_VALIDOS = ['foto_fachada', 'foto_dano_principal', 'foto_cubierta', 'video_recorrido', 'otro'];

/**
 * POST /api/solicitudes/[id]/evidencias/signed-url
 * Devuelve una URL firmada de subida directa a Supabase Storage, para que el
 * navegador suba la foto/video sin pasar por la función serverless (evita
 * límites de payload y ahorra ancho de banda del servidor).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { tipo, extension } = body as { tipo: string; extension: string };

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json({ error: 'Tipo de evidencia inválido' }, { status: 400 });
  }
  if (!/^[a-z0-9]{2,5}$/i.test(extension ?? '')) {
    return NextResponse.json({ error: 'Extensión inválida' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const bucket = process.env.SUPABASE_EVIDENCIAS_BUCKET ?? 'evidencias-viviendas';
  const path = `${params.id}/${tipo}-${Date.now()}.${extension}`;

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl, bucket });
}
