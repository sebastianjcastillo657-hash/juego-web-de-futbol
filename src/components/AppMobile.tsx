"use client";

import { useJuego } from "@/components/juego/useJuego";
import { DraftMobile } from "@/components/mobile/DraftMobile";
import { FormacionMobile } from "@/components/mobile/FormacionMobile";
import { MundialScreenMobile } from "@/components/mobile/MundialScreenMobile";
import { PlantelMobile } from "@/components/mobile/PlantelMobile";

/**
 * Raíz de la interfaz móvil. Consume el mismo `useJuego` que la versión de
 * escritorio; solo cambia la distribución. Cada `fase` tiene su pantalla móvil.
 */
export function AppMobile() {
  const j = useJuego();
  if (!j.montado) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[520px] px-4 pb-6 pt-6">
      {j.fase === "formacion" && (
        <FormacionMobile
          opciones={j.opcionesFormacion}
          onElegir={j.elegirFormacion}
        />
      )}

      {j.fase === "draft" && j.squad && j.stats && (
        <DraftMobile j={j} squad={j.squad} stats={j.stats} />
      )}

      {j.fase === "listo" && j.squad && (
        <PlantelMobile
          squad={j.squad}
          onReiniciar={j.reiniciar}
          onSorteoListo={j.sorteoListo}
        />
      )}

      {j.fase === "mundial" && j.sorteo && j.squad && (
        <MundialScreenMobile
          squad={j.squad}
          mundial={j.sorteo.mundial}
          partidos={j.sorteo.partidos}
          etapaInicial={j.sorteo.etapaInicial}
          seleccionable={j.seleccionada}
          seleccionadoSlotId={j.slotSeleccionado}
          onSlot={j.usarSlot}
          onReiniciar={j.reiniciar}
        />
      )}
    </div>
  );
}
