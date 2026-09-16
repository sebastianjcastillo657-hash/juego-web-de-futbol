// Lógica pura del historial de partidas: armar el resumen de un recorrido de
// Mundial terminado y calcular estadísticas agregadas. Sin React ni acceso a
// almacenamiento (eso vive en la capa de persistencia).

import type { PartidaHistorial, PartidoMundial, ResultadoMundial } from "@/types";

/** Arma la entrada de historial de un recorrido de Mundial ya terminado. */
export function resumirPartida(datos: {
  mundial: number;
  formacion: string;
  mediaEquipo: number;
  logro: ResultadoMundial["logro"];
  partidos: PartidoMundial[];
}): PartidaHistorial {
  const { mundial, formacion, mediaEquipo, logro, partidos } = datos;
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fecha: Date.now(),
    mundial,
    formacion,
    mediaEquipo,
    logro,
    partidosGanados: partidos.filter((p) => p.gano).length,
    partidosJugados: partidos.length,
    golesFavor: partidos.reduce((s, p) => s + p.golesUsuario, 0),
    golesContra: partidos.reduce((s, p) => s + p.golesRival, 0),
  };
}

/** Números agregados de todo el historial, para la cabecera del panel. */
export interface EstadisticasHistorial {
  total: number;
  campeon: number;
  plata: number;
  bronce: number;
  eliminado: number;
  partidosGanados: number;
  partidosJugados: number;
  /** 0-100. */
  porcentajeVictorias: number;
  mejorMedia: number;
  golesFavor: number;
  golesContra: number;
}

export function estadisticasHistorial(
  partidas: PartidaHistorial[],
): EstadisticasHistorial {
  const acc: EstadisticasHistorial = {
    total: partidas.length,
    campeon: 0,
    plata: 0,
    bronce: 0,
    eliminado: 0,
    partidosGanados: 0,
    partidosJugados: 0,
    porcentajeVictorias: 0,
    mejorMedia: 0,
    golesFavor: 0,
    golesContra: 0,
  };
  for (const p of partidas) {
    acc[p.logro] += 1;
    acc.partidosGanados += p.partidosGanados;
    acc.partidosJugados += p.partidosJugados;
    acc.golesFavor += p.golesFavor;
    acc.golesContra += p.golesContra;
    if (p.mediaEquipo > acc.mejorMedia) acc.mejorMedia = p.mediaEquipo;
  }
  acc.porcentajeVictorias =
    acc.partidosJugados > 0
      ? Math.round((acc.partidosGanados / acc.partidosJugados) * 100)
      : 0;
  return acc;
}
