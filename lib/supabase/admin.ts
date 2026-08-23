import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con la service role key. SOLO se importa desde código que corre en
 * el servidor (route handlers de app/api/**, scripts/*). Nunca exponer esta
 * llave ni este cliente a un componente 'use client'.
 *
 * Se construye DENTRO de una función (no como constante de módulo) a
 * propósito: si faltan las variables de entorno, el error debe lanzarse
 * cuando cada ruta llama a supabaseAdmin() dentro de su try/catch
 * (lib/api-response.ts), no al importar el módulo. Si esto fuera una
 * constante top-level, un env var faltante tronaría al cargar el bundle,
 * fuera de cualquier try/catch, y volveríamos al bug original de respuesta
 * vacía ("Unexpected end of JSON input").
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
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
    global: {
      // Evita que Next.js cachee respuestas de Supabase en rutas GET
      // (ej. /api/export, /api/test-db) — siempre deben leer datos frescos.
      fetch: (input, options) => fetch(input, { ...options, cache: 'no-store' }),
    },
  });
}
