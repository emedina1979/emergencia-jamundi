'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para componentes del navegador. Solo usa la anon key
 * (segura para exponer) y respeta RLS — nunca la service role key.
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
