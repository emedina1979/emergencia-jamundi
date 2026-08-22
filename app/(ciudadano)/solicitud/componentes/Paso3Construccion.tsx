'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pasoConstruccionSchema, type PasoConstruccion } from '@/lib/validations';

export function Paso3Construccion({
  valorInicial,
  onSiguiente,
  onAtras,
}: {
  valorInicial?: Partial<PasoConstruccion>;
  onSiguiente: (datos: PasoConstruccion) => void;
  onAtras: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<PasoConstruccion>({
    resolver: zodResolver(pasoConstruccionSchema),
    defaultValues: valorInicial,
  });

  return (
    <form onSubmit={handleSubmit(onSiguiente)} className="space-y-4">
      <h2 className="text-lg font-bold">3. ¿Cómo está construida su vivienda?</h2>
      <p className="text-sm text-gray-500">
        Esto es solo información de referencia — un profesional confirmará estos datos durante la visita de inspección.
      </p>

      <div>
        <p className="campo-label">Sistema constructivo principal</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" value="mamposteria" {...register('sistema_constructivo')} /> Mampostería (ladrillo/bloque)</label>
          <label className="flex items-center gap-2"><input type="radio" value="madera" {...register('sistema_constructivo')} /> Madera</label>
        </div>
        {errors.sistema_constructivo && <p className="campo-error">{errors.sistema_constructivo.message}</p>}
      </div>

      <div>
        <label className="campo-label">Material predominante en muros</label>
        <select className="campo-input" {...register('material_muro')}>
          <option value="">Seleccione…</option>
          <option value="ladrillo">Ladrillo</option>
          <option value="bloque">Bloque</option>
          <option value="madera">Madera</option>
          <option value="guadua">Guadua</option>
          <option value="bahareque">Bahareque</option>
          <option value="otro">Otro</option>
        </select>
        {errors.material_muro && <p className="campo-error">{errors.material_muro.message}</p>}
      </div>

      <div>
        <label className="campo-label">Material de cubierta (techo)</label>
        <select className="campo-input" {...register('material_cubierta')}>
          <option value="">Seleccione…</option>
          <option value="zinc">Teja de zinc</option>
          <option value="asbesto_cemento">Fibrocemento</option>
          <option value="teja_barro">Teja de barro</option>
          <option value="placa_concreto">Placa de concreto</option>
          <option value="madera">Madera</option>
          <option value="palma">Palma</option>
          <option value="otro">Otro</option>
        </select>
        {errors.material_cubierta && <p className="campo-error">{errors.material_cubierta.message}</p>}
      </div>

      <div>
        <label className="campo-label">Material de pisos</label>
        <select className="campo-input" {...register('material_piso')}>
          <option value="">Seleccione…</option>
          <option value="cemento">Cemento</option>
          <option value="baldosa">Baldosa</option>
          <option value="madera">Madera</option>
          <option value="tierra">Tierra</option>
          <option value="otro">Otro</option>
        </select>
        {errors.material_piso && <p className="campo-error">{errors.material_piso.message}</p>}
      </div>

      <div>
        <label className="campo-label">Material de la estructura portante</label>
        <select className="campo-input" {...register('material_estructura')}>
          <option value="">Seleccione…</option>
          <option value="concreto">Concreto</option>
          <option value="mamposteria">Mampostería</option>
          <option value="madera">Madera</option>
          <option value="otro">Otro</option>
        </select>
        {errors.material_estructura && <p className="campo-error">{errors.material_estructura.message}</p>}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onAtras} className="btn-secundario">Atrás</button>
        <button type="submit" className="btn-primario">Continuar</button>
      </div>
    </form>
  );
}
