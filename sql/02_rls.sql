-- ============================================================================
-- Row Level Security
--
-- Regla general: NINGUNA tabla acepta escritura directa desde el cliente
-- (anon ni authenticated). Todas las escrituras pasan por las rutas API de
-- Next.js usando la service role key (que ignora RLS por diseño de Supabase).
-- Esto evita que un ciudadano o un inspector manipule directamente el estado
-- del expediente, el nivel de daño o el catálogo de materiales desde el
-- navegador.
--
-- El personal (inspector/coordinador) sí puede LEER lo necesario para su
-- trabajo directamente desde el cliente autenticado, vía las políticas de
-- SELECT de abajo.
-- ============================================================================

alter table beneficiarios enable row level security;
alter table viviendas enable row level security;
alter table solicitudes enable row level security;
alter table evidencias enable row level security;
alter table staff_usuarios enable row level security;
alter table inspecciones enable row level security;
alter table elementos_evaluados enable row level security;
alter table materiales_combo_lookup enable row level security;
alter table solicitud_materiales enable row level security;
alter table aprobaciones enable row level security;

create or replace function es_staff_activo()
returns boolean language sql stable as $$
  select exists (
    select 1 from staff_usuarios
    where id = auth.uid() and activo
  );
$$;

-- Personal autenticado puede ver su propio perfil
create policy staff_ver_propio_perfil on staff_usuarios
  for select using (id = auth.uid());

-- Personal activo puede leer expedientes, beneficiarios, viviendas y evidencias
create policy staff_lee_solicitudes on solicitudes
  for select using (es_staff_activo());
create policy staff_lee_beneficiarios on beneficiarios
  for select using (es_staff_activo());
create policy staff_lee_viviendas on viviendas
  for select using (es_staff_activo());
create policy staff_lee_evidencias on evidencias
  for select using (es_staff_activo());
create policy staff_lee_inspecciones on inspecciones
  for select using (es_staff_activo());
create policy staff_lee_elementos on elementos_evaluados
  for select using (es_staff_activo());
create policy staff_lee_materiales on solicitud_materiales
  for select using (es_staff_activo());
create policy staff_lee_aprobaciones on aprobaciones
  for select using (es_staff_activo());

-- El catálogo de materiales (ANEXO 2) es de solo lectura para todo el personal
create policy staff_lee_catalogo on materiales_combo_lookup
  for select using (es_staff_activo());
