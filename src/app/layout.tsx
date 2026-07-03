import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Salon AI Rezeption',
  description: 'KI-Rezeption für Friseursalons in Deutschland und Österreich',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
