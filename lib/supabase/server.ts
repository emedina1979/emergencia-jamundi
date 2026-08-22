import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente Supabase autenticado con la sesión del usuario (personal municipal).
 * Respeta RLS: solo puede leer lo que las políticas de 02_rls.sql permiten.
 */
export function supabaseServer() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const faltantes = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean);
  if (faltantes.length > 0) {
    throw new Error(
      `Falta configurar en el entorno: ${faltantes.join(', ')}. ` +
      'En Vercel: Project Settings → Environment Variables (y volver a desplegar). En local: .env.local.'
    );
  }

  return createServerClient(url!, anonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });
}
