/**
 * Dos espacios vacíos fijos a los costados, reservados para publicidad.
 * Solo aparecen en pantallas anchas (>= 1536px), donde el contenido central
 * (`max-w-7xl`) ya deja margen libre: no tapan ni desplazan nada del juego.
 * Sin contenido ni interacción: son solo el hueco.
 */
export function AdRails() {
  return (
    <div aria-hidden className="pointer-events-none select-none">
      <div className="fixed left-0 top-0 z-[1] hidden h-full w-[132px] border-r border-white/10 bg-black/25 2xl:block" />
      <div className="fixed right-0 top-0 z-[1] hidden h-full w-[132px] border-l border-white/10 bg-black/25 2xl:block" />
    </div>
  );
}
