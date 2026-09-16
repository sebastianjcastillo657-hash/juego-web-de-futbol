"use client";

import { useState } from "react";
import { etiquetaRareza } from "@/game/rarity";
import type { EstadisticasPlantel, Player, Rareza } from "@/types";

interface StatsPanelProps {
  stats: EstadisticasPlantel;
  formacionId: string;
}

const RAREZA_COLOR: Record<Rareza, string> = {
  comun: "text-zinc-300",
  raro: "text-emerald-300",
  epico: "text-lime-200",
  leyenda: "text-amber-300",
};

const RAREZAS: Rareza[] = ["comun", "raro", "epico", "leyenda"];

export function StatsPanel({ stats, formacionId }: StatsPanelProps) {
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Resumen: siempre visible, para ver el estado del plantel de un vistazo. */}
      <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-neon font-display text-xs font-bold uppercase tracking-[0.2em]">
            Plantel en vivo
          </h2>
          <span className="rounded-md border border-[#ffd23f]/50 bg-[#ffd23f]/10 px-1.5 py-0.5 font-display text-[10px] font-bold tracking-widest text-[#ffd23f]">
            {formacionId}
          </span>
        </div>

        {/* Medias destacadas */}
        <div className="grid grid-cols-2 gap-1.5">
          <BigStat
            label="Media 11"
            valor={stats.mediaEquipo || "—"}
            color="text-[#c6ff3d]"
          />
          <BigStat
            label="Promedio"
            valor={stats.promedioGeneral || "—"}
            color="text-[#ffd23f]"
          />
        </div>

        {/* Progreso */}
        <div className="space-y-1 rounded-xl border border-white/10 bg-black/30 p-2">
          <Barra label="Titulares" valor={stats.titulares} total={11} color="#10b981" />
          <Barra label="Suplentes" valor={stats.suplentes} total={5} color="#65a30d" />
          <Barra label="Total" valor={stats.colocados} total={16} color="#ffd23f" />
        </div>
      </div>

      {/* Detalle: colapsado por defecto para no saturar la columna. */}
      <div className="w-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
        <button
          type="button"
          onClick={() => setDetalleAbierto((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 font-display text-[10px] font-semibold uppercase tracking-widest text-white/60 transition hover:text-white"
        >
          <span>Ver detalle</span>
          <span
            className={`text-[10px] text-white/40 transition-transform duration-200 ${
              detalleAbierto ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </button>

        {detalleAbierto && (
          <div className="space-y-2 border-t border-white/10 px-3 pb-3 pt-2">
            {/* Mejor / peor */}
            <div className="space-y-1">
              <ExtremoFila
                etiqueta="Mayor media"
                player={stats.mejor}
                color="text-[#c6ff3d]"
              />
              <ExtremoFila
                etiqueta="Menor media"
                player={stats.peor}
                color="text-emerald-300"
              />
            </div>

            {/* Por posición */}
            <div>
              <Titulo>Por posición</Titulo>
              <div className="grid grid-cols-4 gap-1">
                <PosChip label="ARQ" valor={stats.porPosicion.Arquero} />
                <PosChip label="DEF" valor={stats.porPosicion.Defensa} />
                <PosChip label="MED" valor={stats.porPosicion.Medio} />
                <PosChip label="DEL" valor={stats.porPosicion.Delantero} />
              </div>
            </div>

            {/* Por rareza */}
            <div>
              <Titulo>Por rareza</Titulo>
              <div className="flex flex-wrap gap-1">
                {RAREZAS.map((r) => (
                  <span
                    key={r}
                    className={`rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase ${RAREZA_COLOR[r]} ${
                      stats.porRareza[r] === 0 ? "opacity-35" : ""
                    }`}
                  >
                    {etiquetaRareza(r)} {stats.porRareza[r]}
                  </span>
                ))}
              </div>
            </div>

            {/* Por Mundial (año de la versión de cada jugador) */}
            <div>
              <Titulo>Jugadores por Mundial</Titulo>
              {stats.porMundial.length === 0 ? (
                <p className="text-[11px] text-white/35">Sin jugadores todavía.</p>
              ) : (
                <ul className="max-h-28 space-y-0.5 overflow-y-auto pr-1">
                  {stats.porMundial.map((m) => (
                    <li
                      key={m.mundial}
                      className="flex items-center gap-1.5 text-[11px] text-zinc-200"
                    >
                      <span className="font-display font-bold tabular-nums text-white">
                        {m.mundial}
                      </span>
                      <span className="text-white/40">→</span>
                      <span className="text-white/60">
                        {m.cantidad} {m.cantidad === 1 ? "jugador" : "jugadores"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Por país */}
            <div>
              <Titulo>
                Por país{" "}
                <span className="text-white/35">
                  ({stats.paisesDistintos} · {stats.mundialesDistintos} Mundiales)
                </span>
              </Titulo>
              {stats.porPais.length === 0 ? (
                <p className="text-[11px] text-white/35">Sin jugadores todavía.</p>
              ) : (
                <ul className="max-h-28 space-y-0.5 overflow-y-auto pr-1">
                  {stats.porPais.map((c) => (
                    <li
                      key={c.pais}
                      className="flex items-center gap-1.5 text-[11px] text-zinc-200"
                    >
                      <span>{c.bandera}</span>
                      <span className="truncate">{c.pais}</span>
                      <span className="ml-auto font-display font-bold tabular-nums text-white">
                        {c.cantidad}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BigStat({
  label,
  valor,
  color,
}: {
  label: string;
  valor: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-1.5 text-center">
      <div className="font-display text-[10px] uppercase tracking-widest text-white/45">
        {label}
      </div>
      <div className={`font-display text-xl font-bold tabular-nums ${color}`}>
        {valor}
      </div>
    </div>
  );
}

function Barra({
  label,
  valor,
  total,
  color,
}: {
  label: string;
  valor: number;
  total: number;
  color: string;
}) {
  const pct = Math.round((valor / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between font-display text-[10px] uppercase tracking-wider text-white/50">
        <span>{label}</span>
        <span className="tabular-nums text-white/80">
          {valor}/{total}
        </span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ExtremoFila({
  etiqueta,
  player,
  color,
}: {
  etiqueta: string;
  player: Player | null;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px]">
      <span className="font-display text-[9px] uppercase tracking-wider text-white/40">
        {etiqueta}
      </span>
      {player ? (
        <>
          <span className="ml-auto">{player.bandera}</span>
          <span className="max-w-[84px] truncate text-zinc-200">
            {player.nombre}
          </span>
          <span className={`font-display font-bold tabular-nums ${color}`}>
            {player.media}
          </span>
        </>
      ) : (
        <span className="ml-auto text-white/30">—</span>
      )}
    </div>
  );
}

function PosChip({ label, valor }: { label: string; valor: number }) {
  return (
    <div
      className={`rounded-md border border-white/10 bg-black/30 py-1 text-center ${
        valor === 0 ? "opacity-40" : ""
      }`}
    >
      <div className="font-display text-[9px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className="font-display text-sm font-bold tabular-nums text-white">
        {valor}
      </div>
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/75">
      {children}
    </div>
  );
}
