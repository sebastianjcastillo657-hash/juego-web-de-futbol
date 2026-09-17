// Lógica pura de la plantilla: crear, colocar, quitar, validar y promediar.
// Sin React. Todas las funciones devuelven estado nuevo (inmutables).

import { GAME_CONFIG } from "@/game/config";
import { slotsDeFormacion } from "@/game/formations";
import { promedioMedias } from "@/game/ratings";
import type {
  Formation,
  Player,
  PosicionGenerica,
  SquadState,
  TitularSlot,
} from "@/types";

/** Orden de las líneas de campo (sin el arco) para medir qué tan lejos está
 *  una posición de otra: adyacentes (distancia 1) o extremos (distancia 2). */
const ORDEN_LINEA: Record<Exclude<PosicionGenerica, "Arquero">, number> = {
  Defensa: 0,
  Medio: 1,
  Delantero: 2,
};

const SUP_IDS = Array.from(
  { length: GAME_CONFIG.suplentes },
  (_, i) => `SUP-${i + 1}`,
);

/** ¿Es un id de hueco de suplente? */
export function esSuplente(slotId: string): boolean {
  return slotId.startsWith("SUP-");
}

/** Plantilla vacía para una formación. */
export function crearSquad(formation: Formation): SquadState {
  const slots = slotsDeFormacion(formation);
  const titulares: Record<string, Player | null> = {};
  for (const s of slots) titulares[s.id] = null;
  return {
    formation,
    slots,
    titulares,
    suplentes: Array<Player | null>(GAME_CONFIG.suplentes).fill(null),
  };
}

/** Ids de todos los huecos de suplente (SUP-1..SUP-N). */
export function idsSuplentes(): string[] {
  return [...SUP_IDS];
}

/** ¿En qué hueco (si en alguno) está colocada esta carta? */
export function slotDeCarta(squad: SquadState, playerId: string): string | null {
  for (const [id, p] of Object.entries(squad.titulares)) {
    if (p?.id === playerId) return id;
  }
  const i = squad.suplentes.findIndex((p) => p?.id === playerId);
  return i >= 0 ? SUP_IDS[i] : null;
}

/** Carta colocada en un hueco (titular o suplente), o null si está libre. */
export function cartaDeSlot(squad: SquadState, slotId: string): Player | null {
  if (esSuplente(slotId)) {
    const i = SUP_IDS.indexOf(slotId);
    return i >= 0 ? squad.suplentes[i] : null;
  }
  return squad.titulares[slotId] ?? null;
}

/** ¿El hueco está libre? */
export function slotLibre(squad: SquadState, slotId: string): boolean {
  if (esSuplente(slotId)) {
    const i = SUP_IDS.indexOf(slotId);
    return i >= 0 && squad.suplentes[i] == null;
  }
  return slotId in squad.titulares && squad.titulares[slotId] == null;
}

/** Huecos libres cuya posición coincide con la de la carta (los "buenos"). */
export function slotsCompatibles(squad: SquadState, player: Player): string[] {
  return squad.slots
    .filter((s) => s.posicion === player.posicion && squad.titulares[s.id] == null)
    .map((s) => s.id);
}

/** Todos los huecos donde se puede soltar la carta (titulares libres + banco libre). */
export function slotsDisponibles(squad: SquadState, player: Player): string[] {
  void player;
  const tit = squad.slots.filter((s) => squad.titulares[s.id] == null).map((s) => s.id);
  const sup = SUP_IDS.filter((_, i) => squad.suplentes[i] == null);
  return [...tit, ...sup];
}

/** Media efectiva de una carta en un hueco (aplica penalización si corresponde). */
export function mediaEfectiva(player: Player, slot: TitularSlot | "suplente"): number {
  if (slot === "suplente") return player.media;
  if (slot.posicion === player.posicion) return player.media;
  const arcoInvolucrado = slot.posicion === "Arquero" || player.posicion === "Arquero";
  if (arcoInvolucrado) {
    return Math.max(1, player.media - GAME_CONFIG.penalizacion.liosConArco);
  }
  // Ambas son líneas de campo (Defensa/Medio/Delantero): la penalización
  // crece con la distancia entre esa línea y la natural del jugador.
  const distancia = Math.abs(
    ORDEN_LINEA[slot.posicion as Exclude<PosicionGenerica, "Arquero">] -
      ORDEN_LINEA[player.posicion as Exclude<PosicionGenerica, "Arquero">],
  );
  const castigo =
    distancia >= 2
      ? GAME_CONFIG.penalizacion.lineaLejana
      : GAME_CONFIG.penalizacion.lineaCercana;
  return Math.max(1, player.media - castigo);
}

