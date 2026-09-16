// Carga data/mundiales.json y lo normaliza a cartas (Player) ya con:
//  - media de juego = la del Excel, sin transformar
//  - rareza y peso de aparición
//  - media estimada (con boost) donde la fuente no traía dato
// Todo se calcula una sola vez al importar el módulo.

import raw from "@data/mundiales.json";
import { GAME_CONFIG } from "@/game/config";
import { factorPesoMediaAlta, pesoDeRareza, rarezaDeMedia } from "@/game/rarity";
import { promedioMedias } from "@/game/ratings";
import { banderaDe } from "@/data/flags";
import { mediaManual } from "@/data/mediasManuales";
import type { Player, PosicionGenerica, SeleccionResumen } from "@/types";

// --- Forma cruda del JSON (solo lo que usamos) ---
// La posición vive por aparición: un mismo jugador puede jugar de posición
// distinta en cada Mundial (ver data/mundiales.json _meta).
interface RawAparicion {
  mundial: number;
  mediaFifa: number | null;
  posicionGenerica: string;
}
interface RawJugador {
  nombre: string;
  apariciones: RawAparicion[];
}
interface RawSeleccion {
  pais: string;
  participaciones: number[];
  jugadores: RawJugador[];
}
interface RawData {
  selecciones: RawSeleccion[];
}

const DATA = raw as unknown as RawData;

const POS_MAP: Record<string, PosicionGenerica> = {
  Portero: "Arquero",
  Defensor: "Defensa",
  Mediocampista: "Medio",
  Delantero: "Delantero",
};

function slug(...partes: Array<string | number>): string {
  return partes
    .join("__")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

// key: `${pais}||${mundial}` -> cartas de ese plantel
const PLANTELES = new Map<string, Player[]>();
const RESUMENES: SeleccionResumen[] = [];

for (const sel of DATA.selecciones) {
  const bandera = banderaDe(sel.pais);
  const mundialesConCartas: number[] = [];

  for (const mundial of sel.participaciones) {
    // Jugadores de esta selección presentes en este Mundial.
    const presentes: Array<{
      j: RawJugador;
      /** Posición del jugador en `sel.jugadores`: es lo único que garantiza
       *  un id único por carta (ver más abajo) — dos jugadores DISTINTOS
       *  pueden tener nombres iguales o casi iguales (con/sin acento, mayús-
       *  culas, abreviaturas) que, al normalizarlos para el id, colapsan al
       *  mismo texto. Confiar solo en el nombre para identificar produce
       *  colisiones (dos cartas con el mismo id => el sistema las trata como
       *  si fueran una sola: se pueden "fusionar", duplicar un hueco, quedar
       *  ambas seleccionadas a la vez, etc.). El índice en el array de origen
       *  es estable y no depende del nombre, así que nunca colisiona.
       */
      indiceJugador: number;
      posicion: PosicionGenerica;
      mediaFifa: number | null;
    }> = [];
    sel.jugadores.forEach((j, indiceJugador) => {
      const ap = j.apariciones.find((a) => a.mundial === mundial);
      if (!ap) return;
      const posicion = POS_MAP[ap.posicionGenerica];
      if (!posicion) return;
      presentes.push({ j, indiceJugador, posicion, mediaFifa: ap.mediaFifa });
    });
    if (presentes.length === 0) continue;

    // Promedio por posición para estimar las medias faltantes.
    const acum: Record<string, { suma: number; n: number }> = {};
    for (const p of presentes) {
      if (p.mediaFifa == null) continue;
      const a = (acum[p.posicion] ??= { suma: 0, n: 0 });
      a.suma += p.mediaFifa;
      a.n += 1;
    }
    const promedioPorPos = (pos: PosicionGenerica): number | null => {
      const a = acum[pos];
      return a && a.n > 0 ? Math.round(a.suma / a.n) : null;
    };

    const cartas: Player[] = presentes.map(({ j, indiceJugador, posicion, mediaFifa }) => {
      const inventada = mediaFifa == null;
      // Prioridad: 1) ajuste manual pedido explícitamente (data/mediasManuales),
      // 2) media del Excel tal cual, 3) sin dato -> base = promedio de las
      //    medias que SÍ tiene ese jugador en otros Mundiales (o de su
      //    posición) + boost topeado (GAME_CONFIG.mediaFaltante).
      const { boost, tope } = GAME_CONFIG.mediaFaltante;
      const mediasPropias = j.apariciones
        .map((a) => a.mediaFifa)
        .filter((m): m is number => m != null);
      const base =
        mediasPropias.length > 0
          ? promedioMedias(mediasPropias)
          : promedioPorPos(posicion) ?? GAME_CONFIG.mediaInventadaFallback;
      const media =
        mediaManual(sel.pais, mundial, j.nombre) ??
        (inventada ? Math.min(tope, base + boost) : (mediaFifa as number));
      const rareza = rarezaDeMedia(media);
      return {
        // `indiceJugador` (posición en `sel.jugadores`, ver arriba) es lo que
        // garantiza que el id sea único: nombre+posición+mundial+selección
        // solos NO alcanzan cuando dos jugadores distintos tienen nombres que
        // normalizan igual (con/sin acento, mayúsculas, iniciales). Nunca dos
        // cartas comparten el mismo `indiceJugador` dentro de la misma
        // selección, así que el id nunca colisiona.
        id: slug(sel.pais, mundial, posicion, indiceJugador, j.nombre),
        nombre: j.nombre,
        seleccion: sel.pais,
        bandera,
        mundial,
        posicion,
        // Ya no hay transformación: la media de juego es la de la fuente.
        mediaFifa: media,
        media,
        rareza,
        pesoAparicion: pesoDeRareza(rareza) * factorPesoMediaAlta(media),
        mediaInventada: inventada,
      };
    });

    PLANTELES.set(`${sel.pais}||${mundial}`, cartas);
    mundialesConCartas.push(mundial);
  }

  if (mundialesConCartas.length > 0) {
    RESUMENES.push({
      pais: sel.pais,
      bandera,
      mundiales: mundialesConCartas.sort((a, b) => a - b),
    });
  }
}

/** Selecciones jugables y los Mundiales en los que tienen plantel. */
export const SELECCIONES: SeleccionResumen[] = RESUMENES;

/** Años de Mundial únicos presentes en los datos, ordenados. */
export const MUNDIALES: number[] = [
  ...new Set(RESUMENES.flatMap((s) => s.mundiales)),
].sort((a, b) => a - b);

/** Cartas de una selección en un Mundial. Devuelve [] si no existe la combinación. */
export function jugadoresDe(pais: string, mundial: number): Player[] {
  return PLANTELES.get(`${pais}||${mundial}`) ?? [];
}

/** Selecciones (de nuestros datos) que tienen plantel en un Mundial dado. */
export function seleccionesDe(mundial: number): SeleccionResumen[] {
  return SELECCIONES.filter((s) => s.mundiales.includes(mundial));
}
