"use client";

import { useEffect, useRef, useState } from "react";

/**
 * `atento` se vuelve `true` cuando pasan `umbralMs` sin que se llame a
 * `marcarActividad`, mientras `activo` sea `true` (p. ej. el botón está
 * habilitado y visible). Sirve para la animación de "atención" de un botón
 * importante que lleva un rato sin usarse — ver `.atencion-pulso` en
 * `globals.css`. `activo=false` apaga y resetea el temporizador (no tiene
 * sentido llamar la atención sobre un botón deshabilitado u oculto).
 */
export function useAtencionBoton(activo: boolean, umbralMs: number) {
  const [atento, setAtento] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const marcarActividad = () => {
    setAtento(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (activo) {
      timerRef.current = setTimeout(() => setAtento(true), umbralMs);
    }
  };

  useEffect(() => {
    marcarActividad();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Se rearma solo cuando cambia si el botón está activo; `marcarActividad`
    // se llama a mano en cada interacción real (click / mouseenter).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, umbralMs]);

  return { atento, marcarActividad };
}