/**
 * Coloca una carta en un hueco. Si la carta ya estaba en otro hueco, se mueve.
 * Devuelve el mismo estado (sin cambios) si la jugada no es válida.
 */
export function colocar(squad: SquadState, player: Player, slotId: string): SquadState {
  const destinoValido = esSuplente(slotId) || slotId in squad.titulares;
  if (!destinoValido) return squad;
  if (!slotLibre(squad, slotId)) return squad;

  const titulares = { ...squad.titulares };
  const suplentes = [...squad.suplentes];

  // Sacar de su hueco anterior, si tenía.
  const anterior = slotDeCarta(squad, player.id);
  if (anterior) {
    if (esSuplente(anterior)) suplentes[SUP_IDS.indexOf(anterior)] = null;
    else titulares[anterior] = null;
  }

  if (esSuplente(slotId)) suplentes[SUP_IDS.indexOf(slotId)] = player;
  else titulares[slotId] = player;

  return { ...squad, titulares, suplentes };
}

/**
 * Mueve el jugador de `desde` a `hacia` (que debe estar libre). Si `hacia` está
 * ocupado usá `intercambiar`. Devuelve el mismo estado si la jugada no es válida.
 */
export function mover(squad: SquadState, desde: string, hacia: string): SquadState {
  if (desde === hacia) return squad;
  const carta = cartaDeSlot(squad, desde);
  if (!carta) return squad;
  return colocar(squad, carta, hacia);
}

/**
 * Intercambia los jugadores de dos huecos ocupados (titular o banco, en
 * cualquier combinación). Devuelve el mismo estado si algún hueco está vacío.
 */
export function intercambiar(squad: SquadState, slotA: string, slotB: string): SquadState {
  if (slotA === slotB) return squad;
  const a = cartaDeSlot(squad, slotA);
  const b = cartaDeSlot(squad, slotB);
  if (!a || !b) return squad;

  const titulares = { ...squad.titulares };
  const suplentes = [...squad.suplentes];
  const poner = (slot: string, p: Player) => {
    if (esSuplente(slot)) suplentes[SUP_IDS.indexOf(slot)] = p;
    else titulares[slot] = p;
  };
  poner(slotA, b);
  poner(slotB, a);
  return { ...squad, titulares, suplentes };
}

/** Quita la carta de un hueco. */
export function quitar(squad: SquadState, slotId: string): SquadState {
  if (esSuplente(slotId)) {
    const i = SUP_IDS.indexOf(slotId);
    if (i < 0 || squad.suplentes[i] == null) return squad;
    const suplentes = [...squad.suplentes];
    suplentes[i] = null;
    return { ...squad, suplentes };
  }
  if (!(slotId in squad.titulares) || squad.titulares[slotId] == null) return squad;
  return { ...squad, titulares: { ...squad.titulares, [slotId]: null } };
}

/** Ids de todas las cartas ya colocadas (titulares + suplentes). Cada id es
 *  país + año + nombre, o sea una combinación jugador+año única. */
export function idsEnPlantel(squad: SquadState): Set<string> {
  const ids = new Set<string>();
  for (const p of Object.values(squad.titulares)) if (p) ids.add(p.id);
  for (const p of squad.suplentes) if (p) ids.add(p.id);
  return ids;
}

/** Cuántos titulares y suplentes hay colocados. */
export function conteo(squad: SquadState): { titulares: number; suplentes: number } {
  return {
    titulares: Object.values(squad.titulares).filter(Boolean).length,
    suplentes: squad.suplentes.filter(Boolean).length,
  };
}

/** ¿Están los 11 + 5 completos? */
export function estaCompleto(squad: SquadState): boolean {
  const c = conteo(squad);
  return c.titulares === GAME_CONFIG.titulares && c.suplentes === GAME_CONFIG.suplentes;
}

/** Media del equipo = promedio de las medias efectivas de los 11 titulares. */
export function mediaDelEquipo(squad: SquadState): number {
  const medias: number[] = [];
  for (const s of squad.slots) {
    const p = squad.titulares[s.id];
    if (p) medias.push(mediaEfectiva(p, s));
  }
  return promedioMedias(medias);
}
