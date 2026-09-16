/** Promedio redondeado de un conjunto de medias. 0 si está vacío. */
export function promedioMedias(medias: number[]): number {
  if (medias.length === 0) return 0;
  const suma = medias.reduce((a, b) => a + b, 0);
  return Math.round(suma / medias.length);
}
