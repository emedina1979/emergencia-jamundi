'use client';

import { useEffect, useState } from 'react';

export function GaleriaEvidencias({ solicitudId }: { solicitudId: string }) {
  const [evidencias, setEvidencias] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/inspeccion/${solicitudId}/evidencias`)
      .then((r) => r.json())
      .then((j) => setEvidencias(j.evidencias ?? []));
  }, [solicitudId]);

  if (evidencias.length === 0) return null;

  return (
    <section className="my-4">
      <h3 className="mb-2 font-semibold">Evidencia enviada por el ciudadano</h3>
      <div className="grid grid-cols-2 gap-2">
        {evidencias.map((e) =>
          e.url && e.mime_type?.startsWith('video/') ? (
            <video key={e.id} src={e.url} controls className="rounded-lg" />
          ) : (
            e.url && <img key={e.id} src={e.url} alt={e.tipo} className="rounded-lg" />
          )
        )}
      </div>
    </section>
  );
}
