import { GAME_CONFIG } from "@/game/config";
import type { Player, Rareza } from "@/types";

/** Rareza a partir de la media ya inflada. */
export function rarezaDeMedia(media: number): Rareza {
  const u = GAME_CONFIG.rarezaUmbral;
  if (media >= u.leyenda) return "leyenda";
  if (media >= u.epico) return "epico";
  if (media >= u.raro) return "raro";
  return "comun";
}

/**
 * Nivel visual de un jugador: su rareza, salvo que además sea "élite"
 * (media > `elite.umbralMedia`), el escalón más alto de todos. Se usa para
 * graduar cuán espectacular es su revelación en el ROLL.
 */
export type NivelRevelacion = Rareza | "elite";

export function nivelRevelacion(player: Player): NivelRevelacion {
  if (player.media > GAME_CONFIG.elite.umbralMedia) return "elite";
  return player.rareza;
}

/** Color de resplandor por nivel: única fuente de verdad, la comparten la
 *  carta (borde/número) y la secuencia de revelación (anticipación/chispas). */
const GLOW_POR_NIVEL: Record<NivelRevelacion, string> = {
  comun: "#a1a1aa",
  raro: "#10b981",
  epico: "#c6ff3d",
  leyenda: "#ffd23f",
  elite: "#ffe89b",
};

export function glowDeNivel(nivel: NivelRevelacion): string {
  return GLOW_POR_NIVEL[nivel];
}

/**
 * Nivel VISUAL de una carta, más fino que la rareza. Sirve para que la
 * progresión de valor se perciba de inmediato, sin leer la media:
 *  marrón -> plata -> verde -> dorado (90-99) -> multicolor (100, luego >100).
 * No afecta lógica de juego.
 */
export type NivelCarta =
  | "marron"
  | "plata"
  | "verde"
  | "dorado"
  | "doradoAlto"
  | "mitico"
  | "elite"
  | "eliteMax";

export function nivelCarta(media: number): NivelCarta {
  const b = GAME_CONFIG.bandasCarta;
  if (media >= b.eliteMax) return "eliteMax";
  if (media > GAME_CONFIG.elite.umbralMedia) return "elite";
  if (media >= b.mitico) return "mitico";
  if (media >= b.doradoAlto) return "doradoAlto";
  if (media >= b.dorado) return "dorado";
  if (media >= b.verde) return "verde";
  if (media >= b.plata) return "plata";
  return "marron";
}

/** Color de resplandor por nivel visual de carta (variable CSS --glow). */
const GLOW_POR_NIVEL_CARTA: Record<NivelCarta, string> = {
  marron: "#9a6a3f",
  plata: "#d4d4d8",
  verde: "#10b981",
  dorado: "#fcd34d",
  doradoAlto: "#ffd23f",
  mitico: "#ffe89b",
  elite: "#ffffff",
  eliteMax: "#ffffff",
};

export function glowDeNivelCarta(nivel: NivelCarta): string {
  return GLOW_POR_NIVEL_CARTA[nivel];
}

/** Peso de aparición asociado a una rareza. */
export function pesoDeRareza(rareza: Rareza): number {
  return GAME_CONFIG.pesoPorRareza[rareza];
}

/**
 * Multiplicador de compensación para cartas de media alta (ver
 * `GAME_CONFIG.pesoMediaAlta`): 1 si no llega al umbral, el multiplicador
 * configurado si lo supera. Se aplica sobre el peso de rareza, no lo reemplaza.
 */
export function factorPesoMediaAlta(media: number): number {
  const { umbral, multiplicador } = GAME_CONFIG.pesoMediaAlta;
  return media > umbral ? multiplicador : 1;
}

/** Etiqueta legible para mostrar en pantalla. */
export function etiquetaRareza(rareza: Rareza): string {
  switch (rareza) {
    case "leyenda":
      return "Leyenda";
    case "epico":
      return "Épico";
    case "raro":
      return "Raro";
    case "comun":
      return "Común";
  }
}
