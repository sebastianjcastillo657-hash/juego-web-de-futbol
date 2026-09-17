"use client";

import { MundialPartidos } from "@/components/MundialPartidos";
import { PartidoEnVivo } from "@/components/PartidoEnVivo";
import { Pitch } from "@/components/Pitch";
import { PostPartido } from "@/components/PostPartido";
import { EVENTO_ICONO } from "@/components/juego/partidoUtil";
import { useMundial } from "@/components/juego/useMundial";
import { useAyuda } from "@/components/ui/Ayuda";
import { logroDe } from "@/game/mundial";
import { mediaDelEquipo } from "@/game/squad";
import type { Player, PartidoPreparado, SquadState } from "@/types";

interface MundialScreenProps {
  squad: SquadState;
  mundial: number;
  /** Fixture ya sorteado (mismo orden que el jugador vio revelarse uno por uno). */
  partidos: PartidoPreparado[];
  /** Qué pantalla eligió el jugador al terminar el sorteo, antes del partido 1. */
  etapaInicial: "editar" | "jugando";
  /** Reutiliza la misma edición de plantel del draft: seleccionar, mover, intercambiar. */
  seleccionable: Player | null;
  seleccionadoSlotId: string | null;
  onSlot: (slotId: string) => void;
  onReiniciar: () => void;
}

/**
 * Pantalla separada del sorteo: recorre los 7 partidos. Antes de cada uno el
 * jugador puede reordenar su plantel (misma cancha interactiva del draft);
 * el rival se prepara una sola vez al entrar (siempre 4-3-3). Se corta apenas
 * se pierde un partido.
 */
export function MundialScreen({
  squad,
  mundial,
  partidos,
  etapaInicial,
  seleccionable,
  seleccionadoSlotId,
  onSlot,
  onReiniciar,
}: MundialScreenProps) {
  const {
    jugados,
    etapa,
    setEtapa,
    ultimoJugado,
    recorridoTerminado,
    actual,
    manejarFinPartido,
  } = useMundial(mundial, partidos, squad, etapaInicial);

  const ayudaNuevoPlantel = useAyuda("Empezar un plantel nuevo desde cero");
  const ayudaVerResumen = useAyuda("Ver el resumen final del Mundial");
  const ayudaJugar = useAyuda(
    actual ? `Empezar el partido ${actual.numero}` : "Empezar el partido",
  );

  if (etapa !== "post" && (etapa === "resumen" || recorridoTerminado)) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-4">
        <MundialPartidos
          resultado={{ mundial, partidos: jugados, logro: logroDe(jugados) }}
          squad={squad}
        />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onReiniciar}
            {...ayudaNuevoPlantel.trigger}
            className="relative rounded-lg border border-white/15 px-6 py-2 font-display text-xs font-semibold uppercase tracking-widest text-zinc-400 transition hover:border-emerald-400/50 hover:text-white"
          >
            Nuevo plantel
            {ayudaNuevoPlantel.burbuja}
          </button>
        </div>
      </div>
    );
  }

  // Recorrido recién terminado (se ganó el 7º partido o se perdió uno): la
  // pantalla de resultado sigue siendo la compacta, sin cancha (no hay
  // "próximo partido" para el que ajustar el plantel).
  if (etapa === "post" && ultimoJugado && recorridoTerminado) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 p-4 text-center">
        <h2 className="font-display text-lg font-bold uppercase tracking-widest text-white">
          {ultimoJugado.gano ? "¡Ganaste!" : "Perdiste"}
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

        <button
          type="button"
          onClick={() => setEtapa("resumen")}
          {...ayudaVerResumen.trigger}
          className="relative mt-2 rounded-xl border-2 border-[#ffd23f] bg-gradient-to-r from-[#ffd23f] to-[#f5b301] px-8 py-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-black shadow-[0_0_24px_-6px_rgba(255,210,63,0.75)] transition hover:brightness-110 active:scale-95"
        >
          Ver resumen final
          {ayudaVerResumen.burbuja}
        </button>
      </div>
    );
  }

  // Entre partidos: resumen del que acaba de terminar + cancha para ajustar
  // el plantel, todo en una sola pantalla (ver `PostPartido`).
  if (etapa === "post" && ultimoJugado && actual) {
    return (
      <PostPartido
        ultimoJugado={ultimoJugado}
        actual={actual}
        squad={squad}
        seleccionable={seleccionable}
        seleccionadoSlotId={seleccionadoSlotId}
        onSlot={onSlot}
        onJugar={() => setEtapa("jugando")}
      />
    );
  }

  if (!actual) return null;

  if (etapa === "jugando") {
    return (
      <div className="mx-auto max-w-7xl p-4">
        <PartidoEnVivo
          key={actual.numero}
          numero={actual.numero}
          mundial={mundial}
          squad={squad}
          rival={actual.rival}
          xiRival={actual.xiRival}
          ovrUsuarioBase={mediaDelEquipo(squad)}
          ovrRivalBase={actual.ovrRivalBase}
          onFinPartido={manejarFinPartido}
        />
      </div>
    );
  }

  // etapa === "editar"
  return (
    <div className="mx-auto max-w-3xl space-y-2 p-3">
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
          onClick={() => setEtapa("jugando")}
          {...ayudaJugar.trigger}
          className="relative rounded-xl border-2 border-emerald-300/30 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-10 py-2.5 font-display text-base font-bold uppercase tracking-[0.28em] text-white shadow-[0_0_26px_-6px_rgba(16,185,129,0.9)] transition active:scale-95"
        >
          Jugar partido {actual.numero}
          {ayudaJugar.burbuja}
        </button>
      </div>
    </div>
  );
}
