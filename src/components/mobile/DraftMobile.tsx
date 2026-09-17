"use client";

import { useRef } from "react";
import { PlayerCard } from "@/components/PlayerCard";
import { RollPanel } from "@/components/RollPanel";
import { StatsPanel } from "@/components/StatsPanel";
import {
  CartaSilueta,
  claseImpactoRevelado,
} from "@/components/juego/cartaSilueta";
import type { Juego } from "@/components/juego/useJuego";
import { PitchMobile } from "@/components/mobile/PitchMobile";
import { useAyuda } from "@/components/ui/Ayuda";
import { GAME_CONFIG } from "@/game/config";
import { glowDeNivel, nivelRevelacion } from "@/game/rarity";
import type { EstadisticasPlantel, SquadState } from "@/types";

interface DraftMobileProps {
  j: Juego;
  squad: SquadState;
  stats: EstadisticasPlantel;
}

/** Pantalla móvil del draft (ref. pantalla 2). Reutiliza `RollPanel`,
 *  `StatsPanel` y `PlayerCard`; solo cambia la distribución. */
export function DraftMobile({ j, squad, stats }: DraftMobileProps) {
  const {
    roll,
    girando,
    velocidad,
    seleccionada,
    slotSeleccionado,
    seleccionadaId,
    cartasReveladas,
    anticipando,
    cartasVisibles,
    autoRoll,
    completo,
    resorteosRestantes,
    resorteoTipo,
    hacerRoll,
    resortearPais,
    resortearAnio,
    finGiro,
    usarSlot,
    elegirCartaRoll,
    terminar,
    reiniciar,
    siguienteVelocidad,
    setAutoRoll,
  } = j;

  // Al elegir una carta del ROLL, la cancha puede quedar fuera de la vista
  // (el jugador venía mirando las 4 opciones, más abajo en la pantalla): la
  // llevamos automáticamente para que no tenga que buscarla con el dedo.
  const pitchRef = useRef<HTMLDivElement>(null);
  function tocarCandidato(id: string) {
    const seleccionando = seleccionadaId !== id;
    elegirCartaRoll(id);
    if (seleccionando) {
      pitchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const ayudaVelocidad = useAyuda("Cambiar la velocidad de la ruleta");
  const ayudaAutoRoll = useAyuda(
    "Sortear de nuevo automáticamente al colocar una carta",
  );
  const ayudaTerminar = useAyuda(
    completo ? "Finalizar selección del equipo" : "Completá los 11 titulares y los 5 suplentes",
    true,
  );
  const ayudaExit = useAyuda("Salir y empezar un plantel nuevo", true);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2">
        <h1 className="text-neon font-display text-sm font-bold uppercase tracking-[0.2em]">
          Draft Histórico
        </h1>
        <span className="font-display text-[9px] uppercase tracking-widest text-white/50">
          Formación {squad.formation.id}
        </span>
      </header>

      <StatsPanel stats={stats} formacionId={squad.formation.id} />

      <div ref={pitchRef}>
        <PitchMobile
          squad={squad}
          seleccionable={seleccionada}
          seleccionadoSlotId={slotSeleccionado}
          onSlot={usarSlot}
        />
      </div>

      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <RollPanel
            roll={roll}
            girando={girando}
            puedeRollear={!roll && !girando && !completo}
            velocidad={velocidad}
            resorteosRestantes={resorteosRestantes}
            soloResortear={resorteoTipo}
            onRoll={hacerRoll}
            onResortearPais={resortearPais}
            onResortearAnio={resortearAnio}
            onFinGiro={finGiro}
          />
        </div>
        <div className="flex w-14 shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={siguienteVelocidad}
            {...ayudaVelocidad.trigger}
            className="relative rounded-xl border border-white/15 bg-black/40 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-emerald-300"
          >
            ⚡ x{velocidad}
            {ayudaVelocidad.burbuja}
          </button>
          <button
            type="button"
            onClick={() => setAutoRoll((v) => !v)}
            {...ayudaAutoRoll.trigger}
            className={`relative rounded-xl border py-2 font-display text-[8px] font-bold uppercase tracking-widest transition ${
              autoRoll
                ? "border-[#c6ff3d]/70 bg-[#c6ff3d]/15 text-[#c6ff3d]"
                : "border-white/15 bg-black/40 text-zinc-400"
            }`}
          >
            Auto {autoRoll ? "ON" : "OFF"}
            {ayudaAutoRoll.burbuja}
          </button>
        </div>
      </div>

      <div
        className={`text-center font-display text-xs font-bold uppercase tracking-widest ${
          girando
            ? "animate-pulse text-emerald-300"
            : cartasVisibles
              ? "text-[#c6ff3d]"
              : completo
                ? "text-[#ffd23f]"
                : "text-white/45"
        }`}
      >
        {girando
          ? "Sorteando…"
          : cartasVisibles
            ? "¡Elegí tu carta!"
            : completo
              ? "Plantel completo"
              : "Hacé ROLL"}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: GAME_CONFIG.rollOptionsCount }).map((_, i) => {
          const carta = roll && !girando ? roll.opciones[i] : undefined;
          const revelando =
            !!cartasVisibles && cartasReveladas < GAME_CONFIG.rollOptionsCount;

          if (carta && i < cartasReveladas) {
            const nivel = nivelRevelacion(carta);
            const esSeleccionada = carta.id === seleccionadaId;
            // Las candidatas todavía no elegidas ocupan la mitad del tamaño:
            // la que el jugador va tocando se agranda de vuelta a tamaño
            // completo como confirmación visual de cuál eligió.
            return (
              <div
                key={carta.id}
                className={`relative rounded-xl ${claseImpactoRevelado(nivel)} ${
                  esSeleccionada ? "" : "mx-auto w-1/2"
                }`}
                style={{ "--glow": glowDeNivel(nivel) } as React.CSSProperties}
              >
                <PlayerCard
                  player={carta}
                  seleccionada={esSeleccionada}
                  onClick={() => tocarCandidato(carta.id)}
                />
              </div>
            );
          }

          if (carta && i === cartasReveladas && anticipando) {
            const nivel = nivelRevelacion(carta);
            const { msAnticipacion } = GAME_CONFIG.revelacionCarta[nivel];
            return (
              <div key={`ph-${i}`} className="mx-auto w-1/2">
                <CartaSilueta
                  pulsando
                  nivel={nivel}
                  msAnticipacion={msAnticipacion / velocidad}
                />
              </div>
            );
          }

          return (
            <div key={`ph-${i}`} className="mx-auto w-1/2">
              <CartaSilueta pulsando={girando || revelando} />
            </div>
          );
        })}
      </div>

      {!roll && !girando && (
        <p className="text-center text-[11px] leading-snug text-zinc-500">
          {completo
            ? "Plantel completo: tocá Terminar cuando quieras confirmarlo."
            : `Cada ROLL te da ${GAME_CONFIG.rollOptionsCount} jugadores (uno por posición) de una selección y un Mundial al azar. Colocá uno de los cuatro antes de rollear de nuevo.`}
        </p>
      )}

      <div
        className={`sticky bottom-0 -mx-4 flex bg-gradient-to-t from-[#04070a] via-[#04070a]/95 to-transparent px-4 pb-4 pt-3 ${
          completo ? "gap-3" : "gap-2"
        }`}
      >
        <button
          type="button"
          onClick={terminar}
          disabled={!completo}
          {...ayudaTerminar.trigger}
          className={`relative flex-1 rounded-xl border-2 font-display font-bold uppercase tracking-[0.2em] transition active:scale-95 ${
            completo
              ? "border-[#ffd23f] bg-gradient-to-r from-[#ffd23f] to-[#f5b301] py-4 text-base text-black shadow-[0_0_26px_-6px_rgba(255,210,63,0.95)]"
              : "cursor-not-allowed border-white/10 bg-zinc-800 py-3 text-sm text-zinc-500"
          }`}
        >
          {completo ? "Terminar" : "Completá 11+5"}
          {ayudaTerminar.burbuja}
        </button>
        <button
          type="button"
          onClick={reiniciar}
          {...ayudaExit.trigger}
          className="relative rounded-xl border border-white/15 px-4 py-3 font-display text-xs font-semibold uppercase tracking-widest text-zinc-300"
        >
          Exit
          {ayudaExit.burbuja}
        </button>
      </div>
    </div>
  );
}
