-- ============================================================================
-- CONSOLIDADO: pegar completo en el SQL Editor de Supabase.
-- Orden: 01_schema.sql + 02_rls.sql + 03_seed_materiales.sql
-- Generado a partir de los archivos individuales en esta misma carpeta —
-- si editas el esquema, edita el archivo fuente correspondiente y vuelve a
-- consolidar, no este archivo directamente.
-- ============================================================================

-- ============================================================================
-- 01_schema.sql
-- ============================================================================

-- ============================================================================
-- Esquema: Evaluación de vivienda y Banco de Materiales UNGRD — Jamundí
-- Mapea 1:1 con "Formato evaluación de vivienda UNGRD.xlsx":
--   hoja F1 EVALUACIÓN (secciones 1-9), hoja ANEXO (criterios de daño),
--   hoja ANEXO (2) (cantidades de materiales por combo/nivel de daño).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerados (mapean directo a las opciones fijas del formato F1)
-- ---------------------------------------------------------------------------
create type condicion_tenencia as enum ('propietario', 'poseedor', 'arrendatario');
create type zona_vivienda as enum ('cabecera_municipal', 'rural');
create type tipo_evento as enum ('inundacion', 'vendaval', 'sismo', 'avenida_torrencial', 'remocion_en_masa', 'otro');
create type sistema_constructivo as enum ('mamposteria', 'madera');
create type material_muro as enum ('ladrillo', 'bloque', 'madera', 'guadua', 'bahareque', 'otro');
create type material_piso as enum ('cemento', 'baldosa', 'madera', 'tierra', 'otro');
create type material_estructura as enum ('madera', 'concreto', 'mamposteria', 'otro');
create type material_cubierta as enum ('placa_concreto', 'madera', 'asbesto_cemento', 'teja_barro', 'zinc', 'palma', 'otro');
create type nivel_dano as enum ('leve', 'moderado', 'severo');
create type elemento_estructural as enum (
  'vigas_columnas', 'muros_carga', 'muros_divisorios', 'placa_piso',
  'cubierta', 'instalaciones_electricas', 'instalaciones_hidrosanitarias',
  'entrepisos', 'muros_madera'
);
create type estado_solicitud as enum (
  'enviada',            -- ciudadano diligenció el intake (Pasos 1-5)
  'en_inspeccion',      -- asignada a un inspector, aún sin evaluación completa
  'no_elegible',        -- sección 4 del F1: no cumple requisitos de auto-rehabilitación
  'evaluada',           -- inspector completó 5.x y el combo fue calculado
  'aprobada',           -- coordinador firmó sección 9
  'rechazada'           -- coordinador no aprobó
);
create type rol_staff as enum ('inspector', 'coordinador', 'admin');
create type tipo_evidencia as enum ('foto_fachada', 'foto_dano_principal', 'foto_cubierta', 'video_recorrido', 'otro');
create type categoria_kit as enum ('estructura', 'cubierta_zinc', 'cubierta_fibrocemento', 'herramientas');

