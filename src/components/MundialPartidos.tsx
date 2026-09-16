"use client";

import { Pitch } from "@/components/Pitch";
import { tarjetasPorJugadorDe, type TarjetasJugador } from "@/components/PartidoEnVivo";
import { RankingTorneo } from "@/components/RankingTorneo";
import { VictoriaCelebracion } from "@/components/VictoriaCelebracion";
import { nivelPodio, squadRival } from "@/game/mundial";
import {
  asistenciasPorId,
  estadisticasCombinadas,
  estadisticasPorRival,
  estadisticasUsuario,
  golesPorId,
  rankingAmarillas,
  rankingAsistencias,
  rankingGoleadores,
  rankingRojas,
} from "@/game/statsMundial";
import type { PartidoMundial, ResultadoMundial, SquadState } from "@/types";

const LOGRO_UI: Record<
  ResultadoMundial["logro"],
  { emoji: string; titulo: string; color: string }
> = {
  campeon: {
    emoji: "🏆",
    titulo: "¡Campeón del Mundial!",
    color: "text-[#ffd23f]",
  },
  plata: {
    emoji: "🥈",
    titulo: "Subcampeón — medalla de plata",
    color: "text-zinc-200",
  },
  bronce: {
    emoji: "🥉",
    titulo: "Tercer puesto — medalla de bronce",
    color: "text-amber-600",
  },
  eliminado: {
    emoji: "❌",
    titulo: "Quedaste eliminado",
    color: "text-zinc-400",
  },
};

/** Combina las tarjetas de una lista de partidos (cada uno ya devuelve las
 *  suyas con `tarjetasPorJugadorDe`) en un solo mapa acumulado. */
function combinarTarjetas(
  partidos: PartidoMundial[],
  equipo: "usuario" | "rival",
): Record<string, TarjetasJugador> {
  const combinado: Record<string, TarjetasJugador> = {};
  for (const partido of partidos) {
    for (const [id, t] of Object.entries(tarjetasPorJugadorDe(partido.eventos, equipo))) {
      const actual = (combinado[id] ??= { amarillas: 0, roja: false });
      actual.amarillas += t.amarillas;
      actual.roja = actual.roja || t.roja;
    }
  }
  return combinado;
}

interface MundialPartidosProps {
  resultado: ResultadoMundial;
  squad: SquadState;
}

