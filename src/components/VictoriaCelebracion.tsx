"use client";

import { useMemo } from "react";

/**
 * Niveles 1-4: victoria de un partido, según cuántas victorias consecutivas
 * lleva el jugador (ver `game/mundial.ts#nivelVictoria`) — cada tramo se
 * festeja un poco más fuerte que el anterior.
 * Niveles 5-7: llegar al podio del torneo (bronce/plata/campeón, ver
 * `nivelPodio`) — siempre por encima de cualquier nivel de victoria suelta,
 * con el 1º puesto (7) como el tope de todos.
 */
export type NivelCelebracion = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const ES_PODIO = (nivel: NivelCelebracion) => nivel >= 5;

const CONFETI_POR_NIVEL: Record<NivelCelebracion, number> = {
  1: 14,
  2: 22,
  3: 32,
  4: 44,
  5: 55,
  6: 68,
  7: 90,
};
const ESCALA_POR_NIVEL: Record<NivelCelebracion, number> = {
  1: 1,
  2: 1.08,
  3: 1.16,
  4: 1.26,
  5: 1.34,
  6: 1.44,
  7: 1.6,
};
const COLOR_POR_NIVEL: Record<NivelCelebracion, string> = {
  1: "#c6ff3d",
  2: "#10e06a",
  3: "#22e0c8",
  4: "#ffd23f",
  5: "#cd7f32",
  6: "#d4d4d8",
  7: "#ffd23f",
};
const PALETA_CONFETI = ["#ffd23f", "#c6ff3d", "#10e06a", "#22e0c8", "#ff8a3d", "#ffffff"];

interface VictoriaCelebracionProps {
  nivel: NivelCelebracion;
  /** Si se pasa, se muestra como título grande arriba del destello (ej.
   *  "¡VICTORIA!"). Si se omite, el componente solo aporta el efecto
   *  (confeti + destello + sacudida) para envolver un título que ya exista. */
  titulo?: string;
  /** Clases extra para el contenedor raíz — p. ej. `h-full` cuando se usa
   *  como overlay a pantalla completa, para que el confeti caiga en todo
   *  ese alto y no solo en el del título. */
  className?: string;
}

/**
 * Celebración visual reutilizable para victorias y podio: confeti cayendo +
 * destello radial + (nivel alto) sacudida sutil de pantalla y rayos. Un solo
 * componente para ambos casos, compartido por escritorio y móvil — es un
 * efecto autocontenido, no un layout de pantalla completa.
 */
export function VictoriaCelebracion({ nivel, titulo, className = "" }: VictoriaCelebracionProps) {
  const color = COLOR_POR_NIVEL[nivel];
  const podio = ES_PODIO(nivel);
  const piezas = useMemo(
    () =>
      Array.from({ length: CONFETI_POR_NIVEL[nivel] }, () => ({
        left: Math.round(Math.random() * 100),
        delay: Math.round(Math.random() * 500),
        color: PALETA_CONFETI[Math.floor(Math.random() * PALETA_CONFETI.length)],
        rot: Math.round(Math.random() * 60 - 30),
      })),
    [nivel],
  );

  return (
    <div
      className={`pointer-events-none relative flex items-center justify-center overflow-hidden ${
        nivel >= 3 ? "victoria-shake" : ""
      } ${className}`}
      style={{ "--victoria-color": color } as React.CSSProperties}
    >
      {podio && <div className="podio-rayos" />}
      <div className="victoria-glow" />
      {piezas.map((p, i) => (
        <span
          key={i}
          className="confeti-pieza"
          style={
            {
              "--left": `${p.left}%`,
              "--delay": `${p.delay}ms`,
              "--color": p.color,
              "--rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
      {titulo && (
        <div
          className="victoria-titulo relative text-3xl sm:text-4xl"
          style={{ "--escala": ESCALA_POR_NIVEL[nivel] } as React.CSSProperties}
        >
          {titulo}
        </div>
      )}
    </div>
  );
}
