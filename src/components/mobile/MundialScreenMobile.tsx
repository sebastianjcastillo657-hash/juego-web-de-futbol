"use client";

import { EVENTO_ICONO } from "@/components/juego/partidoUtil";
import { useMundial } from "@/components/juego/useMundial";
import { MundialPartidosMobile } from "@/components/mobile/MundialPartidosMobile";
import { PartidoEnVivoMobile } from "@/components/mobile/PartidoEnVivoMobile";
import { PitchMobile } from "@/components/mobile/PitchMobile";
import { PostPartidoMobile } from "@/components/mobile/PostPartidoMobile";
import { logroDe } from "@/game/mundial";
import { mediaDelEquipo } from "@/game/squad";
import type { Player, PartidoPreparado, SquadState } from "@/types";

interface MundialScreenMobileProps {
  squad: SquadState;
  mundial: number;
  partidos: PartidoPreparado[];
  etapaInicial: "editar" | "jugando";
  seleccionable: Player | null;
  seleccionadoSlotId: string | null;
  onSlot: (slotId: string) => void;
  onReiniciar: () => void;
}

/**
 * Recorrido por el Mundial en móvil. Comparte la máquina de estados con la
 * versión de escritorio (`useMundial`); todas las etapas (editar, jugando,
 * post, resumen) tienen layout móvil propio.
 */
export function MundialScreenMobile({
  squad,
  mundial,
  partidos,
  etapaInicial,
  seleccionable,
  seleccionadoSlotId,
  onSlot,
  onReiniciar,
}: MundialScreenMobileProps) {
  const {
    jugados,
    etapa,
    setEtapa,
    ultimoJugado,
    recorridoTerminado,
    actual,
    manejarFinPartido,
  } = useMundial(mundial, partidos, squad, etapaInicial);

  // Resumen final del recorrido.
  if (etapa !== "post" && (etapa === "resumen" || recorridoTerminado)) {
    return (
      <div className="flex flex-col gap-5">
        <MundialPartidosMobile
          resultado={{ mundial, partidos: jugados, logro: logroDe(jugados) }}
        />
        <button
          type="button"
          onClick={onReiniciar}
          className="mx-auto rounded-lg border border-white/15 px-6 py-2 font-display text-xs font-semibold uppercase tracking-widest text-zinc-400"
        >
          Nuevo plantel
        </button>
      </div>
    );
  }

  // Recorrido recién terminado: pantalla de resultado compacta, sin cancha.
  if (etapa === "post" && ultimoJugado && recorridoTerminado) {
    return (
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <div className="text-4xl">{ultimoJugado.gano ? "🏆" : "❌"}</div>
        <h2
          className={`font-display text-2xl font-black uppercase tracking-widest ${
            ultimoJugado.gano ? "text-emerald-300" : "text-[#ff5d5d]"
          }`}
        >
          {ultimoJugado.gano ? "¡Ganaste!" : "Perdiste"}
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

        <button
          type="button"
          onClick={() => setEtapa("resumen")}
          className="mt-2 rounded-xl border-2 border-[#ffd23f] bg-gradient-to-r from-[#ffd23f] to-[#f5b301] px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_24px_-6px_rgba(255,210,63,0.75)] active:scale-95"
        >
          Ver resumen final
        </button>
      </div>
    );
  }

  // Entre partidos: resumen del que acaba de terminar + cancha para ajustar
  // el plantel, todo en una sola pantalla.
  if (etapa === "post" && ultimoJugado && actual) {
    return (
      <PostPartidoMobile
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
      <PartidoEnVivoMobile
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
    );
  }

  // etapa === "editar": ajustar plantel antes del partido.
  return (
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
        onClick={() => setEtapa("jugando")}
        className="mx-auto rounded-xl border-2 border-emerald-300/30 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-8 py-3 font-display text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_0_26px_-6px_rgba(16,185,129,0.9)] active:scale-95"
      >
        Jugar partido {actual.numero}
      </button>
    </div>
  );
}
