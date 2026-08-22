import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Banco de Materiales — Alcaldía de Jamundí',
  description: 'Registro de daños en vivienda tras el sismo — Alcaldía de Jamundí',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="mx-auto min-h-screen max-w-lg">{children}</body>
    </html>
  );
}
