"use client";

import { Pitch } from "@/components/Pitch";
import { VictoriaCelebracion } from "@/components/VictoriaCelebracion";
import { EVENTO_ICONO } from "@/components/juego/partidoUtil";
import { usePartidoEnVivo } from "@/components/juego/usePartidoEnVivo";
import { nivelVictoria, squadRival } from "@/game/mundial";
import type {
  Player,
  PartidoMundial,
  RondaPenal,
  SeleccionResumen,
  SquadState,
} from "@/types";

export { EVENTO_ICONO, tarjetasPorJugadorDe } from "@/components/juego/partidoUtil";
export type { TarjetasJugador } from "@/components/juego/partidoUtil";

interface PartidoEnVivoProps {
  numero: number;
  /** Año del Mundial en curso: se muestra junto al nombre del rival. */
  mundial: number;
  squad: SquadState;
  rival: SeleccionResumen;
  xiRival: Record<string, Player | null>;
  ovrUsuarioBase: number;
  ovrRivalBase: number;
  /** Se llama una vez, cuando el partido termina de jugarse. */
  onFinPartido: (resultado: PartidoMundial) => void;
}

/**
 * Simula un partido en vivo: 30s reales = 90 minutos, con eventos apareciendo
 * cada `intervaloMs`. Si termina empatado, sigue con prórroga y, si hace
 * falta, penales (al azar). Arranca solo al montarse; avisa el resultado
 * final una sola vez por `onFinPartido`.
 */
