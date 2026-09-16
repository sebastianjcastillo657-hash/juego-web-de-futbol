import type { Formation, PosicionGenerica, TitularSlot } from "@/types";

/** Catálogo de formaciones disponibles (todas suman 11 con el arquero). */
export const FORMATIONS: Formation[] = [
  { id: "4-4-2", defensa: 4, medio: 4, delantero: 2 },
  { id: "4-3-3", defensa: 4, medio: 3, delantero: 3 },
  { id: "3-5-2", defensa: 3, medio: 5, delantero: 2 },
  { id: "5-3-2", defensa: 5, medio: 3, delantero: 2 },
  { id: "3-4-3", defensa: 3, medio: 4, delantero: 3 },
  { id: "4-5-1", defensa: 4, medio: 5, delantero: 1 },
];

/**
 * Altura (y%) en la cancha de cada línea. 100 = arco propio, 0 = arco rival.
 * Todas las líneas están corridas -6 respecto del reparto original (92/70/46/22)
 * para que el arquero (la línea más pegada al borde) tenga margen de sobra
 * y su carta nunca quede cortada por el borde inferior de la cancha, sobre
 * todo en pantallas de poca altura. Es un desplazamiento parejo: la distancia
 * entre líneas (y por lo tanto la formación) queda idéntica.
 */
const FILA_Y: Record<PosicionGenerica, number> = {
  Arquero: 86,
  Defensa: 64,
  Medio: 40,
  Delantero: 16,
};

/** Genera una fila de huecos repartidos horizontalmente. */
function fila(posicion: PosicionGenerica, cantidad: number): TitularSlot[] {
  const y = FILA_Y[posicion];
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `TIT-${posicion}-${i + 1}`,
    posicion,
    x: Math.round(((i + 1) / (cantidad + 1)) * 100),
    y,
  }));
}

/** Los 11 huecos de titular de una formación, con posición y coordenadas. */
export function slotsDeFormacion(f: Formation): TitularSlot[] {
  return [
    ...fila("Arquero", 1),
    ...fila("Defensa", f.defensa),
    ...fila("Medio", f.medio),
    ...fila("Delantero", f.delantero),
  ];
}
