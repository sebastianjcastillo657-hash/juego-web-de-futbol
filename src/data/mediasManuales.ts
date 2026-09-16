// Ajustes de media pedidos explícitamente, jugador por jugador. Se aplican
// DESPUÉS de leer el Excel y tienen prioridad sobre su media.
//
// El Excel actual (jugadores_1.xlsx) YA trae las medias curadas (Messi 105,
// Maradona 105, Pelé 105, Zidane 101, Cruyff 103, …), así que esta lista está
// vacía. Se deja el archivo y la función para no romper el import de players.ts
// y para poder volver a agregar overrides puntuales en el futuro.

export interface AjusteMedia {
  pais: string;
  mundial: number;
  nombre: string;
  media: number;
}

/** Ajustes de media pedidos a mano, Mundial por Mundial. */
export const MEDIAS_MANUALES: AjusteMedia[] = [];

const CLAVE = (pais: string, mundial: number, nombre: string) =>
  `${pais}||${mundial}||${nombre}`;

const MAPA = new Map(
  MEDIAS_MANUALES.map((a) => [CLAVE(a.pais, a.mundial, a.nombre), a.media]),
);

/** Media manual para esa carta, o null si no hay ajuste. */
export function mediaManual(
  pais: string,
  mundial: number,
  nombre: string,
): number | null {
  return MAPA.get(CLAVE(pais, mundial, nombre)) ?? null;
}
