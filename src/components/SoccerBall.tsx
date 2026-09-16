/** Pelotita de fútbol (SVG, para que se vea igual en todos los sistemas).
 *  Se apila una por cada gol del jugador sobre su carta en la formación. */
export function SoccerBall({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#0b0b0b" strokeWidth="1.6" />
      <path d="M12 6.4l3.6 2.6-1.4 4.2H9.8L8.4 9z" fill="#0b0b0b" />
      <path
        d="M12 6.4V2.9M15.6 9l3.1-1.7M13.9 13.2l2.3 3M10.1 13.2l-2.3 3M8.4 9L5.3 7.3"
        stroke="#0b0b0b"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
