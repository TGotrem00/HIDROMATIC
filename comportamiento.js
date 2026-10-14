document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       ELEMENTOS DEL HTML
    ========================= */

    const btnVolverPerfil =
        document.getElementById("btn-volver-perfil");

    const nombrePlanta =
        document.getElementById("nombre-planta");

    const tipoPlanta =
        document.getElementById("tipo-planta");

    const humedadActual =
        document.getElementById("humedad-actual");

    const humedadMinima =
        document.getElementById("humedad-minima");

    const tiempoRiego =
        document.getElementById("tiempo-riego");

    const estadoIcono =
        document.getElementById("estado-icono");

    const estadoPlanta =
        document.getElementById("estado-planta");

    const cantidadRiegos =
        document.getElementById("cantidad-riegos");

    const ultimoRiego =
        document.getElementById("ultimo-riego");

    const mensajeComportamiento =
        document.getElementById("mensaje-comportamiento");

    const graficaHumedad =
        document.getElementById("grafica-humedad");

    const graficaRiegos =
        document.getElementById("grafica-riegos");

    const botonesFiltroHumedad =
        document.querySelectorAll(
            "[data-filtro-humedad]"
        );

    const botonesFiltroRiego =
        document.querySelectorAll(
            "[data-filtro-riego]"
        );


    /* =========================
       CONFIGURACIÓN BACKEND
    ========================= */

    const URL_BACKEND =
        "http://localhost:3000";


    /* =========================
       CONFIGURACIÓN SENSOR
    ========================= */

    const RAW_AIRE = 2550;
    const RAW_SECO = 2175;
    const RAW_MOJADO = 910;


    /* =========================
       CONFIGURACIÓN LECTURAS
    ========================= */

    const INTERVALO_GUARDADO =
        5 * 60 * 1000;

    let ultimaLecturaGuardada = 0;

    const INTERVALO_HISTORIAL =
        30 * 1000;


    /* =========================
       FILTROS ACTUALES
    ========================= */

    let filtroHumedadActual =
        "diario";

    let filtroRiegoActual =
        "diario";


    /* =========================
       IP ESP32
    ========================= */

    const IP_ESP32 =
        localStorage.getItem("IP_ESP32");


    /* =========================
       PLANTA SELECCIONADA
    ========================= */

    const plantaGuardada =
        localStorage.getItem(
            "HIDROMATIC_PLANTA_SELECCIONADA"
        );

    let planta = null;

    if (plantaGuardada) {
        try {
            planta =
                JSON.parse(
                    plantaGuardada
                );
        } catch (error) {
            console.error(
                "Error al leer la planta seleccionada:",
                error
            );

            planta = null;
        }
    }


    /* =========================
       COMPROBAR PLANTA
    ========================= */

    if (!planta) {
        mostrarSinPlanta();
        return;
    }


    /* =========================
       DATOS DE LA PLANTA
    ========================= */

    nombrePlanta.textContent =
        planta.nombre || "Mi planta";

    tipoPlanta.textContent =
        planta.tipo || "Tipo de planta";

    const minimo =
        Number(
            planta.humedadMinima ??
            planta.humedad_minima ??
            40
        );

    const tiempo =
        Number(
            planta.tiempoRiego ??
            planta.tiempo_riego ??
            5
        );

    humedadMinima.textContent =
        `${minimo}%`;

    tiempoRiego.textContent =
        `${tiempo} seg`;


    /* =========================
       MENSAJE
    ========================= */

    mensajeComportamiento.classList.add(
        "oculto"
    );


    /* =========================
       BOTÓN VOLVER
    ========================= */

    btnVolverPerfil.addEventListener(
        "click",
        () => {
            window.location.href =
                "perfil.html";
        }
    );


    /* =========================
       FILTROS HUMEDAD
    ========================= */

    botonesFiltroHumedad.forEach(
        (boton) => {

            boton.addEventListener(
                "click",
                () => {

                    filtroHumedadActual =
                        boton.dataset.filtroHumedad;

                    actualizarBotonesFiltro(
                        botonesFiltroHumedad,
                        filtroHumedadActual,
                        "filtroHumedad"
                    );

                    cargarHistorialHumedad();
                }
            );
        }
    );


    /* =========================
       FILTROS RIEGO
    ========================= */

    botonesFiltroRiego.forEach(
        (boton) => {

            boton.addEventListener(
                "click",
                () => {

                    filtroRiegoActual =
                        boton.dataset.filtroRiego;

                    actualizarBotonesFiltro(
                        botonesFiltroRiego,
                        filtroRiegoActual,
                        "filtroRiego"
                    );

                    cargarHistorialRiegos();
                }
            );
        }
    );


    /* =========================
       ACTIVAR FILTROS INICIALES
    ========================= */

    actualizarBotonesFiltro(
        botonesFiltroHumedad,
        filtroHumedadActual,
        "filtroHumedad"
    );

    actualizarBotonesFiltro(
        botonesFiltroRiego,
        filtroRiegoActual,
        "filtroRiego"
    );


    /* =========================
       CARGAR DATOS INICIALES
    ========================= */

    cargarHistorialHumedad();
    cargarHistorialRiegos();
    cargarResumenRiegos();


    /* =========================
       ACTUALIZACIÓN HISTORIAL
    ========================= */

    setInterval(
        () => {
            cargarHistorialHumedad();
            cargarHistorialRiegos();
            cargarResumenRiegos();
        },
        INTERVALO_HISTORIAL
    );


    /* =========================
       COMPROBAR IP ESP32
    ========================= */

    if (!IP_ESP32) {

        humedadActual.textContent =
            "--%";

        estadoIcono.textContent =
            "📡";

        estadoPlanta.textContent =
            "No hay una conexión configurada con el ESP32.";

        return;
    }


    /* =========================
       PRIMERA LECTURA
    ========================= */

    actualizarHumedad();


    /* =========================
       ACTUALIZAR CADA SEGUNDO
    ========================= */

    setInterval(
        () => {
            actualizarHumedad();
        },
        1000
    );


    /* =========================
       LEER HUMEDAD ESP32
    ========================= */

    async function actualizarHumedad() {

        try {

            const respuesta =
                await fetch(
                    `http://${IP_ESP32}/humedad`,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );

            if (!respuesta.ok) {
                throw new Error(
                    `HTTP ${respuesta.status}`
                );
            }

            const texto =
                await respuesta.text();

            const datos =
                interpretarRespuesta(
                    texto
                );

            if (!datos) {
                throw new Error(
                    "Respuesta de humedad no reconocida."
                );
            }

            const raw =
                datos.raw;

            const humedad =
                datos.humedad;


            /* =========================
               MOSTRAR HUMEDAD
            ========================= */

            if (
                humedad !== null &&
                Number.isFinite(humedad)
            ) {

                humedadActual.textContent =
                    `${Math.round(humedad)}%`;

            } else {

                humedadActual.textContent =
                    "--%";
            }


            /* =========================
               ESTADO
            ========================= */

            actualizarEstado(
                humedad,
                raw
            );


            /* =========================
               GUARDAR LECTURA
            ========================= */

            guardarLecturaSiCorresponde(
                humedad,
                raw
            );

        } catch (error) {

            console.error(
                "Error leyendo el ESP32:",
                error
            );

            humedadActual.textContent =
                "--%";

            estadoIcono.textContent =
                "📡";

            estadoPlanta.textContent =
                "No se pudo obtener información del sensor.";
        }
    }


    /* =========================
       GUARDAR LECTURA SQL
    ========================= */

    async function guardarLecturaSiCorresponde(
        humedad,
        raw
    ) {

        if (
            humedad === null ||
            !Number.isFinite(humedad)
        ) {
            return;
        }

        if (
            raw === null ||
            !Number.isFinite(raw)
        ) {
            return;
        }

        if (
            raw > RAW_SECO
        ) {
            return;
        }

        const modoOffline =
            localStorage.getItem(
                "HIDROMATIC_MODO_OFFLINE"
            ) === "true";

        if (modoOffline) {
            return;
        }

        const plantaId =
            Number(planta.id);

        if (
            !Number.isInteger(plantaId) ||
            plantaId <= 0
        ) {
            return;
        }

        const ahora =
            Date.now();

        if (
            ultimaLecturaGuardada !== 0 &&
            ahora - ultimaLecturaGuardada <
                INTERVALO_GUARDADO
        ) {
            return;
        }

        ultimaLecturaGuardada =
            ahora;

        try {

            const respuesta =
                await fetch(
                    `${URL_BACKEND}/lecturas`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                planta_id:
                                    plantaId,

                                humedad:
                                    Math.round(
                                        humedad
                                    ),

                                valor_sensor:
                                    Math.round(
                                        raw
                                    )
                            })
                    }
                );

            const datos =
                await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje ||
                    `HTTP ${respuesta.status}`
                );
            }

            console.log(
                "Lectura de humedad guardada:",
                datos.lectura
            );

            cargarHistorialHumedad();

        } catch (error) {

            console.error(
                "No se pudo guardar la lectura en SQL:",
                error
            );
        }
    }


    /* =========================
       CARGAR HISTORIAL HUMEDAD
    ========================= */

    async function cargarHistorialHumedad() {

        const modoOffline =
            localStorage.getItem(
                "HIDROMATIC_MODO_OFFLINE"
            ) === "true";

        if (modoOffline) {

            mostrarMensajeGrafica(
                graficaHumedad,
                "El historial de humedad no está disponible en modo offline.",
                "📊"
            );

            return;
        }

        const plantaId =
            Number(planta.id);

        if (
            !Number.isInteger(plantaId) ||
            plantaId <= 0
        ) {

            mostrarMensajeGrafica(
                graficaHumedad,
                "Esta planta no tiene un ID válido para consultar su historial.",
                "📊"
            );

            return;
        }

        try {

            const respuesta =
                await fetch(
                    `${URL_BACKEND}/lecturas/${plantaId}?filtro=${filtroHumedadActual}`,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );

            if (!respuesta.ok) {
                throw new Error(
                    `HTTP ${respuesta.status}`
                );
            }

            const datos =
                await respuesta.json();


            /*
             * El backend puede devolver:
             *
             * { lecturas: [...] }
             *
             * o directamente:
             *
             * [...]
             */

            const lecturas =
                extraerArray(
                    datos,
                    "lecturas"
                );


            console.log(
                `Lecturas ${filtroHumedadActual}:`,
                lecturas
            );


            dibujarGraficaHumedad(
                lecturas
            );

        } catch (error) {

            console.error(
                "No se pudo cargar el historial de humedad:",
                error
            );

            mostrarMensajeGrafica(
                graficaHumedad,
                "No se pudo cargar el historial de humedad.",
                "⚠️"
            );
        }
    }


    /* =========================
       CARGAR HISTORIAL RIEGOS
    ========================= */

    async function cargarHistorialRiegos() {

        const modoOffline =
            localStorage.getItem(
                "HIDROMATIC_MODO_OFFLINE"
            ) === "true";

        if (modoOffline) {

            mostrarMensajeGrafica(
                graficaRiegos,
                "El historial de riegos no está disponible en modo offline.",
                "💦"
            );

            return;
        }

        const plantaId =
            Number(planta.id);

        if (
            !Number.isInteger(plantaId) ||
            plantaId <= 0
        ) {

            mostrarMensajeGrafica(
                graficaRiegos,
                "Esta planta no tiene un ID válido para consultar sus riegos.",
                "💦"
            );

            return;
        }

        try {

            const respuesta =
                await fetch(
                    `${URL_BACKEND}/riegos/${plantaId}?filtro=${filtroRiegoActual}`,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );

            if (!respuesta.ok) {
                throw new Error(
                    `HTTP ${respuesta.status}`
                );
            }

            const datos =
                await respuesta.json();


            /*
             * El backend puede devolver:
             *
             * { riegos: [...] }
             *
             * o directamente:
             *
             * [...]
             */

            const riegos =
                extraerArray(
                    datos,
                    "riegos"
                );


            console.log(
                `Riegos ${filtroRiegoActual}:`,
                riegos
            );


            dibujarGraficaRiegos(
                riegos
            );

        } catch (error) {

            console.error(
                "No se pudo cargar el historial de riegos:",
                error
            );

            mostrarMensajeGrafica(
                graficaRiegos,
                "No se pudo cargar el historial de riegos.",
                "⚠️"
            );
        }
    }


    /* =========================
       EXTRAER ARRAYS DEL BACKEND
    ========================= */

    function extraerArray(
        datos,
        propiedad
    ) {

        if (Array.isArray(datos)) {
            return datos;
        }

        if (
            datos &&
            Array.isArray(datos[propiedad])
        ) {
            return datos[propiedad];
        }

        return [];
    }


    /* =========================
       RESUMEN RIEGOS
    ========================= */

    async function cargarResumenRiegos() {

        const modoOffline =
            localStorage.getItem(
                "HIDROMATIC_MODO_OFFLINE"
            ) === "true";

        if (modoOffline) {

            cantidadRiegos.textContent =
                "0";

            ultimoRiego.textContent =
                "--:--";

            return;
        }

        const plantaId =
            Number(planta.id);

        if (
            !Number.isInteger(plantaId) ||
            plantaId <= 0
        ) {

            cantidadRiegos.textContent =
                "0";

            ultimoRiego.textContent =
                "--:--";

            return;
        }

        try {

            const respuesta =
                await fetch(
                    `${URL_BACKEND}/riegos/${plantaId}/resumen`,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );

            if (!respuesta.ok) {
                throw new Error(
                    `HTTP ${respuesta.status}`
                );
            }

            const datos =
                await respuesta.json();


            cantidadRiegos.textContent =
                Number(
                    datos.riegos_realizados ?? 0
                );


            if (datos.ultimo_riego) {

                const fecha =
                    convertirFechaLocal(
                        datos.ultimo_riego
                    );

                if (fecha) {

                    ultimoRiego.textContent =
                        formatearFechaHora(
                            fecha
                        );

                } else {

                    ultimoRiego.textContent =
                        "--:--";
                }

            } else {

                ultimoRiego.textContent =
                    "--:--";
            }

        } catch (error) {

            console.error(
                "No se pudo cargar el resumen de riegos:",
                error
            );

            cantidadRiegos.textContent =
                "0";

            ultimoRiego.textContent =
                "--:--";
        }
    }


    /* =========================
       DIBUJAR GRÁFICA HUMEDAD
    ========================= */

    function dibujarGraficaHumedad(
        lecturas
    ) {

        if (!graficaHumedad) {
            return;
        }

        graficaHumedad.innerHTML =
            "";

        if (!lecturas.length) {

            mostrarMensajeGrafica(
                graficaHumedad,
                obtenerMensajeSinDatosHumedad(),
                "📊"
            );

            return;
        }

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.id =
            "canvas-humedad";

        canvas.style.position =
            "absolute";

        canvas.style.inset =
            "0";

        canvas.style.width =
            "100%";

        canvas.style.height =
            "100%";

        graficaHumedad.appendChild(
            canvas
        );

        const ancho =
            graficaHumedad.clientWidth || 600;

        const alto =
            graficaHumedad.clientHeight || 300;

        const pixelRatio =
            window.devicePixelRatio || 1;

        canvas.width =
            ancho * pixelRatio;

        canvas.height =
            alto * pixelRatio;

        const contexto =
            canvas.getContext("2d");

        contexto.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0
        );

        dibujarLineaHumedad(
            contexto,
            ancho,
            alto,
            lecturas
        );
    }


    /* =========================
       LÍNEA DE HUMEDAD
    ========================= */

    function dibujarLineaHumedad(
        contexto,
        ancho,
        alto,
        lecturas
    ) {

        const margenIzquierdo = 55;
        const margenDerecho = 20;
        const margenSuperior = 25;
        const margenInferior = 65;

        const anchoGrafica =
            ancho -
            margenIzquierdo -
            margenDerecho;

        const altoGrafica =
            alto -
            margenSuperior -
            margenInferior;

        contexto.clearRect(
            0,
            0,
            ancho,
            alto
        );


        /*
         * Normalización de las lecturas.
         *
         * Diario:
         * humedad
         * fecha_lectura
         *
         * Semanal/mensual:
         * humedad_promedio
         * fecha
         *
         * También aceptamos otras variantes
         * por seguridad.
         */

        const puntos =
            lecturas
                .map(
                    (lectura) => {

                        const humedad =
                            Number(
                                lectura.humedad ??
                                lectura.humedad_promedio ??
                                lectura.promedio_humedad ??
                                lectura.valor_humedad
                            );

                        const fechaOriginal =
                            lectura.fecha_lectura ??
                            lectura.fecha ??
                            lectura.dia ??
                            lectura.fecha_registro;

                        const fecha =
                            convertirFechaLocal(
                                fechaOriginal
                            );

                        if (
                            !Number.isFinite(
                                humedad
                            ) ||
                            !fecha
                        ) {
                            return null;
                        }

                        return {

                            humedad:
                                Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        humedad
                                    )
                                ),

                            fecha:
                                fecha
                        };
                    }
                )
                .filter(
                    punto =>
                        punto !== null
                );


        if (!puntos.length) {

            mostrarMensajeGrafica(
                graficaHumedad,
                "Los datos de humedad recibidos no contienen información válida para mostrar.",
                "📊"
            );

            return;
        }


        /* =========================
           EJES
        ========================= */

        contexto.strokeStyle =
            "#cbdacb";

        contexto.lineWidth =
            1;

        contexto.beginPath();

        contexto.moveTo(
            margenIzquierdo,
            margenSuperior
        );

        contexto.lineTo(
            margenIzquierdo,
            margenSuperior +
            altoGrafica
        );

        contexto.stroke();


        contexto.beginPath();

        contexto.moveTo(
            margenIzquierdo,
            margenSuperior +
            altoGrafica
        );

        contexto.lineTo(
            margenIzquierdo +
            anchoGrafica,
            margenSuperior +
            altoGrafica
        );

        contexto.stroke();


        /* =========================
           LÍNEAS HORIZONTALES
        ========================= */

        contexto.font =
            "12px Arial";

        contexto.textAlign =
            "right";

        contexto.textBaseline =
            "middle";

        for (
            let porcentaje = 0;
            porcentaje <= 100;
            porcentaje += 20
        ) {

            const y =
                margenSuperior +
                altoGrafica -
                (
                    porcentaje /
                    100
                ) *
                altoGrafica;

            contexto.strokeStyle =
                "#e4ebe5";

            contexto.beginPath();

            contexto.moveTo(
                margenIzquierdo,
                y
            );

            contexto.lineTo(
                margenIzquierdo +
                anchoGrafica,
                y
            );

            contexto.stroke();

            contexto.fillStyle =
                "#657268";

            contexto.fillText(
                `${porcentaje}%`,
                margenIzquierdo - 8,
                y
            );
        }


        /* =========================
           POSICIONES
        ========================= */

        const posiciones = [];

        puntos.forEach(
            (punto, indice) => {

                let x;

                if (
                    puntos.length === 1
                ) {

                    x =
                        margenIzquierdo +
                        anchoGrafica / 2;

                } else {

                    x =
                        margenIzquierdo +
                        (
                            indice /
                            (puntos.length - 1)
                        ) *
                        anchoGrafica;
                }

                const y =
                    margenSuperior +
                    altoGrafica -
                    (
                        punto.humedad /
                        100
                    ) *
                    altoGrafica;

                posiciones.push({

                    x,

                    y,

                    humedad:
                        punto.humedad,

                    fecha:
                        punto.fecha
                });
            }
        );


        /* =========================
           LÍNEA
        ========================= */

        if (
            posiciones.length > 1
        ) {

            contexto.strokeStyle =
                "#315c3b";

            contexto.lineWidth =
                3;

            contexto.lineJoin =
                "round";

            contexto.lineCap =
                "round";

            contexto.beginPath();

            posiciones.forEach(
                (punto, indice) => {

                    if (
                        indice === 0
                    ) {

                        contexto.moveTo(
                            punto.x,
                            punto.y
                        );

                    } else {

                        contexto.lineTo(
                            punto.x,
                            punto.y
                        );
                    }
                }
            );

            contexto.stroke();
        }


        /* =========================
           PUNTOS
        ========================= */

        posiciones.forEach(
            (punto) => {

                contexto.beginPath();

                contexto.arc(
                    punto.x,
                    punto.y,
                    5,
                    0,
                    Math.PI * 2
                );

                contexto.fillStyle =
                    "#315c3b";

                contexto.fill();

                contexto.strokeStyle =
                    "#ffffff";

                contexto.lineWidth =
                    2;

                contexto.stroke();
            }
        );


        /* =========================
           FECHAS Y HORAS
        ========================= */

        contexto.textAlign =
            "center";

        contexto.textBaseline =
            "top";

        posiciones.forEach(
            (punto, indice) => {

                const puntoAnterior =
                    posiciones[indice - 1];

                const cambioDeDia =
                    !puntoAnterior ||
                    !esMismoDia(
                        puntoAnterior.fecha,
                        punto.fecha
                    );

                if (
                    cambioDeDia
                ) {

                    contexto.font =
                        "bold 11px Arial";

                    contexto.fillStyle =
                        "#315c3b";

                    contexto.fillText(
                        formatearFecha(
                            punto.fecha
                        ),
                        punto.x,
                        margenSuperior +
                        altoGrafica +
                        8
                    );

                    contexto.font =
                        "11px Arial";

                    contexto.fillStyle =
                        "#657268";

                    contexto.fillText(
                        formatearHora(
                            punto.fecha
                        ),
                        punto.x,
                        margenSuperior +
                        altoGrafica +
                        23
                    );

                } else {

                    contexto.font =
                        "11px Arial";

                    contexto.fillStyle =
                        "#657268";

                    contexto.fillText(
                        formatearHora(
                            punto.fecha
                        ),
                        punto.x,
                        margenSuperior +
                        altoGrafica +
                        15
                    );
                }
            }
        );


        /* =========================
           VALOR HUMEDAD
        ========================= */

        contexto.font =
            "bold 12px Arial";

        contexto.textAlign =
            "center";

        contexto.textBaseline =
            "bottom";

        posiciones.forEach(
            (punto) => {

                contexto.fillStyle =
                    "#315c3b";

                contexto.fillText(
                    `${Math.round(punto.humedad)}%`,
                    punto.x,
                    punto.y - 10
                );
            }
        );
    }


    /* =========================
       DIBUJAR GRÁFICA RIEGOS
    ========================= */

    function dibujarGraficaRiegos(
        riegos
    ) {

        if (!graficaRiegos) {
            return;
        }

        graficaRiegos.innerHTML =
            "";

        if (!riegos.length) {

            mostrarMensajeGrafica(
                graficaRiegos,
                obtenerMensajeSinDatosRiegos(),
                "💦"
            );

            return;
        }

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.id =
            "canvas-riegos";

        canvas.style.position =
            "absolute";

        canvas.style.inset =
            "0";

        canvas.style.width =
            "100%";

        canvas.style.height =
            "100%";

        graficaRiegos.appendChild(
            canvas
        );

        const ancho =
            graficaRiegos.clientWidth || 600;

        const alto =
            graficaRiegos.clientHeight || 300;

        const pixelRatio =
            window.devicePixelRatio || 1;

        canvas.width =
            ancho * pixelRatio;

        canvas.height =
            alto * pixelRatio;

        const contexto =
            canvas.getContext("2d");

        contexto.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0
        );

        if (
            filtroRiegoActual ===
            "diario"
        ) {

            dibujarRiegosDiarios(
                contexto,
                ancho,
                alto,
                riegos
            );

        } else {

            dibujarRiegosAgrupados(
                contexto,
                ancho,
                alto,
                riegos
            );
        }
    }


    /* =========================
       RIEGOS DIARIOS
    ========================= */

    function dibujarRiegosDiarios(
        contexto,
        ancho,
        alto,
        riegos
    ) {

        const margenIzquierdo = 55;
        const margenDerecho = 20;
        const margenSuperior = 25;
        const margenInferior = 65;

        const anchoGrafica =
            ancho -
            margenIzquierdo -
            margenDerecho;

        const altoGrafica =
            alto -
            margenSuperior -
            margenInferior;


        const puntos =
            riegos
                .map(
                    (riego) => {

                        const fecha =
                            convertirFechaLocal(
                                riego.fecha_riego ??
                                riego.fecha ??
                                riego.fecha_registro
                            );

                        if (!fecha) {
                            return null;
                        }

                        return {
                            fecha
                        };
                    }
                )
                .filter(
                    punto =>
                        punto !== null
                );


        if (!puntos.length) {

            mostrarMensajeGrafica(
                graficaRiegos,
                "Los riegos recibidos no contienen una fecha válida para mostrar.",
                "💦"
            );

            return;
        }


        const posiciones = [];

        puntos.forEach(
            (punto, indice) => {

                let x;

                if (
                    puntos.length === 1
                ) {

                    x =
                        margenIzquierdo +
                        anchoGrafica / 2;

                } else {

                    x =
                        margenIzquierdo +
                        (
                            indice /
                            (puntos.length - 1)
                        ) *
                        anchoGrafica;
                }

                const y =
                    margenSuperior +
                    altoGrafica / 2;

                posiciones.push({

                    x,

                    y,

                    fecha:
                        punto.fecha
                });
            }
        );


        dibujarEjesRiegos(
            contexto,
            ancho,
            alto,
            margenIzquierdo,
            margenSuperior,
            anchoGrafica,
            altoGrafica
        );


        /* Línea */

        if (
            posiciones.length > 1
        ) {

            contexto.strokeStyle =
                "#315c3b";

            contexto.lineWidth =
                3;

            contexto.lineJoin =
                "round";

            contexto.lineCap =
                "round";

            contexto.beginPath();

            posiciones.forEach(
                (punto, indice) => {

                    if (
                        indice === 0
                    ) {

                        contexto.moveTo(
                            punto.x,
                            punto.y
                        );

                    } else {

                        contexto.lineTo(
                            punto.x,
                            punto.y
                        );
                    }
                }
            );

            contexto.stroke();
        }


        /* Puntos */

        posiciones.forEach(
            (punto) => {

                contexto.beginPath();

                contexto.arc(
                    punto.x,
                    punto.y,
                    6,
                    0,
                    Math.PI * 2
                );

                contexto.fillStyle =
                    "#315c3b";

                contexto.fill();

                contexto.strokeStyle =
                    "#ffffff";

                contexto.lineWidth =
                    2;

                contexto.stroke();
            }
        );


        /* Horas */

        contexto.textAlign =
            "center";

        contexto.textBaseline =
            "top";

        posiciones.forEach(
            (punto) => {

                contexto.font =
                    "bold 11px Arial";

                contexto.fillStyle =
                    "#315c3b";

                contexto.fillText(
                    formatearHora(
                        punto.fecha
                    ),
                    punto.x,
                    margenSuperior +
                    altoGrafica +
                    10
                );
            }
        );


        /* Título sobre cada punto */

        contexto.textBaseline =
            "bottom";

        contexto.font =
            "bold 11px Arial";

        contexto.fillStyle =
            "#315c3b";

        posiciones.forEach(
            (punto) => {

                contexto.fillText(
                    "Riego",
                    punto.x,
                    punto.y - 12
                );
            }
        );
    }


    /* =========================
       RIEGOS SEMANALES/MENSUALES
    ========================= */

    function dibujarRiegosAgrupados(
        contexto,
        ancho,
        alto,
        riegos
    ) {

        const margenIzquierdo = 55;
        const margenDerecho = 20;
        const margenSuperior = 25;
        const margenInferior = 65;

        const anchoGrafica =
            ancho -
            margenIzquierdo -
            margenDerecho;

        const altoGrafica =
            alto -
            margenSuperior -
            margenInferior;


        const puntos =
            riegos
                .map(
                    (riego) => {

                        const fecha =
                            convertirFechaLocal(
                                riego.fecha ??
                                riego.fecha_riego ??
                                riego.fecha_registro
                            );

                        const cantidad =
                            Number(
                                riego.cantidad_riegos ??
                                riego.cantidad ??
                                riego.total_riegos
                            );

                        if (
                            !fecha ||
                            !Number.isFinite(
                                cantidad
                            )
                        ) {
                            return null;
                        }

                        return {

                            fecha,

                            cantidad
                        };
                    }
                )
                .filter(
                    punto =>
                        punto !== null
                );


        if (!puntos.length) {

            mostrarMensajeGrafica(
                graficaRiegos,
                "Los datos de riegos recibidos no contienen información válida para mostrar.",
                "💦"
            );

            return;
        }


        const maximo =
            Math.max(
                ...puntos.map(
                    punto =>
                        punto.cantidad
                ),
                1
            );


        const posiciones = [];

        puntos.forEach(
            (punto, indice) => {

                let x;

                if (
                    puntos.length === 1
                ) {

                    x =
                        margenIzquierdo +
                        anchoGrafica / 2;

                } else {

                    x =
                        margenIzquierdo +
                        (
                            indice /
                            (puntos.length - 1)
                        ) *
                        anchoGrafica;
                }

                const y =
                    margenSuperior +
                    altoGrafica -
                    (
                        punto.cantidad /
                        maximo
                    ) *
                    altoGrafica;

                posiciones.push({

                    x,

                    y,

                    fecha:
                        punto.fecha,

                    cantidad:
                        punto.cantidad
                });
            }
        );


        dibujarEjesRiegos(
            contexto,
            ancho,
            alto,
            margenIzquierdo,
            margenSuperior,
            anchoGrafica,
            altoGrafica
        );


        /* Línea */

        if (
            posiciones.length > 1
        ) {

            contexto.strokeStyle =
                "#315c3b";

            contexto.lineWidth =
                3;

            contexto.lineJoin =
                "round";

            contexto.lineCap =
                "round";

            contexto.beginPath();

            posiciones.forEach(
                (punto, indice) => {

                    if (
                        indice === 0
                    ) {

                        contexto.moveTo(
                            punto.x,
                            punto.y
                        );

                    } else {

                        contexto.lineTo(
                            punto.x,
                            punto.y
                        );
                    }
                }
            );

            contexto.stroke();
        }


        /* Puntos */

        posiciones.forEach(
            (punto) => {

                contexto.beginPath();

                contexto.arc(
                    punto.x,
                    punto.y,
                    6,
                    0,
                    Math.PI * 2
                );

                contexto.fillStyle =
                    "#315c3b";

                contexto.fill();

                contexto.strokeStyle =
                    "#ffffff";

                contexto.lineWidth =
                    2;

                contexto.stroke();
            }
        );


        /* Cantidad */

        contexto.textAlign =
            "center";

        contexto.textBaseline =
            "bottom";

        contexto.font =
            "bold 11px Arial";

        posiciones.forEach(
            (punto) => {

                contexto.fillStyle =
                    "#315c3b";

                contexto.fillText(
                    `${punto.cantidad} riego${punto.cantidad === 1 ? "" : "s"}`,
                    punto.x,
                    punto.y - 11
                );
            }
        );


        /* Fechas */

        contexto.textBaseline =
            "top";

        contexto.font =
            "11px Arial";

        posiciones.forEach(
            (punto) => {

                contexto.fillStyle =
                    "#657268";

                contexto.fillText(
                    formatearFecha(
                        punto.fecha
                    ),
                    punto.x,
                    margenSuperior +
                    altoGrafica +
                    12
                );
            }
        );
    }


    /* =========================
       EJES RIEGOS
    ========================= */

    function dibujarEjesRiegos(
        contexto,
        ancho,
        alto,
        margenIzquierdo,
        margenSuperior,
        anchoGrafica,
        altoGrafica
    ) {

        contexto.clearRect(
            0,
            0,
            ancho,
            alto
        );


        /* Eje vertical */

        contexto.strokeStyle =
            "#cbdacb";

        contexto.lineWidth =
            1;

        contexto.beginPath();

        contexto.moveTo(
            margenIzquierdo,
            margenSuperior
        );

        contexto.lineTo(
            margenIzquierdo,
            margenSuperior +
            altoGrafica
        );

        contexto.stroke();


        /* Eje horizontal */

        contexto.beginPath();

        contexto.moveTo(
            margenIzquierdo,
            margenSuperior +
            altoGrafica
        );

        contexto.lineTo(
            margenIzquierdo +
            anchoGrafica,
            margenSuperior +
            altoGrafica
        );

        contexto.stroke();


        /* Líneas */

        for (
            let i = 0;
            i <= 4;
            i++
        ) {

            const y =
                margenSuperior +
                (
                    i / 4
                ) *
                altoGrafica;

            contexto.strokeStyle =
                "#e4ebe5";

            contexto.beginPath();

            contexto.moveTo(
                margenIzquierdo,
                y
            );

            contexto.lineTo(
                margenIzquierdo +
                anchoGrafica,
                y
            );

            contexto.stroke();
        }
    }


    /* =========================
       ACTUALIZAR BOTONES FILTRO
    ========================= */

    function actualizarBotonesFiltro(
        botones,
        filtro,
        atributo
    ) {

        botones.forEach(
            (boton) => {

                let valor;

                if (
                    atributo ===
                    "filtroHumedad"
                ) {

                    valor =
                        boton.dataset.filtroHumedad;

                } else {

                    valor =
                        boton.dataset.filtroRiego;
                }

                if (
                    valor === filtro
                ) {

                    boton.classList.add(
                        "activo"
                    );

                } else {

                    boton.classList.remove(
                        "activo"
                    );
                }
            }
        );
    }


    /* =========================
       MENSAJES SIN DATOS
    ========================= */

    function obtenerMensajeSinDatosHumedad() {

        if (
            filtroHumedadActual ===
            "diario"
        ) {

            return "Aún no hay lecturas de humedad registradas hoy.";
        }

        if (
            filtroHumedadActual ===
            "semanal"
        ) {

            return "Aún no hay suficientes lecturas para mostrar esta semana.";
        }

        return "Aún no hay suficientes lecturas para mostrar este mes.";
    }


    function obtenerMensajeSinDatosRiegos() {

        if (
            filtroRiegoActual ===
            "diario"
        ) {

            return "Aún no hay riegos registrados hoy.";
        }

        if (
            filtroRiegoActual ===
            "semanal"
        ) {

            return "No hay riegos registrados en los últimos 7 días.";
        }

        return "No hay riegos registrados en los últimos 30 días.";
    }


    /* =========================
       MENSAJE GRÁFICA
    ========================= */

    function mostrarMensajeGrafica(
        elementoGrafica,
        mensaje,
        iconoTexto
    ) {

        if (!elementoGrafica) {
            return;
        }

        elementoGrafica.innerHTML =
            "";

        const mensajeContenedor =
            document.createElement(
                "div"
            );

        mensajeContenedor.className =
            "grafica-mensaje";


        const icono =
            document.createElement(
                "span"
            );

        icono.textContent =
            iconoTexto;


        const texto =
            document.createElement(
                "p"
            );

        texto.textContent =
            mensaje;


        mensajeContenedor.appendChild(
            icono
        );

        mensajeContenedor.appendChild(
            texto
        );

        elementoGrafica.appendChild(
            mensajeContenedor
        );
    }


    /* =========================
       MISMO DÍA
    ========================= */

    function esMismoDia(
        fecha1,
        fecha2
    ) {

        return (
            fecha1.getFullYear() ===
                fecha2.getFullYear() &&

            fecha1.getMonth() ===
                fecha2.getMonth() &&

            fecha1.getDate() ===
                fecha2.getDate()
        );
    }


    /* =========================
       CONVERTIR FECHA LOCAL
    ========================= */

    function convertirFechaLocal(
        fecha
    ) {

        if (!fecha) {
            return null;
        }

        if (
            fecha instanceof Date
        ) {

            if (
                Number.isNaN(
                    fecha.getTime()
                )
            ) {
                return null;
            }

            return fecha;
        }


        const texto =
            String(fecha);


        /*
         * SQL Server entrega normalmente:
         *
         * YYYY-MM-DDTHH:mm:ss.mmm
         *
         * Sin zona horaria.
         *
         * Se interpreta como hora de Colombia.
         */

        if (
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(
                texto
            ) &&
            !/[zZ]|[+-]\d{2}:\d{2}$/.test(
                texto
            )
        ) {

            const fechaColombia =
                new Date(
                    `${texto}-05:00`
                );

            if (
                !Number.isNaN(
                    fechaColombia.getTime()
                )
            ) {

                return fechaColombia;
            }
        }


        const fechaNormal =
            new Date(texto);

        if (
            Number.isNaN(
                fechaNormal.getTime()
            )
        ) {

            return null;
        }

        return fechaNormal;
    }


    /* =========================
       FORMATEAR FECHA
    ========================= */

    function formatearFecha(
        fecha
    ) {

        if (
            !(fecha instanceof Date) ||
            Number.isNaN(
                fecha.getTime()
            )
        ) {

            return "--";
        }

        return fecha.toLocaleDateString(
            "es-CO",
            {
                day: "2-digit",
                month: "short"
            }
        );
    }


    /* =========================
       FORMATEAR HORA
    ========================= */

    function formatearHora(
        fecha
    ) {

        if (
            !(fecha instanceof Date) ||
            Number.isNaN(
                fecha.getTime()
            )
        ) {

            return "--";
        }

        return fecha.toLocaleTimeString(
            "es-CO",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    /* =========================
       FECHA + HORA
    ========================= */

    function formatearFechaHora(
        fecha
    ) {

        if (
            !(fecha instanceof Date) ||
            Number.isNaN(
                fecha.getTime()
            )
        ) {

            return "--:--";
        }

        return (
            formatearFecha(fecha) +
            " · " +
            formatearHora(fecha)
        );
    }


    /* =========================
       INTERPRETAR RESPUESTA ESP32
    ========================= */

    function interpretarRespuesta(
        texto
    ) {

        texto =
            texto.trim();

        if (!texto) {
            return null;
        }


        /* =========================
           INTENTAR JSON
        ========================= */

        try {

            const datos =
                JSON.parse(texto);

            let raw = null;
            let humedad = null;


            if (
                typeof datos.raw ===
                "number"
            ) {

                raw =
                    datos.raw;

            } else if (
                typeof datos.valor_sensor ===
                "number"
            ) {

                raw =
                    datos.valor_sensor;

            } else if (
                typeof datos.humedadRaw ===
                "number"
            ) {

                raw =
                    datos.humedadRaw;

            } else if (
                typeof datos.sensor ===
                "number"
            ) {

                raw =
                    datos.sensor;
            }


            if (
                typeof datos.humedad ===
                "number"
            ) {

                humedad =
                    datos.humedad;

            } else if (
                typeof datos.porcentaje ===
                "number"
            ) {

                humedad =
                    datos.porcentaje;
            }


            if (
                humedad === null &&
                raw !== null
            ) {

                humedad =
                    convertirHumedad(raw);
            }


            return {
                raw,
                humedad
            };

        } catch (error) {
            /* No era JSON */
        }


        /* =========================
           RESPUESTA TEXTO
        ========================= */

        let raw = null;
        let humedad = null;


        const coincidenciaRaw =
            texto.match(
                /HUMEDAD_RAW\s*:\s*(-?\d+(?:\.\d+)?)/i
            );

        if (
            coincidenciaRaw
        ) {

            raw =
                Number(
                    coincidenciaRaw[1]
                );
        }


        const coincidenciaHumedad =
            texto.match(
                /HUMEDAD\s*:\s*(-?\d+(?:\.\d+)?)/i
            );

        if (
            coincidenciaHumedad
        ) {

            humedad =
                Number(
                    coincidenciaHumedad[1]
                );
        }


        if (
            raw === null &&
            humedad === null &&
            /^-?\d+(?:\.\d+)?$/.test(
                texto
            )
        ) {

            raw =
                Number(texto);
        }


        if (
            humedad === null &&
            raw !== null
        ) {

            humedad =
                convertirHumedad(raw);
        }


        if (
            raw === null &&
            humedad === null
        ) {

            return null;
        }


        return {
            raw,
            humedad
        };
    }


    /* =========================
       CONVERTIR RAW A %
    ========================= */

    function convertirHumedad(
        raw
    ) {

        if (
            raw > RAW_SECO
        ) {

            return null;
        }

        const valor =
            Math.min(
                RAW_SECO,
                Math.max(
                    RAW_MOJADO,
                    raw
                )
            );

        const porcentaje =
            (
                (
                    RAW_SECO -
                    valor
                ) /
                (
                    RAW_SECO -
                    RAW_MOJADO
                )
            ) *
            100;

        return Math.round(
            Math.max(
                0,
                Math.min(
                    100,
                    porcentaje
                )
            )
        );
    }


    /* =========================
       ACTUALIZAR ESTADO
    ========================= */

    function actualizarEstado(
        humedad,
        raw
    ) {

        if (
            raw !== null &&
            raw > RAW_SECO
        ) {

            estadoIcono.textContent =
                "⚠️";

            estadoPlanta.textContent =
                "Introduzca el sensor en la tierra.";

            return;
        }


        if (
            humedad === null ||
            !Number.isFinite(humedad)
        ) {

            estadoIcono.textContent =
                "📡";

            estadoPlanta.textContent =
                "Esperando información del sensor.";

            return;
        }


        if (
            humedad < minimo
        ) {

            estadoIcono.textContent =
                "💧";

            estadoPlanta.textContent =
                "La planta necesita riego.";

            return;
        }


        estadoIcono.textContent =
            "🌱";

        estadoPlanta.textContent =
            "La humedad de la planta es adecuada.";
    }


    /* =========================
       SIN PLANTA
    ========================= */

    function mostrarSinPlanta() {

        nombrePlanta.textContent =
            "Sin planta seleccionada";

        tipoPlanta.textContent =
            "Selecciona una planta desde tu perfil.";

        humedadActual.textContent =
            "--%";

        humedadMinima.textContent =
            "--%";

        tiempoRiego.textContent =
            "-- seg";

        estadoIcono.textContent =
            "🌱";

        estadoPlanta.textContent =
            "No hay ninguna planta seleccionada.";

        cantidadRiegos.textContent =
            "0";

        ultimoRiego.textContent =
            "--:--";

        mensajeComportamiento.classList.remove(
            "oculto"
        );
    }


    /* =========================
       REDIBUJAR AL CAMBIAR
       TAMAÑO DE VENTANA
    ========================= */

    window.addEventListener(
        "resize",
        () => {

            cargarHistorialHumedad();

            cargarHistorialRiegos();
        }
    );

});