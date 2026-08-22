'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function PaginaLogin() {
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
    router.push(params.get('redirect') ?? '/inspeccion');
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
