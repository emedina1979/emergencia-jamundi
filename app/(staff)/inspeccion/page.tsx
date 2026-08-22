import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';

const ETIQUETA_ESTADO: Record<string, string> = {
  enviada: 'Pendiente de inspección',
  en_inspeccion: 'En inspección',
  no_elegible: 'No elegible',
  evaluada: 'Evaluada — pendiente de aprobación',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

export default async function PaginaColaInspeccion() {
  const supabase = supabaseServer();
  // RLS (staff_lee_solicitudes en 02_rls.sql) filtra automáticamente: si el
  // usuario no tiene un perfil activo en staff_usuarios, esta consulta no
  // devuelve nada, sin necesidad de repetir el chequeo de rol aquí.
  const { data: solicitudes } = await supabase
    .from('solicitudes')
    .select('id, codigo_radicado, estado, tipo_evento, created_at, beneficiarios(nombres_apellidos), viviendas(nombre_sector, zona)')
    .order('created_at', { ascending: true });

  return (
    <main className="p-5">
      <h1 className="mb-4 text-lg font-bold">Cola de inspección — Jamundí</h1>
      <div className="space-y-2">
        {(solicitudes ?? []).map((s: any) => (
          <Link
            key={s.id}
            href={`/inspeccion/${s.id}`}
            className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
          >
            <div className="flex justify-between">
              <span className="font-semibold">{s.codigo_radicado}</span>
              <span className="text-sm text-gray-500">{ETIQUETA_ESTADO[s.estado] ?? s.estado}</span>
            </div>
            <p className="text-sm text-gray-600">{s.beneficiarios?.nombres_apellidos}</p>
            <p className="text-xs text-gray-400">{s.viviendas?.nombre_sector} · {s.viviendas?.zona}</p>
          </Link>
        ))}
        {(!solicitudes || solicitudes.length === 0) && (
          <p className="text-gray-500">No hay solicitudes registradas, o su usuario no tiene un perfil de personal activo.</p>
        )}
      </div>
    </main>
  );
}
