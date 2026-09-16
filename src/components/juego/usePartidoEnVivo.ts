"use client";

import { useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "@/game/config";
import {
  bonusDificultad,
  deltaPorRoja,
  dramaDePenal,
  expulsadosDe,
  ovrConPenalizacion,
  resolverTick,
  simularPenales,
} from "@/game/simulacion";
import {
  dosDigitos,
  tarjetasPorJugadorDe,
} from "@/components/juego/partidoUtil";
import type {
  DramaPenal,
  EventoPartido,
  Player,
  PartidoMundial,
  ResultadoPenales,
  SeleccionResumen,
  SquadState,
} from "@/types";

type Etapa = "regulacion" | "prorroga" | "penales" | "terminado";

interface FaseReloj {
  inicio: number;
  duracionMs: number;
  minutoInicial: number;
  minutosSpan: number;
}

export interface UsePartidoEnVivoArgs {
  numero: number;
  squad: SquadState;
  rival: SeleccionResumen;
  xiRival: Record<string, Player | null>;
  ovrUsuarioBase: number;
  ovrRivalBase: number;
  onFinPartido: (resultado: PartidoMundial) => void;
}

/**
 * Motor de simulación en vivo de un partido: 30s reales = 90 minutos, eventos
 * cada `intervaloMs`, prórroga y penales si hace falta. Sin interfaz: lo
 * consumen la vista de escritorio (`PartidoEnVivo`) y la móvil
 * (`PartidoEnVivoMobile`). Arranca una sola vez al montarse.
 */
export function usePartidoEnVivo({
  numero,
  squad,
  rival,
  xiRival,
  ovrUsuarioBase,
  ovrRivalBase,
  onFinPartido,
}: UsePartidoEnVivoArgs) {
  const [etapa, setEtapa] = useState<Etapa>("regulacion");
  const [faseReloj, setFaseReloj] = useState<FaseReloj | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [eventos, setEventos] = useState<EventoPartido[]>([]);
  const [golesUsuario, setGolesUsuario] = useState(0);
  const [golesRival, setGolesRival] = useState(0);
  const [rojasUsuario, setRojasUsuario] = useState(0);
  const [rojasRival, setRojasRival] = useState(0);
  const [penalesEnCurso, setPenalesEnCurso] = useState<ResultadoPenales | null>(
    null,
  );
  const [penalesRevelados, setPenalesRevelados] = useState(0);
  /** null hasta que termina el partido; después, si se ganó o no — se usa
   *  para mostrar la animación de victoria directamente en esta pantalla. */
  const [terminadoGano, setTerminadoGano] = useState<boolean | null>(null);
  const [penalActivo, setPenalActivo] = useState<{
    index: number;
    drama: DramaPenal;
    fase: "anticipa" | "resuelto";
  } | null>(null);

  const [golPulse, setGolPulse] = useState<{
    n: number;
    equipo: "usuario" | "rival" | null;
    jugador: Player | null;
    minuto: number;
  }>({ n: 0, equipo: null, jugador: null, minuto: 0 });

  const [ovrBajaPulse, setOvrBajaPulse] = useState<{
    n: number;
    equipo: "usuario" | "rival" | null;
    /** Cuánto restó exactamente ESA roja (ya no es siempre el mismo número:
     *  ver `deltaPorRoja`). */
    delta: number;
  }>({ n: 0, equipo: null, delta: 0 });
  const rojasPrevRef = useRef({ u: 0, r: 0 });

  useEffect(() => {
    const p = rojasPrevRef.current;
    if (rojasUsuario > p.u) {
      const delta = deltaPorRoja(ovrUsuarioBase, p.u);
      setOvrBajaPulse((s) => ({ n: s.n + 1, equipo: "usuario", delta }));
    } else if (rojasRival > p.r) {
      const delta = deltaPorRoja(ovrRivalBase, p.r);
      setOvrBajaPulse((s) => ({ n: s.n + 1, equipo: "rival", delta }));
    }
    rojasPrevRef.current = { u: rojasUsuario, r: rojasRival };
  }, [rojasUsuario, rojasRival, ovrUsuarioBase, ovrRivalBase]);

  const onFinRef = useRef(onFinPartido);
  useEffect(() => {
    onFinRef.current = onFinPartido;
  });

  useEffect(() => {
    if (!faseReloj || etapa === "penales" || etapa === "terminado") return;
    const id = setInterval(() => setAhora(Date.now()), 200);
    return () => clearInterval(id);
  }, [faseReloj, etapa]);

  useEffect(() => {
    const {
      duracionMs,
      intervaloMs,
      minutosReglamentarios,
      minutosProrroga,
    } = GAME_CONFIG.simulacionPartido;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    let golesU = 0;
    let golesR = 0;
    let rojasU = 0;
    let rojasR = 0;
    let huboProrroga = false;
    const historial: EventoPartido[] = [];

    const correrEtapa = (
      nombre: Etapa,
      minutoInicial: number,
      minutosSpan: number,
      duracionMsEtapa: number,
      alTerminar: () => void,
    ) => {
      setEtapa(nombre);
      setFaseReloj({
        inicio: Date.now(),
        duracionMs: duracionMsEtapa,
        minutoInicial,
        minutosSpan,
      });
      const totalTicks = Math.max(1, Math.round(duracionMsEtapa / intervaloMs));

      const tick = (i: number) => {
        if (cancelado) return;
        const minuto = Math.min(
          minutoInicial + minutosSpan,
          Math.round(minutoInicial + ((i + 1) / totalTicks) * minutosSpan),
        );
        const ovrU = ovrConPenalizacion(ovrUsuarioBase, rojasU);
        const ovrR = ovrConPenalizacion(ovrRivalBase, rojasR);
        const evento = resolverTick(
          minuto,
          ovrU,
          ovrR,
          squad.titulares,
          xiRival,
          historial,
          bonusDificultad(numero),
          { usuario: golesU, rival: golesR },
        );

        if (evento) {
          historial.push(evento);
          const sumarRoja = (equipo: EventoPartido["equipo"]) => {
            if (equipo === "usuario") rojasU += 1;
            else rojasR += 1;
            setRojasUsuario(rojasU);
            setRojasRival(rojasR);
          };
          if (evento.tipo === "gol") {
            if (evento.equipo === "usuario") golesU += 1;
            else golesR += 1;
            setGolesUsuario(golesU);
            setGolesRival(golesR);
            setGolPulse((s) => ({
              n: s.n + 1,
              equipo: evento.equipo,
              jugador: evento.jugador,
              minuto,
            }));
          } else if (evento.tipo === "roja") {
            sumarRoja(evento.equipo);
          } else if (evento.tipo === "amarilla" && evento.jugador) {
            const previas = historial.filter(
              (e) =>
                e.tipo === "amarilla" &&
                e.equipo === evento.equipo &&
                e.jugador?.id === evento.jugador!.id,
            ).length;
            if (previas >= 2) {
              historial.push({
                minuto,
                tipo: "roja",
                equipo: evento.equipo,
                jugador: evento.jugador,
                dobleAmarilla: true,
              });
              sumarRoja(evento.equipo);
            }
          }
          setEventos([...historial]);
        }

        if (i + 1 >= totalTicks) {
          timer = setTimeout(alTerminar, 900);
          return;
        }
        timer = setTimeout(() => tick(i + 1), intervaloMs);
      };

      timer = setTimeout(() => tick(0), intervaloMs);
    };

    const finalizar = (resultadoPenales: ResultadoPenales | null) => {
      setEtapa("terminado");
      const gano = resultadoPenales
        ? resultadoPenales.golesUsuario > resultadoPenales.golesRival
        : golesU > golesR;
      setTerminadoGano(gano);
      const { normal, victoria } = GAME_CONFIG.simulacionPartido.demoraFinMs;
      timer = setTimeout(
        () => {
          onFinRef.current({
            numero,
            rival,
            xiRival,
            ovrUsuarioBase,
            ovrRivalBase,
            ovrUsuarioFinal: ovrConPenalizacion(ovrUsuarioBase, rojasU),
            ovrRivalFinal: ovrConPenalizacion(ovrRivalBase, rojasR),
            eventos: historial,
            golesUsuario: golesU,
            golesRival: golesR,
            prorroga: huboProrroga,
            penales: resultadoPenales,
            gano,
          });
        },
        gano ? victoria : normal,
      );
    };

    const jugarPenales = () => {
      setEtapa("penales");
      const resultado = simularPenales(squad.titulares, xiRival, historial);
      setPenalesEnCurso(resultado);
      for (const r of resultado.rondas) {
        historial.push({
          minuto: 120,
          tipo: "penal",
          equipo: r.equipo,
          jugador: r.jugador,
          penalConvertido: r.acierto,
        });
      }
      const {
        msPausaInicial,
        msAnticipacion,
        msEntrePenales,
        msPausaFinal,
        multiplicadorDrama,
      } = GAME_CONFIG.simulacionPartido.penalesRitmo;
      const pisoTenso = numero >= 6;
      const dramaEfectivo = (idx: number): DramaPenal => {
        const d = dramaDePenal(resultado.rondas, idx);
        if (d === "normal" && pisoTenso) return "tenso";
        return d;
      };

      let i = 0;
      const paso = () => {
        if (cancelado) return;
        if (i >= resultado.rondas.length) {
          timer = setTimeout(() => finalizar(resultado), msPausaFinal);
          return;
        }
        const drama = dramaEfectivo(i);
        const mult = multiplicadorDrama[drama];
        setPenalActivo({ index: i, drama, fase: "anticipa" });
        timer = setTimeout(() => {
          if (cancelado) return;
          setPenalActivo({ index: i, drama, fase: "resuelto" });
          setPenalesRevelados(i + 1);
          i += 1;
          timer = setTimeout(paso, msEntrePenales * mult);
        }, msAnticipacion * mult);
      };
      timer = setTimeout(paso, msPausaInicial);
    };

    const despuesDeProrroga = () => {
      if (golesU !== golesR) return finalizar(null);
      timer = setTimeout(jugarPenales, 1000);
    };

    const despuesDeRegulacion = () => {
      if (golesU !== golesR) return finalizar(null);
      huboProrroga = true;
      timer = setTimeout(() => {
        const duracionProrroga = Math.round(
          (duracionMs * minutosProrroga) / minutosReglamentarios,
        );
        correrEtapa(
          "prorroga",
          minutosReglamentarios,
          minutosProrroga,
          duracionProrroga,
          despuesDeProrroga,
        );
      }, 1000);
    };

    correrEtapa("regulacion", 0, minutosReglamentarios, duracionMs, despuesDeRegulacion);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
    // Arranca una sola vez al montarse; cada partido es una instancia nueva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutoGlobal = faseReloj
    ? Math.max(
        faseReloj.minutoInicial,
        Math.min(
          faseReloj.minutoInicial + faseReloj.minutosSpan,
          faseReloj.minutoInicial +
            ((ahora - faseReloj.inicio) / faseReloj.duracionMs) *
              faseReloj.minutosSpan,
        ),
      )
    : 0;
  const mm = Math.floor(minutoGlobal);
  const ss = Math.floor((minutoGlobal - mm) * 60);
  const denomBarra = etapa === "regulacion" ? 90 : 120;
  const pct = Math.min(100, Math.round((minutoGlobal / denomBarra) * 100));

  const ovrUsuarioActual = ovrConPenalizacion(ovrUsuarioBase, rojasUsuario);
  const ovrRivalActual = ovrConPenalizacion(ovrRivalBase, rojasRival);

  const eventosEnVivo = eventos.filter(
    (e) => e.tipo === "gol" || e.tipo === "amarilla" || e.tipo === "roja",
  );

  const golesUsuarioPorId: Record<string, number> = {};
  const golesRivalPorId: Record<string, number> = {};
  const asistenciasUsuarioPorId: Record<string, number> = {};
  const asistenciasRivalPorId: Record<string, number> = {};
  for (const e of eventos) {
    if (e.tipo !== "gol" || !e.jugador) continue;
    const mapaGoles = e.equipo === "usuario" ? golesUsuarioPorId : golesRivalPorId;
    mapaGoles[e.jugador.id] = (mapaGoles[e.jugador.id] ?? 0) + 1;
    if (!e.asistencia) continue;
    const mapaAsist = e.equipo === "usuario" ? asistenciasUsuarioPorId : asistenciasRivalPorId;
    mapaAsist[e.asistencia.id] = (mapaAsist[e.asistencia.id] ?? 0) + 1;
  }
  const tarjetasUsuarioPorId = tarjetasPorJugadorDe(eventos, "usuario");
  const tarjetasRivalPorId = tarjetasPorJugadorDe(eventos, "rival");
  const expulsadosUsuario = expulsadosDe(eventos, "usuario");
  const expulsadosRival = expulsadosDe(eventos, "rival");

  const bajaUsuario = ovrBajaPulse.equipo === "usuario" && ovrBajaPulse.n > 0;
  const bajaRival = ovrBajaPulse.equipo === "rival" && ovrBajaPulse.n > 0;

  const penalesRevel = penalesEnCurso
    ? penalesEnCurso.rondas.slice(0, penalesRevelados)
    : [];
  const penalesMios = penalesRevel.filter((r) => r.equipo === "usuario");
  const penalesRival = penalesRevel.filter((r) => r.equipo === "rival");

  const etiquetaEtapa =
    etapa === "regulacion"
      ? `${dosDigitos(mm)}:${dosDigitos(ss)}`
      : etapa === "prorroga"
        ? `Prórroga ${dosDigitos(mm)}:${dosDigitos(ss)}`
        : etapa === "penales"
          ? "Penales"
          : "Final";

  return {
    etapa,
    eventos,
    golesUsuario,
    golesRival,
    penalesEnCurso,
    penalActivo,
    golPulse,
    ovrBajaPulse,
    mm,
    ss,
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
  };
}
