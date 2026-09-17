"use client";

import { PlayerCard } from "@/components/PlayerCard";
import { PlayerSilhouette } from "@/components/PlayerSilhouette";
import {
  idsSuplentes,
  mediaEfectiva,
  slotsCompatibles,
  slotsDisponibles,
} from "@/game/squad";
import type { Player, SquadState, TitularSlot } from "@/types";

const POS_ABREV: Record<TitularSlot["posicion"], string> = {
  Arquero: "ARQ",
  Defensa: "DEF",
  Medio: "MED",
  Delantero: "DEL",
};

interface PitchProps {
  squad: SquadState;
  /** Carta seleccionada: puede venir del ROLL o ser un jugador ya colocado. */
  seleccionable: Player | null;
  /** Hueco donde está el jugador seleccionado (si la selección es de la plantilla). */
  seleccionadoSlotId: string | null;
  /** Toca un hueco (lleno o vacío): selecciona / mueve / intercambia. */
  onSlot: (slotId: string) => void;
  /** Solo mostrar un once ya definido, sin clicks (vista de partido). */
  soloLectura?: boolean;
  /** Cancha más chica para mostrar dos lado a lado (vista de partido). */
  chico?: boolean;
  /** No mostrar la sección de banco (vista de partido). */
  ocultarBanco?: boolean;
  /** Goles por id de jugador: dibuja una pelotita por gol. */
  golesPorJugador?: Record<string, number>;
  /** Asistencias por id de jugador: dibuja un botín (ver `SoccerBoot`). Se usa
   *  en el resumen general del torneo, no en el de un partido suelto. */
  asistenciasPorJugador?: Record<string, number>;
  /** Tarjetas por id de jugador en este partido: se dibujan sobre la carta. */
  tarjetasPorJugador?: Record<string, { amarillas: number; roja: boolean }>;
  /** Ids de jugadores expulsados en este partido: la carta se marca como tal. */
  expulsadosPorJugador?: Set<string>;
}

