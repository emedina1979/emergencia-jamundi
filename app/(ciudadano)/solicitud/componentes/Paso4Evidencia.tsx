'use client';

import { useState } from 'react';
import imageCompression from 'browser-image-compression';

export type ArchivoEvidencia = { tipo: string; file: File };

const GUIA: Array<{ tipo: string; titulo: string; instruccion: string; requerido: boolean; accept: string }> = [
  { tipo: 'foto_fachada', titulo: 'Foto 1: Fachada completa', instruccion: 'Tome la foto desde la calle, que se vea toda la casa.', requerido: true, accept: 'image/*' },
  { tipo: 'foto_dano_principal', titulo: 'Foto 2: Daño principal', instruccion: 'Muro o columna dañada. Ponga una moneda o su cédula al lado de la fisura, como referencia de tamaño.', requerido: true, accept: 'image/*' },
  { tipo: 'foto_cubierta', titulo: 'Foto 3: Techo o tanque de agua', instruccion: 'Estado de la cubierta o del tanque de agua.', requerido: true, accept: 'image/*' },
  { tipo: 'video_recorrido', titulo: 'Video (opcional)', instruccion: 'Recorrido continuo de máximo 60 segundos por dentro de la vivienda.', requerido: false, accept: 'video/*' },
];

async function comprimirFoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  return imageCompression(file, { maxSizeMB: 1.5, maxWidthOrHeight: 1600, useWebWorker: true });
}

export function Paso4Evidencia({
  valorInicial,
  onSiguiente,
  onAtras,
}: {
  valorInicial?: ArchivoEvidencia[];
  onSiguiente: (archivos: ArchivoEvidencia[]) => void;
  onAtras: () => void;
}) {
  const [archivos, setArchivos] = useState<Record<string, File>>(
    Object.fromEntries((valorInicial ?? []).map((a) => [a.tipo, a.file]))
  );
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function manejarArchivo(tipo: string, file: File | undefined) {
    if (!file) return;
    setError(null);
    const limiteMb = tipo === 'video_recorrido' ? 80 : 15;
    if (file.size > limiteMb * 1024 * 1024) {
      setError(`El archivo supera el límite de ${limiteMb}MB`);
      return;
    }
    setProcesando(tipo);
    try {
      const final = tipo === 'video_recorrido' ? file : await comprimirFoto(file);
      setArchivos((prev) => ({ ...prev, [tipo]: final }));
    } catch {
      setError('No se pudo procesar el archivo, intente de nuevo.');
    } finally {
      setProcesando(null);
    }
  }

  function continuar() {
    const faltantes = GUIA.filter((g) => g.requerido && !archivos[g.tipo]);
    if (faltantes.length > 0) {
      setError(`Falta: ${faltantes.map((f) => f.titulo).join(', ')}`);
      return;
    }
    onSiguiente(Object.entries(archivos).map(([tipo, file]) => ({ tipo, file })));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">4. Fotos y video de los daños</h2>
      <p className="text-sm text-gray-500">Estas fotos ayudan al inspector a priorizar su visita. No reemplazan la evaluación técnica.</p>

      {GUIA.map((g) => (
        <div key={g.tipo} className="rounded-lg border border-gray-200 p-3">
          <p className="font-medium">{g.titulo} {g.requerido && <span className="text-red-600">*</span>}</p>
          <p className="mb-2 text-sm text-gray-500">{g.instruccion}</p>
          <input
            type="file"
            accept={g.accept}
            capture={g.tipo === 'video_recorrido' ? 'environment' : undefined}
            onChange={(e) => manejarArchivo(g.tipo, e.target.files?.[0])}
            className="block w-full text-sm"
          />
          {procesando === g.tipo && <p className="text-sm text-alcaldia-600">Procesando…</p>}
          {archivos[g.tipo] && <p className="text-sm text-green-700">✓ Listo ({Math.round(archivos[g.tipo].size / 1024)} KB)</p>}
        </div>
      ))}

      {error && <p className="campo-error">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onAtras} className="btn-secundario">Atrás</button>
        <button type="button" onClick={continuar} className="btn-primario">Continuar</button>
      </div>
    </div>
  );
}
