// Bandera por selección. Se usan secuencias de "regional indicator" (🇦🇷,
// 🇧🇷, ...): en sistemas con soporte se ven como bandera y en el resto
// (p. ej. Windows) degradan a las dos letras del país (AR, BR, ...), que es
// el formato con el que se muestran todos los jugadores en el juego.
//
// OJO: NO usar el emoji de Inglaterra con "tag sequence" (🏴󠁧󠁢󠁥󠁮󠁧󠁿): en
// muchos sistemas no degrada a letras y aparece una bandera negra/gris.

export const FLAGS: Record<string, string> = {
  España: "🇪🇸",
  Argentina: "🇦🇷",
  Francia: "🇫🇷",
  Inglaterra: "🇬🇧",
  Brasil: "🇧🇷",
  Marruecos: "🇲🇦",
  Portugal: "🇵🇹",
  Bélgica: "🇧🇪",
  "Países Bajos": "🇳🇱",
  México: "🇲🇽",
  Colombia: "🇨🇴",
  Alemania: "🇩🇪",
  Croacia: "🇭🇷",
  Suiza: "🇨🇭",
  Chile: "🇨🇱",
  "Estados Unidos": "🇺🇸",
  Grecia: "🇬🇷",
  Italia: "🇮🇹",
  Serbia: "🇷🇸",
  Uruguay: "🇺🇾",
  Irlanda: "🇮🇪",
  Japón: "🇯🇵",
  Nigeria: "🇳🇬",
  Noruega: "🇳🇴",
  Rumania: "🇷🇴",
  Suecia: "🇸🇪",
  "Costa Rica": "🇨🇷",
  Rusia: "🇷🇺",
  // Yugoslavia ya no existe: la secuencia 🇾🇺 no tiene glifo de bandera, así
  // que se ve siempre como "YU" (que es justo lo que queremos).
  Yugoslavia: "🇾🇺",

  // --- Selecciones agregadas con el Excel jugadores_1 ---
  Rumanía: "🇷🇴", // grafía nueva (antes "Rumania")
  Argelia: "🇩🇿",
  Australia: "🇦🇺",
  Austria: "🇦🇹",
  Bulgaria: "🇧🇬",
  "Cabo Verde": "🇨🇻",
  Camerún: "🇨🇲",
  Canadá: "🇨🇦",
  Chequia: "🇨🇿",
  "Corea del Sur": "🇰🇷",
  "Costa de Marfil": "🇨🇮",
  Dinamarca: "🇩🇰",
  Ecuador: "🇪🇨",
  Egipto: "🇪🇬",
  Ghana: "🇬🇭",
  Hungría: "🇭🇺",
  Paraguay: "🇵🇾",
  Perú: "🇵🇪",
  Polonia: "🇵🇱",
  Senegal: "🇸🇳",
  Sudáfrica: "🇿🇦",
  Turquía: "🇹🇷",
  Ucrania: "🇺🇦",
  // Sin secuencia regional limpia (se ven como 3 letras en las cartas; en la
  // ruleta de ROLL usan su SVG): Escocia, Gales, Irlanda del Norte,
  // Checoslovaquia, Unión Soviética.
};

/** true si la selección tiene una entrada de bandera propia en `FLAGS`.
 *  Cuando es false, hay que mostrar el nombre completo del país (no abreviar). */
export function tieneBandera(pais: string): boolean {
  return pais in FLAGS;
}

/** Abreviación de país para mostrar junto al jugador. Si la selección no
 *  está en `FLAGS`, se cae a las 3 primeras letras (sin acentos) en vez de
 *  a un emoji genérico. */
export function banderaDe(pais: string): string {
  const emoji = FLAGS[pais];
  if (emoji) return emoji;
  return pais
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase();
}
