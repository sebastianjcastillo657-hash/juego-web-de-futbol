import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";

// Fuente display para títulos y números grandes (estética de videojuego
// deportivo). El cuerpo sigue con system-ui.
const display = Oswald({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Draft Histórico",
  description: "Armá tu plantel a partir de un Draft de selecciones y Mundiales.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={display.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
