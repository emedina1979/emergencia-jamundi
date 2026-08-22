'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pasoUbicacionSchema, type PasoUbicacion } from '@/lib/validations';

export function Paso2Ubicacion({
  valorInicial,
  onSiguiente,
  onAtras,
}: {
  valorInicial?: Partial<PasoUbicacion>;
  onSiguiente: (datos: PasoUbicacion) => void;
  onAtras: () => void;
}) {
  const [gpsEstado, setGpsEstado] = useState<'inactivo' | 'buscando' | 'listo' | 'error'>('inactivo');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PasoUbicacion>({
    resolver: zodResolver(pasoUbicacionSchema),
    defaultValues: valorInicial,
  });

  const lat = watch('latitud');
  const lng = watch('longitud');

  function capturarGps() {
    if (!navigator.geolocation) {
      setGpsEstado('error');
      return;
    }
    setGpsEstado('buscando');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitud', Number(pos.coords.latitude.toFixed(6)));
        setValue('longitud', Number(pos.coords.longitude.toFixed(6)));
        setGpsEstado('listo');
      },
      () => setGpsEstado('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form onSubmit={handleSubmit(onSiguiente)} className="space-y-4">
      <h2 className="text-lg font-bold">2. ¿Dónde está la vivienda?</h2>
      <p className="text-sm text-gray-500">Departamento: Valle del Cauca · Municipio: Jamundí</p>

      <div>
        <p className="campo-label">Zona</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" value="cabecera_municipal" {...register('zona')} /> Cabecera municipal</label>
          <label className="flex items-center gap-2"><input type="radio" value="rural" {...register('zona')} /> Zona rural</label>
        </div>
        {errors.zona && <p className="campo-error">{errors.zona.message}</p>}
      </div>

      <div>
        <label className="campo-label">Barrio / Corregimiento / Vereda</label>
        <input className="campo-input" {...register('nombre_sector')} placeholder="Ej. San Antonio" />
        {errors.nombre_sector && <p className="campo-error">{errors.nombre_sector.message}</p>}
      </div>

      <div>
        <label className="campo-label">Dirección o descripción de acceso</label>
        <textarea className="campo-input" rows={2} {...register('direccion')} placeholder="Casa de dos pisos, portón azul, al frente de la tienda..." />
        {errors.direccion && <p className="campo-error">{errors.direccion.message}</p>}
      </div>

      <button type="button" onClick={capturarGps} className="btn-secundario">
        {gpsEstado === 'buscando' ? 'Buscando ubicación…' : '📍 Capturar mi ubicación GPS actual'}
      </button>
      {gpsEstado === 'listo' && <p className="text-sm text-green-700">Ubicación capturada: {lat}, {lng}</p>}
      {gpsEstado === 'error' && <p className="campo-error">No se pudo obtener la ubicación. Puede continuar sin ella.</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onAtras} className="btn-secundario">Atrás</button>
        <button type="submit" className="btn-primario">Continuar</button>
      </div>
    </form>
  );
}
