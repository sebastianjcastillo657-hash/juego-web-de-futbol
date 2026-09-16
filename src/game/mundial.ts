// Prepara los partidos del Mundial sorteado y resuelve el logro final.
// Lógica pura, sin React. El plantel del usuario NUNCA se modifica acá: se
// usa tal cual lo tenga en cada momento (el jugador puede reordenarlo entre
// partido y partido). El rival SIEMPRE juega con formación 4-3-3, armada con
// el mejor jugador disponible de su plantel para cada hueco. Quién gana cada
// partido lo decide la simulación en vivo (ver game/simulacion.ts), no este
// módulo.

import { jugadoresDe } from "@/data/players";
import { GAME_CONFIG } from "@/game/config";
import { FORMATIONS, slotsDeFormacion } from "@/game/formations";
import { mediaDelEquipo } from "@/game/squad";
import type {
  Formation,
  Player,
  PartidoPreparado,
  ResultadoMundial,
  SeleccionResumen,
  SquadState,
  TitularSlot,
} from "@/types";

/** Cuántos partidos tiene el recorrido completo del Mundial. */
export const PARTIDOS_MUNDIAL = 7;

/** El rival siempre juega 4-3-3, sin importar la formación del usuario. */
export const FORMACION_RIVAL: Formation = FORMATIONS.find((f) => f.id === "4-3-3")!;
export const SLOTS_RIVAL: TitularSlot[] = slotsDeFormacion(FORMACION_RIVAL);

/** "Plantel" del rival para poder dibujarlo con `<Pitch>` y calcular su OVR. */
export function squadRival(xiRival: Record<string, Player | null>): SquadState {
  return {
    formation: FORMACION_RIVAL,
    slots: SLOTS_RIVAL,
    titulares: xiRival,
    suplentes: [],
  };
}

/**
 * Arma el mejor once posible para los huecos dados: primero el mejor
 * jugador disponible de la posición natural de cada hueco; los huecos que
 * queden sin cubrir se rellenan con los mejores jugadores restantes, sin
 * importar posición (no se inventan jugadores).
 */
function armarMejorOnce(
  slots: TitularSlot[],
  plantel: Player[],
): Record<string, Player | null> {
  const xi: Record<string, Player | null> = {};
  const usados = new Set<string>();

  for (const slot of slots) {
    const mejor = plantel
      .filter((p) => p.posicion === slot.posicion && !usados.has(p.id))
      .sort((a, b) => b.media - a.media)[0];
    if (mejor) {
      xi[slot.id] = mejor;
      usados.add(mejor.id);
    } else {
      xi[slot.id] = null;
    }
  }

  const restantes = plantel
    .filter((p) => !usados.has(p.id))
    .sort((a, b) => b.media - a.media);
  for (const slot of slots) {
    if (xi[slot.id] != null) continue;
    const siguiente = restantes.shift();
    if (siguiente) {
      xi[slot.id] = siguiente;
      usados.add(siguiente.id);
    }
  }

  return xi;
}

/** Elige un elemento por peso; `pesos[i]` corresponde a `items[i]`. */
function elegirPorPeso<T>(items: T[], pesos: number[]): number {
  const total = pesos.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return Math.floor(Math.random() * items.length);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, pesos[i]);
    if (r <= 0) return i;
  }
  return items.length - 1;
}

/**
 * Prepara el recorrido: hasta 7 rivales distintos, cada uno con su once 4-3-3
 * ya armado (mejor jugador disponible por posición) y su OVR base.
 *
 * La dificultad crece de forma progresiva: para el partido `i` se busca un
 * rival con OVR cercano a un objetivo que sube de partido a partido, y al
 * principio los equipos fuertes (90+) casi no salen. Usa OVR del rival +
 * número de partido, no es azar puro. Ver `GAME_CONFIG.dificultadSorteo`.
 */