-- ---------------------------------------------------------------------------
-- Beneficiario — F1 sección 1 y 3 "DATOS DEL BENEFICIARIO"
-- ---------------------------------------------------------------------------
create table beneficiarios (
  id uuid primary key default gen_random_uuid(),
  nombres_apellidos text not null,
  numero_documento text not null unique,
  lugar_expedicion text not null,
  telefono_contacto text not null,
  inscrito_rud boolean not null,               -- ¿Inscrito en el RUD?
  condicion_tenencia condicion_tenencia not null,
  predio_fuera_riesgo boolean not null,         -- predio fuera de zona de alto riesgo no mitigable
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Vivienda — F1 sección 2 (ubicación) + 5.2/5.3 (sistema constructivo)
-- ---------------------------------------------------------------------------
create table viviendas (
  id uuid primary key default gen_random_uuid(),
  departamento text not null default 'Valle del Cauca',
  municipio text not null default 'Jamundí',
  zona zona_vivienda not null,
  nombre_sector text not null,                  -- barrio / corregimiento / vereda
  direccion text not null,
  latitud numeric(9, 6),
  longitud numeric(9, 6),
  -- 5.2 / 5.3 — completados por el ciudadano en el intake como referencia;
  -- el inspector los confirma o corrige en la inspección (ver inspecciones.*_confirmado)
  sistema_constructivo sistema_constructivo,
  material_muro material_muro,
  material_piso material_piso,
  material_estructura material_estructura,
  material_cubierta material_cubierta,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Solicitud — expediente/caso que amarra beneficiario + vivienda + flujo
-- ---------------------------------------------------------------------------
create table solicitudes (
  id uuid primary key default gen_random_uuid(),
  codigo_radicado text not null unique,         -- ej. JAM-2026-000123, generado en la API
  beneficiario_id uuid not null references beneficiarios(id),
  vivienda_id uuid not null references viviendas(id),
  tipo_evento tipo_evento not null default 'sismo',
  estado estado_solicitud not null default 'enviada',
  descripcion_danos_ciudadano text,              -- narrativa libre del ciudadano; NUNCA determina el combo
  habeas_data_aceptado boolean not null,
  declaracion_veracidad_aceptada boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un beneficiario puede tener como máximo una solicitud activa (no rechazada) a la vez;
-- si se rechaza, puede volver a radicar.
create unique index solicitudes_beneficiario_activa_uk
  on solicitudes (beneficiario_id)
  where estado <> 'rechazada';

create index solicitudes_estado_idx on solicitudes (estado);

-- ---------------------------------------------------------------------------
-- Evidencias — hoja F3-fotografias (fotos y video del intake ciudadano)
-- ---------------------------------------------------------------------------
create table evidencias (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  tipo tipo_evidencia not null,
  storage_path text not null,                    -- ruta en Supabase Storage
  mime_type text not null,
  tamano_bytes integer not null,
  created_at timestamptz not null default now()
);

create index evidencias_solicitud_idx on evidencias (solicitud_id);

-- ---------------------------------------------------------------------------
-- Personal municipal — inspectores y coordinadores (perfil ligado a auth.users)
-- ---------------------------------------------------------------------------
create table staff_usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombres_apellidos text not null,
  rol rol_staff not null,
  tarjeta_profesional text,                      -- obligatoria si rol = 'inspector'
  profesion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint staff_inspector_requiere_tarjeta
    check (rol <> 'inspector' or tarjeta_profesional is not null)
);

-- ---------------------------------------------------------------------------
-- Inspección — F1 secciones 4, 5.1-5.3, 7, 9 (sin el detalle por elemento)
-- ---------------------------------------------------------------------------
create table inspecciones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null unique references solicitudes(id) on delete cascade,
  inspector_id uuid not null references staff_usuarios(id),
  fecha_inspeccion date not null default current_date,

  -- Sección 4: requisitos para auto-rehabilitación
  cumple_requisitos boolean not null default true,
  motivo_no_elegible text,

  -- Sección 5.1 / 5.2 confirmados en terreno (pueden diferir de lo reportado por el ciudadano)
  tipo_evento_confirmado tipo_evento not null,
  sistema_constructivo_confirmado sistema_constructivo not null,
  material_cubierta_confirmado material_cubierta not null,

  -- Sección 7: si el beneficiario no está presente en la visita
  nombre_persona_entrevistada text,
  documento_persona_entrevistada text,
  parentesco_persona_entrevistada text,
  telefono_persona_entrevistada text,

  -- Sección 9: datos del profesional que firma
  nombre_profesional text not null,
  tarjeta_profesional text not null,
  profesion text,

  nivel_dano_general nivel_dano,                 -- calculado, ver lib/combos.ts
  observaciones text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint inspeccion_no_elegible_requiere_motivo
    check (cumple_requisitos or motivo_no_elegible is not null)
);

-- ---------------------------------------------------------------------------
-- Elementos evaluados — F1 5.4/5.5, un registro por elemento estructural
-- ---------------------------------------------------------------------------
create table elementos_evaluados (
  id uuid primary key default gen_random_uuid(),
  inspeccion_id uuid not null references inspecciones(id) on delete cascade,
  elemento elemento_estructural not null,
  fue_afectado boolean not null,
  nivel_dano nivel_dano,                          -- null si fue_afectado = false
  unique (inspeccion_id, elemento),
  constraint elemento_afectado_requiere_nivel
    check (not fue_afectado or nivel_dano is not null)
);

-- ---------------------------------------------------------------------------
-- Catálogo de materiales — ANEXO (2), datos de referencia fijos (no editable
-- desde el flujo ciudadano ni inspector; solo por migración/administración).
-- ---------------------------------------------------------------------------
create table materiales_combo_lookup (
  id uuid primary key default gen_random_uuid(),
  tipo_vivienda sistema_constructivo not null,
  categoria categoria_kit not null,
  nivel_dano nivel_dano not null,
  kit_nombre text not null,
  item_descripcion text not null,
  unidad text not null,
  cantidad numeric not null check (cantidad >= 0),
  orden int not null default 0
);

create index materiales_combo_lookup_busqueda_idx
  on materiales_combo_lookup (tipo_vivienda, categoria, nivel_dano);

-- ---------------------------------------------------------------------------
-- Materiales asignados — resultado calculado y congelado por solicitud
-- (se conserva aunque el catálogo cambie después)
-- ---------------------------------------------------------------------------
create table solicitud_materiales (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  categoria categoria_kit not null,
  kit_nombre text not null,
  item_descripcion text not null,
  unidad text not null,
  cantidad numeric not null,
  generado_en timestamptz not null default now()
);

create index solicitud_materiales_solicitud_idx on solicitud_materiales (solicitud_id);

-- ---------------------------------------------------------------------------
-- Aprobación — F1 sección 9, firma del coordinador del Consejo Territorial
-- ---------------------------------------------------------------------------
create table aprobaciones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null unique references solicitudes(id) on delete cascade,
  coordinador_id uuid not null references staff_usuarios(id),
  aprobado boolean not null,
  observaciones text,
  fecha_aprobacion timestamptz not null default now()
);

