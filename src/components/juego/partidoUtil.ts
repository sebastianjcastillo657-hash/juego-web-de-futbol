import type { EventoPartido } from "@/types";

export const EVENTO_ICONO: Record<EventoPartido["tipo"], string> = {
  gol: "⚽",
  amarilla: "🟨",
  roja: "🟥",
  penal: "🥅",
};

/** Tarjetas de un jugador (amarillas / roja) acumuladas en el partido. */
export type TarjetasJugador = { amarillas: number; roja: boolean };

/** Agrupa las tarjetas de una lista de eventos por id de jugador. */
export function tarjetasPorJugadorDe(
  eventos: EventoPartido[],
  equipo: "usuario" | "rival",
): Record<string, TarjetasJugador> {
  const mapa: Record<string, TarjetasJugador> = {};
  for (const e of eventos) {
    if (e.equipo !== equipo || !e.jugador) continue;
    if (e.tipo !== "amarilla" && e.tipo !== "roja") continue;
    const t = (mapa[e.jugador.id] ??= { amarillas: 0, roja: false });
    if (e.tipo === "amarilla") t.amarillas += 1;
    else t.roja = true;
  }
  return mapa;
}

export function dosDigitos(n: number): string {
  return n.toString().padStart(2, "0");
}
