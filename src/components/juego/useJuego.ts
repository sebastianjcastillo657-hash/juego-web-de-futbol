"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "@/game/config";
import { rollDraft } from "@/game/draft";
import { FORMATIONS } from "@/game/formations";
import { nivelRevelacion } from "@/game/rarity";
import { estadisticasPlantel } from "@/game/stats";
import {
  cartaDeSlot,
  colocar,
  crearSquad,
  estaCompleto,
  idsEnPlantel,
  intercambiar,
  mover,
  slotDeCarta,
} from "@/game/squad";
import type {
  Formation,
  PartidoPreparado,
  RollResult,
  SquadState,
} from "@/types";

export type Fase = "formacion" | "draft" | "listo" | "mundial";

/** N formaciones distintas al azar. */
function sortearFormaciones(n: number): Formation[] {
  return [...FORMATIONS].sort(() => Math.random() - 0.5).slice(0, n);
}

/**
 * Estado y lógica del juego completo (draft + sorteo + partidos), independiente
 * de la interfaz. Lo consumen tanto la vista de escritorio (`DraftScreen`) como
 * la móvil (`AppMobile`): misma fuente de verdad, distinta distribución.
 */
export function useJuego() {
  const [montado, setMontado] = useState(false);
  const [fase, setFase] = useState<Fase>("formacion");
  const [opcionesFormacion, setOpcionesFormacion] = useState<Formation[]>([]);
  const [squad, setSquad] = useState<SquadState | null>(null);
  const [roll, setRoll] = useState<RollResult | null>(null);
  const [girando, setGirando] = useState(false);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const [cartasReveladas, setCartasReveladas] = useState(0);
  const [anticipando, setAnticipando] = useState(false);
  const [velocidad, setVelocidad] = useState<number>(
    GAME_CONFIG.velocidadesDisponibles[0],
  );
  const [sorteo, setSorteo] = useState<{
    mundial: number;
    partidos: PartidoPreparado[];
    etapaInicial: "editar" | "jugando";
  } | null>(null);
  const [autoRoll, setAutoRoll] = useState(false);
  const autoRollPendienteRef = useRef(false);
  // "Volver a sortear país / año": presupuesto combinado por partida y qué
  // parte del ROLL se está re-sorteando ahora (para que gire solo ese cuadrado).
  const [resorteosRestantes, setResorteosRestantes] = useState<number>(
    GAME_CONFIG.resorteosDraft,
  );
  const [resorteoTipo, setResorteoTipo] = useState<"pais" | "anio" | null>(null);

  useEffect(() => {
    setMontado(true);
    setOpcionesFormacion(sortearFormaciones(GAME_CONFIG.formationOptionsCount));
  }, []);

  const finGiro = useCallback(() => setGirando(false), []);

  // Leída dentro del efecto de revelado sin sumarla a las dependencias, para
  // que cambiar la velocidad a mitad de reparto no lo reinicie.
  const velocidadRef = useRef(velocidad);
  useEffect(() => {
    velocidadRef.current = velocidad;
  });

  function siguienteVelocidad() {
    const opciones = GAME_CONFIG.velocidadesDisponibles;
    const i = opciones.indexOf(velocidad as (typeof opciones)[number]);
    setVelocidad(opciones[(i + 1) % opciones.length]);
  }

  // Con Auto Roll activado, apenas se coloca una carta del ROLL se marca acá
  // (ver usarSlot) y este efecto arranca el siguiente ROLL solo, ya con el
  // squad/roll actualizados (evita usar valores viejos de la clausura).
  useEffect(() => {
    if (!autoRollPendienteRef.current) return;
    autoRollPendienteRef.current = false;
    const t = setTimeout(() => {
      hacerRoll();
    }, GAME_CONFIG.rollAnimacion.msAutoRollSiguiente);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squad, roll, girando]);

  // Los jugadores aparecen de a uno, de menor a mayor media (roll.opciones ya
  // viene ordenado así desde draft.ts; el de mayor media es el último). Cada
  // carta espera su propia "anticipación" antes de revelarse: cuanto más
  // alto su nivel (común -> élite), más larga y dramática esa espera.
  useEffect(() => {
    if (girando || !roll) {
      setCartasReveladas(0);
      setAnticipando(false);
      return;
    }
    setCartasReveladas(0);
    setAnticipando(false);
    const opciones = roll.opciones;
    let n = 0;
    let timer: ReturnType<typeof setTimeout>;

    const anticiparSiguiente = () => {
      const carta = opciones[n];
      const { msAnticipacion, msPausaFinal } =
        GAME_CONFIG.revelacionCarta[nivelRevelacion(carta)];
      setAnticipando(true);
      timer = setTimeout(() => {
        n += 1;
        setCartasReveladas(n);
        setAnticipando(false);
        if (n < opciones.length) {
          timer = setTimeout(anticiparSiguiente, msPausaFinal / velocidadRef.current);
        }
      }, msAnticipacion / velocidadRef.current);
    };

    timer = setTimeout(
      anticiparSiguiente,
      GAME_CONFIG.rollAnimacion.msEntreCartas / velocidadRef.current,
    );
    return () => clearTimeout(timer);
  }, [girando, roll]);

  function reiniciar() {
    setFase("formacion");
    setSquad(null);
    setRoll(null);
    setGirando(false);
    setSeleccionadaId(null);
    setSorteo(null);
    setResorteosRestantes(GAME_CONFIG.resorteosDraft);
    setResorteoTipo(null);
    setOpcionesFormacion(sortearFormaciones(GAME_CONFIG.formationOptionsCount));
  }

  /**
   * El jugador ya vio el recorrido completo (los 7 rivales, en orden) y
   * eligió cómo seguir: pasar a la pantalla separada de partidos en esa etapa.
   */
  function sorteoListo(
    mundial: number,
    partidos: PartidoPreparado[],
    etapaInicial: "editar" | "jugando",
  ) {
    setSorteo({ mundial, partidos, etapaInicial });
    setFase("mundial");
  }

  function elegirFormacion(f: Formation) {
    setSquad(crearSquad(f));
    setResorteosRestantes(GAME_CONFIG.resorteosDraft);
    setResorteoTipo(null);
    setFase("draft");
  }

  function hacerRoll() {
    if (!squad || roll || girando || estaCompleto(squad)) return;
    // Se excluyen las combinaciones jugador+año ya colocadas en el plantel:
    // ese jugador con ESE año no vuelve a salir (otros años sí).
    setRoll(rollDraft(idsEnPlantel(squad)));
    setResorteoTipo(null);
    setGirando(true);
    setSeleccionadaId(null);
  }

  /** Vuelve a sortear solo el país del ROLL actual (mantiene el año). */
  function resortearPais() {
    if (!squad || !roll || girando || resorteosRestantes <= 0) return;
    setRoll(
      rollDraft(idsEnPlantel(squad), {
        mundial: roll.mundial,
        evitarPais: roll.seleccion,
      }),
    );
    setResorteoTipo("pais");
    setGirando(true);
    setSeleccionadaId(null);
    setResorteosRestantes((n) => n - 1);
  }

  /** Vuelve a sortear solo el año del ROLL actual (mantiene el país). */
  function resortearAnio() {
    if (!squad || !roll || girando || resorteosRestantes <= 0) return;
    setRoll(
      rollDraft(idsEnPlantel(squad), {
        pais: roll.seleccion,
        evitarMundial: roll.mundial,
      }),
    );
    setResorteoTipo("anio");
    setGirando(true);
    setSeleccionadaId(null);
    setResorteosRestantes((n) => n - 1);
  }

  /** Toggle de selección de una carta del ROLL. */
  function elegirCartaRoll(id: string) {
    setSeleccionadaId((actual) => (actual === id ? null : id));
  }

  /**
   * Único punto de entrada al tocar un hueco de la cancha o del banco.
   * Selecciona / mueve / intercambia según lo que haya seleccionado y en el hueco.
   * Un jugador ya colocado nunca se quita por hacerle clic.
   */
  function usarSlot(slotId: string) {
    if (!squad) return;
    const objetivo = cartaDeSlot(squad, slotId);

    // Nada seleccionado: si el hueco tiene jugador, queda seleccionado.
    if (!seleccionadaId) {
      if (objetivo) setSeleccionadaId(objetivo.id);
      return;
    }

    // Clic sobre el mismo jugador seleccionado: se deselecciona.
    if (objetivo && objetivo.id === seleccionadaId) {
      setSeleccionadaId(null);
      return;
    }

    // Seleccionada = carta del ROLL todavía sin colocar.
    const cartaRoll = roll?.opciones.find((o) => o.id === seleccionadaId) ?? null;
    if (cartaRoll) {
      if (objetivo) return; // el ROLL solo va a un hueco libre; no reemplaza
      const siguiente = colocar(squad, cartaRoll, slotId);
      if (siguiente === squad) return;
      setSquad(siguiente);
      setRoll(null);
      setGirando(false);
      setSeleccionadaId(null);
      if (autoRoll) autoRollPendienteRef.current = true;
      return;
    }

    // Seleccionada = jugador ya colocado: mover a hueco libre o intercambiar.
    const origen = slotDeCarta(squad, seleccionadaId);
    if (!origen) {
      setSeleccionadaId(null);
      return;
    }
    const siguiente = objetivo
      ? intercambiar(squad, origen, slotId)
      : mover(squad, origen, slotId);
    if (siguiente === squad) return;
    setSquad(siguiente);
    setSeleccionadaId(null);
  }

  /** Confirmar el plantel: solo cuando el usuario lo decide. */
  function terminar() {
    if (squad && estaCompleto(squad)) setFase("listo");
  }

  const cartaRollSeleccionada =
    roll?.opciones.find((o) => o.id === seleccionadaId) ?? null;
  const slotSeleccionado =
    squad && seleccionadaId ? slotDeCarta(squad, seleccionadaId) : null;
  // La carta seleccionada, venga del ROLL o de la propia plantilla. Se
  // reusa igual en la fase "mundial" para reordenar el plantel entre partidos.
  const seleccionada =
    cartaRollSeleccionada ??
    (squad && slotSeleccionado ? cartaDeSlot(squad, slotSeleccionado) : null);

  const cartasVisibles = !!roll && !girando;
  const stats = squad ? estadisticasPlantel(squad) : null;
  const completo = squad ? estaCompleto(squad) : false;

  return {
    // estado
    montado,
    fase,
    opcionesFormacion,
    squad,
    roll,
    girando,
    seleccionadaId,
    cartasReveladas,
    anticipando,
    velocidad,
    sorteo,
    autoRoll,
    resorteosRestantes,
    resorteoTipo,
    // derivados
    cartaRollSeleccionada,
    slotSeleccionado,
    seleccionada,
    cartasVisibles,
    stats,
    completo,
    // acciones
    setAutoRoll,
    finGiro,
    siguienteVelocidad,
    reiniciar,
    sorteoListo,
    elegirFormacion,
    hacerRoll,
    resortearPais,
    resortearAnio,
    elegirCartaRoll,
    usarSlot,
    terminar,
  };
}

export type Juego = ReturnType<typeof useJuego>;
