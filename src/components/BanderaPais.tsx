import { banderaSvgDe } from "@/data/banderasSvg";

interface BanderaPaisProps {
  pais: string;
  /** Clases para el <img> de la bandera (tamaño, borde, etc.). */
  className?: string;
  /** Clases para el nombre completo cuando no hay bandera. */
  classNameTexto?: string;
}

/**
 * Bandera SVG de una selección. Si la selección no tiene bandera disponible,
 * muestra su NOMBRE COMPLETO (sin abreviar), como pidió el diseño.
 */
export function BanderaPais({
  pais,
  className = "",
  classNameTexto = "",
}: BanderaPaisProps) {
  const src = banderaSvgDe(pais);
  if (!src) {
    return (
      <span
        className={
          classNameTexto ||
          "line-clamp-3 text-center font-display text-[11px] font-bold uppercase leading-tight text-white"
        }
      >
        {pais}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={pais}
      title={pais}
      draggable={false}
      className={className}
    />
  );
}