-- Secuencia atómica para el código de radicado (evita colisiones si dos
-- ciudadanos envían el formulario al mismo tiempo; un conteo de filas en el
-- cliente no es seguro bajo concurrencia).
create sequence solicitudes_radicado_seq start 1;

create or replace function siguiente_codigo_radicado(prefijo text)
returns text language sql as $$
  select prefijo || '-' || lpad(nextval('solicitudes_radicado_seq')::text, 6, '0');
$$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger solicitudes_set_updated_at before update on solicitudes
  for each row execute function set_updated_at();
create trigger inspecciones_set_updated_at before update on inspecciones
  for each row execute function set_updated_at();

-- ============================================================================
-- 02_rls.sql
-- ============================================================================

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

-- ============================================================================
-- 03_seed_materiales.sql
-- ============================================================================

-- ============================================================================
-- Catálogo de materiales — transcrito directamente de la hoja "ANEXO (2)" del
-- archivo "Formato evaluación de vivienda UNGRD.xlsx".
--
-- IMPORTANTE: la hoja ANEXO (2) SOLO contiene cantidades para vivienda en
-- MAMPOSTERÍA. La hoja "F1 EVALUACIÓN" sí tiene casillas para Combo 4/5/6
-- (vivienda en MADERA: Kit Estructura, Kit Muros, Kit Entrepisos, Kit
-- Hidrosanitario, Kit Eléctrico) pero el archivo fuente NO trae la tabla de
-- cantidades correspondiente. No se inventan cifras aquí: mientras esas filas
-- no se carguen, el motor de combos (lib/combos.ts) debe rechazar el cálculo
-- para sistema_constructivo = 'madera' en vez de devolver un listado vacío.
-- ============================================================================

