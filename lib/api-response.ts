import { NextResponse } from 'next/server';

/**
 * "TypeError: fetch failed" (undici, la implementación de fetch en Node) es
 * un mensaje inútil por sí solo — el motivo real (DNS no resuelve, timeout,
 * TLS, conexión rechazada) vive en `error.cause`, no en `error.message`.
 * Esta función arma un mensaje que encadena message + cause(s) para que el
 * error que llega al cliente/consola diga algo accionable en vez de
 * "fetch failed" a secas.
 */
function describirError(e: unknown, profundidadMax = 4): string {
  const partes: string[] = [];
  let actual: any = e;
  let profundidad = 0;
  while (actual && profundidad < profundidadMax) {
    const texto = actual instanceof Error ? actual.message : String(actual);
    if (texto && !partes.includes(texto)) partes.push(texto);
    actual = actual?.cause;
    profundidad++;
  }
  return partes.length > 0 ? partes.join(' → causado por: ') : 'Error interno del servidor';
}

/**
 * Envuelve un route handler para que CUALQUIER excepción no controlada
 * (ej. faltan las variables de entorno de Supabase, un rpc falla, la
 * conexión a Supabase falla a nivel de red, un throw suelto) termine en un
 * NextResponse.json con status 500 — nunca en una respuesta vacía. Una
 * respuesta vacía es lo que hace que `res.json()` en el cliente reviente
 * con "Unexpected end of JSON input" en vez de mostrar el error real.
 */
export async function manejarRuta(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (e) {
    const mensaje = describirError(e);
    // Se registra el objeto completo (no solo el mensaje) para que en los
    // logs de Vercel quede el stack y el cause original con todo detalle.
    console.error('[api] error no controlado:', e, (e as any)?.cause ? { cause: (e as any).cause } : undefined);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
