// Silueta de jugador (cabeza + torso) con contorno punteado.
// Se usa como marcador de los huecos vacíos, tanto en la cancha/banco
// como en la columna de cartas del ROLL. Única fuente de la silueta.

interface PlayerSilhouetteProps {
  className?: string;
}

export function PlayerSilhouette({ className = "" }: PlayerSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 24 26"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeDasharray="2.2 2.2"
      aria-hidden="true"
    >
      <circle cx="12" cy="6" r="4.4" />
      <path d="M3.5 25c0-5 3.8-8 8.5-8s8.5 3 8.5 8" />
    </svg>
  );
}
