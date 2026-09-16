"use client";

import { useEffect, useState } from "react";
import { SorteoMundial } from "@/components/SorteoMundial";
import { GAME_CONFIG } from "@/game/config";
import { etiquetaRareza } from "@/game/rarity";
import { mediaDelEquipo, mediaEfectiva } from "@/game/squad";
import type {
  PartidoPreparado,
  Player,
  Rareza,
  SquadState,
  TitularSlot,
} from "@/types";

// Misma escala de la carta: cada rareza resalta más que la anterior.
const RAREZA_COLOR: Record<Rareza, string> = {
  comun: "text-zinc-300",
  raro: "text-emerald-300",
  epico: "text-lime-200",
  leyenda: "text-amber-300",
};

interface SquadSummaryProps {
  squad: SquadState;
  onReiniciar: () => void;
  /**
   * Se llama cuando el jugador ya vio el recorrido completo y eligió cómo
   * seguir; el padre pasa a la pantalla del Mundial en esa etapa.
   */
  onSorteoListo: (
    mundial: number,
    partidos: PartidoPreparado[],
    etapaInicial: "editar" | "jugando",
  ) => void;
}

/** Cuenta de 0 a `target` con desaceleración (solo presentación). */
function useCountUp(target: number, ms = 900): number {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    let raf = 0;
    const inicio = performance.now();
    const tick = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / ms);
      setValor(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return valor;
}

export function SquadSummary({ squad, onReiniciar, onSorteoListo }: SquadSummaryProps) {
  const media = mediaDelEquipo(squad);
  const mediaAnimada = useCountUp(media);
  const titulares = squad.slots
    .map((s) => ({ slot: s, player: squad.titulares[s.id] }))
    .filter((x): x is { slot: TitularSlot; player: Player } => x.player != null);
  const suplentes = squad.suplentes.filter((p): p is Player => p != null);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-2 p-3">
      <div className="text-center">
        <h1 className="text-neon font-display text-2xl font-bold uppercase tracking-[0.28em]">
          Plantel completo
        </h1>
        <p className="mt-0.5 font-display text-xs uppercase tracking-widest text-white/45">
          Formación {squad.formation.id}
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border-2 border-[#ffd23f]/50 bg-gradient-to-br from-[#0c2a1e] to-[#06140d] px-8 py-3 shadow-[0_0_36px_-6px_rgba(255,210,63,0.5)]">
        <span className="font-display text-xs uppercase tracking-[0.3em] text-white/55">
          Media del equipo
        </span>
        <span className="count-glow font-display text-4xl font-bold tabular-nums text-[#ffd23f]">
          {mediaAnimada}
        </span>
      </div>

      <div className="grid w-full gap-3 sm:grid-cols-2">
        <Lista titulo={`Titulares (${titulares.length})`}>
          {titulares.map(({ slot, player }) => (
            <Fila
              key={slot.id}
              player={player}
              posicionSlot={abrev(slot.posicion)}
              mediaMostrada={mediaEfectiva(player, slot)}
            />
          ))}
        </Lista>

        <Lista titulo={`Suplentes (${suplentes.length})`}>
          {suplentes.map((player) => (
            <Fila
              key={player.id}
              player={player}
              posicionSlot="SUP"
              mediaMostrada={player.media}
            />
          ))}
        </Lista>
      </div>

      <div className="flex w-full flex-col items-center gap-2">
        <div className="w-full max-w-md">
          <SorteoMundial onListo={onSorteoListo} />
        </div>

        <button
          type="button"
          onClick={onReiniciar}
          className="rounded-lg border border-white/15 px-6 py-1.5 font-display text-xs font-semibold uppercase tracking-widest text-zinc-400 transition hover:border-emerald-400/50 hover:text-white"
        >
          Nuevo plantel
        </button>
      </div>
    </div>
  );
}

function Lista({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur">
      <h2 className="mb-1.5 font-display text-xs font-bold uppercase tracking-[0.25em] text-emerald-300/80">
        {titulo}
      </h2>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function Fila({
  player,
  posicionSlot,
  mediaMostrada,
}: {
  player: Player;
  posicionSlot: string;
  mediaMostrada: number;
}) {
  const penalizado = mediaMostrada < player.media;
  const esElite = player.media > GAME_CONFIG.elite.umbralMedia;
  return (
    <li className="flex items-center gap-2 py-px text-[13px]">
      <span className="w-9 shrink-0 rounded-md bg-[#c6ff3d] px-1.5 py-px text-center font-display text-xs font-black uppercase tracking-wide text-black">
        {posicionSlot}
      </span>
      <span
        className={`w-9 shrink-0 text-right font-display font-bold tabular-nums ${
          esElite ? "text-neon" : RAREZA_COLOR[player.rareza]
        }`}
      >
        {mediaMostrada}
        {penalizado && <span className="ml-0.5 text-[10px] text-red-400">▼</span>}
      </span>
      <span>{player.bandera}</span>
      <span className="truncate">{player.nombre}</span>
      <span className="ml-auto shrink-0 text-[10px] uppercase text-white/40">
        {player.seleccion} {player.mundial} · {etiquetaRareza(player.rareza)}
      </span>
    </li>
  );
}

function abrev(pos: TitularSlot["posicion"]): string {
  return { Arquero: "ARQ", Defensa: "DEF", Medio: "MED", Delantero: "DEL" }[pos];
}
