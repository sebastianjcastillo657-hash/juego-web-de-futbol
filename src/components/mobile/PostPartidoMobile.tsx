"use client";

import { EVENTO_ICONO } from "@/components/juego/partidoUtil";
import { PitchMobile } from "@/components/mobile/PitchMobile";
import { useAyuda } from "@/components/ui/Ayuda";
import type { Player, PartidoMundial, PartidoPreparado, SquadState } from "@/types";

interface PostPartidoMobileProps {
  ultimoJugado: PartidoMundial;
  actual: PartidoPreparado;
  squad: SquadState;
  seleccionable: Player | null;
  seleccionadoSlotId: string | null;
  onSlot: (slotId: string) => void;
  onJugar: () => void;
}

/** Versión móvil de `PostPartido`: resumen arriba, cancha + XI + banco abajo,
 *  todo en una sola pantalla scrolleable (ref. `MundialScreenMobile`). */
export function PostPartidoMobile({
  ultimoJugado,
  actual,
  squad,
  seleccionable,
  seleccionadoSlotId,
  onSlot,
  onJugar,
}: PostPartidoMobileProps) {
  const ayudaJugar = useAyuda(`Empezar el partido ${actual.numero}`);
  return (
    <div className="flex flex-col gap-5">
      {/* ---- Resumen del partido anterior ---- */}
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="text-4xl">🏆</div>
        <h2 className="font-display text-2xl font-black uppercase tracking-widest text-emerald-300">
          ¡Ganaste!
        </h2>
        <p className="font-display text-4xl font-bold tabular-nums text-white">
          {ultimoJugado.golesUsuario} - {ultimoJugado.golesRival}
        </p>
        <p className="text-[12px] text-white/50">
          vs {ultimoJugado.rival.bandera} {ultimoJugado.rival.pais}
          {ultimoJugado.penales
            ? " · penales"
            : ultimoJugado.prorroga
              ? " · prórroga"
              : ""}
        </p>

        {ultimoJugado.eventos.length > 0 && (
          <div className="mt-1 w-full space-y-1 rounded-xl border border-white/10 bg-black/30 p-2 text-left">
            <div className="mb-1 text-center font-display text-[10px] font-bold uppercase tracking-widest text-white/40">
              Cronología del partido
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto">
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
                      className={`flex max-w-[80%] items-center gap-1.5 rounded-full px-2 py-0.5 ${
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
      <div className="flex flex-col gap-4">
        <header className="text-center">
          <h2 className="font-display text-lg font-bold uppercase tracking-widest text-white">
            Antes del partido {actual.numero} de 7
          </h2>
          <p className="mt-1 text-[12px] text-white/50">
            vs {actual.rival.bandera} {actual.rival.pais} · movés o intercambiás
            jugadores si hace falta
          </p>
        </header>

        <PitchMobile
          squad={squad}
          seleccionable={seleccionable}
          seleccionadoSlotId={seleccionadoSlotId}
          onSlot={onSlot}
        />

        <button
          type="button"
          onClick={onJugar}
          {...ayudaJugar.trigger}
          className="relative mx-auto rounded-xl border-2 border-emerald-300/30 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-8 py-3 font-display text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_0_26px_-6px_rgba(16,185,129,0.9)] active:scale-95"
        >
          Jugar partido {actual.numero}
          {ayudaJugar.burbuja}
        </button>
      </div>
    </div>
  );
}