export function prepararPartidos(
  mundial: number,
  rivalesDisponibles: SeleccionResumen[],
): PartidoPreparado[] {
  const {
    ovrObjetivoInicial,
    ovrObjetivoFinal,
    escalaOvr,
    umbralFuerte,
    penalFuerteAlPrincipio,
    penalFuerteMinimo,
    partidosSinFuertes,
  } = GAME_CONFIG.dificultadSorteo;

  // Candidatos: cada selección disponible con su 4-3-3 y su OVR ya calculados.
  const pool = rivalesDisponibles.map((rival) => {
    const xiRival = armarMejorOnce(SLOTS_RIVAL, jugadoresDe(rival.pais, mundial));
    return {
      rival,
      xiRival,
      ovrRivalBase: mediaDelEquipo(squadRival(xiRival)),
    };
  });

  const n = Math.min(PARTIDOS_MUNDIAL, pool.length);
  const partidos: PartidoPreparado[] = [];

  for (let i = 0; i < n; i++) {
    const progreso = n <= 1 ? 1 : i / (n - 1);
    const objetivo =
      ovrObjetivoInicial + progreso * (ovrObjetivoFinal - ovrObjetivoInicial);
    // 1 en el partido 1, baja hasta 0 al llegar a `partidosSinFuertes` (de ahí
    // en más el multiplicador se queda en `penalFuerteMinimo`, nunca en 1).
    const atenuacion = Math.max(0, 1 - i / Math.max(1, partidosSinFuertes));
    const multFuerte =
      penalFuerteAlPrincipio + (penalFuerteMinimo - penalFuerteAlPrincipio) * (1 - atenuacion);

    const pesos = pool.map((c) => {
      let w = Math.exp(-(((c.ovrRivalBase - objetivo) / escalaOvr) ** 2));
      if (c.ovrRivalBase >= umbralFuerte) w *= multFuerte;
      return w;
    });

    const idx = elegirPorPeso(pool, pesos);
    const [elegido] = pool.splice(idx, 1);
    partidos.push({ numero: i + 1, ...elegido });
  }

  return partidos;
}

/**
 * A partir de los partidos ya jugados (se corta apenas se pierde uno),
 * determina el logro final del recorrido.
 */
export function logroDe(
  partidos: Array<{ gano: boolean }>,
): ResultadoMundial["logro"] {
  const ganados = partidos.filter((p) => p.gano).length;
  const ultimo = partidos[partidos.length - 1];
  const perdioUltimo = ultimo ? !ultimo.gano : false;

  if (ganados === PARTIDOS_MUNDIAL) return "campeon";
  if (perdioUltimo && ganados === PARTIDOS_MUNDIAL - 1) return "plata";
  if (perdioUltimo && ganados === PARTIDOS_MUNDIAL - 2) return "bronce";
  return "eliminado";
}

/**
 * Nivel (1-4) de la celebración al ganar UN partido, según qué número de
 * victoria consecutiva es (como el recorrido se corta apenas se pierde uno,
 * `numeroPartido` de un partido ganado equivale a la cantidad de victorias
 * acumuladas hasta ahí). Progresivo: cada tramo de victorias se festeja un
 * poco más fuerte que el anterior. Ver `VictoriaCelebracion`.
 */
export function nivelVictoria(numeroPartido: number): 1 | 2 | 3 | 4 {
  if (numeroPartido >= 7) return 4;
  if (numeroPartido >= 5) return 3;
  if (numeroPartido >= 3) return 2;
  return 1;
}

/**
 * Nivel (5-7) de la celebración especial al terminar el recorrido entre los
 * primeros 3 puestos — superior a cualquier nivel de `nivelVictoria`. `null`
 * si no llegó al podio (quedó eliminado sin medalla). El 1º puesto es el más
 * alto de todos.
 */
export function nivelPodio(
  logro: ResultadoMundial["logro"],
): 5 | 6 | 7 | null {
  if (logro === "bronce") return 5;
  if (logro === "plata") return 6;
  if (logro === "campeon") return 7;
  return null;
}
