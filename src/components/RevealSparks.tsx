"use client";

interface RevealSparksProps {
  /** Color de las chispas (hex). */
  color: string;
  /** Cuántas chispas salen disparadas (más = más espectacular). */
  cantidad: number;
  /** Duración total de la anticipación: las chispas estallan cerca del final. */
  msAnticipacion: number;
}

/**
 * Chispas puramente decorativas (CSS, sin canvas ni librerías) que estallan
 * desde el centro justo antes de que se revele una carta rara/épica en
 * adelante. Cuantas más `cantidad`, más denso se ve el estallido.
 */
export function RevealSparks({ color, cantidad, msAnticipacion }: RevealSparksProps) {
  const chispas = Array.from({ length: cantidad });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {chispas.map((_, i) => {
        const angulo = (360 / cantidad) * i;
        const delay = msAnticipacion * 0.68 + (i % 3) * 40;
        return (
          <span
            key={i}
            className="spark"
            style={
              {
                "--angulo": `${angulo}deg`,
                "--spark-color": color,
                animationDelay: `${delay}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
