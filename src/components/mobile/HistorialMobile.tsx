"use client";

import { useEffect, useState } from "react";
import { estadisticasHistorial } from "@/game/historial";
import { cargarHistorial } from "@/persistencia/historial";
import type { PartidaHistorial } from "@/types";

const LOGRO_UI: Record<
  PartidaHistorial["logro"],
  { emoji: string; label: string; color: string }
> = {
  campeon: { emoji: "🏆", label: "Campeón", color: "text-[#ffd23f]" },
  plata: { emoji: "🥈", label: "Subcampeón", color: "text-zinc-200" },
  bronce: { emoji: "🥉", label: "Tercero", color: "text-amber-500" },
  eliminado: { emoji: "✕", label: "Eliminado", color: "text-[#ff5d5d]" },
};

function fmtFecha(ms: number): string {
  return new Date(ms).toLocaleDateString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/**
 * Historial de partidas para móvil: mismos datos que la tabla de escritorio
 * (`cargarHistorial` + `estadisticasHistorial`), pero como fila de chips que
 * scrollea y tarjetas apiladas en vez de tabla ancha.
 */
export function HistorialMobile() {
  const [partidas, setPartidas] = useState<PartidaHistorial[] | null>(null);

  useEffect(() => {
    setPartidas(cargarHistorial());
  }, []);

  if (partidas === null) return null;

  return (
    <section className="w-full">
      <h2 className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-300/75">
        Historial de partidas
      </h2>

      {partidas.length === 0 ? (
        <p className="text-[12px] leading-relaxed text-white/40">
          Todavía no terminaste ninguna partida. Jugá un Mundial completo y va a
          aparecer acá.
        </p>
      ) : (
        <>
          <ChipsResumen partidas={partidas} />

          <div className="mt-3 flex flex-col gap-2">
            {partidas.map((p) => {
              const l = LOGRO_UI[p.logro];
              const gano = p.logro !== "eliminado";
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-black/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[10px] uppercase tracking-wider text-white/45">
                      {fmtFecha(p.fecha)} · Mundial {p.mundial}
                    </span>
                    <span
                      className={`font-display text-[11px] font-bold ${l.color}`}
                    >
                      {l.emoji} {gano ? `${p.partidosGanados}/${p.partidosJugados}` : l.label}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/45">
                    <span>
                      Form. <b className="text-white/80">{p.formacion}</b>
                    </span>
                    <span>
                      G/J{" "}
                      <b className="text-white/80">
                        {p.partidosGanados}/{p.partidosJugados}
                      </b>
                    </span>
                    <span>
                      Media <b className="text-[#c6ff3d]">{p.mediaEquipo}</b>
                    </span>
                    <span>
                      Goles{" "}
                      <b className="text-white/80">
                        {p.golesFavor}-{p.golesContra}
                      </b>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function ChipsResumen({ partidas }: { partidas: PartidaHistorial[] }) {
  const e = estadisticasHistorial(partidas);
  const chips = [
    `${e.total} partidas`,
    `🏆 ${e.campeon}`,
    `🥈 ${e.plata}`,
    `🥉 ${e.bronce}`,
    `✕ ${e.eliminado}`,
    `${e.porcentajeVictorias}% victorias`,
    `Mejor media ${e.mejorMedia}`,
    `Goles ${e.golesFavor}-${e.golesContra}`,
  ];
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => (
        <span
          key={c}
          className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-black/40 px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-widest text-white/60"
        >
          {c}
        </span>
      ))}
    </div>
  );
}
