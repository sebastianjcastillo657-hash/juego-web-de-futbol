"use client";

import { useEffect, useRef, useState } from "react";
import { BanderaPais } from "@/components/BanderaPais";
import { PlayerSilhouette } from "@/components/PlayerSilhouette";
import { SoccerBall } from "@/components/SoccerBall";
import { SoccerBoot } from "@/components/SoccerBoot";
import {
  etiquetaRareza,
  glowDeNivelCarta,
  nivelCarta,
  type NivelCarta,
} from "@/game/rarity";
import type { Player } from "@/types";

// Identidad visual por MEDIA. Los escalones se perciben de inmediato, sin leer
// el número:
//   <80      marrón
//   80-84    plata
//   85-89    verde
//   90-94    dorado        -> categoría superior
//   95-99    dorado alto   -> dorado con marco y pulso
//   100      multicolor atenuado
//   101-104  multicolor
//   >=105    multicolor al máximo, con aura extra
// El multicolor (borde iridiscente) queda reservado para media 100+.
type NivelSolido = "marron" | "plata" | "verde" | "dorado" | "doradoAlto";
type NivelMulti = "mitico" | "elite" | "eliteMax";

interface NivelUI {
  borde: string;
  texto: string;
  fondo: string;
  /** box-shadow de la carta full */
  brillo: string;
  /** box-shadow de la carta mini */
  miniBrillo: string;
  /** animación de glow pulsante ("" | "rarity-pulse") */
  pulse: string;
  /** marco especial ("" | "marco-oro") */
  marco: string;
  /** color del glow (variable CSS --glow) */
  glowVar: string;
  /** el número respira luz propia ("" | "numero-glow") */
  numeroGlow: string;
  /** tamaño del número de media en la carta full */
  numeroTam: string;
  /** tamaño del número de media en la carta mini */
  miniNumeroTam: string;
}

const NIVEL_UI: Record<NivelSolido, NivelUI> = {
  marron: {
    borde: "border-[#8b5e3c]",
    texto: "text-[#d2a679]",
    fondo: "from-[#5c3a21]/80 to-zinc-950",
    brillo: "shadow-[0_0_10px_-4px_rgba(139,94,60,0.5)]",
    miniBrillo: "",
    pulse: "",
    marco: "",
    glowVar: glowDeNivelCarta("marron"),
    numeroGlow: "",
    numeroTam: "text-xl",
    miniNumeroTam: "text-base",
  },
  plata: {
    borde: "border-zinc-300",
    texto: "text-zinc-200",
    fondo: "from-zinc-500/40 via-zinc-700/50 to-zinc-950",
    brillo: "shadow-[0_0_18px_-3px_rgba(228,228,231,0.6)]",
    miniBrillo: "shadow-[0_0_11px_-3px_rgba(228,228,231,0.55)]",
    pulse: "",
    marco: "",
    glowVar: glowDeNivelCarta("plata"),
    numeroGlow: "",
    numeroTam: "text-2xl",
    miniNumeroTam: "text-lg",
  },
  verde: {
    borde: "border-emerald-400",
    texto: "text-emerald-300",
    fondo: "from-emerald-800/70 via-emerald-900/50 to-zinc-950",
    brillo: "shadow-[0_0_24px_-3px_rgba(16,185,129,0.8)]",
    miniBrillo: "shadow-[0_0_14px_-3px_rgba(16,185,129,0.75)]",
    pulse: "",
    marco: "",
    glowVar: glowDeNivelCarta("verde"),
    numeroGlow: "",
    numeroTam: "text-2xl",
    miniNumeroTam: "text-lg",
  },
  dorado: {
    borde: "border-amber-300",
    texto: "text-amber-200",
    fondo: "from-amber-500/55 via-yellow-700/40 to-zinc-950",
    brillo: "shadow-[0_0_30px_-2px_rgba(252,211,77,0.85)]",
    miniBrillo: "shadow-[0_0_18px_-3px_rgba(252,211,77,0.85)]",
    pulse: "",
    marco: "",
    glowVar: glowDeNivelCarta("dorado"),
    numeroGlow: "numero-glow",
    numeroTam: "text-3xl",
    miniNumeroTam: "text-xl",
  },
  doradoAlto: {
    borde: "border-amber-200",
    texto: "text-amber-100",
    fondo: "from-amber-400/65 via-yellow-600/45 to-zinc-950",
    brillo: "shadow-[0_0_38px_-1px_rgba(255,210,63,1)]",
    miniBrillo: "shadow-[0_0_24px_-2px_rgba(255,210,63,1)]",
    pulse: "rarity-pulse",
    marco: "marco-oro",
    glowVar: glowDeNivelCarta("doradoAlto"),
    numeroGlow: "numero-glow",
    numeroTam: "text-4xl",
    miniNumeroTam: "text-2xl",
  },
};

