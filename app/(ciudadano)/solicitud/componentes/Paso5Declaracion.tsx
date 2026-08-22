'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pasoDeclaracionSchema, type PasoDeclaracion } from '@/lib/validations';
import { parsearRespuesta } from '@/lib/fetch-json';
import type { ArchivoEvidencia } from './Paso4Evidencia';

async function subirEvidencia(solicitudId: string, archivo: ArchivoEvidencia) {
  const extension = archivo.file.name.split('.').pop() || 'bin';
  const resSigned = await fetch(`/api/solicitudes/${solicitudId}/evidencias/signed-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: archivo.tipo, extension }),
  });
  const { path, signedUrl } = await parsearRespuesta<{ path: string; signedUrl: string; bucket: string }>(resSigned);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const uploadUrl = signedUrl.startsWith('http') ? signedUrl : `${supabaseUrl}${signedUrl}`;
  const putRes = await fetch(uploadUrl, { method: 'PUT', body: archivo.file, headers: { 'Content-Type': archivo.file.type } });
  if (!putRes.ok) throw new Error(`No se pudo subir el archivo (${archivo.tipo}): HTTP ${putRes.status}`);

  const resMetadato = await fetch(`/api/solicitudes/${solicitudId}/evidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: archivo.tipo, storage_path: path, mime_type: archivo.file.type, tamano_bytes: archivo.file.size }),
  });
  await parsearRespuesta(resMetadato);
}

export function Paso5Declaracion({
  datosCompletos,
  archivos,
  onAtras,
}: {
  datosCompletos: Record<string, unknown>;
  archivos: ArchivoEvidencia[];
  onAtras: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [radicado, setRadicado] = useState<string | null>(null);
  const [advertenciasEvidencia, setAdvertenciasEvidencia] = useState<string[]>([]);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasoDeclaracion>({ resolver: zodResolver(pasoDeclaracionSchema) });

  async function enviar(declaracion: PasoDeclaracion) {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datosCompletos, declaracion }),
      });
      const json = await parsearRespuesta<{ solicitud: { id: string; codigo_radicado: string } }>(res);
      const solicitudId = json.solicitud.id;

      // La solicitud ya quedó radicada en este punto — si una evidencia falla al
      // subir, no perdemos el trámite del ciudadano por eso; se informa aparte.
      const advertencias: string[] = [];
      for (const archivo of archivos) {
        try {
          await subirEvidencia(solicitudId, archivo);
        } catch (e) {
          advertencias.push(`No se pudo subir "${archivo.tipo}": ${(e as Error).message}`);
        }
      }

      setAdvertenciasEvidencia(advertencias);
      setRadicado(json.solicitud.codigo_radicado);
    } catch (e) {
      setErrorEnvio((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (radicado) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-bold text-green-700">¡Solicitud enviada!</h2>
        <p>Su número de radicado es:</p>
        <p className="text-2xl font-bold tracking-wide">{radicado}</p>
        <p className="text-sm text-gray-500">Guarde este número. Un inspector de la Alcaldía visitará su vivienda para completar la evaluación técnica.</p>
        {advertenciasEvidencia.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-800">
            <p className="font-semibold">Su solicitud quedó registrada, pero algunas fotos/video no se pudieron subir:</p>
            <ul className="mt-1 list-disc pl-5">
              {advertenciasEvidencia.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
            <p className="mt-1">El inspector podrá pedírselas directamente durante la visita.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4">
      <h2 className="text-lg font-bold">5. Declaración y consentimiento</h2>

      <div>
        <label className="campo-label">Describa brevemente los daños (opcional)</label>
        <textarea className="campo-input" rows={3} {...register('descripcion_danos_ciudadano')} />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" {...register('habeas_data_aceptado')} />
        Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 (Habeas Data), para efectos de este proceso de ayuda humanitaria.
      </label>
      {errors.habeas_data_aceptado && <p className="campo-error">{errors.habeas_data_aceptado.message}</p>}

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" {...register('declaracion_veracidad_aceptada')} />
        Declaro bajo la gravedad de juramento que la información suministrada es veraz.
      </label>
      {errors.declaracion_veracidad_aceptada && <p className="campo-error">{errors.declaracion_veracidad_aceptada.message}</p>}

      {errorEnvio && <p className="campo-error">{errorEnvio}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onAtras} className="btn-secundario" disabled={enviando}>Atrás</button>
        <button type="submit" className="btn-primario" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </div>
    </form>
  );
}
