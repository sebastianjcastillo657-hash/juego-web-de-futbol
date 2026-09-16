"use client";

import { HistorialMobile } from "@/components/mobile/HistorialMobile";
import { slotsDeFormacion } from "@/game/formations";
import type { Formation } from "@/types";

interface FormacionMobileProps {
  opciones: Formation[];
  onElegir: (f: Formation) => void;
}

/** Pantalla móvil de elección de formación (ref. pantalla 3). */
export function FormacionMobile({ opciones, onElegir }: FormacionMobileProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-neon font-display text-2xl font-bold uppercase tracking-[0.2em]">
          Elegí formación
        </h1>
        <p className="mt-2 font-display text-[10px] uppercase tracking-widest text-white/45">
          No se puede cambiar durante la partida
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {opciones.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onElegir(f)}
            style={{ animationDelay: `${i * 80}ms` }}
            className="card-in sheen group flex items-center gap-4 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#0a2318] to-[#06140d] p-4 text-left transition active:scale-[0.98]"
          >
            <MiniCancha formation={f} />
            <div className="min-w-0 flex-1">
              <div className="text-neon font-display text-2xl font-bold tracking-[0.14em]">
                {f.id}
              </div>
              <div className="mt-1 font-display text-[11px] uppercase tracking-wider text-white/55">
                {f.defensa} DEF · {f.medio} MED · {f.delantero} DEL
              </div>
            </div>
            <span className="font-display text-lg text-white/25 transition group-active:text-emerald-300">
              ›
            </span>
          </button>
        ))}
      </div>

      <HistorialMobile />
    </div>
  );
}

function MiniCancha({ formation }: { formation: Formation }) {
  const slots = slotsDeFormacion(formation);
  return (
    <div className="pitch-stripes relative h-28 w-16 shrink-0 overflow-hidden rounded-lg border border-emerald-400/30 bg-[radial-gradient(circle_at_50%_30%,#12592f,#0a2a17_75%)]">
      {slots.map((s) => (
        <span
          key={s.id}
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c6ff3d] shadow-[0_0_8px_rgba(198,255,61,0.9)] transition group-active:bg-[#ffd23f]"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
    </div>
  );
}
