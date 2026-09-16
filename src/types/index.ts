// Tipos compartidos del juego. Fuente de verdad de las formas de datos.
// No poner lógica acá.

/** Las cuatro (y únicas) posiciones del juego. */
export type PosicionGenerica = "Arquero" | "Defensa" | "Medio" | "Delantero";

/** Rareza de una carta. Ordenada de más común a más rara. */
export type Rareza = "comun" | "raro" | "epico" | "leyenda";

/**
 * Una carta jugable: un jugador concreto en un Mundial concreto de una
 * selección concreta. El mismo futbolista en otro Mundial es otra carta.
 */
export interface Player {
  /** id estable: `${seleccion}__${mundial}__${nombre}` en slug. */
  id: string;
  nombre: string;
  seleccion: string;
  bandera: string;
  /** Año del Mundial al que pertenece esta carta. */
  mundial: number;
  posicion: PosicionGenerica;
  /** Media original de la fuente (FIFA/FC), o inventada si la fuente no tenía. */
  mediaFifa: number;
  /** Media de juego ya inflada. Es la que se usa en pantalla y en cálculos. */
  media: number;
  rareza: Rareza;
  /** Peso relativo de aparición en un ROLL (más alto = sale más seguido). */
  pesoAparicion: number;
  /** true si `mediaFifa` fue inventada porque la fuente no la traía. */
  mediaInventada: boolean;
}

/** Selección + los Mundiales en los que aparece en los datos. */
export interface SeleccionResumen {
  pais: string;
  bandera: string;
  mundiales: number[];
}

/** Una formación: siempre 1 arquero + estas líneas = 11 titulares. */
export interface Formation {
  /** ej. "4-3-3" */
  id: string;
  defensa: number;
  medio: number;
  delantero: number;
}

/** Hueco de titular en la cancha, con su posición fija y su lugar para dibujar. */
export interface TitularSlot {
  id: string;
  posicion: PosicionGenerica;
  /** 0..100, porcentaje horizontal dentro de la cancha. */
  x: number;
  /** 0..100, porcentaje vertical dentro de la cancha (100 = arco propio). */
  y: number;
}

/** Resultado de un ROLL. */
export interface RollResult {
  seleccion: string;
  bandera: string;
  mundial: number;
  opciones: Player[];
}

/** Conteo de jugadores de un país, con su bandera. */
export interface ConteoPais {
  pais: string;
  bandera: string;
  cantidad: number;
}

/**
 * Estadísticas del plantel en construcción, recalculadas cada vez que se
 * agrega, quita o intercambia un jugador. Solo lectura / presentación.
 */
export interface EstadisticasPlantel {
  /** Titulares + suplentes colocados. */
  colocados: number;
  titulares: number;
  suplentes: number;
  /** Media efectiva del 11 (con penalizaciones por posición). */
  mediaEquipo: number;
  /** Promedio de la media cruda de todos los jugadores colocados. */
  promedioGeneral: number;
  /** Jugador con mayor / menor media cruda entre los colocados. */
  mejor: Player | null;
  peor: Player | null;
  /** Cantidad de jugadores por posición natural. */
  porPosicion: Record<PosicionGenerica, number>;
  /** Cantidad de jugadores por rareza. */
  porRareza: Record<Rareza, number>;
  /** Jugadores por país, de mayor a menor cantidad. */
  porPais: ConteoPais[];
  /** Jugadores por año mundialista (el del `player.mundial`), orden ascendente. */
  porMundial: { mundial: number; cantidad: number }[];
  paisesDistintos: number;
  mundialesDistintos: number;
}

/** Estado de la plantilla en construcción. */
export interface SquadState {
  formation: Formation;
  slots: TitularSlot[];
  /** slotId -> carta colocada. */
  titulares: Record<string, Player | null>;
  /** 5 lugares libres de banco, sin posición. */
  suplentes: (Player | null)[];
}

/** Tipo de evento que puede pasar durante la simulación en vivo de un partido. */
export type TipoEventoPartido = "gol" | "amarilla" | "roja" | "penal";

