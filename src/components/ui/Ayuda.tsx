"use client";

import { useRef, useState } from "react";

/**
 * Explicación mínima de un botón: en PC usa el `title` nativo (tooltip al
 * pasar el mouse, gratis); en celular el `title` no sirve con touch, así que
 * además arma una burbuja propia que aparece al mantener presionado.
 *
 * Uso: pegar `{...trigger}` en el botón (que debe tener `relative` en su
 * className para que la burbuja se ancle a él) y renderizar `{burbuja}` como
 * hijo suyo.
 *
 *   const ayuda = useAyuda("Sortear jugador");
 *   <button {...ayuda.trigger} className="relative ...">
 *     ROLL
 *     {ayuda.burbuja}
 *   </button>
 */
export function useAyuda(texto: string, arriba = false) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = () => {
    timer.current = setTimeout(() => setVisible(true), 420);
  };
  const ocultar = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  return {
    trigger: {
      title: texto,
      onTouchStart: mostrar,
      onTouchEnd: ocultar,
      onTouchCancel: ocultar,
      onTouchMove: ocultar,
    },
    burbuja: visible ? (
      <span
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-black/95 px-2 py-1 font-display text-[10px] font-normal normal-case tracking-normal text-white shadow-lg ${
          arriba ? "bottom-full mb-1.5" : "top-full mt-1.5"
        }`}
      >
        {texto}
      </span>
    ) : null,
  };
}
