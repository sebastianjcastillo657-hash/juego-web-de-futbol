# PROJECT_RULES.md

Reglas estrictas para el desarrollo del juego web de fútbol histórico
(Draft de jugadores/Mundiales + plantilla 11+5 + Mundial roguelike + minijuegos).

Estas reglas son de cumplimiento obligatorio para cualquier persona o asistente
(incluido Claude Code) que trabaje en este proyecto. Ante la duda: **preguntar,
no asumir.**

---

## 1. Alcance del trabajo

- **NO** crear funcionalidades, pantallas, endpoints, dependencias ni configuración
  que no hayan sido pedidas explícitamente.
- **NO** "mejorar de paso" código no relacionado con la tarea actual.
- **NO** añadir librerías nuevas sin autorización previa.
- **NO** adelantar trabajo de fases futuras. Se implementa **una sola fase por vez**
  y no se pasa a la siguiente sin aprobación.
- Si una idea parece útil pero no fue pedida: proponerla por escrito y esperar
  respuesta. No implementarla.

## 2. Archivos existentes

- **NO** modificar archivos existentes sin autorización explícita para ese archivo.
- **NO** borrar ni renombrar archivos existentes sin autorización.
- **NO** mover archivos entre carpetas sin autorización.
- Antes de tocar un archivo existente hay que nombrarlo en el plan (ver sección 6).

## 3. Tipos y contratos

- **NO** cambiar nombres de tipos, interfaces, enums ni sus propiedades.
- **NO** cambiar la forma (shape) de un tipo ya definido sin autorización.
- **NO** cambiar firmas de funciones públicas ya existentes (parámetros, orden,
  tipo de retorno) sin autorización.
- Los tipos viven en su capa dedicada (`types`), no dentro de componentes.
- Extender un tipo es aceptable solo si se pidió; reemplazarlo o renombrarlo, no.

## 4. Estructura de carpetas y arquitectura

- **NO** cambiar la estructura de carpetas acordada.
- **NO** cambiar la arquitectura por iniciativa propia.
- Mantener SIEMPRE separadas las capas:
  - **interfaz** (componentes React / UI)
  - **lógica del juego** (motor, reglas, simulación)
  - **datos** (jugadores, selecciones, Mundiales, config)
  - **tipos**
  - **persistencia** (local / Supabase más adelante)
- La lógica del juego **NO** va dentro de componentes React.
- Cada pieza de lógica importante tiene **una única fuente de verdad**. Prohibido
  duplicar reglas, constantes o fórmulas.
- Los valores de balance (probabilidades, pesos, penalizaciones de posición, etc.)
  van **centralizados en configuración**, nunca hardcodeados sueltos.

## 5. Datos de jugadores

- **NO** inventar datos de jugadores (rating, posiciones, año, selección, rareza,
  peso) si esos datos afectan la lógica final.
- Los datos mock deben estar claramente marcados como mock y aislados, para poder
  reemplazarlos sin tocar la lógica.

## 6. Proceso antes de implementar

**SIEMPRE**, antes de escribir o modificar código:

1. Analizar y describir el estado actual del proyecto relevante a la tarea.
2. Explicar qué se va a hacer y por qué.
3. Indicar **exactamente** qué archivos existentes serán modificados.
4. Indicar **exactamente** qué archivos nuevos serán creados.
5. Si la tarea puede afectar varias partes del proyecto, **esperar aprobación
   explícita** antes de continuar.

No se empieza a implementar hasta que el plan esté aprobado.

## 7. Proceso después de implementar

**SIEMPRE**, al terminar una tarea:

1. Ejecutar las comprobaciones necesarias (typecheck, lint, build o pruebas según
   corresponda).
2. Reportar errores encontrados, con su salida real.
3. Corregir **únicamente** los errores relacionados con la tarea.
4. Explicar qué se modificó, archivo por archivo.
5. Explicar qué quedó pendiente.

- Nunca afirmar que algo funciona solo porque compila.
- Si las comprobaciones fallan, decirlo claramente; no maquillar el resultado.

## 8. Estilo y consistencia

- Seguir las convenciones ya presentes en el código (nombres, formato, idioma de
  comentarios, estructura de imports).
- No reformatear archivos completos ni cambiar el estilo global sin autorización.
- Commits (cuando se pidan): pequeños, enfocados en una sola tarea/fase.

## 9. Prioridades de diseño del juego

El juego prioriza, en este orden: **diversión, simplicidad, azar, decisiones
interesantes, rejugabilidad, velocidad, presentación visual.**

Queda **explícitamente fuera** del proyecto (no implementar, no proponer como
necesario): química entre jugadores, mercado complejo, economía compleja,
entrenamiento, contratos, fatiga detallada, decenas de estadísticas por jugador.

## 10. Orden de desarrollo por fases

FASE 0: Reglas del proyecto (este archivo).
FASE 1: Estructura del proyecto + interfaz básica.
FASE 2: Pantalla de selección de formación.
FASE 3: Sistema de posiciones.
FASE 4: Cartas y jugadores mock.
FASE 5: Sistema ROLL.
FASE 6: Probabilidades de posición y rareza.
FASE 7: Colocación de jugadores.
FASE 8: Plantilla 11 + 5.
FASE 9: Media del equipo.
FASE 10: Generación del Mundial.
FASE 11: Simulación de partidos.
FASE 12: Modo DT.
FASE 13: Eventos.
FASE 14: Minijuegos.
FASE 15: Torneo completo.
FASE 16: Guardado.
FASE 17: Historial.
FASE 18: Usuarios.
FASE 19: Ranking.
FASE 20: Pulido visual, balance y pruebas.

Se implementa **una fase por vez**. El objetivo es primero un MVP completamente
jugable y después añadir sistemas.

---

## Resumen (checklist rápido)

- [ ] ¿Lo que voy a hacer fue pedido explícitamente?
- [ ] ¿Mostré el plan con archivos a modificar y a crear?
- [ ] ¿Tengo aprobación si toca varias partes?
- [ ] ¿No estoy renombrando tipos ni cambiando carpetas/arquitectura?
- [ ] ¿La lógica está fuera de los componentes y sin duplicar?
- [ ] ¿Los valores de balance están centralizados en config?
- [ ] ¿Corrí las comprobaciones y reporté el resultado real?
- [ ] ¿Expliqué qué cambié y qué quedó pendiente?