-- Categoría: estructura (mampostería) — Combo 1 (leve) / Combo 2 (moderado) / Combo 3 (severo)
insert into materiales_combo_lookup (tipo_vivienda, categoria, nivel_dano, kit_nombre, item_descripcion, unidad, cantidad, orden) values
('mamposteria','estructura','leve',    'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Cemento Bulto 50 Kg', 'Und', 4, 1),
('mamposteria','estructura','moderado','Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Cemento Bulto 50 Kg', 'Und', 15, 1),
('mamposteria','estructura','severo',  'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Cemento Bulto 50 Kg', 'Und', 25, 1),

('mamposteria','estructura','leve',    'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 1/4" L=6M', 'Und', 0, 2),
('mamposteria','estructura','moderado','Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 1/4" L=6M', 'Und', 25, 2),
('mamposteria','estructura','severo',  'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 1/4" L=6M', 'Und', 40, 2),

('mamposteria','estructura','leve',    'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 3/8" L=6M', 'Und', 0, 3),
('mamposteria','estructura','moderado','Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 3/8" L=6M', 'Und', 12, 3),
('mamposteria','estructura','severo',  'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 3/8" L=6M', 'Und', 20, 3),

('mamposteria','estructura','leve',    'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 1/2" L=6M', 'Und', 0, 4),
('mamposteria','estructura','moderado','Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 1/2" L=6M', 'Und', 8, 4),
('mamposteria','estructura','severo',  'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Varilla de 1/2" L=6M', 'Und', 12, 4),

('mamposteria','estructura','leve',    'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Alambre negro No. 18', 'Kg', 0, 5),
('mamposteria','estructura','moderado','Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Alambre negro No. 18', 'Kg', 3, 5),
('mamposteria','estructura','severo',  'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Alambre negro No. 18', 'Kg', 6, 5),

('mamposteria','estructura','leve',    'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Puntilla de 2"', 'Lb', 0, 6),
('mamposteria','estructura','moderado','Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Puntilla de 2"', 'Lb', 2, 6),
('mamposteria','estructura','severo',  'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Puntilla de 2"', 'Lb', 3, 6),

('mamposteria','estructura','leve',    'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Tabla común L=3m para encofrado', 'Und', 0, 7),
('mamposteria','estructura','moderado','Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Tabla común L=3m para encofrado', 'Und', 10, 7),
('mamposteria','estructura','severo',  'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Tabla común L=3m para encofrado', 'Und', 15, 7),

('mamposteria','estructura','leve',    'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Malla electrosoldada 3mm 15x15cm (6x2,35)', 'Und', 0, 8),
('mamposteria','estructura','moderado','Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Malla electrosoldada 3mm 15x15cm (6x2,35)', 'Und', 2, 8),
('mamposteria','estructura','severo',  'Kit estructura tipo concreto (Vigas, columnas, placas de piso)', 'Malla electrosoldada 3mm 15x15cm (6x2,35)', 'Und', 4, 8),

('mamposteria','estructura','leve',    'Kit mampostería adobe macizo', 'Ladrillo tolete común', 'Und', 450, 9),
('mamposteria','estructura','moderado','Kit mampostería adobe macizo', 'Ladrillo tolete común', 'Und', 900, 9),
('mamposteria','estructura','severo',  'Kit mampostería adobe macizo', 'Ladrillo tolete común', 'Und', 1500, 9),

('mamposteria','estructura','leve',    'Kit mampostería adobe macizo', 'Cemento Bulto 50 Kg', 'Und', 3, 10),
('mamposteria','estructura','moderado','Kit mampostería adobe macizo', 'Cemento Bulto 50 Kg', 'Und', 12, 10),
('mamposteria','estructura','severo',  'Kit mampostería adobe macizo', 'Cemento Bulto 50 Kg', 'Und', 21, 10),

