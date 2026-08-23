'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

function FormularioLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      setError('Correo o contraseña incorrectos');
      return;
    }
    // push() solo cambia la ruta; si Next.js ya tenía cacheado el árbol de
    // Server Components de /inspeccion (ej. por un prefetch antes del login,
    // o el redirect que hizo el middleware la primera vez sin sesión),
    // refresh() lo invalida para que se vuelva a renderizar con la cookie de
    // sesión recién creada por signInWithPassword — si no, puede quedarse
    // mostrando el estado "no autenticado" hasta un reload manual.
    router.push(params.get('redirect') ?? '/inspeccion');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <h1 className="mb-6 text-xl font-bold">Acceso funcionarios — Alcaldía de Jamundí</h1>
      <form onSubmit={iniciarSesion} className="space-y-4">
        <div>
          <label className="campo-label">Correo institucional</label>
          <input className="campo-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="campo-label">Contraseña</label>
          <input className="campo-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="campo-error">{error}</p>}
        <button type="submit" className="btn-primario" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}

export default function PaginaLogin() {
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <FormularioLogin />
    </Suspense>
  );
}
