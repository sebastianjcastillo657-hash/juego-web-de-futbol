"use client";

import { AdRails } from "@/components/AdRails";
import { AppMobile } from "@/components/AppMobile";
import { DraftScreen } from "@/components/DraftScreen";
import { useIsMobile } from "@/components/useIsMobile";

/**
 * Punto de entrada de la app. Elige el árbol de interfaz según el dispositivo:
 * escritorio -> `DraftScreen` (diseño actual, intacto); celular -> `AppMobile`
 * (diseño reorganizado para pantalla chica). Ambos comparten toda la lógica del
 * juego vía `useJuego`.
 */
export function AppRoot() {
  const isMobile = useIsMobile();
  if (isMobile === null) return null; // hasta conocer el tamaño de pantalla
  if (isMobile) return <AppMobile />;
  return (
    <>
      <AdRails />
      <DraftScreen />
    </>
  );
}
