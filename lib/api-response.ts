import { NextResponse } from 'next/server';

/**
 * Envuelve un route handler para que CUALQUIER excepción no controlada
 * (ej. faltan las variables de entorno de Supabase, un rpc falla, un throw
 * suelto) termine en un NextResponse.json con status 500 — nunca en una
 * respuesta vacía. Una respuesta vacía es lo que hace que `res.json()` en
 * el cliente reviente con "Unexpected end of JSON input" en vez de mostrar
 * el error real.
 */
export async function manejarRuta(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (e) {
    console.error('[api] error no controlado:', e);
    const mensaje = e instanceof Error ? e.message : 'Error interno del servidor';
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
