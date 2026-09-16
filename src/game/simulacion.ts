// Simulación en vivo de un partido: en cada "tick" del reloj (cada
// `intervaloMs`) puede pasar un evento (gol, amarilla, roja). Lógica pura,
// sin React — el componente que dibuja el partido llama a `resolverTick` en
// cada tick y guarda el resultado.

import { GAME_CONFIG } from "@/game/config";
import type {
  DramaPenal,
  EventoPartido,
  Player,
  ResultadoPenales,
  RondaPenal,
  TipoEventoPartido,
} from "@/types";

/** Posiciones con más chance de ser autoras de un gol. */
const POSICIONES_GOLEADORAS: Player["posicion"][] = ["Delantero", "Medio"];

/** Elige un índice de `pesos` (ponderado); si la suma da 0, uniforme. */
function indicePorPeso(pesos: number[]): number {
  const total = pesos.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return Math.floor(Math.random() * pesos.length);
  let r = Math.random() * total;
  for (let i = 0; i < pesos.length; i++) {
    r -= Math.max(0, pesos[i]);
    if (r <= 0) return i;
  }
  return pesos.length - 1;
}

/** Cuántas amarillas lleva cada jugador de un equipo en este partido (id ->
 *  cantidad). Se usa para bajarles la chance de sumar otra tarjeta. */
function amarillasPorJugador(
  eventos: EventoPartido[],
  equipo: "usuario" | "rival",
): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const e of eventos) {
    if (e.equipo !== equipo || e.tipo !== "amarilla" || !e.jugador) continue;
    mapa.set(e.jugador.id, (mapa.get(e.jugador.id) ?? 0) + 1);
  }
  return mapa;
}

/**
 * A quién le sacan la tarjeta (amarilla o roja) dentro del equipo: ponderado
 * por `GAME_CONFIG.simulacionPartido.tarjetas.factorConAmarilla` — un
 * jugador que YA tiene una amarilla en este partido pesa bastante menos, para
 * que cueste mucho más que acumule otra (nunca imposible, solo mucho menos
 * probable). Así la segunda amarilla — y la roja por doble amarilla — quedan
 * naturalmente más raras.
 */
function elegirJugadorParaTarjeta(
  xi: Record<string, Player | null>,
  excluir: ReadonlySet<string>,
  yaAmonestados: Map<string, number>,
): Player | null {
  const jugadores = Object.values(xi).filter(
    (p): p is Player => p != null && !excluir.has(p.id),
  );
  if (jugadores.length === 0) return null;
  const { factorConAmarilla } = GAME_CONFIG.simulacionPartido.tarjetas;
  const pesos = jugadores.map((p) => (yaAmonestados.has(p.id) ? factorConAmarilla : 1));
  return jugadores[indicePorPeso(pesos)];
}

/**
 * Autor del GOL dentro del equipo que lo convierte: no es uniforme — pondera
 * por `media^exponenteMedia` entre los jugadores ofensivos disponibles (ver
 * `GAME_CONFIG.simulacionPartido.golData`), así un crack convierte más
 * seguido que un suplente sin que el resultado sea determinista.
 */
function elegirGoleador(
  xi: Record<string, Player | null>,
  excluir: ReadonlySet<string>,
): Player | null {
  const jugadores = Object.values(xi).filter(
    (p): p is Player => p != null && !excluir.has(p.id),
  );
  const ofensivos = jugadores.filter((p) => POSICIONES_GOLEADORAS.includes(p.posicion));
  const pool = ofensivos.length > 0 ? ofensivos : jugadores;
  if (pool.length === 0) return null;
  const { exponenteMedia } = GAME_CONFIG.simulacionPartido.golData;
  const pesos = pool.map((p) => Math.pow(p.media, exponenteMedia));
  return pool[indicePorPeso(pesos)];
}

/**
 * Quién da la asistencia de un gol, si la hubo: `GAME_CONFIG.simulacionPartido
 * .asistencias.probabilidad` de que exista, y si existe, se sortea entre los
 * compañeros disponibles (nunca el propio goleador) ponderado por
 * `media^exponenteMedia`, igual que el gol.
 */
function elegirAsistencia(
  xi: Record<string, Player | null>,
  excluir: ReadonlySet<string>,
  goleador: Player | null,
): Player | null {
  const { probabilidad, exponenteMedia } = GAME_CONFIG.simulacionPartido.asistencias;
  if (Math.random() >= probabilidad) return null;
  const jugadores = Object.values(xi).filter(
    (p): p is Player => p != null && !excluir.has(p.id) && p.id !== goleador?.id,
  );
  if (jugadores.length === 0) return null;
  const pesos = jugadores.map((p) => Math.pow(p.media, exponenteMedia));
  return jugadores[indicePorPeso(pesos)];
}

