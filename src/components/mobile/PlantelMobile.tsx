"use client";

import { useState } from "react";
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

const RAREZA_COLOR: Record<Rareza, string> = {
  comun: "text-zinc-300",
  raro: "text-emerald-300",
  epico: "text-lime-200",
  leyenda: "text-amber-300",
};

const ABREV: Record<TitularSlot["posicion"], string> = {
  Arquero: "ARQ",
  Defensa: "DEF",
  Medio: "MED",
  Delantero: "DEL",
};

interface PlantelMobileProps {
  squad: SquadState;
  onReiniciar: () => void;
  onSorteoListo: (
    mundial: number,
    partidos: PartidoPreparado[],
    etapaInicial: "editar" | "jugando",
  ) => void;
}

/** Pantalla móvil del plantel confirmado (ref. pantalla 1). */
export function PlantelMobile({
  squad,
  onReiniciar,
  onSorteoListo,
}: PlantelMobileProps) {
  const [tab, setTab] = useState<"titulares" | "suplentes">("titulares");
  const media = mediaDelEquipo(squad);

  const titulares = squad.slots
    .map((s) => ({ slot: s, player: squad.titulares[s.id] }))
    .filter((x): x is { slot: TitularSlot; player: Player } => x.player != null);
  const suplentes = squad.suplentes.filter((p): p is Player => p != null);

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <h1 className="text-neon font-display text-2xl font-bold uppercase tracking-[0.2em]">
          Plantel completo
        </h1>
        <p className="mt-1 font-display text-[10px] uppercase tracking-widest text-white/45">
          Formación {squad.formation.id}
        </p>
      </header>

      <div className="flex items-center justify-center gap-4 rounded-2xl border-2 border-[#ffd23f]/50 bg-gradient-to-br from-[#0c2a1e] to-[#06140d] px-6 py-4 shadow-[0_0_36px_-8px_rgba(255,210,63,0.5)]">
        <span className="font-display text-[10px] uppercase tracking-[0.28em] text-white/55">
          Media del equipo
        </span>
        <span className="count-glow font-display text-5xl font-bold tabular-nums text-[#ffd23f]">
          {media}
        </span>
      </div>

      <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
        <TabBtn activo={tab === "titulares"} onClick={() => setTab("titulares")}>
          Titulares ({titulares.length})
        </TabBtn>
        <TabBtn activo={tab === "suplentes"} onClick={() => setTab("suplentes")}>
          Suplentes ({suplentes.length})
        </TabBtn>
      </div>

      <ul className="flex flex-col gap-1.5">
        {tab === "titulares"
          ? titulares.map(({ slot, player }) => (
              <Fila
                key={slot.id}
                player={player}
                posicionSlot={ABREV[slot.posicion]}
                mediaMostrada={mediaEfectiva(player, slot)}
              />
            ))
          : suplentes.map((player) => (
              <Fila
                key={player.id}
                player={player}
                posicionSlot="SUP"
                mediaMostrada={player.media}
              />
            ))}
      </ul>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <SorteoMundial onListo={onSorteoListo} />
      </div>

      <button
        type="button"
        onClick={onReiniciar}
        className="mx-auto rounded-lg border border-white/15 px-6 py-2 font-display text-xs font-semibold uppercase tracking-widest text-zinc-400"
      >
        Nuevo plantel
      </button>
    </div>
  );
}

function TabBtn({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 font-display text-[11px] font-bold uppercase tracking-widest transition ${
        activo ? "bg-[#c6ff3d] text-black" : "text-white/50"
      }`}
    >
      {children}
    </button>
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
    <li className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[13px]">
      <span className="w-9 shrink-0 rounded-md bg-[#c6ff3d] px-1 py-0.5 text-center font-display text-[11px] font-black uppercase text-black">
        {posicionSlot}
      </span>
      <span
        className={`w-8 shrink-0 text-right font-display font-bold tabular-nums ${
          esElite ? "text-neon" : RAREZA_COLOR[player.rareza]
        }`}
      >
        {mediaMostrada}
        {penalizado && <span className="ml-0.5 text-[9px] text-red-400">▼</span>}
      </span>
      <span className="shrink-0">{player.bandera}</span>
      <span className="min-w-0 flex-1 truncate">{player.nombre}</span>
      <span className="shrink-0 text-[9px] uppercase leading-tight text-white/40">
        {player.seleccion} {player.mundial}
        <br />
        {etiquetaRareza(player.rareza)}
      </span>
    </li>
  );
}
