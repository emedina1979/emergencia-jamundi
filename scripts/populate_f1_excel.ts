/**
 * Toma el JSON generado por export_ungrd.ts (o /api/export) y escribe una
 * copia de "Formato evaluación de vivienda UNGRD.xlsx" por cada solicitud,
 * con las casillas de la hoja "F1 EVALUACIÓN" diligenciadas.
 *
 * Uso:
 *   npm run populate:excel -- --in=export-ungrd-aprobada.json --plantilla="../Formato evaluación de vivienda UNGRD.xlsx" --out=./salida
 *
 * IMPORTANTE — alcance honesto de este mapeo:
 * Las coordenadas de celda de abajo fueron verificadas contra el archivo
 * fuente (revisando merged_cells con openpyxl): identificación del
 * beneficiario, ubicación de la vivienda, los 3 criterios SÍ/NO de la
 * sección 3, la sección 4 (elegibilidad) y el sistema constructivo (5.2).
 *
 * NO están mapeadas todavía (requieren inspeccionar más merges del Excel,
 * porque son grillas repetidas Leve/Moderado/Severo en columnas paralelas):
 *   - 5.4 / 5.5 evaluación técnica por elemento (filas 65-84)
 *   - 6. Selección de combos de materiales (filas 90-107)
 *   - 7. Datos de quien atiende la visita (fila 110)
 *   - 9. Firmas (son manuscritas, no aplica automatizar)
 * Esas secciones sí van completas en el JSON de export_ungrd.ts — solo falta
 * extender CELDAS_F1 de abajo con las coordenadas exactas una vez se revisen
 * los merges de esas filas en el Excel real. No se adivinan coordenadas para
 * no escribir datos de daño estructural en la celda equivocada.
 */
import ExcelJS from 'exceljs';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

function argValor(nombre: string, porDefecto?: string): string {
  const arg = process.argv.find((a) => a.startsWith(`--${nombre}=`));
  if (arg) return arg.split('=')[1];
  if (porDefecto !== undefined) return porDefecto;
  throw new Error(`Falta el argumento --${nombre}=`);
}

const SI_NO = (valor: boolean) => (valor ? 'X' : '');

async function main() {
  const inPath = argValor('in');
  const plantillaPath = argValor('plantilla');
  const outDir = argValor('out', './salida-ungrd');

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const solicitudes = JSON.parse(readFileSync(inPath, 'utf-8'));

  for (const s of solicitudes) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(plantillaPath);
    const ws = wb.getWorksheet('F1 EVALUACIÓN ');
    if (!ws) throw new Error('No se encontró la hoja "F1 EVALUACIÓN " en la plantilla');

    const b = s.beneficiarios;
    const v = s.viviendas;
    const insp = s.inspecciones?.[0] ?? s.inspecciones; // según el shape del JSON de origen

    // --- Sección 1/3: identificación del beneficiario (verificado) ---
    ws.getCell('AA17').value = b.nombres_apellidos;
    ws.getCell('AC18').value = b.numero_documento;
    ws.getCell('AJ18').value = b.lugar_expedicion;

    // --- Sección 2: ubicación (verificado) ---
    ws.getCell('K22').value = v.departamento;
    ws.getCell('K24').value = v.municipio;
    if (v.zona === 'cabecera_municipal') {
      ws.getCell('K26').value = v.nombre_sector;
    } else {
      ws.getCell('K29').value = v.nombre_sector; // corregimiento
      ws.getCell('K32').value = v.nombre_sector; // o vereda, según cuál use el municipio
    }
    ws.getCell('D30').value = v.direccion;

    // --- Sección 3: criterios SÍ/NO (verificado para RUD y zona de riesgo) ---
    if (b.inscrito_rud) ws.getCell('AR23').value = 'X'; else ws.getCell('AT23').value = 'X';
    // Mapeo asumido: propietario/poseedor -> SÍ, arrendatario -> NO. El Excel
    // fuente pregunta un único SÍ/NO ("es propietario"), pero la app captura
    // 3 estados porque el arrendatario no aplica a subsidio. Confirmar con la
    // Alcaldía si "poseedor" debe ir como SÍ o requiere una nota aparte.
    // (Checkbox de este criterio no confirmado por coordenada — ver cabecera del archivo.)
    if (v.predio_fuera_riesgo) ws.getCell('AR31').value = 'X'; else ws.getCell('AT31').value = 'X';

    // --- Sección 4: elegibilidad (verificado) ---
    if (insp) {
      if (insp.cumple_requisitos) ws.getCell('AA34').value = 'X'; else ws.getCell('AB34').value = 'X';
    }

    // --- Sección 5.2: sistema constructivo confirmado por el inspector (verificado) ---
    if (insp?.sistema_constructivo_confirmado === 'mamposteria') ws.getCell('K45').value = 'X';
    if (insp?.sistema_constructivo_confirmado === 'madera') ws.getCell('AD45').value = 'X';

    const archivo = path.join(outDir, `F1-${s.codigo_radicado}.xlsx`);
    await wb.xlsx.writeFile(archivo);
    console.log(`Generado ${archivo}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
