'use client';

import { useState } from 'react';
import { WizardProgress } from '@/components/WizardProgress';
import { Paso1Identificacion } from './componentes/Paso1Identificacion';
import { Paso2Ubicacion } from './componentes/Paso2Ubicacion';
import { Paso3Construccion } from './componentes/Paso3Construccion';
import { Paso4Evidencia, type ArchivoEvidencia } from './componentes/Paso4Evidencia';
import { Paso5Declaracion } from './componentes/Paso5Declaracion';
import type { PasoIdentificacion, PasoUbicacion, PasoConstruccion } from '@/lib/validations';

type EstadoWizard = {
  paso: number;
  identificacion?: PasoIdentificacion;
  ubicacion?: PasoUbicacion;
  construccion?: PasoConstruccion;
  archivos?: ArchivoEvidencia[];
};

export default function PaginaSolicitud() {
  const [estado, setEstado] = useState<EstadoWizard>({ paso: 1 });

  return (
    <main className="p-5">
      <WizardProgress paso={estado.paso} total={5} />

      {estado.paso === 1 && (
        <Paso1Identificacion
          valorInicial={estado.identificacion}
          onSiguiente={(identificacion) => setEstado((s) => ({ ...s, identificacion, paso: 2 }))}
        />
      )}

      {estado.paso === 2 && (
        <Paso2Ubicacion
          valorInicial={estado.ubicacion}
          onSiguiente={(ubicacion) => setEstado((s) => ({ ...s, ubicacion, paso: 3 }))}
          onAtras={() => setEstado((s) => ({ ...s, paso: 1 }))}
        />
      )}

      {estado.paso === 3 && (
        <Paso3Construccion
          valorInicial={estado.construccion}
          onSiguiente={(construccion) => setEstado((s) => ({ ...s, construccion, paso: 4 }))}
          onAtras={() => setEstado((s) => ({ ...s, paso: 2 }))}
        />
      )}

      {estado.paso === 4 && (
        <Paso4Evidencia
          valorInicial={estado.archivos}
          onSiguiente={(archivos) => setEstado((s) => ({ ...s, archivos, paso: 5 }))}
          onAtras={() => setEstado((s) => ({ ...s, paso: 3 }))}
        />
      )}

      {estado.paso === 5 && estado.identificacion && estado.ubicacion && estado.construccion && (
        <Paso5Declaracion
          datosCompletos={{
            identificacion: estado.identificacion,
            ubicacion: estado.ubicacion,
            construccion: estado.construccion,
          }}
          archivos={estado.archivos ?? []}
          onAtras={() => setEstado((s) => ({ ...s, paso: 4 }))}
        />
      )}
    </main>
  );
}