/** Un evento ocurrido durante la simulación en vivo de un partido. */
export interface EventoPartido {
  minuto: number;
  tipo: TipoEventoPartido;
  equipo: "usuario" | "rival";
  /** Quién lo protagoniza (autor del gol / sancionado / pateador), si se pudo elegir. */
  jugador: Player | null;
  /** Solo para `tipo: "penal"`: si el penal fue convertido. */
  penalConvertido?: boolean;
  /** Solo para `tipo: "roja"`: la expulsión vino de acumular dos amarillas. */
  dobleAmarilla?: boolean;
  /** Solo para `tipo: "gol"` de juego (nunca en penales): quién dio la
   *  asistencia, si la hubo (no todos los goles tienen una). No se muestra en
   *  el resumen de un partido individual, solo se usa para el resumen general
   *  del torneo. */
  asistencia?: Player | null;
}

/** Rival + su once ya armado para un partido, antes de simularlo en vivo. */
export interface PartidoPreparado {
  numero: number;
  rival: SeleccionResumen;
  /** slotId -> jugador del rival en ese hueco (siempre formación 4-3-3). */
  xiRival: Record<string, Player | null>;
  ovrRivalBase: number;
}

/** Un penal pateado en la tanda de definición. */
export interface RondaPenal {
  equipo: "usuario" | "rival";
  acierto: boolean;
  /** Pateador elegido del XI de ese equipo (null si no se pudo elegir). */
  jugador: Player | null;
}

/**
 * Cuán decisivo es un penal dentro de la tanda, para graduar el ritmo y el
 * énfasis de su animación:
 *  - "decisivo": muerte súbita, o patada que gana/pierde la tanda matemáticamente.
 *  - "tenso": 4º/5º penal de un equipo con la tanda pareja (diferencia <= 1).
 *  - "normal": el resto.
 */
export type DramaPenal = "normal" | "tenso" | "decisivo";

/** Resultado de la tanda de penales (completamente al azar). */
export interface ResultadoPenales {
  golesUsuario: number;
  golesRival: number;
  rondas: RondaPenal[];
}

/**
 * Un partido ya jugado (simulado) del recorrido por el Mundial sorteado.
 * El plantel del usuario nunca se modifica; `xiRival` es el once que se le
 * armó a ese rival (formación 4-3-3 fija). `gano` es desde el punto de vista
 * del usuario.
 */
export interface PartidoMundial {
  numero: number;
  rival: SeleccionResumen;
  xiRival: Record<string, Player | null>;
  /** OVR de cada equipo antes de penalizaciones de tarjetas rojas de este partido. */
  ovrUsuarioBase: number;
  ovrRivalBase: number;
  /** OVR de cada equipo al final del partido (con las rojas de ESE partido ya descontadas). */
  ovrUsuarioFinal: number;
  ovrRivalFinal: number;
  eventos: EventoPartido[];
  golesUsuario: number;
  golesRival: number;
  /** true si necesitó prórroga (empate a los 90'). */
  prorroga: boolean;
  /** Si hizo falta definir por penales (empate tras la prórroga). */
  penales: ResultadoPenales | null;
  gano: boolean;
}

/** Resultado de jugar el Mundial sorteado: se corta apenas se pierde uno. */
export interface ResultadoMundial {
  mundial: number;
  partidos: PartidoMundial[];
  logro: "campeon" | "plata" | "bronce" | "eliminado";
}

/**
 * Una partida (recorrido completo de un Mundial) ya terminada, guardada en el
 * historial persistente. Solo el resumen: no se guardan los eventos partido a
 * partido.
 */
export interface PartidaHistorial {
  /** id único de la partida. */
  id: string;
  /** Momento en que terminó, en ms epoch. */
  fecha: number;
  /** Año del Mundial sorteado. */
  mundial: number;
  /** Formación usada (ej. "4-3-3"). */
  formacion: string;
  /** Media del equipo con la que se jugó el recorrido. */
  mediaEquipo: number;
  logro: ResultadoMundial["logro"];
  partidosGanados: number;
  partidosJugados: number;
  golesFavor: number;
  golesContra: number;
}