export function Pitch({
  squad,
  seleccionable,
  seleccionadoSlotId,
  onSlot,
  soloLectura = false,
  chico = false,
  ocultarBanco = false,
  golesPorJugador,
  asistenciasPorJugador,
  tarjetasPorJugador,
  expulsadosPorJugador,
}: PitchProps) {
  const compatibles = seleccionable
    ? new Set(slotsCompatibles(squad, seleccionable))
    : new Set<string>();
  const disponibles = seleccionable
    ? new Set(slotsDisponibles(squad, seleccionable))
    : new Set<string>();
  // Con un jugador propio seleccionado, los demás ocupados son destinos de intercambio.
  const modoIntercambio = seleccionadoSlotId != null;
  // "chico" (dos canchas lado a lado) es más angosto: una línea de 4-5
  // jugadores no tiene margen para el tamaño "compacto" completo sin que las
  // cartas se toquen entre sí, así que ahí usa una variante más angosta.
  const tamanoMini = chico ? "compactoAjustado" : "compacto";

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
      {/* Cancha */}
      <div
        className={`pitch-stripes relative mx-auto aspect-[2/3.3] w-full overflow-hidden rounded-2xl border-2 border-emerald-300/30 bg-[radial-gradient(circle_at_50%_30%,#12592f,#0a2a17_72%)] shadow-[0_0_40px_-8px_rgba(16,224,106,0.4),inset_0_0_60px_-20px_rgba(0,0,0,0.7)] ${
          chico ? "max-h-[66vh] max-w-[460px]" : "max-h-[75vh] max-w-[540px]"
        }`}
      >
        {!chico && (
          <div className="pointer-events-none absolute left-3 top-2 z-[4] font-display text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Plantel titular
          </div>
        )}
        {/* líneas */}
        <div className="pointer-events-none absolute inset-4 rounded-xl border border-emerald-200/30" />
        <div className="pointer-events-none absolute left-4 right-4 top-1/2 border-t border-emerald-200/30" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/30" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200/50" />

        {squad.slots.map((s) => {
          const carta = squad.titulares[s.id];
          const esCompatible = compatibles.has(s.id);
          const esDisponible = disponibles.has(s.id);
          const estaSeleccionado = s.id === seleccionadoSlotId;
          const esDestinoSwap = modoIntercambio && !!carta && !estaSeleccionado;
          return (
            <div
              key={s.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              {carta ? (
                <div
                  key={carta.id}
                  className={`slot-drop rounded-md ${
                    esDestinoSwap
                      ? "ring-2 ring-[#ffd23f]/85 shadow-[0_0_14px_rgba(255,210,63,0.65)]"
                      : ""
                  }`}
                >
                  <PlayerCard
                    player={carta}
                    variante="mini"
                    tamanoMini={tamanoMini}
                    seleccionada={estaSeleccionado}
                    goles={golesPorJugador?.[carta.id] ?? 0}
                    asistencias={asistenciasPorJugador?.[carta.id] ?? 0}
                    tarjetas={tarjetasPorJugador?.[carta.id]}
                    expulsado={expulsadosPorJugador?.has(carta.id) ?? false}
                    mediaEnPosicion={mediaEfectiva(carta, s)}
                    onClick={soloLectura ? undefined : () => onSlot(s.id)}
                  />
                </div>
              ) : chico ? (
                <div className="h-[99px] w-[70px] rounded-md border-2 border-dashed border-white/20 bg-black/20" />
              ) : (
                <button
                  type="button"
                  onClick={() => onSlot(s.id)}
                  disabled={!seleccionable}
                  className={`flex h-[99px] w-[81px] flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed font-display text-[10px] font-black uppercase tracking-wide transition ${
                    esCompatible
                      ? "animate-pulse border-[#c6ff3d] bg-[#c6ff3d]/25 text-[#eaffc2] shadow-[0_0_18px_rgba(198,255,61,0.7)]"
                      : esDisponible
                        ? "border-white/45 bg-black/30 text-white hover:border-emerald-400/70 hover:bg-emerald-500/10"
                        : "border-white/20 bg-black/25 text-white/60"
                  }`}
                >
                  <PlayerSilhouette className="h-5 w-5 opacity-70" />
                  {POS_ABREV[s.posicion]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Banco */}
      {!ocultarBanco && (
        <div>
          <div className="mb-0.5 text-center font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
            Banco
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {idsSuplentes().map((id, i) => {
              const carta = squad.suplentes[i];
              const esDisponible = disponibles.has(id);
              const estaSeleccionado = id === seleccionadoSlotId;
              const esDestinoSwap = modoIntercambio && !!carta && !estaSeleccionado;
              return carta ? (
                <div
                  key={id}
                  className={`rounded-md ${
                    esDestinoSwap
                      ? "ring-2 ring-[#ffd23f]/85 shadow-[0_0_14px_rgba(255,210,63,0.65)]"
                      : ""
                  }`}
                >
                  <div key={carta.id} className="slot-drop">
                    <PlayerCard
                      player={carta}
                      variante="mini"
                      tamanoMini="compacto"
                      seleccionada={estaSeleccionado}
                      expulsado={expulsadosPorJugador?.has(carta.id) ?? false}
                      onClick={soloLectura ? undefined : () => onSlot(id)}
                    />
                  </div>
                </div>
              ) : (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSlot(id)}
                  disabled={!seleccionable}
                  className={`flex h-[99px] w-[81px] flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed font-display text-[10px] font-black uppercase tracking-wide transition ${
                    esDisponible && seleccionable
                      ? "animate-pulse border-[#c6ff3d] bg-[#c6ff3d]/20 text-[#eaffc2] shadow-[0_0_16px_rgba(198,255,61,0.6)]"
                      : "border-white/20 bg-black/25 text-white/60"
                  }`}
                >
                  <PlayerSilhouette className="h-5 w-5 opacity-70" />
                  SUP
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