/** Cuántos jugadores de `xi` (no expulsados) en alguna de `posiciones` son de
 *  élite (media > `umbralMedia`). Se usa para el bonus de gol de `probGolUsuario`. */
function contarEliteEnPosicion(
  xi: Record<string, Player | null>,
  posiciones: readonly Player["posicion"][],
  excluir: ReadonlySet<string>,
  umbralMedia: number,
): number {
  let n = 0;
  for (const p of Object.values(xi)) {
    if (p && !excluir.has(p.id) && posiciones.includes(p.posicion) && p.media > umbralMedia) {
      n += 1;
    }
  }
  return n;
}

/**
 * Ids de los jugadores de un equipo que están EXPULSADOS en el partido:
 * los que tienen una roja o los que acumularon dos amarillas. Un expulsado
 * queda fuera del partido (no puede protagonizar más eventos).
 */
export function expulsadosDe(
  eventos: EventoPartido[],
  equipo: "usuario" | "rival",
): Set<string> {
  const amarillas: Record<string, number> = {};
  const fuera = new Set<string>();
  for (const e of eventos) {
    if (e.equipo !== equipo || !e.jugador) continue;
    if (e.tipo === "roja") fuera.add(e.jugador.id);
    else if (e.tipo === "amarilla") {
      amarillas[e.jugador.id] = (amarillas[e.jugador.id] ?? 0) + 1;
      if (amarillas[e.jugador.id] >= 2) fuera.add(e.jugador.id);
    }
  }
  return fuera;
}

/**
 * OVR de un equipo ya con las tarjetas rojas de ESE partido descontadas:
 * rendimientos decrecientes por roja (`porRoja[0]` la 1ª, `porRoja[1]` la
 * 2ª... la última entrada se repite para las que sigan) y un tope relativo al
 * OVR original (`topeFraccionOvr`), para que 2 o 3 rojas nunca dejen a un
 * equipo sin ninguna chance de remontar.
 */
export function ovrConPenalizacion(ovrBase: number, rojas: number): number {
  const { porRoja, topeFraccionOvr } = GAME_CONFIG.simulacionPartido.penalizacionTarjetaRoja;
  let ajuste = 0;
  for (let i = 0; i < rojas; i++) {
    ajuste += porRoja[Math.min(i, porRoja.length - 1)];
  }
  ajuste = Math.min(ajuste, ovrBase * topeFraccionOvr);
  return Math.max(1, ovrBase - ajuste);
}

/**
 * Cuánto resta EXACTAMENTE la roja número `rojasPrevias + 1` de un equipo
 * (ya con el tope de `ovrConPenalizacion` aplicado). Sirve para mostrar en la
 * interfaz el descuento real de esa tarjeta puntual, que ya no es siempre el
 * mismo número fijo.
 */
export function deltaPorRoja(ovrBase: number, rojasPrevias: number): number {
  return (
    ovrConPenalizacion(ovrBase, rojasPrevias) - ovrConPenalizacion(ovrBase, rojasPrevias + 1)
  );
}

/**
 * Probabilidad de que el equipo del usuario sea el protagonista de un evento,
 * según la diferencia de OVR `d = ovrUsuario - ovrRival`. `d = 0` => 0.5. La
 * ventaja crece de forma progresiva con `tanh(d / escalaOvr)` y se satura en
 * `ventajaMax*` (nunca 0 ni 1: siempre puede haber sorpresas). Asimétrica: la
 * ventaja del usuario pesa un poco más que la del rival a igual diferencia.
 */
export function probProtagonistaUsuario(
  ovrUsuario: number,
  ovrRival: number,
): number {
  const { escalaOvr, ventajaMaxUsuario, ventajaMaxRival } =
    GAME_CONFIG.simulacionPartido.ventajaOvr;
  const d = ovrUsuario - ovrRival;
  const cap = d >= 0 ? ventajaMaxUsuario : ventajaMaxRival;
  return 0.5 + cap * Math.tanh(d / escalaOvr);
}

/**
 * Sesgo TEMPORAL de "curva de aprendizaje" a favor del usuario según el número
 * de partido del recorrido (1..7). Se suma a `probGolUsuario` en
 * `resolverTick`; NO toca los OVR ni el sistema de `ventajaOvr`. Positivo al
 * principio, decae con las victorias hasta `bonusResidual` (nunca 0: ver el
 * comentario de `GAME_CONFIG.simulacionPartido.progresionDificultad`).
 */
