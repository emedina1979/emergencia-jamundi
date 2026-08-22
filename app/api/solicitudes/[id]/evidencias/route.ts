import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { manejarRuta } from '@/lib/api-response';

const MAX_BYTES_FOTO = 8 * 1024 * 1024;   // 8MB tras compresión en el cliente
const MAX_BYTES_VIDEO = 80 * 1024 * 1024; // ~60s de video comprimido

/**
 * POST /api/solicitudes/[id]/evidencias
 * Se llama DESPUÉS de que el navegador subió el archivo con la URL firmada
 * (ver signed-url/route.ts). Aquí solo se registra el metadato en la BD.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return manejarRuta(async () => {
    const body = await req.json();
    const { tipo, storage_path, mime_type, tamano_bytes } = body as {
      tipo: string; storage_path: string; mime_type: string; tamano_bytes: number;
    };

    const esVideo = tipo === 'video_recorrido';
    const limite = esVideo ? MAX_BYTES_VIDEO : MAX_BYTES_FOTO;
    if (typeof tamano_bytes !== 'number' || tamano_bytes <= 0 || tamano_bytes > limite) {
      return NextResponse.json({ error: `Archivo fuera del límite permitido (${Math.round(limite / 1024 / 1024)}MB)` }, { status: 400 });
    }
    if (!storage_path.startsWith(`${params.id}/`)) {
      return NextResponse.json({ error: 'Ruta de archivo inválida' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('evidencias')
      .insert({ solicitud_id: params.id, tipo, storage_path, mime_type, tamano_bytes })
      .select('id')
      .single();

    if (error) {
      console.error('[api/solicitudes/evidencias] error insertando evidencia:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ evidencia: data }, { status: 201 });
  });
}
