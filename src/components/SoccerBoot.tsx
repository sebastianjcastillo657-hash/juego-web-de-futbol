/** Botín de fútbol (SVG, para que se vea igual en todos los sistemas). Se
 *  usa como indicador de asistencia sobre la carta, en el resumen general
 *  del torneo. */
export function SoccerBoot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M3.5 19.5h17c.6 0 1-.4 1-1 0-1.9-1.3-3.5-3.1-4l-3.2-.9c-.7-.2-1.3-.6-1.7-1.2l-2-2.8c-.5-.7-1.3-1.1-2.2-1.1H6.8c-.7 0-1.3.5-1.4 1.2l-.9 4.6-1.5 2.7c-.3.5.1 1.1.5 1.1z"
        fill="#3d2a1a"
        stroke="#1a1108"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M4.4 16.3l16 0"
        stroke="#1a1108"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M9.5 8.7v2.6M12.3 8.7l.6 2.5"
        stroke="#1a1108"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
