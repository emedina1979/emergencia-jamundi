import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con la service role key. SOLO se importa desde código que corre en
 * el servidor (route handlers de app/api/**, scripts/*). Nunca exponer esta
 * llave ni este cliente a un componente 'use client'.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const faltantes = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !key && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean);
  if (faltantes.length > 0) {
    throw new Error(
      `Falta configurar en el entorno: ${faltantes.join(', ')}. ` +
      'En Vercel: Project Settings → Environment Variables (y volver a desplegar). En local: .env.local.'
    );
  }
  return createClient(url!, key!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