export function bonusDificultad(numeroPartido: number): number {
  const { bonusInicial, bonusResidual, partidosHastaNormal, curva } =
    GAME_CONFIG.simulacionPartido.progresionDificultad;
  const t = Math.max(0, 1 - (numeroPartido - 1) / partidosHastaNormal);
  return bonusResidual + (bonusInicial - bonusResidual) * Math.pow(t, curva);
}

/**
 * Probabilidad de que el GOL de este tick lo convierta el usuario: parte de
 * `probProtagonistaUsuario` (OVR) + `sesgoUsuario` (curva de aprendizaje) y le
 * suma el "factor élite" simétrico (ver `GAME_CONFIG.simulacionPartido.bonusElite`):
 * un atacante propio de élite suma, un arquero o defensor RIVAL de élite
 * resta, y al revés si el crack lo tiene el rival. El ajuste total queda
 * topeado en `topeTotal` antes de sumarse — sigue siendo un plus chico sobre
 * el OVR (que ya refleja a estos jugadores en su promedio), no un factor aparte.
 */
export function probGolUsuario(
  ovrUsuario: number,
  ovrRival: number,
  xiUsuario: Record<string, Player | null>,
  xiRival: Record<string, Player | null>,
  expulsadosUsuario: ReadonlySet<string>,
  expulsadosRival: ReadonlySet<string>,
  sesgoUsuario = 0,
): number {
  const base = probProtagonistaUsuario(ovrUsuario, ovrRival) + sesgoUsuario;
  const { umbralMedia, bonusAtacante, bonusArquero, bonusDefensor, topeTotal } =
    GAME_CONFIG.simulacionPartido.bonusElite;

  const hayElite = (
    xi: Record<string, Player | null>,
    excluir: ReadonlySet<string>,
    posiciones: readonly Player["posicion"][],
  ) => contarEliteEnPosicion(xi, posiciones, excluir, umbralMedia) > 0;

  let ajuste = 0;
  if (hayElite(xiUsuario, expulsadosUsuario, POSICIONES_GOLEADORAS)) ajuste += bonusAtacante;
  if (hayElite(xiRival, expulsadosRival, POSICIONES_GOLEADORAS)) ajuste -= bonusAtacante;
  if (hayElite(xiRival, expulsadosRival, ["Arquero"])) ajuste -= bonusArquero;
  if (hayElite(xiUsuario, expulsadosUsuario, ["Arquero"])) ajuste += bonusArquero;
  if (hayElite(xiRival, expulsadosRival, ["Defensa"])) ajuste -= bonusDefensor;
  if (hayElite(xiUsuario, expulsadosUsuario, ["Defensa"])) ajuste += bonusDefensor;

  ajuste = Math.max(-topeTotal, Math.min(topeTotal, ajuste));
  return Math.min(0.95, Math.max(0.05, base + ajuste));
}

/**
 * Probabilidad de que la TARJETA de este tick sea para un jugador del
 * usuario: a propósito, NO depende del OVR (ver el comentario de
 * `GAME_CONFIG.simulacionPartido`), solo de si va perdiendo
 * (`tarjetaPorMarcador`) — el equipo que va abajo en el marcador se juega más
 * el físico, sin que ser el mejor equipo implique además acumular más tarjetas.
 */
export function probTarjetaUsuario(golesUsuario: number, golesRival: number): number {
  const { base, porDiferenciaGol, tope } = GAME_CONFIG.simulacionPartido.tarjetaPorMarcador;
  const diferenciaEnContra = golesRival - golesUsuario;
  const sesgo = Math.max(-tope, Math.min(tope, diferenciaEnContra * porDiferenciaGol));
  return Math.min(0.95, Math.max(0.05, base + sesgo));
}

/**
 * Resuelve un tick del reloj del partido: puede no pasar nada (null), o
 * devolver un evento. `ovrUsuario`/`ovrRival` deben venir ya con
 * `ovrConPenalizacion` aplicado hasta el momento (rojas acumuladas en ESE
 * partido). El gol y la tarjeta usan probabilidades DISTINTAS e independientes
 * (ver `probGolUsuario` / `probTarjetaUsuario`): el gol premia al mejor
 * equipo, la tarjeta depende del marcador, no del OVR.
 *
 * `sesgoUsuario` (opcional) es el modificador temporal de curva de aprendizaje
 * (ver `bonusDificultad`), y `marcador` el resultado parcial al momento del
 * tick (para `probTarjetaUsuario`).
 */
