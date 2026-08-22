import Link from 'next/link';

export default function Inicio() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-bold text-alcaldia-700">
        Banco de Materiales — Alcaldía de Jamundí
      </h1>
      <p className="text-gray-600">
        Registre los daños de su vivienda por el sismo para iniciar el trámite de ayuda con materiales de construcción.
      </p>
      <Link href="/solicitud" className="btn-primario">
        Iniciar registro
      </Link>
      <Link href="/inspeccion" className="text-sm text-gray-400 underline">
        Acceso funcionarios
      </Link>
    </main>
  );
}
