"use client";

import { HistorialPartidas } from "@/components/HistorialPartidas";
import { slotsDeFormacion } from "@/game/formations";
import type { Formation } from "@/types";

interface FormationPickerProps {
  opciones: Formation[];
  onElegir: (f: Formation) => void;
}

export function FormationPicker({ opciones, onElegir }: FormationPickerProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-start gap-10 p-6 py-14">
      <div className="text-center">
        <h1 className="text-neon font-display text-4xl font-bold uppercase tracking-[0.28em]">
          Elegí formación
        </h1>
        <p className="mt-3 font-display text-sm uppercase tracking-widest text-white/45">
          No se puede cambiar durante la partida.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
        {opciones.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onElegir(f)}
            style={{ animationDelay: `${i * 90}ms` }}
            className="card-in sheen group flex flex-col items-center gap-4 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#0a2318] to-[#06140d] p-6 transition hover:-translate-y-1 hover:border-emerald-400/70 hover:shadow-[0_0_30px_-6px_rgba(16,185,129,0.6)]"
          >
            <span className="text-neon font-display text-3xl font-bold tracking-[0.15em]">
              {f.id}
            </span>
            <MiniCampo formation={f} />
            <span className="font-display text-xs uppercase tracking-wider text-white/55">
              {f.defensa} DEF · {f.medio} MED · {f.delantero} DEL
            </span>
          </button>
        ))}
      </div>

      <HistorialPartidas />
    </div>
  );
}

function MiniCampo({ formation }: { formation: Formation }) {
  const slots = slotsDeFormacion(formation);
  return (
    <div className="pitch-stripes relative h-44 w-28 overflow-hidden rounded-lg border border-emerald-400/30 bg-[radial-gradient(circle_at_50%_30%,#12592f,#0a2a17_75%)]">
      {slots.map((s) => (
        <span
          key={s.id}
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c6ff3d] shadow-[0_0_10px_rgba(198,255,61,0.9)] transition group-hover:bg-[#ffd23f] group-hover:shadow-[0_0_12px_rgba(255,210,63,0.9)]"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
    </div>
  );
}