export function resolverTick(
  minuto: number,
  ovrUsuario: number,
  ovrRival: number,
  xiUsuario: Record<string, Player | null>,
  xiRival: Record<string, Player | null>,
  eventos: EventoPartido[] = [],
  sesgoUsuario = 0,
  marcador: { usuario: number; rival: number } = { usuario: 0, rival: 0 },
): EventoPartido | null {
  const { probEvento, probEventoGol, tarjetas } = GAME_CONFIG.simulacionPartido;

  if (Math.random() >= probEvento) return null;

  const esGol = Math.random() < probEventoGol;

  if (esGol) {
    const expulsadosUsuario = expulsadosDe(eventos, "usuario");
    const expulsadosRival = expulsadosDe(eventos, "rival");
    const probUsuario = probGolUsuario(
      ovrUsuario,
      ovrRival,
      xiUsuario,
      xiRival,
      expulsadosUsuario,
      expulsadosRival,
      sesgoUsuario,
    );
    const equipo: "usuario" | "rival" = Math.random() < probUsuario ? "usuario" : "rival";
    const xiDelEquipo = equipo === "usuario" ? xiUsuario : xiRival;
    const expulsados = equipo === "usuario" ? expulsadosUsuario : expulsadosRival;
    const goleador = elegirGoleador(xiDelEquipo, expulsados);
    return {
      minuto,
      tipo: "gol",
      equipo,
      jugador: goleador,
      asistencia: elegirAsistencia(xiDelEquipo, expulsados, goleador),
    };
  }

  // No fue gol: antes esto siempre terminaba en tarjeta. Ahora, la mayoría
  // de las veces la jugada queda en nada (ver `tarjetas.probSiNoGol`), así
  // las tarjetas en general son bastante menos frecuentes sin tocar la
  // frecuencia de gol.
  if (Math.random() >= tarjetas.probSiNoGol) return null;

  const equipo: "usuario" | "rival" =
    Math.random() < probTarjetaUsuario(marcador.usuario, marcador.rival) ? "usuario" : "rival";
  const xiDelEquipo = equipo === "usuario" ? xiUsuario : xiRival;
  const expulsados = expulsadosDe(eventos, equipo);
  const tipo: TipoEventoPartido =
    Math.random() < tarjetas.probAmarilla ? "amarilla" : "roja";
  return {
    minuto,
    tipo,
    equipo,
    jugador: elegirJugadorParaTarjeta(
      xiDelEquipo,
      expulsados,
      amarillasPorJugador(eventos, equipo),
    ),
  };
}

/** Orden de pateadores de un equipo: primero ofensivos, después el resto,
 *  cada grupo mezclado. Se excluye a los expulsados (no patean en la tanda).
 *  Se usa en orden y, si se acaba, se repite. */
function ordenPateadores(
  xi: Record<string, Player | null>,
  excluir: ReadonlySet<string>,
): Player[] {
  const jugadores = Object.values(xi).filter(
    (p): p is Player => p != null && !excluir.has(p.id),
  );
  const mezclar = (arr: Player[]) => [...arr].sort(() => Math.random() - 0.5);
  const ofensivos = mezclar(
    jugadores.filter((p) => POSICIONES_GOLEADORAS.includes(p.posicion)),
  );
  const resto = mezclar(
    jugadores.filter((p) => !POSICIONES_GOLEADORAS.includes(p.posicion)),
  );
  return [...ofensivos, ...resto];
}

/** El arquero de un equipo dentro de su XI (o null si no hay ninguno cargado). */
function arqueroDe(xi: Record<string, Player | null>): Player | null {
  return Object.values(xi).find((p) => p?.posicion === "Arquero") ?? null;
}

/**
 * Cuán decisivo es el penal `indice` de la tanda (ver `DramaPenal`). Mira el
 * marcador de la tanda ANTES de esa patada y cuántos penales le quedan a cada
 * equipo dentro de los 5 reglamentarios.
 */
export function dramaDePenal(
  rondas: RondaPenal[],
  indice: number,
): DramaPenal {
  const { penalesPorEquipo } = GAME_CONFIG.simulacionPartido;
  if (indice < 0 || indice >= rondas.length) return "normal";
  // Muerte súbita: cada patada define.
  if (indice >= penalesPorEquipo * 2) return "decisivo";

  const equipo = rondas[indice].equipo;
  let gProp = 0;
  let gRival = 0;
  let tomadosProp = 0;
  let tomadosRival = 0;
  for (let j = 0; j < indice; j++) {
    const r = rondas[j];
    if (r.equipo === equipo) {
      tomadosProp += 1;
      if (r.acierto) gProp += 1;
    } else {
      tomadosRival += 1;
      if (r.acierto) gRival += 1;
    }
  }
  const restProp = penalesPorEquipo - (tomadosProp + 1);
  const restRival = penalesPorEquipo - tomadosRival;

  const ganaSiConvierte = gProp + 1 > gRival + restRival;
  const pierdeSiFalla = gProp + restProp < gRival;
  if (ganaSiConvierte || pierdeSiFalla) return "decisivo";

  if (tomadosProp >= 3 && Math.abs(gProp - gRival) <= 1) return "tenso";
  return "normal";
}

