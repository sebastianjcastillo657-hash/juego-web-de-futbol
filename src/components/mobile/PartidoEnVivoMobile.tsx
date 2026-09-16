"use client";

import { useState } from "react";
import { VictoriaCelebracion } from "@/components/VictoriaCelebracion";
import { EVENTO_ICONO } from "@/components/juego/partidoUtil";
import { usePartidoEnVivo } from "@/components/juego/usePartidoEnVivo";
import { PitchMobile } from "@/components/mobile/PitchMobile";
import { nivelVictoria, squadRival } from "@/game/mundial";
import type {
  Player,
  PartidoMundial,
  RondaPenal,
  SeleccionResumen,
  SquadState,
} from "@/types";

interface Props {
  numero: number;
  /** Año del Mundial en curso: se muestra junto al nombre del rival. */
  mundial: number;
  squad: SquadState;
  rival: SeleccionResumen;
  xiRival: Record<string, Player | null>;
  ovrUsuarioBase: number;
  ovrRivalBase: number;
  onFinPartido: (resultado: PartidoMundial) => void;
}

/** Partido en vivo en móvil (ref. pantalla 5): barra de marcador sticky,
 *  toggle Tu equipo / Rival y una sola cancha a la vez. Mismo motor. */
export function PartidoEnVivoMobile(props: Props) {
  const { mundial, squad, rival, xiRival } = props;
  const v = usePartidoEnVivo(props);
  const [vista, setVista] = useState<"usuario" | "rival">("usuario");

  const golColor = v.golPulse.equipo === "rival" ? "#ffd23f" : "#c6ff3d";

  return (
    <div className="relative flex flex-col gap-3">
      {/* Victoria: se muestra ACÁ, directamente sobre la pantalla del
          partido, apenas termina — el resumen (pantalla siguiente) ya no la
          muestra. */}
      {v.terminadoGano && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-black/55">
          <VictoriaCelebracion
            nivel={nivelVictoria(props.numero)}
            titulo="¡VICTORIA!"
            className="h-full w-full"
          />
        </div>
      )}

      {/* Barra de marcador sticky */}
      <div
        className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#081410]/95 px-4 pb-2 pt-3 backdrop-blur"
        style={{ "--gol-color": golColor } as React.CSSProperties}
      >
        <div className="relative">
          {v.golPulse.n > 0 && (
            <div
              key={`gol-ovl-${v.golPulse.n}`}
              className="gol-overlay pointer-events-none absolute left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            >
              <div className="gol-overlay-titulo text-5xl">¡GOL!</div>
              <div className="mt-0.5 font-display text-[10px] font-bold uppercase tracking-[0.3em] text-white/90">
                {v.golPulse.minuto}&apos; ·{" "}
                {v.golPulse.equipo === "rival"
                  ? `${rival.bandera} ${rival.pais}`
                  : "Tu equipo"}
              </div>
              {v.golPulse.jugador && (
                <div className="font-display text-sm font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {v.golPulse.jugador.bandera} {v.golPulse.jugador.nombre}
                </div>
              )}
            </div>
          )}
          {(v.bajaUsuario || v.bajaRival) && (
            <div
              key={`exp-banner-${v.ovrBajaPulse.n}`}
              className="expulsion-banner pointer-events-none absolute -top-2 left-1/2 z-40 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border-2 border-[#ff2d2d] bg-[#dc2626] px-3 py-1 font-display text-[11px] font-black uppercase tracking-widest text-white shadow-[0_0_28px_-2px_rgba(220,38,38,0.95)]"
            >
              🟥 Expulsión ·{" "}
              {v.bajaUsuario ? "Tu equipo" : rival.pais} −{v.ovrBajaPulse.delta} OVR
            </div>
          )}

          <div
            key={`marcador-${v.golPulse.n}`}
            className={`flex items-center justify-between gap-2 rounded-xl border-2 border-white/10 bg-black/40 px-3 py-2 ${
              v.golPulse.n > 0 ? "gol-caja" : ""
            }`}
          >
            <TeamTag
              label="Tu equipo"
              ovr={v.ovrUsuarioActual}
              color="text-emerald-300"
              ovrColor="text-[#c6ff3d]"
              baja={v.bajaUsuario}
              n={v.ovrBajaPulse.n}
              delta={v.ovrBajaPulse.delta}
            />
            <span
              className={`font-display text-2xl font-bold tabular-nums text-white ${
                v.golPulse.n > 0 ? "gol-marcador" : ""
              }`}
            >
              {v.golesUsuario} - {v.golesRival}
            </span>
            <TeamTag
              label={`${rival.bandera} ${rival.pais} ${mundial}`}
              ovr={v.ovrRivalActual}
              color="text-[#ffd23f]"
              ovrColor="text-[#ffd23f]"
              baja={v.bajaRival}
              n={v.ovrBajaPulse.n}
              delta={v.ovrBajaPulse.delta}
              alineadoDerecha
            />
          </div>
        </div>

        {/* Reloj + barra de tiempo */}
        <div className="mt-1.5">
          <div className="mb-0.5 flex items-center justify-between font-display text-[9px] uppercase tracking-widest text-white/40">
            <span>0&apos;</span>
            <span
              className={
                v.etapa === "terminado"
                  ? "text-white"
                  : "animate-pulse text-emerald-300"
              }
            >
              {v.etiquetaEtapa}
            </span>
            <span>{v.denomBarra}&apos;</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#ffd23f] transition-all duration-[200ms] ease-linear"
              style={{ width: `${v.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Definición por penales */}
      {v.penalesEnCurso && (
        <div className="space-y-2 rounded-xl border border-[#ffd23f]/50 bg-[#ffd23f]/5 p-3">
          <div className="text-center font-display text-[10px] font-bold uppercase tracking-widest text-[#ffd23f]">
            Definición por penales
          </div>
          {v.penalActivo &&
            (() => {
              const ronda = v.penalesEnCurso!.rondas[v.penalActivo!.index];
              if (!ronda) return null;
              const esUsuario = ronda.equipo === "usuario";
              const etiquetaFase =
                v.penalActivo!.drama === "decisivo"
                  ? "Penal decisivo"
                  : v.penalActivo!.drama === "tenso"
                    ? "Penal clave"
                    : "Va a patear";
              return (
                <div
                  key={`kicker-${v.penalActivo!.index}`}
                  className={`penal-kicker ${v.penalActivo!.drama} relative flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-lg border-2 px-3 py-2 ${
                    esUsuario
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-[#ffd23f]/60 bg-[#ffd23f]/10"
                  }`}
                >
                  {v.penalActivo!.drama === "decisivo" && (
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
                      v.penalActivo!.drama === "decisivo" ? "text-lg" : "text-sm"
                    }`}
                  >
                    {ronda.jugador
                      ? `${ronda.jugador.bandera} ${ronda.jugador.nombre}`
                      : "—"}
                  </span>
                  {v.penalActivo!.fase === "anticipa" ? (
                    <span
                      className={`font-display text-[10px] uppercase tracking-widest ${
                        v.penalActivo!.drama === "decisivo"
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
          <SectorPenalesMini
            titulo="Tu equipo"
            color="text-emerald-300"
            tiros={v.penalesMios}
          />
          <div className="border-t border-white/10" />
          <SectorPenalesMini
            titulo={`${rival.bandera} ${rival.pais}`}
            color="text-[#ffd23f]"
            tiros={v.penalesRival}
          />
        </div>
      )}

      {/* Historial en vivo */}
      {v.eventosEnVivo.length > 0 && (
        <div className="flex max-h-24 items-start justify-between gap-2 overflow-y-auto">
          <div className="flex flex-1 flex-col items-start gap-1">
            {v.eventosEnVivo
              .filter((e) => e.equipo === "usuario")
              .map((e, i) => (
                <span
                  key={i}
                  className="card-in flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300"
                >
                  <span className="shrink-0 text-white/40">{e.minuto}&apos;</span>
                  <span className="shrink-0">{EVENTO_ICONO[e.tipo]}</span>
                  <span className="truncate font-semibold">
                    {e.jugador ? e.jugador.nombre : "Jugada"}
                  </span>
                </span>
              ))}
          </div>
          <div className="flex flex-1 flex-col items-end gap-1">
            {v.eventosEnVivo
              .filter((e) => e.equipo === "rival")
              .map((e, i) => (
                <span
                  key={i}
                  className="card-in flex flex-row-reverse items-center gap-1 rounded-full bg-[#ffd23f]/10 px-2 py-0.5 text-[10px] text-[#ffd23f]"
                >
                  <span className="shrink-0 text-white/40">{e.minuto}&apos;</span>
                  <span className="shrink-0">{EVENTO_ICONO[e.tipo]}</span>
                  <span className="truncate font-semibold">
                    {e.jugador ? e.jugador.nombre : "Jugada"}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Toggle de cancha */}
      <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
        <button
          type="button"
          onClick={() => setVista("usuario")}
          className={`flex-1 rounded-lg py-2 font-display text-[11px] font-bold uppercase tracking-widest transition ${
            vista === "usuario" ? "bg-[#c6ff3d] text-black" : "text-white/50"
          }`}
        >
          Tu equipo · {v.ovrUsuarioActual}
        </button>
        <button
          type="button"
          onClick={() => setVista("rival")}
          className={`flex-1 rounded-lg py-2 font-display text-[11px] font-bold uppercase tracking-widest transition ${
            vista === "rival" ? "bg-[#ffd23f] text-black" : "text-white/50"
          }`}
        >
          {rival.pais} · {v.ovrRivalActual}
        </button>
      </div>

      {vista === "usuario" ? (
        <PitchMobile
          squad={squad}
          seleccionable={null}
          seleccionadoSlotId={null}
          onSlot={() => {}}
          soloLectura
          golesPorJugador={v.golesUsuarioPorId}
          asistenciasPorJugador={v.asistenciasUsuarioPorId}
          tarjetasPorJugador={v.tarjetasUsuarioPorId}
          expulsadosPorJugador={v.expulsadosUsuario}
        />
      ) : (
        <PitchMobile
          squad={squadRival(xiRival)}
          seleccionable={null}
          seleccionadoSlotId={null}
          onSlot={() => {}}
          soloLectura
          golesPorJugador={v.golesRivalPorId}
          asistenciasPorJugador={v.asistenciasRivalPorId}
          tarjetasPorJugador={v.tarjetasRivalPorId}
          expulsadosPorJugador={v.expulsadosRival}
        />
      )}
    </div>
  );
}

function TeamTag({
  label,
  ovr,
  color,
  ovrColor,
  baja,
  n,
  delta,
  alineadoDerecha = false,
}: {
  label: string;
  ovr: number;
  color: string;
  ovrColor: string;
  baja: boolean;
  n: number;
  delta: number;
  alineadoDerecha?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col ${alineadoDerecha ? "items-end" : "items-start"}`}
    >
      <span
        className={`truncate font-display text-[10px] font-bold uppercase tracking-widest ${color}`}
      >
        {label}
      </span>
      <span
        key={`ovr-${label}-${baja ? n : 0}`}
        className={`relative font-display text-base font-black tabular-nums ${ovrColor} ${
          baja ? "ovr-baja" : ""
        }`}
      >
        {ovr}
        {baja && (
          <span className="ovr-delta absolute -right-6 -top-1 font-display text-[11px] font-black text-[#ff2d2d]">
            −{delta}
          </span>
        )}
      </span>
    </div>
  );
}

function SectorPenalesMini({
  titulo,
  color,
  tiros,
}: {
  titulo: string;
  color: string;
  tiros: RondaPenal[];
}) {
  const convertidos = tiros.filter((t) => t.acierto).length;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`font-display text-[10px] font-bold uppercase tracking-widest ${color}`}
        >
          {titulo}
        </span>
        <span className="font-display text-sm font-black tabular-nums text-white">
          {convertidos}
        </span>
      </div>
      <div className="flex min-h-[26px] flex-wrap gap-1">
        {tiros.map((t, i) => (
          <span
            key={i}
            className="card-in flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-sm"
          >
            {t.acierto ? "✅" : "❌"}
          </span>
        ))}
      </div>
    </div>
  );
}
