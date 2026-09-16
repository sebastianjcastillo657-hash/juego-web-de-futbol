"use client";

import { EVENTO_ICONO } from "@/components/juego/partidoUtil";
import { Pitch } from "@/components/Pitch";
import type { Player, PartidoMundial, PartidoPreparado, SquadState } from "@/types";

interface PostPartidoProps {
  ultimoJugado: PartidoMundial;
  /** Próximo partido a jugar (siempre hay uno: esta pantalla no se usa si el
   *  recorrido ya terminó). */
  actual: PartidoPreparado;
  squad: SquadState;
  seleccionable: Player | null;
  seleccionadoSlotId: string | null;
  onSlot: (slotId: string) => void;
  onJugar: () => void;
}

/**
 * Pantalla "entre partidos": arriba el resumen del partido recién jugado
 * (mismo contenido que antes se mostraba solo, en su propia pantalla), abajo
 * la cancha interactiva para ajustar el plantel antes del próximo partido —
 * ambas cosas juntas, sin tener que pasar por una pantalla intermedia.
 */
export function PostPartido({
  ultimoJugado,
  actual,
  squad,
  seleccionable,
  seleccionadoSlotId,
  onSlot,
  onJugar,
}: PostPartidoProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4">
      {/* ---- Resumen del partido anterior ---- */}
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
        <h2 className="font-display text-lg font-bold uppercase tracking-widest text-white">
          ¡Ganaste!
        </h2>
        <p className="font-display text-3xl font-bold tabular-nums text-white">
          {ultimoJugado.golesUsuario} - {ultimoJugado.golesRival}
        </p>
        <p className="text-sm text-white/50">
          vs {ultimoJugado.rival.bandera} {ultimoJugado.rival.pais}
          {ultimoJugado.penales
            ? " · definido por penales"
            : ultimoJugado.prorroga
              ? " · en prórroga"
              : ""}
        </p>

        {ultimoJugado.eventos.length > 0 && (
          <div className="mt-1 w-full space-y-1 rounded-xl border border-white/10 bg-black/30 p-2 text-left">
            <div className="mb-1 text-center font-display text-[10px] font-bold uppercase tracking-widest text-white/40">
              Cronología del partido
            </div>
            <div className="max-h-44 space-y-1 overflow-y-auto">
              {ultimoJugado.eventos.map((e, i) => {
                const esUsuario = e.equipo === "usuario";
                const esPenal = e.tipo === "penal";
                const etiqueta = esPenal ? "Pen." : `${e.minuto}'`;
                const icono = esPenal
                  ? e.penalConvertido
                    ? "✅"
                    : "❌"
                  : EVENTO_ICONO[e.tipo];
                return (
                  <div
                    key={i}
                    className={`flex items-center text-[11px] ${
                      esUsuario ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`flex max-w-[75%] items-center gap-1.5 rounded-full px-2 py-0.5 ${
                        esUsuario
                          ? "flex-row bg-emerald-500/10"
                          : "flex-row-reverse bg-[#ffd23f]/10"
                      }`}
                    >
                      <span className="shrink-0 font-display text-white/40">
                        {etiqueta}
                      </span>
                      <span className="shrink-0">{icono}</span>
                      <span
                        className={`truncate font-semibold ${
                          esUsuario ? "text-emerald-300" : "text-[#ffd23f]"
                        }`}
                      >
                        {e.jugador ? e.jugador.nombre : "Jugada"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10" />

      {/* ---- Ajustar plantel antes del próximo partido ---- */}
      <div className="space-y-2">
        <div className="text-center">
          <h2 className="font-display text-base font-bold uppercase tracking-widest text-white">
            Antes del partido {actual.numero} de 7
          </h2>
          <p className="mt-0.5 text-xs text-white/50">
            vs {actual.rival.bandera} {actual.rival.pais} · ajustá tu plantilla si hace
            falta (podés mover o intercambiar jugadores).
          </p>
        </div>
        <Pitch
          squad={squad}
          seleccionable={seleccionable}
          seleccionadoSlotId={seleccionadoSlotId}
          onSlot={onSlot}
        />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onJugar}
            className="rounded-xl border-2 border-emerald-300/30 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-10 py-2.5 font-display text-base font-bold uppercase tracking-[0.28em] text-white shadow-[0_0_26px_-6px_rgba(16,185,129,0.9)] transition active:scale-95"
          >
            Jugar partido {actual.numero}
          </button>
        </div>
      </div>
    </div>
  );
}
