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
