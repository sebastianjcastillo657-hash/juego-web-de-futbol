"use client";

import { PlayerCard } from "@/components/PlayerCard";
import { RankingTorneo } from "@/components/RankingTorneo";
import { VictoriaCelebracion } from "@/components/VictoriaCelebracion";
import { nivelPodio } from "@/game/mundial";
import {
  estadisticasCombinadas,
  estadisticasUsuario,
  rankingAmarillas,
  rankingAsistencias,
  rankingGoleadores,
  rankingRojas,
} from "@/game/statsMundial";
import type { PartidoMundial, ResultadoMundial } from "@/types";

const LOGRO_UI: Record<
  ResultadoMundial["logro"],
  { emoji: string; titulo: string; color: string }
> = {
  campeon: { emoji: "🏆", titulo: "¡Campeón del Mundial!", color: "text-[#ffd23f]" },
  plata: { emoji: "🥈", titulo: "Subcampeón · plata", color: "text-zinc-200" },
  bronce: { emoji: "🥉", titulo: "Tercer puesto · bronce", color: "text-amber-600" },
  eliminado: { emoji: "❌", titulo: "Quedaste eliminado", color: "text-[#ff5d5d]" },
};

interface Props {
  resultado: ResultadoMundial;
}

/** Resumen final del recorrido por el Mundial, en móvil (ref. pantalla 6). */
export function MundialPartidosMobile({ resultado }: Props) {
  const { partidos, logro, mundial } = resultado;
  const ui = LOGRO_UI[logro];
  const ultimo = partidos[partidos.length - 1] as PartidoMundial | undefined;
  const ganados = partidos.filter((p) => p.gano).length;
  const nivel = nivelPodio(logro);

  // Estadísticas ACUMULADAS de todo el recorrido, no solo del último partido.
  const statsUsuario = estadisticasUsuario(partidos);
  const statsCombinadas = estadisticasCombinadas(partidos);
  const goleadores = rankingGoleadores(statsCombinadas);
  const asistentes = rankingAsistencias(statsCombinadas);
  const amarillas = rankingAmarillas(statsCombinadas);
  const rojas = rankingRojas(statsCombinadas);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero de logro */}
      <div className="relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border-2 border-white/10 bg-black/40 py-6 text-center">
        {nivel && <VictoriaCelebracion nivel={nivel} />}
        <span className={`relative text-5xl ${nivel === 7 ? "podio-trofeo" : ""}`}>
          {ui.emoji}
        </span>
        <span
          className={`relative font-display text-lg font-black uppercase tracking-[0.15em] ${ui.color}`}
        >
          {ui.titulo}
        </span>
        {ultimo && (
          <span className="relative mt-1 font-display text-3xl font-bold tabular-nums text-white">
            {ultimo.golesUsuario} - {ultimo.golesRival}
          </span>
        )}
        <span className="relative font-display text-[10px] uppercase tracking-widest text-white/40">
          Mundial {mundial} · {ganados}/7 ganados
          {ultimo ? ` · vs ${ultimo.rival.bandera} ${ultimo.rival.pais}` : ""}
        </span>
      </div>

      {/* Fila de los 7 partidos */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: 7 }).map((_, i) => {
          const p = partidos[i];
          if (!p) {
            return (
              <div
                key={i}
                className="flex h-16 w-[64px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-white/15 bg-black/20 text-white/30"
              >
                <span className="font-display text-[8px] uppercase tracking-wider">
                  P{i + 1}
                </span>
                <span className="text-xs">—</span>
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`flex h-16 w-[64px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1 ${
                p.gano
                  ? "border-emerald-400/70 bg-emerald-500/10"
                  : "border-red-400/70 bg-red-500/10"
              }`}
            >
              <span className="text-base leading-none">{p.rival.bandera}</span>
              <span className="font-display text-[10px] font-bold tabular-nums leading-none text-white">
                {p.golesUsuario}-{p.golesRival}
                {p.penales && <sup className="ml-0.5 text-[7px]">PEN</sup>}
                {p.prorroga && !p.penales && <sup className="ml-0.5 text-[7px]">PR</sup>}
              </span>
              <span
                className={`font-display text-[8px] font-bold uppercase leading-none ${
                  p.gano ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {p.gano ? "Ganado" : "Perdido"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Goleadores y asistencias de TODO el recorrido, con el botín sobre la
          carta de quien dio la asistencia (ver `SoccerBoot`). */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-center font-display text-[10px] font-bold uppercase tracking-widest text-white/40">
          Tu equipo · todo el torneo
        </div>
        {statsUsuario.length === 0 ? (
          <p className="text-center text-[11px] text-white/35">
            Sin goles, asistencias ni tarjetas todavía.
          </p>
        ) : (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {statsUsuario.map((s) => (
              <div key={s.jugador.id} className="shrink-0">
                <PlayerCard
                  player={s.jugador}
                  variante="mini"
                  tamanoMini="chico"
                  goles={s.goles}
                  asistencias={s.asistencias}
                  tarjetas={{ amarillas: s.amarillas, roja: s.rojas > 0 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rankings del torneo: tu equipo y los rivales enfrentados juntos. */}
      <div className="flex flex-col gap-3">
        <div className="text-center font-display text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
          Rankings del torneo
        </div>
        <RankingTorneo titulo="Máximos goleadores" icono="⚽" stats={goleadores} campo="goles" />
        <RankingTorneo titulo="Máximos asistentes" icono="👟" stats={asistentes} campo="asistencias" />
        <RankingTorneo titulo="Tarjetas amarillas" icono="🟨" stats={amarillas} campo="amarillas" />
        <RankingTorneo titulo="Tarjetas rojas" icono="🟥" stats={rojas} campo="rojas" />
      </div>
    </div>
  );
}