/** Cartas multicolor (media 100+). `clase` modifica la intensidad del
 *  iridiscente sobre `.card-elite`: 100 atenuado, >100 normal, >=105 al máximo. */
const MULTICOLOR_UI: Record<
  NivelMulti,
  { clase: string; glowVar: string; numeroTam: string; miniNumeroTam: string }
> = {
  mitico: {
    clase: "elite-100",
    glowVar: glowDeNivelCarta("mitico"),
    numeroTam: "text-4xl",
    miniNumeroTam: "text-xl",
  },
  elite: {
    clase: "",
    glowVar: glowDeNivelCarta("elite"),
    numeroTam: "text-5xl",
    miniNumeroTam: "text-2xl",
  },
  eliteMax: {
    clase: "elite-max",
    glowVar: glowDeNivelCarta("eliteMax"),
    numeroTam: "text-5xl",
    miniNumeroTam: "text-2xl",
  },
};

const POS_ABREV: Record<Player["posicion"], string> = {
  Arquero: "ARQ",
  Defensa: "DEF",
  Medio: "MED",
  Delantero: "DEL",
};

/** Pastilla de posición: máximo contraste, misma pinta en toda la app. */
const POS_BADGE =
  "rounded-md bg-[#c6ff3d] font-display font-black uppercase tracking-wide text-black";

interface PlayerCardProps {
  player: Player;
  variante?: "full" | "mini";
  /** Solo aplica a "mini": "chico" para tiras horizontales en móvil (resumen
   *  de torneo); "chicoFluido" para la cancha de celular (grilla por línea de
   *  formación, ancho fluye hasta un máximo); "banco" para el banco de
   *  suplentes en móvil (tira con scroll horizontal, un poco más chico que
   *  "chico" para que entren más cartas a la vista); "compacto" para la
   *  cancha de escritorio normal; "compactoAjustado" para la cancha de
   *  escritorio "chica" (dos lado a lado) — más angosta que "compacto" para
   *  que las líneas de 4-5 jugadores no se superpongan. */
  tamanoMini?:
    | "normal"
    | "chico"
    | "chicoFluido"
    | "banco"
    | "compacto"
    | "compactoAjustado";
  seleccionada?: boolean;
  /** Goles marcados: una pelotita por gol sobre la carta. */
  goles?: number;
  /** Asistencias dadas: un botín sobre la carta (ver `SoccerBoot`). Se usa en
   *  el resumen general del torneo, no en el resumen de un partido suelto. */
  asistencias?: number;
  /** Tarjetas recibidas en el partido en curso: se dibujan sobre la carta. */
  tarjetas?: { amarillas: number; roja: boolean };
  /** El jugador está expulsado en el partido en curso (roja directa o doble amarilla). */
  expulsado?: boolean;
  /** Media ya penalizada para el hueco donde está colocado (ver `mediaEfectiva`
   *  en `game/squad.ts`). Si es menor a `player.media`, la carta se tiñe de
   *  rojo y se muestra este número en vez de la media natural del jugador. */
  mediaEnPosicion?: number;
  onClick?: () => void;
}

