// Capa de persistencia del historial de partidas: lee y escribe en
// localStorage del navegador. No hay backend; el historial es por navegador
// y sobrevive recargas y cierres de la pestaña. Todo acceso está protegido
// para poder importarse desde código que también corre en el servidor (SSR).

import type { PartidaHistorial } from "@/types";

/** Clave versionada: si cambia la forma de `PartidaHistorial`, subir la versión. */
const CLAVE = "futdraft.historial.v1";

/** Límite de seguridad para no llenar el almacenamiento. */
const MAX_PARTIDAS = 200;

function hayLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/** Todas las partidas guardadas, de la más reciente a la más vieja. [] si no hay. */
export function cargarHistorial(): PartidaHistorial[] {
  if (!hayLocalStorage()) return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const data = JSON.parse(crudo);
    return Array.isArray(data) ? (data as PartidaHistorial[]) : [];
  } catch {
    return [];
  }
}

/**
 * Agrega una partida al frente del historial (más reciente primero) y lo
 * guarda. Devuelve el historial actualizado.
 */
export function guardarPartida(partida: PartidaHistorial): PartidaHistorial[] {
  const siguiente = [partida, ...cargarHistorial()].slice(0, MAX_PARTIDAS);
  if (hayLocalStorage()) {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(siguiente));
    } catch {
      /* almacenamiento lleno o bloqueado: la partida no se persiste */
    }
  }
  return siguiente;
}
