import { GAME_CONFIG } from "@/game/config";
import { SELECCIONES, jugadoresDe, seleccionesDe } from "@/data/players";
import type {
  Player,
  PosicionGenerica,
  RollResult,
  SeleccionResumen,
} from "@/types";

/** Elección al azar uniforme de un elemento. */
function elegir<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Una carta al azar de la lista, ponderada por `pesoAparicion`. */
function elegirPonderado(candidatos: Player[]): Player {
  const total = candidatos.reduce((s, p) => s + Math.max(0, p.pesoAparicion), 0);
  let r = Math.random() * total;
  for (const p of candidatos) {
    r -= Math.max(0, p.pesoAparicion);
    if (r <= 0) return p;
  }
  return candidatos[candidatos.length - 1];
}

/** Orden de desempate cuando dos cartas tienen la misma media. */
const ORDEN_POS: Record<PosicionGenerica, number> = {
  Arquero: 0,
  Defensa: 1,
  Medio: 2,
  Delantero: 3,
};

const POSICIONES: PosicionGenerica[] = ["Arquero", "Defensa", "Medio", "Delantero"];

/**
 * Filtros opcionales para "volver a sortear" solo una parte del ROLL:
 * - `pais`: fija la selección y re-sortea el año.
 * - `mundial`: fija el año y re-sortea la selección.
 * - `evitarPais` / `evitarMundial`: si hay alternativa, no repetir ese valor.
 */
export interface RollOpciones {
  pais?: string;
  mundial?: number;
  evitarPais?: string;
  evitarMundial?: number;
}

/**
 * Un ROLL: elige selección + año de Mundial al azar y devuelve exactamente
 * 4 jugadores, uno por posición (arquero, defensa, medio, delantero), cada uno
 * ponderado por rareza. El resultado viene ordenado por media de menor a mayor.
 *
 * `idsEnUso` son las combinaciones jugador+año (== `Player.id`) que ya están
 * en el plantel: se excluyen de las opciones para que un mismo jugador+año no
 * pueda salir dos veces. Otras versiones del jugador (otros años) siguen
 * disponibles porque tienen otro `id`.
 *
 * `opciones` permite re-sortear solo país o solo año (ver `RollOpciones`).
 */
export function rollDraft(
  idsEnUso: ReadonlySet<string> = new Set(),
  opciones: RollOpciones = {},
): RollResult {
  const { pais, mundial: mundialFijo, evitarPais, evitarMundial } = opciones;

  const selsPosibles: SeleccionResumen[] = pais
    ? SELECCIONES.filter((s) => s.pais === pais)
    : mundialFijo != null
      ? seleccionesDe(mundialFijo)
      : SELECCIONES;

  for (let intento = 0; intento < 60; intento++) {
    let candSels = selsPosibles;
    if (evitarPais && selsPosibles.length > 1) {
      const filtradas = selsPosibles.filter((s) => s.pais !== evitarPais);
      if (filtradas.length > 0) candSels = filtradas;
    }
    const sel = elegir(candSels);

    let aniosPosibles =
      mundialFijo != null && sel.mundiales.includes(mundialFijo)
        ? [mundialFijo]
        : sel.mundiales;
    if (evitarMundial != null && aniosPosibles.length > 1) {
      const filtrados = aniosPosibles.filter((m) => m !== evitarMundial);
      if (filtrados.length > 0) aniosPosibles = filtrados;
    }
    const mundial = elegir(aniosPosibles);

    const plantel = jugadoresDe(sel.pais, mundial);

    const porPosicion = new Map<PosicionGenerica, Player[]>();
    for (const pos of POSICIONES) {
      porPosicion.set(
        pos,
        plantel.filter((p) => p.posicion === pos && !idsEnUso.has(p.id)),
      );
    }
    // Necesitamos al menos un jugador disponible en cada posición.
    if (POSICIONES.some((pos) => porPosicion.get(pos)!.length === 0)) continue;

    const ops = POSICIONES.map((pos) => elegirPonderado(porPosicion.get(pos)!)).sort(
      (a, b) => a.media - b.media || ORDEN_POS[a.posicion] - ORDEN_POS[b.posicion],
    );

    return { seleccion: sel.pais, bandera: sel.bandera, mundial, opciones: ops };
  }

  // Fallback defensivo: primera combinación viable dentro del filtro.
  const sel = selsPosibles[0] ?? SELECCIONES[0];
  const mundial =
    mundialFijo != null && sel.mundiales.includes(mundialFijo)
      ? mundialFijo
      : sel.mundiales[0];
  const plantel = jugadoresDe(sel.pais, mundial);
  const ops = POSICIONES.map((pos) => {
    const libres = plantel.filter((p) => p.posicion === pos && !idsEnUso.has(p.id));
    return libres[0] ?? plantel.find((p) => p.posicion === pos) ?? plantel[0];
  }).sort((a, b) => a.media - b.media || ORDEN_POS[a.posicion] - ORDEN_POS[b.posicion]);
  return { seleccion: sel.pais, bandera: sel.bandera, mundial, opciones: ops };
}