export function PartidoEnVivo({
  numero,
  mundial,
  squad,
  rival,
  xiRival,
  ovrUsuarioBase,
  ovrRivalBase,
  onFinPartido,
}: PartidoEnVivoProps) {
  const {
    etapa,
    golesUsuario,
    golesRival,
    penalesEnCurso,
    penalActivo,
    golPulse,
    ovrBajaPulse,
    denomBarra,
    pct,
    ovrUsuarioActual,
    ovrRivalActual,
    eventosEnVivo,
    golesUsuarioPorId,
    golesRivalPorId,
    asistenciasUsuarioPorId,
    asistenciasRivalPorId,
    tarjetasUsuarioPorId,
    tarjetasRivalPorId,
    expulsadosUsuario,
    expulsadosRival,
    bajaUsuario,
    bajaRival,
    penalesMios,
    penalesRival,
    etiquetaEtapa,
    terminadoGano,
  } = usePartidoEnVivo({
    numero,
    squad,
    rival,
    xiRival,
    ovrUsuarioBase,
    ovrRivalBase,
    onFinPartido,
  });

  return (
    <div className="relative w-full space-y-3">
      {/* Victoria: se muestra ACÁ, directamente sobre la pantalla del
          partido, apenas termina — el resumen (pantalla siguiente) ya no la
          muestra. Cubre toda la pantalla del partido mientras dura. */}
      {terminadoGano && (
        <div className="pointer-events-none absolute inset-0 z-[70] flex items-center justify-center bg-black/55">
          <VictoriaCelebracion
            nivel={nivelVictoria(numero)}
            titulo="¡VICTORIA!"
            className="h-full w-full"
          />
        </div>
      )}

      <div className="text-center font-display text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
        Partido {numero} de 7
      </div>

      {/* Marcador. En cada gol la caja y el número pegan un salto con destello,
          en el color del equipo que marcó (key fuerza el remontaje). */}
      <div className="relative">
        {golPulse.n > 0 && (
          <div
            key={`gol-ovl-${golPulse.n}`}
            style={
              {
                "--gol-color":
                  golPulse.equipo === "rival" ? "#ffd23f" : "#c6ff3d",
              } as React.CSSProperties
            }
            className="gol-overlay pointer-events-none absolute left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          >
            <div className="gol-overlay-titulo text-6xl">¡GOL!</div>
            <div className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/90">
              {golPulse.minuto}&apos; ·{" "}
              {golPulse.equipo === "rival"
                ? `${rival.bandera} ${rival.pais}`
                : "Tu equipo"}
            </div>
            {golPulse.jugador && (
              <div className="mt-0.5 font-display text-lg font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                {golPulse.jugador.bandera} {golPulse.jugador.nombre}
              </div>
            )}
          </div>
        )}
        {(bajaUsuario || bajaRival) && (
          <div
            key={`exp-banner-${ovrBajaPulse.n}`}
            className="expulsion-banner pointer-events-none absolute -top-3 left-1/2 z-40 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border-2 border-[#ff2d2d] bg-[#dc2626] px-4 py-1.5 font-display text-sm font-black uppercase tracking-widest text-white shadow-[0_0_28px_-2px_rgba(220,38,38,0.95)]"
          >
            <span className="mr-1.5 align-middle text-base">🟥</span>
            Expulsión ·{" "}
            {bajaUsuario ? "Tu equipo" : `${rival.bandera} ${rival.pais}`} pierde
            nivel −{ovrBajaPulse.delta} OVR
          </div>
        )}
        <div
          key={`marcador-${golPulse.n}`}
          style={
            {
              "--gol-color": golPulse.equipo === "rival" ? "#ffd23f" : "#c6ff3d",
            } as React.CSSProperties
          }
          className={`flex items-center justify-center gap-4 rounded-2xl border-2 border-white/10 bg-black/40 py-3 ${
            golPulse.n > 0 ? "gol-caja" : ""
          }`}
        >
          <span className="font-display text-sm font-bold uppercase tracking-widest text-emerald-300">
            Tu equipo
          </span>
          <span
            className={`font-display text-3xl font-bold tabular-nums text-white ${
              golPulse.n > 0 ? "gol-marcador" : ""
            }`}
          >
            {golesUsuario} - {golesRival}
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-[#ffd23f]">
            {rival.bandera} {rival.pais} {mundial}
          </span>
        </div>
      </div>

      {/* Definición por penales: arriba, integrada con el marcador. Tu equipo
          arriba, el rival abajo, cada uno con sus penales (✅ / ❌). */}
      {penalesEnCurso && (
        <div className="mx-auto max-w-md space-y-2 rounded-xl border border-[#ffd23f]/50 bg-[#ffd23f]/5 p-3">
          <div className="text-center font-display text-[10px] font-bold uppercase tracking-widest text-[#ffd23f]">
            Definición por penales
          </div>
          {penalActivo &&
            (() => {
              const ronda = penalesEnCurso.rondas[penalActivo.index];
              if (!ronda) return null;
              const esUsuario = ronda.equipo === "usuario";
              const etiquetaFase =
                penalActivo.drama === "decisivo"
                  ? "Penal decisivo"
                  : penalActivo.drama === "tenso"
                    ? "Penal clave"
                    : "Va a patear";
              return (
                <div
                  key={`kicker-${penalActivo.index}`}
                  className={`penal-kicker ${penalActivo.drama} relative flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-lg border-2 px-3 py-2 ${
                    esUsuario
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-[#ffd23f]/60 bg-[#ffd23f]/10"
                  }`}
                >
                  {penalActivo.drama === "decisivo" && (
                    <span className="penal-kicker-pulso pointer-events-none absolute inset-0 rounded-lg" />
                  )}
                  <span
                    className={`font-display text-[10px] font-bold uppercase tracking-widest ${
                      esUsuario ? "text-emerald-300" : "text-[#ffd23f]"
                    }`}
                  >
                    {esUsuario ? "Tu equipo" : `${rival.bandera} ${rival.pais}`}
                  </span>
                  <span
                    className={`font-display font-black text-white ${
                      penalActivo.drama === "decisivo" ? "text-lg" : "text-sm"
                    }`}
                  >
                    {ronda.jugador
                      ? `${ronda.jugador.bandera} ${ronda.jugador.nombre}`
                      : "—"}
                  </span>
                  {penalActivo.fase === "anticipa" ? (
                    <span
                      className={`font-display text-[10px] uppercase tracking-widest ${
                        penalActivo.drama === "decisivo"
                          ? "font-black text-[#ff6b6b]"
                          : "text-white/50"
                      }`}
                    >
                      {etiquetaFase}
                    </span>
                  ) : (
                    <span className="text-base leading-none">
                      {ronda.acierto ? "✅" : "❌"}
                    </span>
                  )}
                </div>
              );
            })()}
          <SectorPenales
            titulo="Tu equipo"
            colorTitulo="text-emerald-300"
            colorTiro="bg-emerald-500/20 text-emerald-300"
            tiros={penalesMios}
          />
          <div className="border-t border-white/10" />
          <SectorPenales
            titulo={`${rival.bandera} ${rival.pais}`}
            colorTitulo="text-[#ffd23f]"
            colorTiro="bg-[#ffd23f]/20 text-[#ffd23f]"
            tiros={penalesRival}
          />
        </div>
      )}

      {/* Historial en vivo, junto al marcador: goles y tarjetas, cada uno del
          lado del equipo correspondiente. El historial completo queda igual
          para la pantalla de resumen al terminar el partido. */}
      {eventosEnVivo.length > 0 && (
        <div className="flex max-h-24 items-start justify-between gap-3 overflow-y-auto px-1">
          <div className="flex flex-1 flex-col items-start gap-1">
            {eventosEnVivo
              .filter((e) => e.equipo === "usuario")
              .map((e, i) => (
                <span
                  key={i}
                  className="card-in flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300"
                >
                  <span className="shrink-0 font-display text-white/40">{e.minuto}&apos;</span>
                  <span className="shrink-0">{EVENTO_ICONO[e.tipo]}</span>
                  <span className="truncate font-semibold">
                    {e.jugador ? e.jugador.nombre : "Jugada"}
                  </span>
                </span>
              ))}
          </div>
          <div className="flex flex-1 flex-col items-end gap-1">
            {eventosEnVivo
              .filter((e) => e.equipo === "rival")
              .map((e, i) => (
                <span
                  key={i}
                  className="card-in flex flex-row-reverse items-center gap-1.5 rounded-full bg-[#ffd23f]/10 px-2 py-0.5 text-[11px] text-[#ffd23f]"
                >
                  <span className="shrink-0 font-display text-white/40">{e.minuto}&apos;</span>
                  <span className="shrink-0">{EVENTO_ICONO[e.tipo]}</span>
                  <span className="truncate font-semibold">
                    {e.jugador ? e.jugador.nombre : "Jugada"}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Línea de tiempo continua + reloj mm:ss */}
      <div>
        <div className="mb-1 flex items-center justify-between font-display text-[10px] uppercase tracking-widest text-white/40">
          <span>0&apos;</span>
          <span
            className={
              etapa === "terminado" ? "text-white" : "animate-pulse text-emerald-300"
            }
          >
            {etiquetaEtapa}
          </span>
          <span>{denomBarra}&apos;</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#ffd23f] transition-all duration-[200ms] ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Formaciones enfrentadas: tu equipo vs el rival, con el OVR de cada uno */}
      <div className="flex items-start justify-center gap-3 overflow-x-auto">
        <div className="flex w-[560px] shrink-0 flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-emerald-300">
              Tu equipo
            </span>
            <span
              key={`ovr-u-${bajaUsuario ? ovrBajaPulse.n : 0}`}
              className={`relative font-display text-2xl font-black tabular-nums text-[#c6ff3d] ${
                bajaUsuario ? "ovr-baja" : ""
              }`}
            >
              {ovrUsuarioActual}
              {bajaUsuario && (
                <span className="ovr-delta absolute -right-7 -top-1 font-display text-sm font-black text-[#ff2d2d]">
                  −{ovrBajaPulse.delta}
                </span>
              )}
            </span>
          </div>
          <span className="font-display text-[10px] uppercase tracking-widest text-white/40">
            {squad.formation.id}
          </span>
          <Pitch
            squad={squad}
            seleccionable={null}
            seleccionadoSlotId={null}
            onSlot={() => {}}
            soloLectura
            chico
            ocultarBanco
            golesPorJugador={golesUsuarioPorId}
            asistenciasPorJugador={asistenciasUsuarioPorId}
            tarjetasPorJugador={tarjetasUsuarioPorId}
            expulsadosPorJugador={expulsadosUsuario}
          />
        </div>

        <span className="mt-10 shrink-0 self-center rounded-full border-2 border-white/25 bg-black/60 px-3 py-2 font-display text-base font-black uppercase tracking-widest text-white shadow-[0_0_18px_-4px_rgba(255,255,255,0.35)]">
          VS
        </span>

        <div className="flex w-[560px] shrink-0 flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-[#ffd23f]">
              {rival.bandera} {rival.pais} {mundial}
            </span>
            <span
              key={`ovr-r-${bajaRival ? ovrBajaPulse.n : 0}`}
              className={`relative font-display text-2xl font-black tabular-nums text-[#ffd23f] ${
                bajaRival ? "ovr-baja" : ""
              }`}
            >
              {ovrRivalActual}
              {bajaRival && (
                <span className="ovr-delta absolute -right-7 -top-1 font-display text-sm font-black text-[#ff2d2d]">
                  −{ovrBajaPulse.delta}
                </span>
              )}
            </span>
          </div>
          <span className="font-display text-[10px] uppercase tracking-widest text-white/40">
            4-3-3
          </span>
          <Pitch
            squad={squadRival(xiRival)}
            seleccionable={null}
            seleccionadoSlotId={null}
            onSlot={() => {}}
            soloLectura
            chico
            ocultarBanco
            golesPorJugador={golesRivalPorId}
            asistenciasPorJugador={asistenciasRivalPorId}
            tarjetasPorJugador={tarjetasRivalPorId}
            expulsadosPorJugador={expulsadosRival}
          />
        </div>
      </div>
    </div>
  );
}

/** Un sector de la tanda de penales: el título del equipo y sus tiros
 *  (✅ convertido / ❌ fallado), solo los de ese equipo. */
function SectorPenales({
  titulo,
  colorTitulo,
  colorTiro,
  tiros,
}: {
  titulo: string;
  colorTitulo: string;
  colorTiro: string;
  tiros: RondaPenal[];
}) {
  const convertidos = tiros.filter((t) => t.acierto).length;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`font-display text-[10px] font-bold uppercase tracking-widest ${colorTitulo}`}
        >
          {titulo}
        </span>
        <span className="font-display text-sm font-black tabular-nums text-white">
          {convertidos}
        </span>
      </div>
      <div className="flex min-h-[28px] flex-wrap gap-1">
        {tiros.map((t, i) => (
          <span
            key={i}
            className={`card-in flex h-7 w-7 items-center justify-center rounded-full text-sm ${colorTiro}`}
          >
            {t.acierto ? "✅" : "❌"}
          </span>
        ))}
      </div>
    </div>
  );
}
