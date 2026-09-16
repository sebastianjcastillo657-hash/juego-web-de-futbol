"use client";

import { PlayerSilhouette } from "@/components/PlayerSilhouette";
import { RevealSparks } from "@/components/RevealSparks";
import { glowDeNivel, type NivelRevelacion } from "@/game/rarity";

/** Envoltorio del golpe de revelación: más grande y brillante cuanto más
 *  alto el nivel del jugador (común/raro quedan con el pop-in de siempre). */
export function claseImpactoRevelado(nivel: NivelRevelacion): string {
  switch (nivel) {
    case "elite":
      return "slot-drop slam-elite burst-elite";
    case "leyenda":
    case "epico":
      return "slot-drop slam-grande burst-fuerte";
    default:
      return "slot-drop";
  }
}

/**
 * Marcador de un lugar de carta del ROLL todavía sin revelar. Si `nivel`
 * viene con datos (la carta ya se conoce pero está en su anticipación), en
 * vez del placeholder genérico muestra el resplandor creciente propio de su
 * nivel — y chispas, de épico para arriba — hasta que se revele.
 */
export function CartaSilueta({
  pulsando = false,
  nivel,
  msAnticipacion,
}: {
  pulsando?: boolean;
  nivel?: NivelRevelacion;
  msAnticipacion?: number;
}) {
  if (nivel && msAnticipacion) {
    const glow = glowDeNivel(nivel);
    const conChispas = nivel === "epico" || nivel === "leyenda" || nivel === "elite";
    const cantidadChispas = nivel === "elite" ? 14 : nivel === "leyenda" ? 10 : 6;
    return (
      <div
        className="anticipando relative flex aspect-[3/4.3] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 bg-gradient-to-b from-white/[0.04] to-transparent text-white/70"
        style={
          {
            "--glow": glow,
            animationDuration: `${msAnticipacion}ms`,
          } as React.CSSProperties
        }
      >
        {conChispas && (
          <RevealSparks color={glow} cantidad={cantidadChispas} msAnticipacion={msAnticipacion} />
        )}
        <PlayerSilhouette className="h-9 w-9 opacity-80" />
        <span className="font-display text-[9px] uppercase tracking-[0.18em]">
          Sorteando
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex aspect-[3/4.3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-white/25 bg-gradient-to-b from-white/[0.04] to-transparent text-white/30 ${
        pulsando ? "animate-pulse" : ""
      }`}
    >
      <PlayerSilhouette className="h-9 w-9 opacity-70" />
      <span className="font-display text-[9px] uppercase tracking-[0.18em]">
        {pulsando ? "Sorteando" : "Jugador"}
      </span>
    </div>
  );
}
