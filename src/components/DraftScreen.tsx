"use client";

import { FormationPicker } from "@/components/FormationPicker";
import { MundialScreen } from "@/components/MundialScreen";
import { Pitch } from "@/components/Pitch";
import { PlayerCard } from "@/components/PlayerCard";
import { RollPanel } from "@/components/RollPanel";
import { SquadSummary } from "@/components/SquadSummary";
import { StatsPanel } from "@/components/StatsPanel";
import {
  CartaSilueta,
  claseImpactoRevelado,
} from "@/components/juego/cartaSilueta";
import { useJuego } from "@/components/juego/useJuego";
import { useAyuda } from "@/components/ui/Ayuda";
import { GAME_CONFIG } from "@/game/config";
import { glowDeNivel, nivelRevelacion } from "@/game/rarity";

export function DraftScreen() {
  const {
    montado,
    fase,
    opcionesFormacion,
    squad,
    roll,
    girando,
    seleccionadaId,
    cartasReveladas,
    anticipando,
    velocidad,
    sorteo,
    autoRoll,
    resorteosRestantes,
    resorteoTipo,
    slotSeleccionado,
    seleccionada,
    cartasVisibles,
    stats,
    completo,
    setAutoRoll,
    finGiro,
    siguienteVelocidad,
    reiniciar,
    sorteoListo,
    elegirFormacion,
    hacerRoll,
    resortearPais,
    resortearAnio,
    elegirCartaRoll,
    usarSlot,
    terminar,
  } = useJuego();

  const ayudaTerminar = useAyuda(
    completo ? "Finalizar selección del equipo" : "Completá los 11 titulares y los 5 suplentes",
  );
  const ayudaExit = useAyuda("Salir y empezar un plantel nuevo");
  const ayudaVelocidad = useAyuda("Cambiar la velocidad de la ruleta");
  const ayudaAutoRoll = useAyuda(
    "Sortear de nuevo automáticamente al colocar una carta",
  );

  if (!montado) return null;

  if (fase === "formacion") {
    return <FormationPicker opciones={opcionesFormacion} onElegir={elegirFormacion} />;
  }

  if (!squad || !stats) return null;

  if (fase === "listo") {
    return (
      <SquadSummary squad={squad} onReiniciar={reiniciar} onSorteoListo={sorteoListo} />
    );
  }

  if (fase === "mundial" && sorteo) {
    return (
      <MundialScreen
        squad={squad}
        mundial={sorteo.mundial}
        partidos={sorteo.partidos}
        etapaInicial={sorteo.etapaInicial}
        seleccionable={seleccionada}
        seleccionadoSlotId={slotSeleccionado}
        onSlot={usarSlot}
        onReiniciar={reiniciar}
      />
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-2">
      <header className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur">
        <h1 className="text-neon font-display text-base font-bold uppercase tracking-[0.26em]">
          Draft Histórico
        </h1>
        <span className="font-display text-[10px] uppercase tracking-widest text-white/50">
          Formación {squad.formation.id}
        </span>
      </header>

      <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-start">
        {/* Izquierda: estado del plantel (stats en vivo + confirmar/salir).
            Primero en desktop, segundo en mobile (la cancha va arriba). */}
        <div className="order-2 flex w-full flex-col gap-2 lg:order-1 lg:w-[280px] lg:shrink-0">
          <StatsPanel stats={stats} formacionId={squad.formation.id} />

          <div
            className={`flex w-full flex-col rounded-2xl border border-white/10 bg-black/40 p-2 backdrop-blur ${
              completo ? "gap-3" : "gap-1.5"
            }`}
          >
            <button
              type="button"
              onClick={terminar}
              disabled={!completo}
              {...ayudaTerminar.trigger}
              className={`relative rounded-xl border-2 font-display font-bold uppercase tracking-[0.2em] transition active:scale-95 ${
                completo
                  ? "border-[#ffd23f] bg-gradient-to-r from-[#ffd23f] to-[#f5b301] py-3.5 text-base text-black shadow-[0_0_26px_-6px_rgba(255,210,63,0.95)] hover:brightness-110"
                  : "cursor-not-allowed border-white/10 bg-zinc-800 py-2 text-sm text-zinc-500"
              }`}
            >
              {completo ? "Terminar" : "Completá 11+5"}
              {ayudaTerminar.burbuja}
            </button>

            <button
              type="button"
              onClick={reiniciar}
              {...ayudaExit.trigger}
              className="relative rounded-xl border border-white/15 py-1.5 font-display text-xs font-semibold uppercase tracking-widest text-zinc-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/10 hover:text-white"
            >
              Exit
              {ayudaExit.burbuja}
            </button>
          </div>
        </div>

        {/* Centro: cancha + banco. Primero en mobile. */}
        <div className="order-1 w-full lg:order-2 lg:min-w-0 lg:flex-1">
          <Pitch
            squad={squad}
            seleccionable={seleccionada}
            seleccionadoSlotId={slotSeleccionado}
            onSlot={usarSlot}
          />
        </div>

        {/* Derecha: ROLL (botón + ruleta) arriba, cartas del ROLL debajo en grilla. */}
        <section className="order-3 flex w-full flex-col items-center gap-2 lg:w-[300px] lg:shrink-0">
          <div className="flex w-full items-stretch gap-2">
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

            {/* Velocidad + Auto Roll: afuera del cuadrado principal, a su derecha. */}
            <div className="flex w-16 shrink-0 flex-col gap-2">
              <button
                type="button"
                onClick={siguienteVelocidad}
                {...ayudaVelocidad.trigger}
                className="relative rounded-xl border border-white/15 bg-black/40 py-2 font-display text-[11px] font-bold uppercase tracking-widest text-emerald-300 transition hover:border-emerald-400/60 hover:text-white"
              >
                ⚡ x{velocidad}
                {ayudaVelocidad.burbuja}
              </button>

              <button
                type="button"
                onClick={() => setAutoRoll((v) => !v)}
                {...ayudaAutoRoll.trigger}
                className={`relative rounded-xl border py-2 font-display text-[9px] font-bold uppercase tracking-widest transition ${
                  autoRoll
                    ? "border-[#c6ff3d]/70 bg-[#c6ff3d]/15 text-[#c6ff3d]"
                    : "border-white/15 bg-black/40 text-zinc-400 hover:border-white/30"
                }`}
              >
                Auto {autoRoll ? "ON" : "OFF"}
                {ayudaAutoRoll.burbuja}
              </button>
            </div>
          </div>

          <div
            className={`font-display text-xs font-bold uppercase tracking-widest ${
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

          <div className="grid w-full grid-cols-2 justify-items-center gap-2 [&>*]:w-full [&>*]:max-w-[122px]">
            {Array.from({ length: GAME_CONFIG.rollOptionsCount }).map((_, i) => {
              const carta = roll && !girando ? roll.opciones[i] : undefined;
              const revelando =
                !!cartasVisibles && cartasReveladas < GAME_CONFIG.rollOptionsCount;

              if (carta && i < cartasReveladas) {
                const nivel = nivelRevelacion(carta);
                return (
                  <div
                    key={carta.id}
                    className={`relative rounded-xl ${claseImpactoRevelado(nivel)}`}
                    style={{ "--glow": glowDeNivel(nivel) } as React.CSSProperties}
                  >
                    <PlayerCard
                      player={carta}
                      seleccionada={carta.id === seleccionadaId}
                      onClick={() => elegirCartaRoll(carta.id)}
                    />
                  </div>
                );
              }

              if (carta && i === cartasReveladas && anticipando) {
                const nivel = nivelRevelacion(carta);
                const { msAnticipacion } = GAME_CONFIG.revelacionCarta[nivel];
                return (
                  <CartaSilueta
                    key={`ph-${i}`}
                    pulsando
                    nivel={nivel}
                    msAnticipacion={msAnticipacion / velocidad}
                  />
                );
              }

              return <CartaSilueta key={`ph-${i}`} pulsando={girando || revelando} />;
            })}
          </div>

          {!roll && !girando && (
            <div className="text-center text-[10px] leading-snug text-zinc-500">
              {completo
                ? "Plantel completo: presioná Terminar cuando quieras confirmarlo."
                : `Cada ROLL te da ${GAME_CONFIG.rollOptionsCount} jugadores (uno por posición), ordenados de menor a mayor media. Colocá uno antes de rollear de nuevo.`}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
