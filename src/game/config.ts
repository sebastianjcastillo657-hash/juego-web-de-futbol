// Única fuente de verdad de los números de balance.
// Cambiá acá y se propaga a todo el juego.

export const GAME_CONFIG = {
  /** Cuántas formaciones al azar se ofrecen al empezar. */
  formationOptionsCount: 3,
  /** Cuántos jugadores devuelve cada ROLL. */
  rollOptionsCount: 4,
  /**
   * Máximo combinado de "volver a sortear país / año" por partida (draft).
   * Se reponen al empezar un draft nuevo (elegir formación / nueva partida).
   */
  resorteosDraft: 3,
  /** Titulares y suplentes que hay que completar. */
  titulares: 11,
  suplentes: 5,

  /**
   * Umbrales de rareza sobre la media de juego (que ahora es la del Excel,
   * sin transformar). Rango real de las medias: ~72 a 105.
   */
  rarezaUmbral: {
    leyenda: 100,
    epico: 93,
    raro: 85,
    // por debajo de `raro` => "comun"
  },

  /** Peso relativo de aparición según rareza (más raro = más difícil). */
  pesoPorRareza: {
    comun: 60,
    raro: 26,
    epico: 11,
    leyenda: 3,
  },

  /**
   * Compensación de peso para las cartas de media alta: hay muchas menos que
   * de media <= `umbral`, así que sin esto son más difíciles de lo que
   * debería su rareza. Multiplica el peso de rareza (no lo reemplaza) para
   * las cartas con media > `umbral`. Con `multiplicador: 1.5`, la chance de
   * que salga una +89 en su grupo de posición sube de ~7.5% a ~10% en
   * promedio (su población real es ~15%): siguen siendo notablemente más
   * difíciles que las <=89, solo un poco menos de lo que marcaría la sola
   * rareza.
   */
  pesoMediaAlta: {
    umbral: 89,
    multiplicador: 1.5,
  },

  /**
   * Umbral inferior de media para cada NIVEL VISUAL de carta. Es solo estética
   * (borde, color, glow, marco, animaciones): cuanto más alta la media, más
   * llamativa la carta y más evidente la progresión de un vistazo. Es
   * independiente de `rarezaUmbral` (que rige la `Rareza` del modelo de datos y
   * el peso de aparición).
   *
   * Escalones de valor, de menor a mayor:
   *  - <80 marrón / 80-84 plata                 -> tonos base
   *  - 85-89 verde
   *  - 90-94 dorado / 95-99 dorado alto         -> categoría superior, estética dorada
   *  - 100 mítico                               -> multicolor atenuado
   *  - 101-104 élite                            -> multicolor
   *  - >=105 élite máximo                       -> multicolor al máximo, aura extra
   */
  bandasCarta: {
    eliteMax: 105,
    mitico: 100,
    doradoAlto: 95,
    dorado: 90,
    verde: 85,
    plata: 80,
    // por debajo de `plata` (80) => "marrón"
  },

  /** Media que se usa si no se puede estimar una para un jugador sin dato. */
  mediaInventadaFallback: 78,

  /**
   * Jugadores sin media en el Excel (la fuente no traía su fila). Se estima
   * por el promedio de su posición y se le suma `boost`, con tope `tope`.
   * Es a propósito una media un poco "exagerada": son estrellas que la
   * fuente se salteó (ej. Neuer 2010/2014, Marcos Llorente 2026).
   */
  mediaFaltante: {
    boost: 8,
    tope: 105,
  },

  /** Jugador de élite (estilo iridiscente) si su media es estrictamente mayor. */
  elite: {
    umbralMedia: 100,
  },

  /** Penalización de media al colocar en una posición que no corresponde. */
  penalizacion: {
    /** Jugador de campo en una línea de campo equivocada. */
    posicionIncorrectaCampo: 6,
    /** Arquero fuera del arco, o jugador de campo en el arco. */
    liosConArco: 20,
  },

  /**
   * Animación de "ruleta" al rollear. Primero gira la ruleta del país; al frenar
   * hace la frenada dramática (`msFrenadoDramatico`), espera `msPausaEntreFases`
   * y recién ahí arranca la ruleta del año. Los jugadores aparecen tras la
   * frenada dramática del año.
   *
   * `pasos`     : cuántos cambios de valor se muestran antes de frenar.
   * `msInicial` : delay entre pasos al arrancar (rápido).
   * `msFinal`   : delay entre pasos justo antes de frenar (lento).
   * `curva`     : exponente de desaceleración; >1 frena más de golpe al final
   *               (sensación de rueda real). 1 = lineal.
   * `msFrenadoDramatico` : cuánto se mantiene el golpe de frenada antes de seguir.
   * `msPausaEntreFases`  : respiro entre que frena el país y arranca el año.
   * `msEntreCartas`      : demora entre que aparece cada jugador (de menor a
   *                        mayor media; el de mayor media aparece último).
   */
  rollAnimacion: {
    pasos: 22,
    msInicial: 28,
    msFinal: 300,
    curva: 2.6,
    msFrenadoDramatico: 520,
    msPausaEntreFases: 260,
    msEntreCartas: 600,
    /** Con Auto Roll activado, pausa antes de arrancar el siguiente ROLL solo. */
    msAutoRollSiguiente: 500,
  },

  /**
   * Revelado de cada carta del ROLL: cuanto más alto el nivel del jugador
   * (común -> raro -> épico -> leyenda -> élite, esta última para media >
   * `elite.umbralMedia`), más larga la espera previa (`msAnticipacion`,
   * mostrando el resplandor creciente en el lugar de la carta) y más
   * respiro hay después de revelarla (`msPausaFinal`) antes de pasar a la
   * siguiente. Común queda casi instantáneo a propósito: no hay que hacer
   * esperar al jugador por algo que no es especial.
   */
  revelacionCarta: {
    comun: { msAnticipacion: 120, msPausaFinal: 260 },
    raro: { msAnticipacion: 450, msPausaFinal: 320 },
    epico: { msAnticipacion: 950, msPausaFinal: 420 },
    leyenda: { msAnticipacion: 1600, msPausaFinal: 550 },
    elite: { msAnticipacion: 2400, msPausaFinal: 700 },
  },

  /**
   * Revelado secuencial de los 7 rivales del Mundial (tras fijarse el año),
   * uno por uno y en el mismo orden en el que se jugarán. Cada rival usa la
   * misma ruleta (`pasos`/`msInicial`/`msFinal`/`curva` de `rollAnimacion`)
   * y, al frenar, esperar `msPausaEntreRivales` antes de pasar al siguiente.
   */
  sorteoRivales: {
    /** Cuánto se mantiene el golpe de frenada de cada rival individual. */
    msFrenadoRival: 480,
    /** Pausa entre que un rival termina de revelarse y arranca el siguiente. */
    msPausaEntreRivales: 500,
    /** Pausa tras revelar el 7º rival, antes de mostrar la pantalla de decisión. */
    msPausaFinal: 700,
  },

  /**
   * Multiplicadores de velocidad disponibles para la ruleta (país/año) y el
   * reparto de cartas. El botón de velocidad cicla por esta lista en orden;
   * los tiempos de `rollAnimacion` son la base (x1) y se dividen por el
   * multiplicador activo.
   */
  velocidadesDisponibles: [1, 1.5, 2] as const,

  /**
   * Animación de "atención" en los botones del ROLL (roll / volver a sortear
   * país / volver a sortear año) cuando llevan un rato sin usarse: un empujón
   * corto y sutil ("podés hacer clic acá"), no un loop constante. Se arma
   * apenas el botón queda habilitado y se apaga apenas el jugador interactúa
   * (click o pasar el mouse). El resto del timing (duración del empujón, cada
   * cuánto se repite) vive en el keyframe CSS `atencion-pulso`.
   */
  atencionBoton: {
    umbralInactividadMs: 5000,
  },

  /**
   * Simulación en vivo de un partido del Mundial: 30s reales representan los
   * 90 minutos, repartidos en ticks de `intervaloMs`. En cada tick puede
   * pasar un evento (`probEvento`); si pasa, se decide gol vs tarjeta
   * (`probEventoGol`).
   *  - Gol: qué equipo lo convierte se pesa por el OVR relativo (`ventajaOvr`
   *    + `progresionDificultad` + `bonusElite`) — a más OVR, más chance real
   *    de marcar.
   *  - Tarjeta (ver `tarjetas`): a qué equipo se la sacan NO depende del OVR
   *    sino del marcador (`tarjetaPorMarcador`), el equipo que va perdiendo
   *    se juega más el físico. Antes ambas usaban la misma probabilidad de
   *    "protagonismo": el equipo mejor sacaba más goles Y más tarjetas en la
   *    misma proporción, sin el efecto compensador que tiene en la realidad
   *    (el que domina reparte menos patadas).
   */
  simulacionPartido: {
    /** Duración total del partido simulado, en ms (representa 90 minutos). */
    duracionMs: 30000,
    /**
     * Cuánto se espera en la pantalla del partido, ya terminado (`etapa
     * === "terminado"`), antes de pasar a la siguiente pantalla. Si ganó, se
     * espera bastante más (`victoria`): ahí es donde se muestra la animación
     * de victoria, directamente sobre la cancha del partido, y necesita
     * tiempo para lucirse. Si no ganó, sigue siendo la pausa corta de siempre.
     */
    demoraFinMs: {
      normal: 1500,
      victoria: 3400,
    },
    /**
     * Cada cuánto puede pasar un evento, en ms. Bajado de 2500 a 1700 (más
     * tiradas por partido) para que el resultado agregado refleje mejor la
     * diferencia de OVR: con pocos eventos por partido, un equipo claramente
     * superior podía perder solo por varianza aunque el sistema esté bien
     * calibrado en el agregado.
     */
    intervaloMs: 1700,
    /**
     * Probabilidad de que pase algo en un tick dado. Bajada de 0.4 a 0.3 al
     * compensar los ticks extra de arriba, para que la cantidad total de
     * eventos por partido no cambie mucho respecto de antes.
     */
    probEvento: 0.3,
    /** Si pasa algo, probabilidad de que sea gol (el resto, candidato a tarjeta). */
    probEventoGol: 0.55,

    /**
     * Tarjetas: bastante menos frecuentes que antes, y las rojas en
     * particular, muy raras — ya no deben verse en prácticamente todos los
     * partidos.
     *  - `probSiNoGol`: de los eventos que NO son gol, cuántos terminan
     *    siendo realmente una tarjeta (el resto queda en nada: una falta sin
     *    sanción, un roce sin consecuencia). Baja la cantidad total de
     *    tarjetas SIN tocar la frecuencia de gol, que no cambia.
     *  - `probAmarilla`: de las tarjetas que sí ocurren, cuántas son
     *    amarilla (el resto, roja directa) — subida para que la roja directa
     *    sea un evento excepcional.
     *  - `factorConAmarilla`: multiplica el peso de selección de un jugador
     *    que YA tiene una amarilla en este partido a la hora de elegir a
     *    quién le sacan la PRÓXIMA tarjeta de su equipo (amarilla o roja):
     *    bien por debajo de 1, para que cueste mucho más que le saquen otra.
     *    Nunca 0 (sigue siendo posible, solo mucho menos probable). Como
     *    consecuencia, la segunda amarilla — y la roja por doble amarilla —
     *    quedan naturalmente más raras, sin tocar esa regla en sí.
     */
    tarjetas: {
      probSiNoGol: 0.4,
      probAmarilla: 0.93,
      factorConAmarilla: 0.2,
    },

    /**
     * Cuánto resta al OVR del equipo cada tarjeta roja, solo por ese partido:
     * rendimientos decrecientes (la 1ª pesa más que la 2ª, esa más que la
     * 3ª...) y un tope relativo al OVR original del equipo, para que 2 o 3
     * rojas nunca lo dejen sin ninguna chance de remontar. Ver
     * `ovrConPenalizacion` / `deltaPorRoja`.
     */
    penalizacionTarjetaRoja: {
      porRoja: [4, 3, 2],
      topeFraccionOvr: 0.18,
    },

    /**
     * Reparto del GOL entre los dos equipos según la diferencia de OVR
     * `d = ovrUsuario - ovrRival` (ya con la penalización de rojas aplicada).
     * `d = 0` => 50/50. La ventaja crece con `tanh(d / escalaOvr)` y se satura
     * en `ventajaMax*` (nunca llega a 100%: siempre hay lugar para sorpresas y
     * remontadas). La curva es asimétrica a favor del equipo del usuario: a
     * igual diferencia, su ventaja pesa un poco más que la del rival.
     *  - usuario más fuerte: tope 50 + ventajaMaxUsuario  (0.22 => 72/28)
     *  - rival más fuerte:   tope 50 + ventajaMaxRival     (0.15 => 35/65)
     * Diferencia de ~3 puntos ya se percibe con claridad (~60/40).
     */
    ventajaOvr: {
      escalaOvr: 6,
      ventajaMaxUsuario: 0.22,
      ventajaMaxRival: 0.15,
    },

    /**
     * Curva de aprendizaje: un sesgo TEMPORAL que se SUMA a la probabilidad de
     * GOL del usuario (no reemplaza `ventajaOvr`). Favorece al usuario en sus
     * primeros partidos y decae con las victorias, pero sin llegar nunca a 0
     * (`bonusResidual`): como al ganar se pasa de partido, `numero = victorias
     * + 1`, así que sin un piso, justo semifinal/final (partido 6-7, el pico
     * de tensión del recorrido) coincidían con el sistema OVR puro Y con el
     * rival más fuerte posible (ver `dificultadSorteo`) — un combo demasiado
     * duro justo en el peor momento.
     *   bonus(numero) = bonusResidual +
     *     (bonusInicial - bonusResidual) * max(0, 1-(numero-1)/partidosHastaNormal)^curva
     */
    progresionDificultad: {
      bonusInicial: 0.14,
      bonusResidual: 0.04,
      partidosHastaNormal: 5,
      curva: 1,
    },

    /**
     * Bonus de GOL por jugadores de élite: media > `umbralMedia` (umbral de
     * JUEGO, distinto del umbral visual `elite.umbralMedia` de las cartas).
     * Por escalón, no continuo, y como mucho se cuenta 1 vez por rol aunque
     * haya varios jugadores que lo cumplan (para que no se acumule sin
     * límite):
     *  - Un delantero/medio propio de élite suma `bonusAtacante` a tu chance
     *    de gol.
     *  - Un arquero rival de élite te la resta (ataja más).
     *  - Un defensor rival de élite te la resta un poco (cuesta más
     *    superarlo).
     * Todo es simétrico: si el crack lo tiene el rival, el efecto es al
     * revés. La suma de estos ajustes se topea en `topeTotal` para que nunca
     * sea determinante por sí sola — sigue siendo un plus chico arriba del
     * OVR (que YA refleja a estos jugadores en su promedio); esto solo agrega
     * el "factor genio puntual" que un promedio de equipo no puede capturar.
     */
    bonusElite: {
      umbralMedia: 95,
      bonusAtacante: 0.05,
      bonusArquero: 0.05,
      bonusDefensor: 0.03,
      topeTotal: 0.12,
    },

    /**
     * A qué equipo se le saca la TARJETA: no depende del OVR (ver el
     * comentario de más arriba), sino de si va perdiendo. `base` 0.5 = si van
     * empatados, 50/50. Por cada gol de diferencia en contra suma
     * `porDiferenciaGol` a la chance de ser el sancionado, topeado en `tope`
     * para que ir perdiendo por goleada no vuelva la tarjeta casi segura.
     */
    tarjetaPorMarcador: {
      base: 0.5,
      porDiferenciaGol: 0.05,
      tope: 0.2,
    },

    /**
     * Autor del gol dentro del equipo que lo convierte: sorteo ponderado por
     * `media^exponenteMedia` entre los jugadores ofensivos disponibles (no
     * expulsados) — un crack convierte más seguido que un suplente, pero
     * nunca es el único que puede hacerlo.
     */
    golData: {
      exponenteMedia: 2,
    },

    /**
     * Asistencias: no todos los goles de juego tienen una (jugada individual,
     * córner mal defendido, etc.) — `probabilidad` es la fracción que sí.
     * Nunca hay asistencia en los penales (ni de juego ni de la tanda). Quién
     * la da se sortea entre los compañeros disponibles del goleador (nunca el
     * propio goleador), ponderado por `media^exponenteMedia` igual que el gol.
     */
    asistencias: {
      probabilidad: 0.65,
      exponenteMedia: 2,
    },

    /** Minutos de juego reglamentario (para calcular la duración real de la prórroga). */
    minutosReglamentarios: 90,
    /** Minutos que dura la prórroga si hay empate a los 90'. */
    minutosProrroga: 30,
    /** Cuántos penales patea cada equipo antes de pasar a muerte súbita. */
    penalesPorEquipo: 5,

    /**
     * Probabilidad de convertir un penal: ya no es fija para todos. Sale de
     * `probBase` ajustada por la diferencia de media entre el pateador y el
     * arquero rival (cada punto de diferencia suma/resta `porPuntoDiferencia`),
     * siempre dentro de `[probMin, probMax]` — ni el mejor pateador contra el
     * peor arquero es un gol garantizado, ni el peor pateador contra el mejor
     * arquero es un fracaso garantizado.
     */
    penales: {
      probBase: 0.78,
      porPuntoDiferencia: 0.012,
      probMin: 0.55,
      probMax: 0.9,
    },

    /**
     * Ritmo del revelado de la tanda de penales. Cada penal tiene dos beats:
     * primero se anuncia el pateador (`msAnticipacion`, se ve el nombre), luego
     * aparece el resultado y se hace una pausa (`msEntrePenales`) antes del
     * siguiente. Ambas pausas se multiplican por `multiplicadorDrama` según lo
     * decisivo del penal (ver `dramaDePenal`): un penal normal apenas se
     * ralentiza, uno que puede definir la serie se siente más lento y dramático.
     * La idea es sumar tensión sin que la tanda se vuelva larga.
     */
    penalesRitmo: {
      msPausaInicial: 720,
      msAnticipacion: 470,
      msEntrePenales: 560,
      msPausaFinal: 1450,
      multiplicadorDrama: { normal: 1, tenso: 1.5, decisivo: 2.1 },
    },
  },

  /**
   * Sorteo de rivales con dificultad progresiva. Para el partido `i` (1..7)
   * se busca un rival con OVR cercano a un "objetivo" que crece de forma
   * lineal desde `ovrObjetivoInicial` (partido 1) hasta `ovrObjetivoFinal`
   * (último partido). El peso de cada rival cae con una gaussiana de ancho
   * `escalaOvr` respecto a ese objetivo (más ancho = más azar). Al principio,
   * los rivales de `umbralFuerte`+ llevan el multiplicador `penalFuerteAlPrincipio`,
   * que se relaja gradualmente (en `partidosSinFuertes` partidos) hasta
   * `penalFuerteMinimo` — nunca hasta 1 (sin ninguna cautela): sin ese piso,
   * para semifinal/final ya no quedaba NADA de esa protección justo cuando el
   * objetivo de OVR está en su pico, el momento de mayor tensión.
   */
  dificultadSorteo: {
    ovrObjetivoInicial: 82,
    ovrObjetivoFinal: 100,
    escalaOvr: 6,
    umbralFuerte: 90,
    penalFuerteAlPrincipio: 0.05,
    penalFuerteMinimo: 0.7,
    partidosSinFuertes: 3,
  },
} as const;
