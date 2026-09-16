// Banderas SVG reales de las selecciones jugables, servidas desde
// `public/banderas/*.svg`. Se usan SOLO en la ruleta de ROLL (el sorteo de
// países). Para el resto del juego (cartas de jugador, sorteo de rivales) se
// sigue usando `banderaDe` de `@/data/flags` (emoji / 2 letras).
//
// Origen: flag-icons (lipis, MIT) para casi todas; Yugoslavia (RF, tricolor)
// dibujada a mano; Checoslovaquia = bandera checa; Unión Soviética de Wikimedia.

/** Nombre de selección -> archivo en `/banderas/`. */
const PAIS_A_ARCHIVO: Record<string, string> = {
  Alemania: "de",
  Argelia: "dz",
  Argentina: "ar",
  Australia: "au",
  Austria: "at",
  Brasil: "br",
  Bulgaria: "bg",
  Bélgica: "be",
  "Cabo Verde": "cv",
  Camerún: "cm",
  Canadá: "ca",
  Checoslovaquia: "csk",
  Chequia: "cz",
  Chile: "cl",
  Colombia: "co",
  "Corea del Sur": "kr",
  "Costa Rica": "cr",
  "Costa de Marfil": "ci",
  Croacia: "hr",
  Dinamarca: "dk",
  Ecuador: "ec",
  Egipto: "eg",
  Escocia: "gb-sct",
  España: "es",
  "Estados Unidos": "us",
  Francia: "fr",
  Gales: "gb-wls",
  Ghana: "gh",
  Grecia: "gr",
  Hungría: "hu",
  Inglaterra: "gb-eng",
  Irlanda: "ie",
  "Irlanda del Norte": "gb-nir",
  Italia: "it",
  Japón: "jp",
  Marruecos: "ma",
  México: "mx",
  Nigeria: "ng",
  Noruega: "no",
  Paraguay: "py",
  "Países Bajos": "nl",
  Perú: "pe",
  Polonia: "pl",
  Portugal: "pt",
  Rumania: "ro",
  Rumanía: "ro",
  Rusia: "ru",
  Senegal: "sn",
  Serbia: "rs",
  Sudáfrica: "za",
  Suecia: "se",
  Suiza: "ch",
  Turquía: "tr",
  Ucrania: "ua",
  "Unión Soviética": "su",
  Uruguay: "uy",
  Yugoslavia: "yu",
};

/** Ruta al SVG de la bandera de una selección, o `null` si no hay. */
export function banderaSvgDe(pais: string): string | null {
  const archivo = PAIS_A_ARCHIVO[pais];
  return archivo ? `/banderas/${archivo}.svg` : null;
}

/** Todas las rutas de bandera únicas (para precargar). */
export const BANDERAS_SVG: string[] = [
  ...new Set(Object.values(PAIS_A_ARCHIVO)),
].map((a) => `/banderas/${a}.svg`);
