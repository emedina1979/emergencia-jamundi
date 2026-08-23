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

  // No se filtra por id explícitamente: la política RLS staff_ver_propio_perfil
  // (id = auth.uid()) ya garantiza que esto solo puede devolver la fila del
  // usuario autenticado. Evita depender de una segunda llamada a
  // auth.getUser() (round-trip de red aparte) solo para obtener un id que
  // Postgres ya conoce por la sesión de la petición.
  const { data: perfil } = await supabase.from('staff_usuarios').select('rol').maybeSingle();

  const beneficiario = Array.isArray((solicitud as any).beneficiarios) ? (solicitud as any).beneficiarios[0] : (solicitud as any).beneficiarios;
  const vivienda = Array.isArray((solicitud as any).viviendas) ? (solicitud as any).viviendas[0] : (solicitud as any).viviendas;

  const puedeEvaluar = !!perfil && (solicitud.estado === 'enviada' || solicitud.estado === 'en_inspeccion') && (perfil.rol === 'inspector' || perfil.rol === 'admin');
  const puedeAprobar = !!perfil && solicitud.estado === 'evaluada' && (perfil.rol === 'coordinador' || perfil.rol === 'admin');
  const esperandoAprobacion = !!perfil && solicitud.estado === 'evaluada' && perfil.rol === 'inspector';
  const casoCerrado = solicitud.estado === 'aprobada' || solicitud.estado === 'rechazada' || solicitud.estado === 'no_elegible';
  const sinAccionParaEsteRol = !!perfil && !puedeEvaluar && !puedeAprobar && !esperandoAprobacion && !casoCerrado;

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

      {puedeEvaluar && (
        <FormularioEvaluacion solicitud={{ id: solicitud.id, tipo_evento: solicitud.tipo_evento, viviendas: vivienda }} />
      )}

      {puedeAprobar && <PanelAprobacion solicitudId={solicitud.id} />}

      {esperandoAprobacion && (
        <p className="text-gray-500">Ya evaluada. Pendiente de aprobación por el coordinador.</p>
      )}

      {casoCerrado && (
        <p className="font-semibold">Caso cerrado — estado: {solicitud.estado}</p>
      )}

      {!perfil && (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Tu usuario no tiene un perfil activo en staff_usuarios, así que no se te puede asignar ningún rol
          (inspector/coordinador). Pide que te den de alta con: <code>insert into staff_usuarios (id, nombres_apellidos, rol) values (auth.uid(), &apos;...&apos;, &apos;inspector&apos;);</code>
        </p>
      )}

      {sinAccionParaEsteRol && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Tu rol (&quot;{perfil!.rol}&quot;) no tiene ninguna acción disponible para el estado actual (&quot;{solicitud.estado}&quot;) de esta solicitud.
        </p>
      )}
    </main>
  );
}
