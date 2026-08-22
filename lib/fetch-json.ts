/**
 * Lee una Response de forma segura: nunca llama res.json() a ciegas.
 * Si el cuerpo viene vacío o no es JSON válido (ej. la función serverless
 * crasheó y devolvió una respuesta sin contenido), lanza un error legible
 * en vez de que el navegador reviente con "Unexpected end of JSON input".
 */
export async function parsearRespuesta<T = any>(res: Response): Promise<T> {
  const texto = await res.text();
  let datos: any = undefined;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      // el cuerpo no era JSON — se maneja abajo con el texto crudo
    }
  }

  if (!res.ok) {
    const mensaje = datos?.error ?? (texto ? texto.slice(0, 300) : `Error HTTP ${res.status}`);
    throw new Error(mensaje);
  }
  if (datos === undefined) {
    throw new Error('El servidor respondió sin contenido. Intente de nuevo o contacte soporte.');
  }
  return datos as T;
}
