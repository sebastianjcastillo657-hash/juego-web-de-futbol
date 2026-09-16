import type { EstadisticaJugador } from "@/game/statsMundial";

const COLOR_PUESTO = ["text-[#ffd23f]", "text-zinc-300", "text-amber-600"];

interface RankingTorneoProps {
  titulo: string;
  icono: string;
  /** Ya filtrados y ordenados (ver `rankingGoleadores` y compañía). */
  stats: EstadisticaJugador[];
  campo: "goles" | "asistencias" | "amarillas" | "rojas";
  /** Cuántos puestos mostrar como máximo (el resto no entra: sigue siendo un
   *  ranking de los MÁS destacados, no una lista completa interminable). */
  tope?: number;
}

/**
 * Un ranking del torneo: nombre + país + puesto + cantidad, todo en tamaño
 * grande para que se lea de un vistazo (a diferencia de las cartas de la
 * cancha, acá el objetivo es la tabla de estadísticas en sí). Compartido por
 * escritorio y móvil.
 */
export function RankingTorneo({ titulo, icono, stats, campo, tope = 8 }: RankingTorneoProps) {
  const visibles = stats.slice(0, tope);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-3 flex items-center justify-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white/70">
        <span className="text-xl">{icono}</span>
        {titulo}
      </div>
      {visibles.length === 0 ? (
        <p className="py-2 text-center text-sm text-white/35">Todavía nadie.</p>
      ) : (
        <ol className="space-y-1.5">
          {visibles.map((s, i) => (
            <li
              key={s.jugador.id}
              className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2"
            >
              <span
                className={`w-6 shrink-0 text-center font-display text-lg font-black ${
                  COLOR_PUESTO[i] ?? "text-white/40"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-bold text-white sm:text-lg">
                  {s.jugador.bandera} {s.jugador.nombre}
                </span>
                <span
                  className={`block text-[11px] font-semibold uppercase tracking-wide ${
                    s.esUsuario ? "text-emerald-300" : "text-white/40"
                  }`}
                >
                  {s.esUsuario ? "Tu equipo" : s.jugador.seleccion}
                </span>
              </span>
              <span className="shrink-0 font-display text-2xl font-black tabular-nums text-[#c6ff3d]">
                {s[campo]}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
