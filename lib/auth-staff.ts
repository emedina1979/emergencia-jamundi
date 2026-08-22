import { supabaseServer } from '@/lib/supabase/server';

export type RolStaff = 'inspector' | 'coordinador' | 'admin';

export interface StaffAutenticado {
  id: string;
  rol: RolStaff;
  nombres_apellidos: string;
}

/**
 * Verifica la sesión (cookies) contra Supabase Auth y confirma que el usuario
 * tiene un perfil activo en staff_usuarios con alguno de los roles permitidos.
 * Se usa al inicio de cada ruta API de /api/inspeccion/** antes de tocar la
 * base con la service role key — la service role ignora RLS, así que esta
 * verificación es la única barrera real contra un ciudadano (o un inspector
 * sin el rol correcto) escribiendo en esas tablas.
 */
export async function requiereStaff(rolesPermitidos: RolStaff[]): Promise<StaffAutenticado | null> {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('staff_usuarios')
    .select('id, rol, nombres_apellidos, activo')
    .eq('id', user.id)
    .maybeSingle();

  if (!perfil || !perfil.activo) return null;
  if (!rolesPermitidos.includes(perfil.rol as RolStaff)) return null;

  return { id: perfil.id, rol: perfil.rol as RolStaff, nombres_apellidos: perfil.nombres_apellidos };
}
