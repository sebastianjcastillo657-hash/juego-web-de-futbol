// Estadísticas ACUMULADAS de todo el recorrido por el Mundial (varios
// partidos), para el resumen general al terminar el torneo. Distinto de las
// estadísticas de un solo partido (esas viven en `components/juego/partidoUtil`,
// consumidas por el resumen individual de cada encuentro). Lógica pura, sin
// React.

import type { Player, PartidoMundial } from "@/types";

/** Goles, asistencias y tarjetas de un jugador acumulados en varios partidos. */
export interface EstadisticaJugador {
  jugador: Player;
  /** true si es del plantel del usuario; false si es de un rival. */
  esUsuario: boolean;
  goles: number;
  asistencias: number;
  amarillas: number;
  rojas: number;
}

function nueva(jugador: Player, esUsuario: boolean): EstadisticaJugador {
  return { jugador, esUsuario, goles: 0, asistencias: 0, amarillas: 0, rojas: 0 };
}

/** Recorre los eventos de varios partidos y acumula goles/asistencias/tarjetas
 *  por jugador, solo del equipo pedido. */
function acumularEventos(
  partidos: PartidoMundial[],
  equipo: "usuario" | "rival",
): Map<string, EstadisticaJugador> {
  const mapa = new Map<string, EstadisticaJugador>();
  const sumar = (jugador: Player, campo: "goles" | "asistencias" | "amarillas" | "rojas") => {
    const actual = mapa.get(jugador.id) ?? nueva(jugador, equipo === "usuario");
    actual[campo] += 1;
    mapa.set(jugador.id, actual);
  };
  for (const partido of partidos) {
    for (const e of partido.eventos) {
      if (e.equipo !== equipo) continue;
      if (e.tipo === "gol" && e.jugador) sumar(e.jugador, "goles");
      if (e.tipo === "gol" && e.asistencia) sumar(e.asistencia, "asistencias");
      if (e.tipo === "amarilla" && e.jugador) sumar(e.jugador, "amarillas");
      if (e.tipo === "roja" && e.jugador) sumar(e.jugador, "rojas");
    }
  }
  return mapa;
}

/** Goleadores primero, después más asistencias; empate final por nombre. */
function ordenar(mapa: Map<string, EstadisticaJugador>): EstadisticaJugador[] {
  return [...mapa.values()].sort(
    (a, b) =>
      b.goles - a.goles ||
      b.asistencias - a.asistencias ||
      a.jugador.nombre.localeCompare(b.jugador.nombre),
  );
}

/** Estadísticas acumuladas de TODO el recorrido para el equipo del usuario. */
export function estadisticasUsuario(partidos: PartidoMundial[]): EstadisticaJugador[] {
  return ordenar(acumularEventos(partidos, "usuario"));
}

/** Estadísticas del rival, un bloque por partido (cada partido enfrenta a un
 *  rival distinto, así que no hay nada que fusionar entre ellos). */
export interface EstadisticaRival {
  numero: number;
  rival: PartidoMundial["rival"];
  estadisticas: EstadisticaJugador[];
}
export function estadisticasPorRival(partidos: PartidoMundial[]): EstadisticaRival[] {
  return partidos.map((partido) => ({
    numero: partido.numero,
    rival: partido.rival,
    estadisticas: ordenar(acumularEventos([partido], "rival")),
  }));
}

/** id -> goles, listo para `<Pitch golesPorJugador>` (solo los que tienen). */
export function golesPorId(stats: EstadisticaJugador[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of stats) if (s.goles > 0) out[s.jugador.id] = s.goles;
  return out;
}

/** id -> asistencias, listo para `<Pitch asistenciasPorJugador>`. */
export function asistenciasPorId(stats: EstadisticaJugador[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of stats) if (s.asistencias > 0) out[s.jugador.id] = s.asistencias;
  return out;
}

/** Todos los jugadores con estadísticas de TODO el torneo en un solo pool —
 *  los del usuario y los de cada rival enfrentado juntos, para los rankings
 *  generales del torneo (que no distinguen equipo, ver `rankingPorGoles` y
 *  compañía). Nunca hay colisión de id entre jugadores de rivales distintos
 *  ni con el usuario (cada carta es única), así que fusionar es seguro. */
export function estadisticasCombinadas(partidos: PartidoMundial[]): EstadisticaJugador[] {
  const mapa = new Map<string, EstadisticaJugador>();
  for (const s of estadisticasUsuario(partidos)) mapa.set(s.jugador.id, s);
  for (const bloque of estadisticasPorRival(partidos)) {
    for (const s of bloque.estadisticas) mapa.set(s.jugador.id, s);
  }
  return [...mapa.values()];
}

/** Ranking del torneo por una sola estadística: de mayor a menor, solo los
 *  que tienen al menos 1 (no tiene sentido "rankear" a quien tiene 0).
 *  Empate: por nombre, únicamente para que el orden sea estable — no implica
 *  que uno haya rendido mejor que el otro. */
function rankingPor(
  stats: EstadisticaJugador[],
  campo: "goles" | "asistencias" | "amarillas" | "rojas",
): EstadisticaJugador[] {
  return stats
    .filter((s) => s[campo] > 0)
    .sort((a, b) => b[campo] - a[campo] || a.jugador.nombre.localeCompare(b.jugador.nombre));
}

export function rankingGoleadores(stats: EstadisticaJugador[]): EstadisticaJugador[] {
  return rankingPor(stats, "goles");
}
export function rankingAsistencias(stats: EstadisticaJugador[]): EstadisticaJugador[] {
  return rankingPor(stats, "asistencias");
}
export function rankingAmarillas(stats: EstadisticaJugador[]): EstadisticaJugador[] {
  return rankingPor(stats, "amarillas");
}
export function rankingRojas(stats: EstadisticaJugador[]): EstadisticaJugador[] {
  return rankingPor(stats, "rojas");
}