('mamposteria','estructura','leve',    'Kit mampostería adobe macizo', 'Sika', 'Kg', 2, 11),
('mamposteria','estructura','moderado','Kit mampostería adobe macizo', 'Sika', 'Kg', 4, 11),
('mamposteria','estructura','severo',  'Kit mampostería adobe macizo', 'Sika', 'Kg', 6, 11),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Tubería Hidráulica PVC Presión 1/2" RDE 13,5 - 315 PSI L=6m', 'Und', 1, 12),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Tubería Hidráulica PVC Presión 1/2" RDE 13,5 - 315 PSI L=6m', 'Und', 2, 12),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Tubería Hidráulica PVC Presión 1/2" RDE 13,5 - 315 PSI L=6m', 'Und', 4, 12),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Llave de Paso', 'Und', 0, 13),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Llave de Paso', 'Und', 1, 13),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Llave de Paso', 'Und', 2, 13),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Tanque de agua 500 L', 'Und', 0, 14),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Tanque de agua 500 L', 'Und', 0, 14),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Tanque de agua 500 L', 'Und', 1, 14),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Tubería PVC sanitaria de 2" L=6m', 'Und', 1, 15),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Tubería PVC sanitaria de 2" L=6m', 'Und', 3, 15),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Tubería PVC sanitaria de 2" L=6m', 'Und', 5, 15),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Tubería PVC sanitaria de 3" L=6m', 'Und', 1, 16),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Tubería PVC sanitaria de 3" L=6m', 'Und', 3, 16),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Tubería PVC sanitaria de 3" L=6m', 'Und', 5, 16),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Tubería PVC sanitaria de 4" L=6m', 'Und', 2, 17),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Tubería PVC sanitaria de 4" L=6m', 'Und', 4, 17),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Tubería PVC sanitaria de 4" L=6m', 'Und', 6, 17),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Tanque pozo séptico', 'Und', 0, 18),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Tanque pozo séptico', 'Und', 0, 18),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Tanque pozo séptico', 'Und', 1, 18),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Rejilla metálica 3x2" con sosco', 'Und', 0, 19),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Rejilla metálica 3x2" con sosco', 'Und', 2, 19),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Rejilla metálica 3x2" con sosco', 'Und', 3, 19),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Pegante PVC PAVCO 1/4 galón (Soldadura)', 'Und', 1, 20),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Pegante PVC PAVCO 1/4 galón (Soldadura)', 'Und', 1, 20),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Pegante PVC PAVCO 1/4 galón (Soldadura)', 'Und', 1, 20),

('mamposteria','estructura','leve',    'Kit Hidrosanitario', 'Limpiador líquido PVC PAVCO 1/4 galón', 'Und', 1, 21),
('mamposteria','estructura','moderado','Kit Hidrosanitario', 'Limpiador líquido PVC PAVCO 1/4 galón', 'Und', 1, 21),
('mamposteria','estructura','severo',  'Kit Hidrosanitario', 'Limpiador líquido PVC PAVCO 1/4 galón', 'Und', 1, 21),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Tablero monofásico de 4 circuitos', 'Und', 0, 22),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Tablero monofásico de 4 circuitos', 'Und', 0, 22),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Tablero monofásico de 4 circuitos', 'Und', 1, 22),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Braker Luminex o similar enchufable 40Amp', 'Und', 0, 23),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Braker Luminex o similar enchufable 40Amp', 'Und', 0, 23),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Braker Luminex o similar enchufable 40Amp', 'Und', 1, 23),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Cable 10 AWG - THW', 'm', 0, 24),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Cable 10 AWG - THW', 'm', 25, 24),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Cable 10 AWG - THW', 'm', 50, 24),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Cable 12 AWG - THW', 'm', 0, 25),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Cable 12 AWG - THW', 'm', 25, 25),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Cable 12 AWG - THW', 'm', 50, 25),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Varilla polo a tierra - Copper Weld', 'Und', 0, 26),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Varilla polo a tierra - Copper Weld', 'Und', 0, 26),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Varilla polo a tierra - Copper Weld', 'Und', 1, 26),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Tubería PVC de 1/2" conduit L=3m', 'm', 0, 27),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Tubería PVC de 1/2" conduit L=3m', 'm', 2, 27),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Tubería PVC de 1/2" conduit L=3m', 'm', 6, 27),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Curva PVC de 1/2" conduit 90° c*e', 'Und', 0, 28),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Curva PVC de 1/2" conduit 90° c*e', 'Und', 4, 28),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Curva PVC de 1/2" conduit 90° c*e', 'Und', 8, 28),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Caja Sencilla Rectangular PVC para Electricidad de 4x2"', 'Und', 0, 29),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Caja Sencilla Rectangular PVC para Electricidad de 4x2"', 'Und', 0, 29),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Caja Sencilla Rectangular PVC para Electricidad de 4x2"', 'Und', 4, 29),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Caja Sencilla Rectangular PVC para Electricidad de 4x4"', 'Und', 0, 30),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Caja Sencilla Rectangular PVC para Electricidad de 4x4"', 'Und', 0, 30),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Caja Sencilla Rectangular PVC para Electricidad de 4x4"', 'Und', 4, 30),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Caja plástica eléctrica octagonal de 4"', 'Und', 0, 31),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Caja plástica eléctrica octagonal de 4"', 'Und', 0, 31),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Caja plástica eléctrica octagonal de 4"', 'Und', 4, 31),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Toma corriente doble', 'Und', 0, 32),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Toma corriente doble', 'Und', 3, 32),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Toma corriente doble', 'Und', 5, 32),

