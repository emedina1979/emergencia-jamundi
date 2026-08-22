'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parsearRespuesta } from '@/lib/fetch-json';

export function PanelAprobacion({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decidir(aprobado: boolean) {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/inspeccion/${solicitudId}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado, observaciones: observaciones || undefined }),
      });
      await parsearRespuesta(res);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rounded-lg border border-alcaldia-600/30 bg-alcaldia-50 p-4">
      <h3 className="font-semibold">Sección 9 — Aprobación del Consejo Territorial</h3>
      <textarea
        className="campo-input mt-2"
        placeholder="Observaciones (obligatorio si rechaza)"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
      />
      {error && <p className="campo-error">{error}</p>}
      <div className="mt-2 flex gap-3">
        <button className="btn-secundario" disabled={enviando} onClick={() => decidir(false)}>Rechazar</button>
        <button className="btn-primario" disabled={enviando} onClick={() => decidir(true)}>Aprobar</button>
      </div>
    </section>
  );
}
