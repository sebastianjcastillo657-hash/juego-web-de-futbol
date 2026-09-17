"use client";

import { PlayerCard } from "@/components/PlayerCard";
import { PlayerSilhouette } from "@/components/PlayerSilhouette";
import {
  idsSuplentes,
  mediaEfectiva,
  slotsCompatibles,
  slotsDisponibles,
} from "@/game/squad";
import type { Player, PosicionGenerica, SquadState } from "@/types";

const POS_ABREV: Record<PosicionGenerica, string> = {
  Arquero: "ARQ",
  Defensa: "DEF",
  Medio: "MED",
  Delantero: "DEL",
};

/** Líneas de arriba (ataque) hacia abajo (arco). */
const LINEAS: PosicionGenerica[] = [
  "Delantero",
  "Medio",
  "Defensa",
  "Arquero",
];

// Tailwind no detecta clases armadas con template strings (`grid-cols-${n}`)
// porque su análisis estático busca el texto literal — por eso esta tabla usa
// nombres de clase completos, ya presentes en el theme por defecto.
const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

interface PitchMobileProps {
  squad: SquadState;
  seleccionable: Player | null;
  seleccionadoSlotId: string | null;
  onSlot: (slotId: string) => void;
  /** Vista sin interacción (partido en curso): sin clicks, sin banco. */
  soloLectura?: boolean;
  golesPorJugador?: Record<string, number>;
  /** Asistencias por id de jugador: dibuja un botín (ver `SoccerBoot`). */
  asistenciasPorJugador?: Record<string, number>;
  tarjetasPorJugador?: Record<string, { amarillas: number; roja: boolean }>;
  expulsadosPorJugador?: Set<string>;
}

/**
 * Cancha compacta para celular: en vez de posiciones absolutas por %, las
 * líneas se apilan como filas centradas que envuelven. Mismo `onSlot` que la
 * cancha de escritorio; solo cambia la distribución.
 */
export function PitchMobile({
  squad,
  seleccionable,
  seleccionadoSlotId,
  onSlot,
  soloLectura = false,
  golesPorJugador,
  asistenciasPorJugador,
  tarjetasPorJugador,
  expulsadosPorJugador,
}: PitchMobileProps) {
  const compatibles = seleccionable
    ? new Set(slotsCompatibles(squad, seleccionable))
    : new Set<string>();
  const disponibles = seleccionable
    ? new Set(slotsDisponibles(squad, seleccionable))
    : new Set<string>();
  const modoIntercambio = seleccionadoSlotId != null;

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className={`pitch-stripes flex flex-col rounded-2xl border-2 border-emerald-300/25 bg-[radial-gradient(circle_at_50%_20%,#12592f,#0a2a17_78%)] px-3 shadow-[inset_0_0_50px_-18px_rgba(0,0,0,0.7)] ${
          soloLectura ? "gap-8 py-8" : "gap-7 py-7"
        }`}
      >
        {LINEAS.map((linea) => {
          const slots = squad.slots.filter((s) => s.posicion === linea);
          if (slots.length === 0) return null;
          return (
            <div
              key={linea}
              className={`grid ${GRID_COLS[slots.length] ?? "grid-cols-1"} gap-2`}
            >
              {slots.map((s) => {
                const carta = squad.titulares[s.id];
                const estaSeleccionado = s.id === seleccionadoSlotId;
                const esDestinoSwap =
                  modoIntercambio && !!carta && !estaSeleccionado;
                const esCompatible = compatibles.has(s.id);
                const esDisponible = disponibles.has(s.id);
                return carta ? (
                  <div
                    key={s.id}
                    className={`slot-drop rounded-md ${
                      esDestinoSwap
                        ? "ring-2 ring-[#ffd23f]/85 shadow-[0_0_14px_rgba(255,210,63,0.65)]"
                        : ""
                    }`}
                  >
                    <PlayerCard
                      player={carta}
                      variante="mini"
                      tamanoMini="chicoFluido"
                      seleccionada={estaSeleccionado}
                      goles={golesPorJugador?.[carta.id] ?? 0}
                      asistencias={asistenciasPorJugador?.[carta.id] ?? 0}
                      tarjetas={tarjetasPorJugador?.[carta.id]}
                      expulsado={expulsadosPorJugador?.has(carta.id) ?? false}
                      mediaEnPosicion={mediaEfectiva(carta, s)}
                      onClick={soloLectura ? undefined : () => onSlot(s.id)}
                    />
                  </div>
                ) : soloLectura ? (
                  <div
                    key={s.id}
                    className="h-[119px] w-full max-w-[103px] mx-auto rounded-md border-2 border-dashed border-white/15 bg-black/20"
                  />
                ) : (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSlot(s.id)}
                    className={`flex h-[119px] w-full max-w-[103px] mx-auto flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed font-display text-[11px] font-black uppercase tracking-wide transition ${
                      esCompatible
                        ? "animate-pulse border-[#c6ff3d] bg-[#c6ff3d]/25 text-[#eaffc2] shadow-[0_0_16px_rgba(198,255,61,0.7)]"
                        : esDisponible
                          ? "border-white/45 bg-black/30 text-white"
                          : "border-white/20 bg-black/25 text-white/55"
                    }`}
                  >
                    <PlayerSilhouette className="h-5 w-5 opacity-70" />
                    {POS_ABREV[s.posicion]}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Banco: tira horizontal que scrollea */}
      {!soloLectura && (
      <div>
        <div className="mb-1 text-center font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
          Banco
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {idsSuplentes().map((id, i) => {
            const carta = squad.suplentes[i];
            const estaSeleccionado = id === seleccionadoSlotId;
            const esDestinoSwap =
              modoIntercambio && !!carta && !estaSeleccionado;
            const esDisponible = disponibles.has(id);
            return carta ? (
              <div
                key={id}
                className={`shrink-0 rounded-md ${
                  esDestinoSwap
                    ? "ring-2 ring-[#ffd23f]/85 shadow-[0_0_14px_rgba(255,210,63,0.65)]"
                    : ""
                }`}
              >
                <div className="slot-drop">
                  <PlayerCard
                    player={carta}
                    variante="mini"
                    tamanoMini="banco"
                    seleccionada={estaSeleccionado}
                    onClick={() => onSlot(id)}
                  />
                </div>
              </div>
            ) : (
              <button
                key={id}
                type="button"
                onClick={() => onSlot(id)}
                className={`flex h-[100px] w-[85px] shrink-0 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed font-display text-[11px] font-black uppercase tracking-wide transition ${
                  esDisponible
                    ? "animate-pulse border-[#c6ff3d] bg-[#c6ff3d]/20 text-[#eaffc2] shadow-[0_0_16px_rgba(198,255,61,0.6)]"
                    : "border-white/20 bg-black/25 text-white/55"
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
