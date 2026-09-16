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
  eliminado: { emoji: "❌", label: "Eliminado", color: "text-zinc-400" },
};

function fmtFecha(ms: number): string {
  return new Date(ms).toLocaleDateString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/**
 * Historial persistente de partidas terminadas. Se carga de localStorage al
 * montar (por eso es cliente y espera a estar montado para no chocar con el
 * render del servidor).
 */
export function HistorialPartidas() {
  const [partidas, setPartidas] = useState<PartidaHistorial[] | null>(null);

  useEffect(() => {
    setPartidas(cargarHistorial());
  }, []);

  if (partidas === null) return null;

  return (
    <section className="w-full max-w-3xl">
      <h2 className="text-center font-display text-lg font-bold uppercase tracking-[0.25em] text-white/80">
        Historial de partidas
      </h2>

      {partidas.length === 0 ? (
        <p className="mt-3 text-center text-sm text-white/40">
          Todavía no terminaste ninguna partida. Jugá un Mundial completo y va a
          aparecer acá.
        </p>
      ) : (
        <>
          <Resumen partidas={partidas} />

          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/30">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0a1c13] font-display uppercase tracking-widest text-white/40">
                <tr>
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-2 py-2 font-semibold">Mundial</th>
                  <th className="px-2 py-2 font-semibold">Form.</th>
                  <th className="px-2 py-2 font-semibold">Resultado</th>
                  <th className="px-2 py-2 text-center font-semibold">G/J</th>
                  <th className="px-2 py-2 text-center font-semibold">Media</th>
                  <th className="px-3 py-2 text-center font-semibold">Goles</th>
                </tr>
              </thead>
              <tbody>
                {partidas.map((p) => {
                  const l = LOGRO_UI[p.logro];
                  return (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="whitespace-nowrap px-3 py-1.5 text-white/50">
                        {fmtFecha(p.fecha)}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums text-white/70">
                        {p.mundial}
                      </td>
                      <td className="px-2 py-1.5 text-white/70">{p.formacion}</td>
                      <td className={`px-2 py-1.5 font-semibold ${l.color}`}>
                        {l.emoji} {l.label}
                      </td>
                      <td className="px-2 py-1.5 text-center tabular-nums text-white/70">
                        {p.partidosGanados}/{p.partidosJugados}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold tabular-nums text-[#c6ff3d]">
                        {p.mediaEquipo}
                      </td>
                      <td className="px-3 py-1.5 text-center tabular-nums text-white/60">
                        {p.golesFavor}-{p.golesContra}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Resumen({ partidas }: { partidas: PartidaHistorial[] }) {
  const e = estadisticasHistorial(partidas);
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2 font-display text-[11px] uppercase tracking-widest">
      <Chip>{e.total} partidas</Chip>
      <Chip>🏆 {e.campeon}</Chip>
      <Chip>🥈 {e.plata}</Chip>
      <Chip>🥉 {e.bronce}</Chip>
      <Chip>❌ {e.eliminado}</Chip>
      <Chip>{e.porcentajeVictorias}% victorias</Chip>
      <Chip>Mejor media {e.mejorMedia}</Chip>
      <Chip>
        Goles {e.golesFavor}-{e.golesContra}
      </Chip>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/60">
      {children}
    </span>
  );
}