('mamposteria','estructura','leve',    'Kit Eléctrico', 'Interruptor Sencillo', 'Und', 0, 33),
('mamposteria','estructura','moderado','Kit Eléctrico', 'Interruptor Sencillo', 'Und', 3, 33),
('mamposteria','estructura','severo',  'Kit Eléctrico', 'Interruptor Sencillo', 'Und', 5, 33);

-- Categoría: cubierta_zinc (mampostería)
insert into materiales_combo_lookup (tipo_vivienda, categoria, nivel_dano, kit_nombre, item_descripcion, unidad, cantidad, orden) values
('mamposteria','cubierta_zinc','leve',    'Kit Cubierta Zinc', 'Teja lámina de zinc (L=2,44 m)', 'Und', 4, 1),
('mamposteria','cubierta_zinc','moderado','Kit Cubierta Zinc', 'Teja lámina de zinc (L=2,44 m)', 'Und', 10, 1),
('mamposteria','cubierta_zinc','severo',  'Kit Cubierta Zinc', 'Teja lámina de zinc (L=2,44 m)', 'Und', 20, 1),

('mamposteria','cubierta_zinc','leve',    'Kit Cubierta Zinc', 'Amarras', 'Und', 24, 2),
('mamposteria','cubierta_zinc','moderado','Kit Cubierta Zinc', 'Amarras', 'Und', 60, 2),
('mamposteria','cubierta_zinc','severo',  'Kit Cubierta Zinc', 'Amarras', 'Und', 120, 2),

('mamposteria','cubierta_zinc','leve',    'Kit estructura metálica para soporte de cubierta', 'Perfil metálico 3"x1-1/2"x6m', 'Und', 0, 3),
('mamposteria','cubierta_zinc','moderado','Kit estructura metálica para soporte de cubierta', 'Perfil metálico 3"x1-1/2"x6m', 'Und', 2, 3),
('mamposteria','cubierta_zinc','severo',  'Kit estructura metálica para soporte de cubierta', 'Perfil metálico 3"x1-1/2"x6m', 'Und', 3, 3),

('mamposteria','cubierta_zinc','leve',    'Kit Canaleta de aguas lluvias', 'Canaleta de aguas lluvias, L=2m', 'Und', 0, 4),
('mamposteria','cubierta_zinc','moderado','Kit Canaleta de aguas lluvias', 'Canaleta de aguas lluvias, L=2m', 'Und', 2, 4),
('mamposteria','cubierta_zinc','severo',  'Kit Canaleta de aguas lluvias', 'Canaleta de aguas lluvias, L=2m', 'Und', 3, 4);

