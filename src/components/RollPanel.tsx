"use client";

import { useEffect, useRef, useState } from "react";
import { BanderaPais } from "@/components/BanderaPais";
import { useAtencionBoton } from "@/components/juego/useAtencionBoton";
import { GAME_CONFIG } from "@/game/config";
import { MUNDIALES, SELECCIONES } from "@/data/players";
import { BANDERAS_SVG } from "@/data/banderasSvg";
import type { RollResult } from "@/types";

interface RollPanelProps {
  roll: RollResult | null;
  /** true mientras la ruleta está girando (el resultado aún no se revela). */
  girando: boolean;
  puedeRollear: boolean;
  /** Multiplicador de velocidad de la ruleta (1, 1.5, 2...). El control para
   *  cambiarla vive afuera de este panel (a su izquierda). */
  velocidad: number;
  /** Re-sorteos combinados (país + año) que quedan en esta partida. */
  resorteosRestantes: number;
  /** Qué parte del ROLL se está re-sorteando ahora: gira solo ese cuadrado. */
  soloResortear: "pais" | "anio" | null;
  onRoll: () => void;
  onResortearPais: () => void;
  onResortearAnio: () => void;
  /** Se llama cuando la ruleta termina de frenar. */
  onFinGiro: () => void;
}

const PLACEHOLDER_PAIS = { pais: "???", bandera: "🏳️" };
const PLACEHOLDER_ANIO = "----";

