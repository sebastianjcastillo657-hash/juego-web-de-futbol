"use client";

import { useEffect, useState } from "react";

/** Ancho por debajo del cual se usa el diseño móvil. */
const QUERY = "(max-width: 767px)";

/**
 * `true` si el viewport tiene ancho de celular, `false` si es de escritorio,
 * `null` hasta que el componente monta (para no romper la hidratación: el
 * servidor no conoce el tamaño de pantalla). Reacciona a cambios de tamaño.
 */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}