-- Categoría: cubierta_fibrocemento (mampostería)
insert into materiales_combo_lookup (tipo_vivienda, categoria, nivel_dano, kit_nombre, item_descripcion, unidad, cantidad, orden) values
('mamposteria','cubierta_fibrocemento','leve',    'Kit Cubierta Fibrocemento', 'Teja No. 8 (L=2,44 m)', 'Und', 4, 1),
('mamposteria','cubierta_fibrocemento','moderado','Kit Cubierta Fibrocemento', 'Teja No. 8 (L=2,44 m)', 'Und', 10, 1),
('mamposteria','cubierta_fibrocemento','severo',  'Kit Cubierta Fibrocemento', 'Teja No. 8 (L=2,44 m)', 'Und', 20, 1),

('mamposteria','cubierta_fibrocemento','leve',    'Kit Cubierta Fibrocemento', 'Caballete para teja fibrocemento', 'Und', 0, 2),
('mamposteria','cubierta_fibrocemento','moderado','Kit Cubierta Fibrocemento', 'Caballete para teja fibrocemento', 'Und', 2, 2),
('mamposteria','cubierta_fibrocemento','severo',  'Kit Cubierta Fibrocemento', 'Caballete para teja fibrocemento', 'Und', 4, 2),

('mamposteria','cubierta_fibrocemento','leve',    'Kit Cubierta Fibrocemento', 'Ganchos para teja', 'Und', 8, 3),
('mamposteria','cubierta_fibrocemento','moderado','Kit Cubierta Fibrocemento', 'Ganchos para teja', 'Und', 20, 3),
('mamposteria','cubierta_fibrocemento','severo',  'Kit Cubierta Fibrocemento', 'Ganchos para teja', 'Und', 40, 3),

('mamposteria','cubierta_fibrocemento','leve',    'Kit estructura metálica para soporte de cubierta', 'Perfil metálico 3"x1-1/2"x6m', 'Und', 0, 4),
('mamposteria','cubierta_fibrocemento','moderado','Kit estructura metálica para soporte de cubierta', 'Perfil metálico 3"x1-1/2"x6m', 'Und', 2, 4),
('mamposteria','cubierta_fibrocemento','severo',  'Kit estructura metálica para soporte de cubierta', 'Perfil metálico 3"x1-1/2"x6m', 'Und', 3, 4),

('mamposteria','cubierta_fibrocemento','leve',    'Kit Canaleta de aguas lluvias', 'Canaleta de aguas lluvias, L=2m', 'Und', 0, 5),
('mamposteria','cubierta_fibrocemento','moderado','Kit Canaleta de aguas lluvias', 'Canaleta de aguas lluvias, L=2m', 'Und', 2, 5),
('mamposteria','cubierta_fibrocemento','severo',  'Kit Canaleta de aguas lluvias', 'Canaleta de aguas lluvias, L=2m', 'Und', 3, 5);

-- Categoría: herramientas (mampostería) — cantidad fija sin importar el nivel de daño
insert into materiales_combo_lookup (tipo_vivienda, categoria, nivel_dano, kit_nombre, item_descripcion, unidad, cantidad, orden)
select 'mamposteria', 'herramientas', nd.nivel_dano, 'Kit Herramientas', h.item_descripcion, 'Und', 1, h.orden
from (values
  ('Martillo 16 Onzas', 1),
  ('Segueta con marco, incluye 2 repuestos', 2),
  ('Serrucho de 18"', 3),
  ('Palustre 7" mango plástico', 4),
  ('Llana metálica', 5),
  ('Alicate 8"', 6),
  ('Corta Frío 6"', 7),
  ('Pala redonda # 2 con cabo de madera', 8),
  ('Balde de Construcción', 9),
  ('Carretilla', 10),
  ('Nivel de Aluminio 12"', 11),
  ('Flexómetro (10m)', 12),
  ('Guantes de Seguridad', 13),
  ('Plomada', 14),
  ('Puntero', 15),
  ('Maceta', 16)
) as h(item_descripcion, orden)
cross join (values ('leve'::nivel_dano), ('moderado'::nivel_dano), ('severo'::nivel_dano)) as nd(nivel_dano);

-- NOTA: no se inserta ninguna fila con tipo_vivienda = 'madera'. Ver comentario
-- al inicio de este archivo — falta la tabla de cantidades en el Excel fuente.
