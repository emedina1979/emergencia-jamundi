'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

function FormularioLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const params = useSearchParams();

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setCargando(false);
      setError('Correo o contraseña incorrectos');
      return;
    }
    // Navegación dura a propósito (no router.push/refresh): fuerza una
    // petición HTTP real al servidor, con la cookie de sesión que
    // signInWithPassword acaba de escribir, para que el middleware y los
    // Server Components de /inspeccion la vean de inmediato. router.push()
    // depende de que el Router Cache de Next.js se invalide justo a tiempo,
    // lo cual no siempre pasa en el mismo tick en que termina el login.
    window.location.href = params.get('redirect') ?? '/inspeccion';
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
