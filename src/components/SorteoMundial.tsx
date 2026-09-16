"use client";

import { useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "@/game/config";
import { prepararPartidos } from "@/game/mundial";
import { MUNDIALES, seleccionesDe } from "@/data/players";
import type { PartidoPreparado } from "@/types";

const PLACEHOLDER_ANIO = "----";

interface SorteoMundialProps {
  /**
   * Se llama una sola vez, cuando el jugador elige qué hacer tras ver el
   * recorrido completo (los 7 rivales, en el mismo orden en que se jugarán).
   */
  onListo?: (
    mundial: number,
    partidos: PartidoPreparado[],
    etapaInicial: "editar" | "jugando",
  ) => void;
}

type FaseSorteo = "idle" | "anio" | "rivales" | "decision";

interface Resultado {
  mundial: number;
  partidos: PartidoPreparado[];
}

/**
 * Sorteo completo del Mundial. El jugador arranca con "Comenzar": ahí se
 * decide todo el resultado (el año y los 7 rivales, en el orden en que se
 * jugarán) y arranca la animación. Mientras corre, el botón pasa a "Saltar":
 * si lo presiona, se muestran al instante todos los resultados finales sin
 * esperar la animación. Al terminar, elige si ajustar la plantilla o jugar.
 */
export function SorteoMundial({ onListo }: SorteoMundialProps) {
  const [fase, setFase] = useState<FaseSorteo>("idle");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const [display, setDisplay] = useState(PLACEHOLDER_ANIO);
  const [tick, setTick] = useState(0);
  const [frenadoAnio, setFrenadoAnio] = useState(false);

  const [indiceRival, setIndiceRival] = useState(0);
  const [displayRival, setDisplayRival] = useState("");
  const [tickRival, setTickRival] = useState(0);
  const [frenadoRival, setFrenadoRival] = useState(false);
  const [revelados, setRevelados] = useState<PartidoPreparado[]>([]);

  const onListoRef = useRef(onListo);
  useEffect(() => {
    onListoRef.current = onListo;
  });

  const partidos = resultado?.partidos ?? [];
  const mundial = resultado?.mundial ?? null;
  const girandoAnio = fase === "anio" && !frenadoAnio;

  function comenzar() {
    const elegido = MUNDIALES[Math.floor(Math.random() * MUNDIALES.length)];
    const parts = prepararPartidos(elegido, seleccionesDe(elegido));
    setResultado({ mundial: elegido, partidos: parts });
    setDisplay(PLACEHOLDER_ANIO);
    setFrenadoAnio(false);
    setFrenadoRival(false);
    setIndiceRival(0);
    setRevelados([]);
    setFase("anio");
  }

  function saltar() {
    if (!resultado) return;
    setDisplay(String(resultado.mundial));
    setFrenadoAnio(true);
    setRevelados(resultado.partidos);
    setFase("decision");
  }

  // Fase 1: ruleta del año del Mundial (hacia el resultado ya decidido).
  useEffect(() => {
    if (fase !== "anio" || !resultado) return;

    const { pasos, msInicial, msFinal, curva, msFrenadoDramatico } =
      GAME_CONFIG.rollAnimacion;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    const delayPaso = (i: number) => {
      const frac = pasos <= 1 ? 1 : i / (pasos - 1);
      return msInicial + (msFinal - msInicial) * Math.pow(frac, curva);
    };

    const girar = (i: number) => {
      if (cancelado) return;
      if (i >= pasos) {
        setDisplay(String(resultado.mundial));
        setTick((t) => t + 1);
        setFrenadoAnio(true);
        timer = setTimeout(() => setFase("rivales"), msFrenadoDramatico);
        return;
      }
      setDisplay(String(MUNDIALES[Math.floor(Math.random() * MUNDIALES.length)]));
      setTick((t) => t + 1);
      timer = setTimeout(() => girar(i + 1), delayPaso(i));
    };

    timer = setTimeout(() => girar(0), msInicial);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [fase, resultado]);

  // Fase 2: revelado secuencial de los 7 rivales, en el orden del fixture.
  useEffect(() => {
    if (fase !== "rivales" || !resultado) return;
    if (indiceRival >= resultado.partidos.length) return;

    const { pasos, msInicial, msFinal, curva } = GAME_CONFIG.rollAnimacion;
    const { msFrenadoRival, msPausaEntreRivales, msPausaFinal } =
      GAME_CONFIG.sorteoRivales;
    const candidatos = seleccionesDe(resultado.mundial);
    const objetivo = resultado.partidos[indiceRival];
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    setFrenadoRival(false);

    const delayPaso = (i: number) => {
      const frac = pasos <= 1 ? 1 : i / (pasos - 1);
      return msInicial + (msFinal - msInicial) * Math.pow(frac, curva);
    };

    const girar = (i: number) => {
      if (cancelado) return;
      if (i >= pasos) {
        setDisplayRival(objetivo.rival.pais);
        setTickRival((t) => t + 1);
        setFrenadoRival(true);
        timer = setTimeout(() => {
          setRevelados((prev) => [...prev, objetivo]);
          const esUltimo = indiceRival + 1 >= resultado.partidos.length;
          timer = setTimeout(
            () => {
              if (esUltimo) setFase("decision");
              else setIndiceRival((idx) => idx + 1);
            },
            esUltimo ? msPausaFinal : msPausaEntreRivales,
          );
        }, msFrenadoRival);
        return;
      }
      const candidato = candidatos.length > 0
        ? candidatos[Math.floor(Math.random() * candidatos.length)].pais
        : objetivo.rival.pais;
      setDisplayRival(candidato);
      setTickRival((t) => t + 1);
      timer = setTimeout(() => girar(i + 1), delayPaso(i));
    };

    timer = setTimeout(() => girar(0), msInicial);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [fase, resultado, indiceRival]);

  function elegir(etapaInicial: "editar" | "jugando") {
    if (!resultado) return;
    onListoRef.current?.(resultado.mundial, resultado.partidos, etapaInicial);
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/* Ruleta del Mundial. */}
      <div
        className={`relative aspect-square w-40 overflow-hidden rounded-2xl border-4 border-[#ffd23f]/80 bg-gradient-to-br from-[#0c2a1e] via-[#123a26] to-[#0a1f16] shadow-[0_0_44px_-8px_rgba(255,210,63,0.7)] ${
          fase === "idle" || !girandoAnio ? "breathe" : ""
        } ${frenadoAnio ? "slam burst" : ""}`}
      >
        <span className="absolute left-3 top-2.5 font-display text-xs font-bold uppercase tracking-[0.25em] text-[#ffd23f]">
          Mundial
        </span>
        <span
          key={girandoAnio ? `t${tick}` : "final"}
          className={`flex h-full items-center justify-center ${
            girandoAnio ? "reel-in" : ""
          }`}
        >
          <span className="font-display text-6xl font-bold tabular-nums text-[#ffd23f] drop-shadow-[0_0_18px_rgba(255,210,63,0.6)]">
            {display}
          </span>
        </span>
      </div>

      <div className="min-h-[20px] font-display text-sm font-semibold uppercase tracking-widest">
        {fase === "idle" ? (
          <span className="text-white/50">Listo para sortear</span>
        ) : girandoAnio ? (
          <span className="animate-pulse text-[#ffd23f]">Sorteando Mundial…</span>
        ) : (
          <span className="text-white">Mundial {mundial}</span>
        )}
      </div>

      {/* Botón único: "Comenzar" al inicio, "Saltar" mientras corre la animación. */}
      {(fase === "idle" || fase === "anio" || fase === "rivales") && (
        <button
          type="button"
          onClick={fase === "idle" ? comenzar : saltar}
          className="rounded-xl border-2 border-[#ffd23f] bg-gradient-to-r from-[#ffd23f] to-[#f5b301] px-10 py-2.5 font-display text-base font-bold uppercase tracking-[0.28em] text-black shadow-[0_0_24px_-6px_rgba(255,210,63,0.75)] transition hover:brightness-110 active:scale-95"
        >
          {fase === "idle" ? "Comenzar" : "Saltar"}
        </button>
      )}

      {/* Revelado secuencial de los 7 rivales, en el orden del fixture real. */}
      {(fase === "rivales" || fase === "decision") && (
        <div className="w-full space-y-3">
          {fase === "rivales" && (
            <>
              <div
                className={`relative mx-auto aspect-square w-32 overflow-hidden rounded-2xl border-2 border-emerald-400/70 bg-gradient-to-br from-[#0a2c1e] via-[#0f3d29] to-[#061c13] p-2 shadow-[0_0_28px_-6px_rgba(16,185,129,0.7)] ${
                  frenadoRival ? "slam burst" : ""
                }`}
              >
                <span className="absolute left-2 top-1.5 font-display text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Partido {indiceRival + 1} de {partidos.length}
                </span>
                <span
                  key={frenadoRival ? "final-rival" : `r${tickRival}`}
                  className={`flex h-full items-center justify-center px-1 ${
                    frenadoRival ? "" : "reel-in"
                  }`}
                >
                  <span className="line-clamp-3 text-center font-display text-sm font-bold uppercase leading-tight text-white">
                    {displayRival}
                  </span>
                </span>
              </div>
              <div className="text-center font-display text-xs font-semibold uppercase tracking-widest text-emerald-300/80 animate-pulse">
                Sorteando rivales…
              </div>
            </>
          )}

          <div className="mx-auto w-full max-w-sm space-y-1.5">
            {partidos.map((p, i) => {
              const revelado = revelados.find((r) => r.numero === p.numero);
              return (
                <div
                  key={p.numero}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                    revelado
                      ? "card-in border-white/10 bg-black/30 text-zinc-200"
                      : "border-dashed border-white/10 bg-black/10 text-white/25"
                  }`}
                >
                  <span className="w-16 shrink-0 font-display text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Partido {i + 1}
                  </span>
                  <span className="truncate">
                    {revelado ? revelado.rival.pais : "???"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decisión final: el jugador elige cómo seguir, nunca se avanza solo. */}
      {fase === "decision" && (
        <div className="card-in flex w-full flex-col items-center gap-2 pt-1 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => elegir("editar")}
            className="w-full rounded-xl border-2 border-white/20 bg-black/40 px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:border-emerald-400/60 hover:text-emerald-300 sm:w-auto"
          >
            Modificar equipo
          </button>
          <button
            type="button"
            onClick={() => elegir("jugando")}
            className="w-full rounded-xl border-2 border-emerald-300/30 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-8 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_22px_-6px_rgba(16,185,129,0.9)] transition active:scale-95 sm:w-auto"
          >
            Comenzar partido
          </button>
        </div>
      )}
    </div>
  );
}
