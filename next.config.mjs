/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El juego es 100% cliente (sin API routes, sin middleware, sin Server
  // Actions): no hace falta que corra un servidor de Next.js en producción.
  // "export" genera un sitio 100% estático en `out/` (HTML/JS/CSS listos
  // para servir desde cualquier hosting estático), lo que además deja fuera
  // del alcance casi todas las vulnerabilidades conocidas de Next.js (son
  // del runtime del servidor, que acá directamente no existe).
  output: "export",
};

export default nextConfig;
