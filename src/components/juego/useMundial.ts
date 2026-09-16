"use client";

import { useEffect, useRef, useState } from "react";
import { resumirPartida } from "@/game/historial";
import { logroDe } from "@/game/mundial";
import { mediaDelEquipo } from "@/game/squad";
import { guardarPartida } from "@/persistencia/historial";
import type { PartidoMundial, PartidoPreparado, SquadState } from "@/types";

export type EtapaPantalla = "editar" | "jugando" | "post" | "resumen";

/**
 * Máquina de estados del recorrido por el Mundial (los 7 partidos), sin
 * interfaz: la comparten la vista de escritorio (`MundialScreen`) y la móvil
 * (`MundialScreenMobile`). Guarda la partida en el historial persistente una
 * sola vez, apenas el recorrido queda decidido.
 */
export function useMundial(
  mundial: number,
  partidos: PartidoPreparado[],
  squad: SquadState,
  etapaInicial: "editar" | "jugando",
) {
  const [jugados, setJugados] = useState<PartidoMundial[]>([]);
  const [etapa, setEtapa] = useState<EtapaPantalla>(etapaInicial);

  const ultimoJugado = jugados[jugados.length - 1];
  const recorridoTerminado =
    jugados.length >= partidos.length ||
    (ultimoJugado ? !ultimoJugado.gano : false);
  const actual = partidos[jugados.length];

  const guardadoRef = useRef(false);
  useEffect(() => {
    if (guardadoRef.current || jugados.length === 0 || !recorridoTerminado) return;
    guardadoRef.current = true;
    guardarPartida(
      resumirPartida({
        mundial,
        formacion: squad.formation.id,
        mediaEquipo: mediaDelEquipo(squad),
        logro: logroDe(jugados),
        partidos: jugados,
      }),
    );
  }, [jugados, recorridoTerminado, mundial, squad]);

  function manejarFinPartido(resultado: PartidoMundial) {
    setJugados((prev) => [...prev, resultado]);
    setEtapa("post");
  }

  return {
    jugados,
    etapa,
    setEtapa,
    ultimoJugado,
    recorridoTerminado,
    actual,
    manejarFinPartido,
  };
}
