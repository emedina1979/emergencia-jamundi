import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { FormularioEvaluacion } from '@/components/FormularioEvaluacion';
import { PanelAprobacion } from '@/components/PanelAprobacion';
import { GaleriaEvidencias } from '@/components/GaleriaEvidencias';

export default async function PaginaDetalleInspeccion({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select(`
      id, codigo_radicado, estado, tipo_evento, descripcion_danos_ciudadano,
      beneficiarios ( nombres_apellidos, numero_documento, telefono_contacto, condicion_tenencia, inscrito_rud ),
      viviendas ( zona, nombre_sector, direccion, sistema_constructivo, material_cubierta )
    `)
    .eq('id', params.id)
    .maybeSingle();

  if (!solicitud) return notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from('staff_usuarios').select('rol').eq('id', user?.id).maybeSingle();

  const beneficiario = Array.isArray((solicitud as any).beneficiarios) ? (solicitud as any).beneficiarios[0] : (solicitud as any).beneficiarios;
  const vivienda = Array.isArray((solicitud as any).viviendas) ? (solicitud as any).viviendas[0] : (solicitud as any).viviendas;

  return (
    <main className="p-5">
      <h1 className="text-lg font-bold">{solicitud.codigo_radicado}</h1>
      <p className="text-sm text-gray-500">Estado actual: {solicitud.estado}</p>

      <section className="my-4 rounded-lg border border-gray-200 bg-white p-3">
        <p><b>Beneficiario:</b> {beneficiario?.nombres_apellidos} — CC {beneficiario?.numero_documento}</p>
        <p><b>Tel:</b> {beneficiario?.telefono_contacto} · <b>Tenencia:</b> {beneficiario?.condicion_tenencia} · <b>RUD:</b> {beneficiario?.inscrito_rud ? 'Sí' : 'No'}</p>
        <p><b>Ubicación:</b> {vivienda?.nombre_sector} ({vivienda?.zona}) — {vivienda?.direccion}</p>
        {solicitud.descripcion_danos_ciudadano && (
          <p className="mt-1 text-sm text-gray-600"><b>Descripción del ciudadano:</b> {solicitud.descripcion_danos_ciudadano}</p>
        )}
      </section>

      <GaleriaEvidencias solicitudId={solicitud.id} />

      {(solicitud.estado === 'enviada' || solicitud.estado === 'en_inspeccion') && perfil && (perfil.rol === 'inspector' || perfil.rol === 'admin') && (
        <FormularioEvaluacion solicitud={{ id: solicitud.id, tipo_evento: solicitud.tipo_evento, viviendas: vivienda }} />
      )}

      {solicitud.estado === 'evaluada' && perfil && (perfil.rol === 'coordinador' || perfil.rol === 'admin') && (
        <PanelAprobacion solicitudId={solicitud.id} />
      )}

      {solicitud.estado === 'evaluada' && perfil?.rol === 'inspector' && (
        <p className="text-gray-500">Ya evaluada. Pendiente de aprobación por el coordinador.</p>
      )}

      {(solicitud.estado === 'aprobada' || solicitud.estado === 'rechazada' || solicitud.estado === 'no_elegible') && (
        <p className="font-semibold">Caso cerrado — estado: {solicitud.estado}</p>
      )}
    </main>
  );
}
