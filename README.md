# Banco de Materiales UNGRD — Jamundí

Sistema de dos partes:
1. **Intake ciudadano** (`/solicitud`) — identidad, ubicación, autoreporte de construcción, fotos/video, consentimiento. NO decide el nivel de daño ni el combo de materiales.
2. **Inspección y aprobación** (`/inspeccion`, requiere login) — un inspector con tarjeta profesional evalúa el daño estructural (F1 5.4/5.5) y el sistema calcula el combo desde el catálogo (ANEXO 2); un coordinador aprueba (F1 sección 9).

## Puesta en marcha

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En el SQL Editor del proyecto, ejecutar en orden: `sql/01_schema.sql`, `sql/02_rls.sql`, `sql/03_seed_materiales.sql`.
3. En Storage, crear un bucket **privado** llamado `evidencias-viviendas` (o el nombre que pongas en `SUPABASE_EVIDENCIAS_BUCKET`).
4. Copiar `.env.example` a `.env.local` y completar con la URL y llaves del proyecto (Project Settings → API).
5. Crear el primer usuario de personal:
   - Authentication → Users → Add user (correo + contraseña).
   - En SQL Editor: `insert into staff_usuarios (id, nombres_apellidos, rol, tarjeta_profesional) values ('<uid-del-usuario>', 'Nombre Apellido', 'admin', null);`
   - Repetir para cada inspector (rol `inspector`, con `tarjeta_profesional` obligatoria) y coordinador (rol `coordinador`).
6. `npm install`
7. `npm run dev` y abrir `http://localhost:3000`.

## Exportar a Excel UNGRD

```bash
npm run export:ungrd -- --estado=aprobada --out=export.json
npm run populate:excel -- --in=export.json --plantilla="../Formato evaluación de vivienda UNGRD.xlsx" --out=./salida
```

## Antes de usar esto en producción con las 1.900 familias

Estos puntos quedaron señalados en el código (buscar "TODO"/comentarios) y requieren decisión de la Alcaldía / UNGRD, no son bugs de programación:

- **Combo de materiales para vivienda en MADERA no está cargado** — el Excel fuente no trae esa tabla de cantidades (solo mampostería). `lib/combos.ts` rechaza el cálculo con un error explícito en vez de generar un combo vacío; hay que conseguir esas cifras antes de que un inspector evalúe una casa en madera.
- **Regla de agregación del nivel de daño general** (`lib/combos.ts: calcularNivelDanoGeneral`) asume "el peor elemento evaluado" porque el Excel no explicita cómo pasar de calificación por elemento a un único nivel de daño de la vivienda. Confirmar contra el Manual Operativo de la UNGRD.
- **Mapeo a celdas del Excel F1** (`scripts/populate_f1_excel.ts`) solo cubre identificación, ubicación, los criterios SÍ/NO de RUD y zona de riesgo, elegibilidad y sistema constructivo — coordenadas verificadas contra los merges reales del archivo. Las secciones 5.4/5.5, 6 y 7 no están mapeadas a celda porque son grillas repetidas que requieren revisar más a fondo el archivo real antes de escribir en la celda correcta; sí van completas en el JSON de exportación.
- **Autenticación de personal** es manual vía Supabase Dashboard (paso 5 arriba) — no hay autoregistro, a propósito.
- **Ninguna fase de este flujo previene por sí sola el fraude de identidad** (alguien enviando el formulario a nombre de otra persona). La única barrera hoy es "un documento = una solicitud activa"; verificación de identidad más fuerte (ej. validar contra el censo de damnificados) queda fuera de este alcance.
