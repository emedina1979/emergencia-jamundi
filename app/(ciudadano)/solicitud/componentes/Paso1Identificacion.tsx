'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pasoIdentificacionSchema, type PasoIdentificacion } from '@/lib/validations';

export function Paso1Identificacion({
  valorInicial,
  onSiguiente,
}: {
  valorInicial?: Partial<PasoIdentificacion>;
  onSiguiente: (datos: PasoIdentificacion) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasoIdentificacion>({
    resolver: zodResolver(pasoIdentificacionSchema),
    defaultValues: valorInicial,
  });

  return (
    <form onSubmit={handleSubmit(onSiguiente)} className="space-y-4">
      <h2 className="text-lg font-bold">1. ¿Quién eres?</h2>

      <div>
        <label className="campo-label">Nombres y apellidos completos</label>
        <input className="campo-input" {...register('nombres_apellidos')} placeholder="Ej. María Fernanda Rojas Gómez" />
        {errors.nombres_apellidos && <p className="campo-error">{errors.nombres_apellidos.message}</p>}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="campo-label">Número de cédula</label>
          <input className="campo-input" inputMode="numeric" {...register('numero_documento')} placeholder="1234567890" />
          {errors.numero_documento && <p className="campo-error">{errors.numero_documento.message}</p>}
        </div>
        <div className="flex-1">
          <label className="campo-label">Expedida en</label>
          <input className="campo-input" {...register('lugar_expedicion')} placeholder="Jamundí" />
          {errors.lugar_expedicion && <p className="campo-error">{errors.lugar_expedicion.message}</p>}
        </div>
      </div>

      <div>
        <label className="campo-label">Celular / WhatsApp de contacto</label>
        <input className="campo-input" inputMode="numeric" {...register('telefono_contacto')} placeholder="3001234567" />
        {errors.telefono_contacto && <p className="campo-error">{errors.telefono_contacto.message}</p>}
      </div>

      <fieldset className="rounded-lg border border-amber-300 bg-amber-50 p-3">
        <legend className="px-1 text-sm font-semibold text-amber-800">Preguntas obligatorias</legend>

        <p className="mb-1 mt-2 text-sm font-medium">¿Está inscrito en el Registro Único de Damnificados (RUD)?</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" value="si" {...register('inscrito_rud')} /> Sí</label>
          <label className="flex items-center gap-2"><input type="radio" value="no" {...register('inscrito_rud')} /> No</label>
        </div>
        {errors.inscrito_rud && <p className="campo-error">{errors.inscrito_rud.message}</p>}

        <p className="mb-1 mt-3 text-sm font-medium">¿Cuál es su relación con la vivienda?</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2"><input type="radio" value="propietario" {...register('condicion_tenencia')} /> Propietario</label>
          <label className="flex items-center gap-2"><input type="radio" value="poseedor" {...register('condicion_tenencia')} /> Poseedor</label>
          <label className="flex items-center gap-2"><input type="radio" value="arrendatario" {...register('condicion_tenencia')} /> Arrendatario</label>
        </div>
        {errors.condicion_tenencia && <p className="campo-error">{errors.condicion_tenencia.message}</p>}
        <p className="mt-1 text-xs text-amber-700">
          Nota: los arrendatarios no aplican al subsidio de materiales, según el Manual Operativo UNGRD.
        </p>

        <p className="mb-1 mt-3 text-sm font-medium">¿El predio está fuera de zona de alto riesgo no mitigable?</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" value="si" {...register('predio_fuera_riesgo')} /> Sí</label>
          <label className="flex items-center gap-2"><input type="radio" value="no" {...register('predio_fuera_riesgo')} /> No</label>
        </div>
        {errors.predio_fuera_riesgo && <p className="campo-error">{errors.predio_fuera_riesgo.message}</p>}
      </fieldset>

      <button type="submit" className="btn-primario">Continuar</button>
    </form>
  );
}
