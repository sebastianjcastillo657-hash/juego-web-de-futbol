// Estadísticas del plantel en construcción. Función pura, sin React.
// Se recalcula en cada cambio (agregar / quitar / mover / intercambiar).

import { mediaDelEquipo } from "@/game/squad";
import { promedioMedias } from "@/game/ratings";
import type {
  EstadisticasPlantel,
  Player,
  PosicionGenerica,
  Rareza,
  SquadState,
} from "@/types";

const POSICIONES: PosicionGenerica[] = [
  "Arquero",
  "Defensa",
  "Medio",
  "Delantero",
];
const RAREZAS: Rareza[] = ["comun", "raro", "epico", "leyenda"];

/** Todos los jugadores colocados (titulares + suplentes), sin huecos vacíos. */
function jugadoresColocados(squad: SquadState): Player[] {
  const titulares = squad.slots
    .map((s) => squad.titulares[s.id])
    .filter((p): p is Player => p != null);
  const suplentes = squad.suplentes.filter((p): p is Player => p != null);
  return [...titulares, ...suplentes];
}

export function estadisticasPlantel(squad: SquadState): EstadisticasPlantel {
  const colocados = jugadoresColocados(squad);
  const titulares = squad.slots.filter((s) => squad.titulares[s.id] != null).length;
  const suplentes = squad.suplentes.filter((p) => p != null).length;

  const porPosicion = Object.fromEntries(
    POSICIONES.map((pos) => [pos, 0]),
  ) as Record<PosicionGenerica, number>;
  const porRareza = Object.fromEntries(
    RAREZAS.map((r) => [r, 0]),
  ) as Record<Rareza, number>;

  const paises = new Map<string, { bandera: string; cantidad: number }>();
  const mundiales = new Map<number, number>();
  let mejor: Player | null = null;
  let peor: Player | null = null;

  for (const p of colocados) {
    porPosicion[p.posicion] += 1;
    porRareza[p.rareza] += 1;
    mundiales.set(p.mundial, (mundiales.get(p.mundial) ?? 0) + 1);

    const actual = paises.get(p.seleccion) ?? { bandera: p.bandera, cantidad: 0 };
    actual.cantidad += 1;
    paises.set(p.seleccion, actual);

    if (!mejor || p.media > mejor.media) mejor = p;
    if (!peor || p.media < peor.media) peor = p;
  }

  const porPais = [...paises.entries()]
    .map(([pais, v]) => ({ pais, bandera: v.bandera, cantidad: v.cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.pais.localeCompare(b.pais));

  const porMundial = [...mundiales.entries()]
    .map(([mundial, cantidad]) => ({ mundial, cantidad }))
    .sort((a, b) => a.mundial - b.mundial);

  return {
    colocados: colocados.length,
    titulares,
    suplentes,
    mediaEquipo: mediaDelEquipo(squad),
    promedioGeneral: promedioMedias(colocados.map((p) => p.media)),
    mejor,
    peor,
    porPosicion,
    porRareza,
    porPais,
    porMundial,
    paisesDistintos: porPais.length,
    mundialesDistintos: mundiales.size,
  };
}
