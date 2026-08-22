'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { elementosPara, ELEMENTOS_LABEL } from '@/lib/elementos';
import { parsearRespuesta } from '@/lib/fetch-json';

type NivelDano = 'leve' | 'moderado' | 'severo' | '';

export function FormularioEvaluacion({ solicitud }: { solicitud: any }) {
  const router = useRouter();
  const [cumpleRequisitos, setCumpleRequisitos] = useState(true);
  const [motivoNoElegible, setMotivoNoElegible] = useState('');
  const [sistemaConfirmado, setSistemaConfirmado] = useState<'mamposteria' | 'madera'>(
    solicitud.viviendas?.sistema_constructivo ?? 'mamposteria'
  );
  const [cubiertaConfirmada, setCubiertaConfirmada] = useState(solicitud.viviendas?.material_cubierta ?? 'zinc');
  const [tipoEventoConfirmado, setTipoEventoConfirmado] = useState(solicitud.tipo_evento ?? 'sismo');
  const [nombreProfesional, setNombreProfesional] = useState('');
  const [tarjetaProfesional, setTarjetaProfesional] = useState('');
  const [elementos, setElementos] = useState<Record<string, { afectado: boolean; nivel: NivelDano }>>(
    Object.fromEntries(elementosPara(sistemaConfirmado).map((e) => [e, { afectado: false, nivel: '' }]))
  );
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function cambiarSistema(nuevo: 'mamposteria' | 'madera') {
    setSistemaConfirmado(nuevo);
    setElementos(Object.fromEntries(elementosPara(nuevo).map((e) => [e, { afectado: false, nivel: '' }])));
  }

  async function enviarEvaluacion() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/inspeccion/${solicitud.id}/evaluacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cumple_requisitos: cumpleRequisitos,
          motivo_no_elegible: motivoNoElegible || undefined,
          tipo_evento_confirmado: tipoEventoConfirmado,
          sistema_constructivo_confirmado: sistemaConfirmado,
          material_cubierta_confirmado: cubiertaConfirmada,
          nombre_profesional: nombreProfesional,
          tarjeta_profesional: tarjetaProfesional,
          elementos: Object.entries(elementos).map(([elemento, v]) => ({
            elemento,
            fue_afectado: v.afectado,
            nivel_dano: v.afectado ? (v.nivel || null) : null,
          })),
        }),
      });
      const json = await parsearRespuesta<any>(res);
      setResultado(json);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <p className="font-semibold text-green-800">Evaluación guardada — estado: {resultado.estado}</p>
        {resultado.nivel_dano_general && <p>Nivel de daño general: <b>{resultado.nivel_dano_general}</b></p>}
        {resultado.materiales?.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {resultado.materiales.map((m: any, i: number) => (
              <li key={i}>{m.kit_nombre} — {m.item_descripcion}: {m.cantidad} {m.unidad}</li>
            ))}
          </ul>
        )}
        {resultado.advertencias?.map((a: string, i: number) => (
          <p key={i} className="mt-2 text-sm text-amber-700">⚠ {a}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold">Sección 4 — Elegibilidad</h3>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={cumpleRequisitos} onChange={(e) => setCumpleRequisitos(e.target.checked)} />
          Cumple los requisitos para auto-rehabilitación
        </label>
        {!cumpleRequisitos && (
          <textarea
            className="campo-input mt-2"
            placeholder="Describa el motivo de no elegibilidad"
            value={motivoNoElegible}
            onChange={(e) => setMotivoNoElegible(e.target.value)}
          />
        )}
      </section>

      {cumpleRequisitos && (
        <>
          <section>
            <h3 className="font-semibold">Sección 5.1 / 5.2 — Confirmación en terreno</h3>
            <label className="campo-label">Sistema constructivo</label>
            <select className="campo-input" value={sistemaConfirmado} onChange={(e) => cambiarSistema(e.target.value as any)}>
              <option value="mamposteria">Mampostería</option>
              <option value="madera">Madera</option>
            </select>

            <label className="campo-label mt-2">Material de cubierta</label>
            <select className="campo-input" value={cubiertaConfirmada} onChange={(e) => setCubiertaConfirmada(e.target.value)}>
              <option value="zinc">Zinc</option>
              <option value="asbesto_cemento">Fibrocemento</option>
              <option value="teja_barro">Teja de barro</option>
              <option value="placa_concreto">Placa de concreto</option>
              <option value="madera">Madera</option>
              <option value="palma">Palma</option>
              <option value="otro">Otro</option>
            </select>
          </section>

          <section>
            <h3 className="font-semibold">Sección 5.4 / 5.5 — Evaluación técnica por elemento</h3>
            <p className="text-sm text-gray-500">Basar la calificación en los criterios del ANEXO (fisuras, pandeo, desplazamiento, etc.)</p>
            {elementosPara(sistemaConfirmado).map((el) => (
              <div key={el} className="mt-2 rounded border border-gray-200 p-2">
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={elementos[el]?.afectado ?? false}
                    onChange={(e) => setElementos((prev) => ({ ...prev, [el]: { ...prev[el], afectado: e.target.checked } }))}
                  />
                  {ELEMENTOS_LABEL[el]}
                </label>
                {elementos[el]?.afectado && (
                  <div className="mt-1 flex gap-3 pl-6 text-sm">
                    {(['leve', 'moderado', 'severo'] as const).map((n) => (
                      <label key={n} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`nivel-${el}`}
                          checked={elementos[el]?.nivel === n}
                          onChange={() => setElementos((prev) => ({ ...prev, [el]: { ...prev[el], nivel: n } }))}
                        />
                        {n}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      <section>
        <h3 className="font-semibold">Sección 9 — Profesional responsable</h3>
        <label className="campo-label">Nombre del profesional</label>
        <input className="campo-input" value={nombreProfesional} onChange={(e) => setNombreProfesional(e.target.value)} />
        <label className="campo-label mt-2">Tarjeta profesional</label>
        <input className="campo-input" value={tarjetaProfesional} onChange={(e) => setTarjetaProfesional(e.target.value)} />
      </section>

      {error && <p className="campo-error">{error}</p>}

      <button className="btn-primario" onClick={enviarEvaluacion} disabled={enviando || !nombreProfesional || !tarjetaProfesional}>
        {enviando ? 'Guardando…' : 'Guardar evaluación'}
      </button>
    </div>
  );
}