export function MundialPartidos({ resultado, squad }: MundialPartidosProps) {
  const { partidos, logro } = resultado;
  const ui = LOGRO_UI[logro];
  const ultimo = partidos[partidos.length - 1] as PartidoMundial | undefined;
  const nivel = nivelPodio(logro);

  // Estadísticas ACUMULADAS de todo el recorrido, no solo del último partido.
  const statsUsuario = estadisticasUsuario(partidos);
  const statsPorRival = estadisticasPorRival(partidos);
  const golesUsuarioPorId = golesPorId(statsUsuario);
  const asistenciasUsuarioPorId = asistenciasPorId(statsUsuario);
  const tarjetasUsuarioPorId = combinarTarjetas(partidos, "usuario");

  const statsUltimoRival = statsPorRival[statsPorRival.length - 1]?.estadisticas ?? [];
  const golesRivalPorId = golesPorId(statsUltimoRival);
  const asistenciasRivalPorId = asistenciasPorId(statsUltimoRival);
  const tarjetasRivalPorId = ultimo ? tarjetasPorJugadorDe(ultimo.eventos, "rival") : {};

  // Rankings del torneo: un solo pool con tu equipo Y todos los rivales
  // enfrentados, cada uno ordenado por su propia estadística.
  const statsCombinadas = estadisticasCombinadas(partidos);
  const goleadores = rankingGoleadores(statsCombinadas);
  const asistentes = rankingAsistencias(statsCombinadas);
  const amarillas = rankingAmarillas(statsCombinadas);
  const rojas = rankingRojas(statsCombinadas);

  return (
    <div className="w-full space-y-4">
      {/* Logro final */}
      <div className="relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border-2 border-white/10 bg-black/40 py-4">
        {nivel && <VictoriaCelebracion nivel={nivel} />}
        <span className={`relative text-5xl ${nivel === 7 ? "podio-trofeo" : ""}`}>
          {ui.emoji}
        </span>
        <span
          className={`relative font-display text-lg font-bold uppercase tracking-[0.2em] ${ui.color}`}
        >
          {ui.titulo}
        </span>
        <span className="relative font-display text-[11px] uppercase tracking-widest text-white/40">
          Mundial {resultado.mundial} · {partidos.filter((p) => p.gano).length}/7 ganados
        </span>
      </div>

      {/* Línea de tiempo: 7 partidos, con las medias (OVR) de cada uno. */}
      <div className="flex w-full items-center justify-center gap-1.5 overflow-x-auto pb-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const p = partidos[i];
          if (!p) {
            return (
              <div
                key={i}
                className="flex h-14 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-white/15 bg-black/20 text-white/30"
              >
                <span className="font-display text-[9px] uppercase tracking-wider">
                  Partido {i + 1}
                </span>
                <span className="text-xs">—</span>
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`flex h-14 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1 ${
                p.gano
                  ? "border-emerald-400/70 bg-emerald-500/10"
                  : "border-red-400/70 bg-red-500/10"
              }`}
            >
              <span className="text-base leading-none">{p.rival.bandera}</span>
              <span className="font-display text-[10px] font-bold tabular-nums leading-none text-white">
                {p.golesUsuario} - {p.golesRival}
                {p.penales && <sup className="ml-0.5 text-[7px]">PEN</sup>}
                {p.prorroga && !p.penales && <sup className="ml-0.5 text-[7px]">PR</sup>}
              </span>
              <span
                className={`font-display text-[9px] font-bold uppercase leading-none ${
                  p.gano ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {p.gano ? "Ganado" : "Perdido"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Las dos canchas del último partido jugado, con goles/asistencias/
          tarjetas ya acumulados de TODO el recorrido (no solo este partido). */}
      {ultimo && (
        <div>
          <div className="mb-2 text-center font-display text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            Partido {ultimo.numero} · vos {ultimo.golesUsuario} — {ultimo.golesRival}{" "}
            {ultimo.rival.pais}
            {ultimo.penales && " (penales)"}
            {ultimo.prorroga && !ultimo.penales && " (prórroga)"}
          </div>
          <div className="flex items-start justify-center gap-3 overflow-x-auto">
            <div className="flex w-[560px] shrink-0 flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold uppercase tracking-widest text-emerald-300">
                  Tu equipo
                </span>
                <span className="font-display text-2xl font-black tabular-nums text-[#c6ff3d]">
                  {ultimo.ovrUsuarioFinal}
                </span>
              </div>
              <span className="font-display text-[10px] uppercase tracking-widest text-white/40">
                {squad.formation.id}
              </span>
              <Pitch
                squad={squad}
                seleccionable={null}
                seleccionadoSlotId={null}
                onSlot={() => {}}
                soloLectura
                chico
                ocultarBanco
                golesPorJugador={golesUsuarioPorId}
                asistenciasPorJugador={asistenciasUsuarioPorId}
                tarjetasPorJugador={tarjetasUsuarioPorId}
              />
            </div>

            <span className="mt-10 shrink-0 self-center rounded-full border-2 border-white/25 bg-black/60 px-3 py-2 font-display text-base font-black uppercase tracking-widest text-white shadow-[0_0_18px_-4px_rgba(255,255,255,0.35)]">
              VS
            </span>

            <div className="flex w-[560px] shrink-0 flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold uppercase tracking-widest text-[#ffd23f]">
                  {ultimo.rival.bandera} {ultimo.rival.pais}
                </span>
                <span className="font-display text-2xl font-black tabular-nums text-[#ffd23f]">
                  {ultimo.ovrRivalFinal}
                </span>
              </div>
              <span className="font-display text-[10px] uppercase tracking-widest text-white/40">
                4-3-3
              </span>
              <Pitch
                squad={squadRival(ultimo.xiRival)}
                seleccionable={null}
                seleccionadoSlotId={null}
                onSlot={() => {}}
                soloLectura
                chico
                ocultarBanco
                golesPorJugador={golesRivalPorId}
                asistenciasPorJugador={asistenciasRivalPorId}
                tarjetasPorJugador={tarjetasRivalPorId}
              />
            </div>
          </div>
        </div>
      )}

      {/* ---- Rankings del torneo: goleadores, asistencias y tarjetas, con
          jugadores de tu equipo y de los rivales enfrentados juntos ---- */}
      <div>
        <div className="mb-2 text-center font-display text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
          Rankings del torneo
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <RankingTorneo titulo="Máximos goleadores" icono="⚽" stats={goleadores} campo="goles" />
          <RankingTorneo titulo="Máximos asistentes" icono="👟" stats={asistentes} campo="asistencias" />
          <RankingTorneo titulo="Tarjetas amarillas" icono="🟨" stats={amarillas} campo="amarillas" />
          <RankingTorneo titulo="Tarjetas rojas" icono="🟥" stats={rojas} campo="rojas" />
        </div>
      </div>
    </div>
  );
}
