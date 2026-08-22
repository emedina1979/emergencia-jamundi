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