export function PlayerCard({
  player,
  variante = "full",
  tamanoMini = "normal",
  seleccionada = false,
  goles = 0,
  asistencias = 0,
  tarjetas,
  expulsado = false,
  mediaEnPosicion,
  onClick,
}: PlayerCardProps) {
  const fueraDePosicion =
    mediaEnPosicion != null && mediaEnPosicion < player.media;
  const mediaMostrada = mediaEnPosicion ?? player.media;
  const nivel: NivelCarta = nivelCarta(player.media);
  const esMulti =
    nivel === "mitico" || nivel === "elite" || nivel === "eliteMax";
  const mui = esMulti ? MULTICOLOR_UI[nivel] : null;
  const ui = esMulti ? NIVEL_UI.doradoAlto : NIVEL_UI[nivel];
  const clickable = typeof onClick === "function";
  const etiqueta = esMulti ? "Élite" : etiquetaRareza(player.rareza);

  // Animación de expulsión una sola vez, en la transición "entra a expulsado".
  const [animarExp, setAnimarExp] = useState(false);
  const expulsadoPrev = useRef(expulsado);
  useEffect(() => {
    if (expulsado && !expulsadoPrev.current) {
      setAnimarExp(true);
      const id = setTimeout(() => setAnimarExp(false), 1300);
      expulsadoPrev.current = expulsado;
      return () => clearTimeout(id);
    }
    expulsadoPrev.current = expulsado;
  }, [expulsado]);

  const expClases = `${expulsado ? "carta-expulsada" : ""} ${
    animarExp ? "expulsion-anim" : ""
  }`;

  const style = {
    "--glow": esMulti ? mui!.glowVar : ui.glowVar,
  } as React.CSSProperties;

  if (variante === "mini") {
    const banco = tamanoMini === "banco";
    const chico =
      tamanoMini === "chico" || tamanoMini === "chicoFluido" || banco;
    const chicoFluido = tamanoMini === "chicoFluido";
    const compactoAjustado = tamanoMini === "compactoAjustado";
    const compacto = tamanoMini === "compacto" || compactoAjustado || banco;
    const { primerNombre, apellido: ape } = partirNombre(player.nombre);
    // +~0.5cm (≈19px) en cada dimensión respecto del tamaño original, para
    // que las cartas ya colocadas (titular/banco) tengan más presencia.
    // "compactoAjustado" gana lo mismo en alto pero bastante menos en ancho:
    // en la cancha "chica" (dos lado a lado) una línea de 4-5 jugadores no
    // tiene margen para el ancho completo sin superponerse.
    // "chicoFluido" (cancha de celular): el alto queda fijo, pero el ancho es
    // fluido (llena su columna de la grilla de esa línea, hasta un máximo de
    // 103px) — así una línea de 5 en un celular angosto encoge para entrar
    // en una sola fila, en vez de desbordar o partirse en dos filas. "chico"
    // a secas (tiras horizontales con scroll) mantiene el ancho fijo de
    // siempre; "banco" es una versión un poco más chica de esa misma tira,
    // para que entren más suplentes a la vista sin scrollear tanto.
    const dims = compactoAjustado
      ? "h-[99px] w-[70px]"
      : banco
        ? "h-[100px] w-[85px]"
        : compacto
          ? "h-[99px] w-[81px]"
          : chicoFluido
            ? "h-[119px] w-full max-w-[103px] mx-auto"
            : chico
              ? "h-[119px] w-[103px]"
              : "h-[106px] w-[88px]";
    // En touch, `:hover` puede quedar "pegado" tras un tap (no hay mouse real
    // que se retire), agrandando la carta sin que el usuario la esté tocando.
    // Los tamaños exclusivos de celular solo agrandan en dispositivos que
    // realmente soportan hover (mouse); en escritorio (compacto/compactoAjustado)
    // el hover-grow de siempre queda intacto.
    const hoverClases = chico
      ? "[@media(hover:hover)]:hover:z-10 [@media(hover:hover)]:hover:scale-[1.08]"
      : "hover:z-10 hover:scale-[1.08]";
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!clickable}
        style={style}
        className={`relative flex shrink-0 ${dims} flex-col items-center justify-between rounded-md border text-center transition-transform duration-200 ease-out ${hoverClases} ${
          compacto ? "gap-0 px-1 py-1" : "gap-0.5 px-1.5 py-1.5"
        } ${
          esMulti
            ? `card-elite border-transparent bg-zinc-950 ${mui!.clase}`
            : `bg-gradient-to-b ${ui.borde} ${ui.fondo} ${ui.miniBrillo} ${ui.marco}`
        } ${seleccionada ? "ring-2 ring-white/90 brightness-110" : ""} ${
          fueraDePosicion ? "!border-red-500/80" : ""
        } ${
          clickable ? "cursor-pointer hover:brightness-110" : "cursor-default"
        } ${expClases}`}
      >
        {fueraDePosicion && (
          <div className="pointer-events-none absolute inset-0 rounded-md bg-red-600/25" />
        )}
        {goles > 0 && <GolesPelotas goles={goles} />}
        {tarjetas && (tarjetas.amarillas > 0 || tarjetas.roja) && (
          <TarjetasCarta tarjetas={tarjetas} />
        )}
        {asistencias > 0 && <BotinAsistencias cantidad={asistencias} />}
        <div className="relative flex w-full items-center justify-between gap-1">
          <span
            className={`font-display font-bold leading-none ${
              compacto ? "text-base" : esMulti ? mui!.miniNumeroTam : ui.miniNumeroTam
            } ${
              fueraDePosicion
                ? "text-red-400"
                : `${esMulti ? "text-neon" : "text-white"} ${esMulti ? "numero-glow" : ui.numeroGlow}`
            }`}
          >
            {mediaMostrada}
          </span>
          <span
            className={`${POS_BADGE} leading-none ${
              compacto ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-[11px]"
            }`}
          >
            {POS_ABREV[player.posicion]}
          </span>
        </div>
        {!compacto && (
        <span className="txt-contorno min-h-[14px] w-full truncate text-[12px] leading-tight text-zinc-200">
          {primerNombre ||" "}
        </span>
        )}
        <span
          className={`txt-contorno w-full truncate font-display font-bold leading-tight text-white ${
            compacto ? "text-[12px]" : "text-sm"
          }`}
        >
          {ape}
        </span>
        <BanderaPais
          pais={player.seleccion}
          className={`inline-block rounded-[2px] border border-black/40 object-cover ${
            compacto ? "h-[9px] w-[13px]" : "h-[11px] w-4"
          }`}
          classNameTexto={`w-full truncate text-center font-display text-[8px] font-bold uppercase leading-none text-zinc-300`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      style={style}
      className={`relative flex aspect-[3/4.3] w-full flex-col justify-between rounded-xl border-2 p-2 text-left transition duration-200 ease-out hover:z-10 hover:scale-105 ${
        esMulti
          ? `card-elite border-transparent bg-zinc-950 ${mui!.clase}`
          : `sheen sheen-run bg-gradient-to-b ${ui.borde} ${ui.fondo} ${ui.brillo} ${ui.pulse} ${ui.marco}`
      } ${seleccionada ? "ring-4 ring-white/80 brightness-110" : ""} ${
        clickable ? "cursor-pointer hover:-translate-y-1 hover:brightness-110" : "cursor-default"
      } ${expClases}`}
    >
      {/* Media + posición (izq) / rareza (der) */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex flex-col leading-none">
          <span
            className={`font-display font-bold leading-none ${
              esMulti
                ? `text-neon numero-glow ${mui!.numeroTam}`
                : `text-white ${ui.numeroTam} ${ui.numeroGlow}`
            }`}
          >
            {player.media}
            {player.mediaInventada && (
              <span
                title="media estimada"
                className="ml-0.5 align-top text-xs font-normal text-white/40"
              >
                ≈
              </span>
            )}
          </span>
          <span className={`${POS_BADGE} mt-1 inline-block w-fit px-1.5 py-0.5 text-xs`}>
            {POS_ABREV[player.posicion]}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full border px-1.5 py-0.5 font-display text-[8px] font-bold uppercase tracking-wide ${
            esMulti
              ? "border-white/30 bg-white/10 text-white"
              : `border-white/15 bg-black/30 ${ui.texto}`
          }`}
        >
          {etiqueta}
        </span>
      </div>

      {/* Silueta como identidad visual central (sin fotos de jugadores). */}
      <div className="flex flex-1 items-center justify-center">
        <PlayerSilhouette
          className={`h-11 w-11 opacity-60 ${esMulti ? "text-white" : ui.texto}`}
        />
      </div>

      {/* Nombre + bandera / país / mundial */}
      <div className="text-center">
        <div className="txt-contorno line-clamp-1 text-[15px] font-bold leading-tight text-white">
          {player.nombre}
        </div>
        <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-zinc-300">
          <BanderaPais
            pais={player.seleccion}
            className="inline-block h-[11px] w-4 shrink-0 rounded-[2px] border border-black/40 object-cover"
            classNameTexto="shrink-0 font-display text-[9px] font-bold uppercase leading-none text-zinc-300"
          />
          <span className="truncate">
            {player.seleccion} · {player.mundial}
          </span>
        </div>
      </div>
    </button>
  );
}

/** Parte el nombre en "primer nombre" + "apellido". Si es un solo token
 *  (mononombre tipo Ronaldinho), va todo como apellido y `primerNombre` vacío. */
function partirNombre(nombre: string): { primerNombre: string; apellido: string } {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length <= 1) return { primerNombre: "", apellido: partes[0] ?? "" };
  return { primerNombre: partes[0], apellido: partes.slice(1).join(" ") };
}

/** Tarjetas recibidas, en la esquina superior izquierda de la carta:
 *  rectángulos amarillos (1-2) y/o rojo. Sin emoji, para que se vea igual
 *  en todos los sistemas. Si terminó en expulsión (roja directa o doble
 *  amarilla) se muestra SOLO la roja: es el resultado final de la acción. */
function TarjetasCarta({
  tarjetas,
}: {
  tarjetas: { amarillas: number; roja: boolean };
}) {
  if (tarjetas.roja) {
    return (
      <div className="pointer-events-none absolute -left-1.5 -top-2 z-10 flex items-center gap-0.5">
        <span className="h-3.5 w-2.5 rounded-[2px] border border-black/60 bg-[#dc2626] shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
      </div>
    );
  }
  const amarillas = Math.min(tarjetas.amarillas, 2);
  return (
    <div className="pointer-events-none absolute -left-1.5 -top-2 z-10 flex items-center gap-0.5">
      {Array.from({ length: amarillas }).map((_, i) => (
        <span
          key={`a${i}`}
          className="h-3.5 w-2.5 rounded-[2px] border border-black/60 bg-[#facc15] shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
        />
      ))}
    </div>
  );
}

/** Pelotitas de gol apiladas en la esquina superior de la carta: una por
 *  gol (hasta 4 dibujadas; de ahí en más, "xN" para no saturar). */
function GolesPelotas({ goles }: { goles: number }) {
  const dibujadas = Math.min(goles, 3);
  return (
    <div className="pointer-events-none absolute -right-1.5 -top-2 z-10 flex items-center [&>svg:not(:first-child)]:-ml-1.5">
      {Array.from({ length: dibujadas }).map((_, i) => (
        <SoccerBall
          key={i}
          className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
        />
      ))}
      {goles > 3 && (
        <span className="ml-0.5 rounded-full bg-black/80 px-1 font-display text-[8px] font-black leading-none text-white">
          x{goles}
        </span>
      )}
    </div>
  );
}

/** Botín(es) en la esquina inferior de la carta: indica asistencias (una por
 *  cada una, hasta 3; de ahí en más, "xN"). Se usa en el resumen general del
 *  torneo, para identificar de un vistazo a quién dio cada asistencia. */
function BotinAsistencias({ cantidad }: { cantidad: number }) {
  const dibujados = Math.min(cantidad, 3);
  return (
    <div className="pointer-events-none absolute -bottom-2 -right-1.5 z-10 flex items-center [&>svg:not(:first-child)]:-ml-1.5">
      {Array.from({ length: dibujados }).map((_, i) => (
        <SoccerBoot
          key={i}
          className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
        />
      ))}
      {cantidad > 3 && (
        <span className="ml-0.5 rounded-full bg-black/80 px-1 font-display text-[8px] font-black leading-none text-white">
          x{cantidad}
        </span>
      )}
    </div>
  );
}
