// Servidor mínimo para producción en Seenode: el juego es un sitio 100%
// estático (`next build` con `output: "export"` en next.config.mjs genera
// todo en `out/`), pero Seenode todavía no tiene hosting de sitios estáticos
// como producto propio (está listado como "coming soon") — su modelo actual
// es "Web Services", que esperan un proceso que responda HTTP. Este archivo
// sigue el patrón que la propia documentación de Seenode recomienda para
// este caso: https://seenode.com/docs/how-to/deploy/javascript/react-spa
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;
const BUILD_DIR = path.join(__dirname, "out");

app.use(express.static(BUILD_DIR));

// El juego es una sola pantalla (todo el estado interno es de React, no hay
// rutas propias) — cualquier ruta no encontrada devuelve el mismo index.html.
app.get("*", (req, res) => {
  res.sendFile(path.join(BUILD_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sirviendo el build estático en http://0.0.0.0:${PORT}`);
});