/**
 * Tanda de penales: cada patada tiene su propia probabilidad de acierto,
 * según la media del pateador contra la del arquero rival (ver
 * `GAME_CONFIG.simulacionPartido.penales`) — ya no es un número fijo para
 * todos. Se corta apenas el resultado queda matemáticamente decidido, como
 * en una tanda real: no hace falta patear los `penalesPorEquipo` tiros si ya
 * no hay forma de que el que va perdiendo alcance al otro con lo que le
 * queda. Si sigue empatado al agotarlos, muerte súbita de a uno hasta que se
 * defina. Cada penal registra su pateador (del XI de ese equipo, salvo los
 * expulsados durante el partido).
 */
export function simularPenales(
  xiUsuario: Record<string, Player | null>,
  xiRival: Record<string, Player | null>,
  eventos: EventoPartido[] = [],
): ResultadoPenales {
  const { penalesPorEquipo, penales } = GAME_CONFIG.simulacionPartido;
  const { probBase, porPuntoDiferencia, probMin, probMax } = penales;
  const rondas: RondaPenal[] = [];
  let golesUsuario = 0;
  let golesRival = 0;
  let tiradosUsuario = 0;
  let tiradosRival = 0;

  const pateadores = {
    usuario: ordenPateadores(xiUsuario, expulsadosDe(eventos, "usuario")),
    rival: ordenPateadores(xiRival, expulsadosDe(eventos, "rival")),
  };
  const cuenta = { usuario: 0, rival: 0 };
  const proximoPateador = (equipo: "usuario" | "rival"): Player | null => {
    const lista = pateadores[equipo];
    if (lista.length === 0) return null;
    return lista[cuenta[equipo]++ % lista.length];
  };
  const arquero = { usuario: arqueroDe(xiUsuario), rival: arqueroDe(xiRival) };

  const probAcierto = (pateador: Player | null, arqueroRival: Player | null): number => {
    if (!pateador) return probBase;
    const diferencia = pateador.media - (arqueroRival?.media ?? pateador.media);
    const p = probBase + diferencia * porPuntoDiferencia;
    return Math.min(probMax, Math.max(probMin, p));
  };

  const patear = (equipo: "usuario" | "rival") => {
    const pateador = proximoPateador(equipo);
    const arqueroRival = equipo === "usuario" ? arquero.rival : arquero.usuario;
    const acierto = Math.random() < probAcierto(pateador, arqueroRival);
    rondas.push({ equipo, acierto, jugador: pateador });
    if (equipo === "usuario") {
      tiradosUsuario += 1;
      if (acierto) golesUsuario += 1;
    } else {
      tiradosRival += 1;
      if (acierto) golesRival += 1;
    }
  };

  /** true si a alguno de los dos ya no lo alcanza el otro con los tiros
   *  reglamentarios que le quedan: la tanda ya está decidida. */
  const yaDefinida = (): boolean => {
    const restanUsuario = penalesPorEquipo - tiradosUsuario;
    const restanRival = penalesPorEquipo - tiradosRival;
    return (
      golesUsuario > golesRival + restanRival ||
      golesRival > golesUsuario + restanUsuario
    );
  };

  // Ronda reglamentaria: se corta apenas queda matemáticamente decidida (se
  // chequea después de CADA tiro, no solo al completar el par), en vez de
  // patear siempre los `penalesPorEquipo` tiros de cada equipo.
  for (let i = 0; i < penalesPorEquipo && !yaDefinida(); i++) {
    patear("usuario");
    if (yaDefinida()) break;
    patear("rival");
  }

  // Muerte súbita si sigue empatado: una ronda define en cuanto uno convierte
  // y el otro falla (límite de seguridad, altamente improbable de alcanzar).
  let intentos = 0;
  while (golesUsuario === golesRival && intentos < 20) {
    patear("usuario");
    patear("rival");
    intentos += 1;
  }
  if (golesUsuario === golesRival) {
    if (Math.random() < 0.5) golesUsuario += 1;
    else golesRival += 1;
  }

  return { golesUsuario, golesRival, rondas };
}