export function RollPanel({
  roll,
  girando,
  puedeRollear,
  velocidad,
  resorteosRestantes,
  soloResortear,
  onRoll,
  onResortearPais,
  onResortearAnio,
  onFinGiro,
}: RollPanelProps) {
  const [displayPais, setDisplayPais] = useState(PLACEHOLDER_PAIS);
  const [displayAnio, setDisplayAnio] = useState(PLACEHOLDER_ANIO);
  const [tickPais, setTickPais] = useState(0);
  const [tickAnio, setTickAnio] = useState(0);
  const [frenadoPais, setFrenadoPais] = useState(false);
  const [frenadoAnio, setFrenadoAnio] = useState(false);
  const [faseRuleta, setFaseRuleta] = useState<"idle" | "pais" | "anio" | "listo">(
    "idle",
  );

  // Mantener callbacks/velocidad frescas sin re-disparar la animación (para
  // que cambiar la velocidad a mitad de giro no la reinicie de golpe).
  const onFinRef = useRef(onFinGiro);
  useEffect(() => {
    onFinRef.current = onFinGiro;
  });
  const velocidadRef = useRef(velocidad);
  useEffect(() => {
    velocidadRef.current = velocidad;
  });

  // Precarga las banderas para que la ruleta no parpadee la primera vuelta.
  useEffect(() => {
    for (const src of BANDERAS_SVG) {
      const img = new Image();
      img.src = src;
    }
  }, []);

  useEffect(() => {
    if (!girando || !roll) return;

    const {
      pasos,
      msInicial,
      msFinal,
      curva,
      msFrenadoDramatico,
      msPausaEntreFases,
    } = GAME_CONFIG.rollAnimacion;
    const sels = SELECCIONES;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    const delayPaso = (i: number) => {
      const frac = pasos <= 1 ? 1 : i / (pasos - 1);
      const base = msInicial + (msFinal - msInicial) * Math.pow(frac, curva);
      return base / velocidadRef.current;
    };

    const girarPais = (i: number, alFrenar: () => void, demoraFreno: number) => {
      if (cancelado) return;
      if (i >= pasos) {
        setDisplayPais({ pais: roll.seleccion, bandera: roll.bandera });
        setTickPais((t) => t + 1);
        setFrenadoPais(true);
        timer = setTimeout(alFrenar, demoraFreno / velocidadRef.current);
        return;
      }
      const s = sels[Math.floor(Math.random() * sels.length)];
      setDisplayPais({ pais: s.pais, bandera: s.bandera });
      setTickPais((t) => t + 1);
      timer = setTimeout(() => girarPais(i + 1, alFrenar, demoraFreno), delayPaso(i));
    };

    const girarAnio = (i: number) => {
      if (cancelado) return;
      if (i >= pasos) {
        setDisplayAnio(String(roll.mundial));
        setTickAnio((t) => t + 1);
        setFrenadoAnio(true);
        setFaseRuleta("listo");
        timer = setTimeout(
          () => onFinRef.current(),
          msFrenadoDramatico / velocidadRef.current,
        );
        return;
      }
      setDisplayAnio(
        String(MUNDIALES[Math.floor(Math.random() * MUNDIALES.length)]),
      );
      setTickAnio((t) => t + 1);
      timer = setTimeout(() => girarAnio(i + 1), delayPaso(i));
    };

    if (soloResortear === "pais") {
      // Solo gira el cuadrado del país; el año queda como está.
      setFrenadoPais(false);
      setFaseRuleta("pais");
      timer = setTimeout(
        () => girarPais(0, () => onFinRef.current(), msFrenadoDramatico),
        msInicial / velocidadRef.current,
      );
    } else if (soloResortear === "anio") {
      // Solo gira el cuadrado del año; el país queda como está.
      setDisplayPais({ pais: roll.seleccion, bandera: roll.bandera });
      setFrenadoAnio(false);
      setFaseRuleta("anio");
      timer = setTimeout(() => girarAnio(0), msInicial / velocidadRef.current);
    } else {
      // ROLL completo: primero país, después año.
      setFrenadoPais(false);
      setFrenadoAnio(false);
      setFaseRuleta("pais");
      setDisplayAnio(PLACEHOLDER_ANIO);
      const iniciarAnio = () => {
        if (cancelado) return;
        setFaseRuleta("anio");
        girarAnio(0);
      };
      timer = setTimeout(
        () =>
          girarPais(0, iniciarAnio, msFrenadoDramatico + msPausaEntreFases),
        msInicial / velocidadRef.current,
      );
    }

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [girando, roll, soloResortear]);

  const paisGirando = girando && faseRuleta === "pais" && !frenadoPais;
  const anioGirando = girando && faseRuleta === "anio" && !frenadoAnio;
  const enReposo = !girando && !roll;

  const pais = girando
    ? displayPais
    : roll
      ? { pais: roll.seleccion, bandera: roll.bandera }
      : PLACEHOLDER_PAIS;
  const anio = girando
    ? displayAnio
    : roll
      ? String(roll.mundial)
      : PLACEHOLDER_ANIO;

  const sinResorteos = resorteosRestantes <= 0;

  // "Atención" del ROLL / re-sorteos tras un rato sin usarse: un solo temporizador
  // compartido, armado mientras haya algún botón de este panel habilitado.
  // Interactuar con cualquiera de los tres (click o simplemente pasar el mouse)
  // la apaga y la reinicia.
  const hayBotonHabilitado = roll
    ? !girando && !sinResorteos
    : puedeRollear;
  const { atento, marcarActividad } = useAtencionBoton(
    hayBotonHabilitado,
    GAME_CONFIG.atencionBoton.umbralInactividadMs,
  );
  const claseAtencion = atento ? "atencion-pulso" : "";

  return (
    <aside className="flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur">
      {roll ? (
        <>
          {/* El ROLL se dividió: un botón sobre cada cuadrado. */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                marcarActividad();
                onResortearPais();
              }}
              onMouseEnter={marcarActividad}
              disabled={girando || sinResorteos}
              className={`rounded-xl border-2 border-emerald-400/60 bg-emerald-500/10 px-1.5 py-2 font-display text-[10px] font-bold uppercase leading-tight tracking-wide text-emerald-200 transition duration-200 ease-out active:scale-95 enabled:hover:scale-[1.04] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-zinc-800/60 disabled:text-zinc-500 ${claseAtencion}`}
            >
              🎲 Volver a sortear país
            </button>
            <button
              type="button"
              onClick={() => {
                marcarActividad();
                onResortearAnio();
              }}
              onMouseEnter={marcarActividad}
              disabled={girando || sinResorteos}
              className={`rounded-xl border-2 border-[#ffd23f]/60 bg-[#ffd23f]/10 px-1.5 py-2 font-display text-[10px] font-bold uppercase leading-tight tracking-wide text-[#ffe89b] transition duration-200 ease-out active:scale-95 enabled:hover:scale-[1.04] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-zinc-800/60 disabled:text-zinc-500 ${claseAtencion}`}
            >
              🎲 Volver a sortear año
            </button>
          </div>
          <div
            className={`-mt-1 text-center font-display text-[10px] font-semibold uppercase tracking-widest ${
              sinResorteos ? "text-white/30" : "text-white/50"
            }`}
          >
            {sinResorteos
              ? "Sin re-sorteos · se reponen la próxima partida"
              : `${resorteosRestantes} re-sorteo${
                  resorteosRestantes === 1 ? "" : "s"
                } disponible${resorteosRestantes === 1 ? "" : "s"}`}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            marcarActividad();
            onRoll();
          }}
          onMouseEnter={marcarActividad}
          disabled={!puedeRollear}
          className={`btn-roll relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-emerald-300/30 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 py-4 text-2xl font-display font-bold uppercase tracking-[0.28em] text-white shadow-[0_0_30px_-4px_rgba(16,185,129,0.95)] transition duration-200 ease-out active:scale-95 enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:border-white/5 disabled:from-zinc-700 disabled:via-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 disabled:shadow-none ${
            puedeRollear ? "ring-pulse" : ""
          } ${claseAtencion}`}
        >
          <span aria-hidden className="text-2xl leading-none">
            🎲
          </span>
          Roll
        </button>
      )}

      {/* País y Mundial: dos cuadrados totalmente independientes, tamaño fijo
          (más chicos) para que todo el panel entre sin hacer scroll. */}
      <div className="grid grid-cols-2 justify-items-center gap-2">
        {/* PAÍS */}
        <div
          className={`relative aspect-square w-24 overflow-hidden rounded-xl border-2 border-emerald-400/70 bg-gradient-to-br from-[#0a2c1e] via-[#0f3d29] to-[#061c13] p-1.5 shadow-[0_0_22px_-5px_rgba(16,185,129,0.7)] ${
            enReposo ? "breathe" : ""
          } ${frenadoPais ? "slam burst" : ""}`}
        >
          <span className="absolute left-1.5 top-1 font-display text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            País
          </span>
          <span
            key={paisGirando ? `p${tickPais}` : "final-pais"}
            className={`flex h-full flex-col items-center justify-center px-1 ${
              paisGirando ? "reel-in" : ""
            }`}
          >
            <BanderaPais
              pais={pais.pais}
              className="h-14 w-[78px] rounded-[3px] border border-black/40 object-cover shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
            />
          </span>
        </div>

        {/* MUNDIAL / AÑO */}
        <div
          className={`relative aspect-square w-24 overflow-hidden rounded-xl border-2 border-[#ffd23f]/70 bg-gradient-to-br from-[#0c2a1e] via-[#123a26] to-[#0a1f16] p-1.5 shadow-[0_0_22px_-5px_rgba(255,210,63,0.6)] ${
            enReposo ? "breathe" : ""
          } ${frenadoAnio ? "slam burst" : ""}`}
        >
          <span className="absolute left-1.5 top-1 font-display text-[8px] font-bold uppercase tracking-[0.18em] text-[#ffd23f]">
            Mundial
          </span>
          <span
            key={anioGirando ? `a${tickAnio}` : "final-anio"}
            className={`flex h-full items-center justify-center ${
              anioGirando ? "reel-in" : ""
            }`}
          >
            <span className="font-display text-2xl font-bold tabular-nums text-[#ffd23f] drop-shadow-[0_0_12px_rgba(255,210,63,0.55)]">
              {anio}
            </span>
          </span>
        </div>
      </div>

      <div className="h-4 text-center font-display text-[10px] font-semibold uppercase tracking-widest">
        {paisGirando ? (
          <span className="animate-pulse text-emerald-300">Sorteando país…</span>
        ) : anioGirando ? (
          <span className="animate-pulse text-[#ffd23f]">Sorteando Mundial…</span>
        ) : roll ? (
          <span className="text-white">
            {roll.seleccion} · {roll.mundial}
          </span>
        ) : (
          <span className="text-white/40">Girá la ruleta</span>
        )}
      </div>
    </aside>
  );
}
