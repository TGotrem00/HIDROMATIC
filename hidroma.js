document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       ELEMENTOS DE HIDROMA
       ========================= */

    const botonHidroma =
        document.getElementById("hidroma-boton");

    const ventanaHidroma =
        document.getElementById("hidroma-ventana");

    const botonCerrar =
        document.getElementById("hidroma-cerrar");

    const mensajesHidroma =
        document.getElementById("hidroma-mensajes");

    const formulario =
        document.getElementById("hidroma-form");

    const entrada =
        document.getElementById("hidroma-input");


    /* Navegación */

    const chat =
        document.getElementById("hidroma-chat");

    const archivoVista =
        document.getElementById("hidroma-archivo");

    const botonChat =
        document.getElementById("hidroma-chat-btn");

    const botonArchivo =
        document.getElementById("hidroma-archivo-btn");

    const botonVolverChat =
        document.getElementById("hidroma-volver-chat");

    const listaConversaciones =
        document.getElementById(
            "hidroma-lista-conversaciones"
        );


    /* =========================
       CONFIGURACIÓN BACKEND
       ========================= */

    const URL_BACKEND =
        "http://localhost:3000";


    /* =========================
       COMPROBAR ELEMENTOS
       ========================= */

    if (!botonHidroma || !ventanaHidroma) {
        return;
    }


    /* =========================
       FECHA ACTUAL
       ========================= */

    function obtenerFechaActual() {

        const ahora = new Date();

        const año =
            ahora.getFullYear();

        const mes =
            String(ahora.getMonth() + 1)
                .padStart(2, "0");

        const dia =
            String(ahora.getDate())
                .padStart(2, "0");

        return `${año}-${mes}-${dia}`;
    }


    const fechaActual =
        obtenerFechaActual();


    /* =========================
       ARCHIVO DE CONVERSACIONES
       ========================= */

    function obtenerArchivo() {

        const archivoGuardado =
            localStorage.getItem(
                "HIDROMA_CONVERSACIONES"
            );

        if (!archivoGuardado) {
            return {};
        }

        try {

            return JSON.parse(
                archivoGuardado
            );

        } catch (error) {

            console.error(
                "No se pudo leer el archivo de Hidroma:",
                error
            );

            return {};
        }
    }


    function guardarArchivo(archivo) {

        localStorage.setItem(
            "HIDROMA_CONVERSACIONES",
            JSON.stringify(archivo)
        );
    }


    /* =========================
       OBTENER USUARIO ACTUAL
       ========================= */

    function obtenerUsuarioActual() {

        const usuarioGuardado =
            localStorage.getItem(
                "HIDROMATIC_USUARIO"
            );

        if (!usuarioGuardado) {
            return null;
        }

        try {

            return JSON.parse(
                usuarioGuardado
            );

        } catch (error) {

            console.error(
                "No se pudo leer el usuario de HIDROMATIC:",
                error
            );

            return null;
        }
    }


    /* =========================
       OBTENER PLANTA SELECCIONADA
       ========================= */

    function obtenerPlantaSeleccionada() {

        const plantaGuardada =
            localStorage.getItem(
                "HIDROMATIC_PLANTA_SELECCIONADA"
            );

        if (!plantaGuardada) {
            return null;
        }

        try {

            return JSON.parse(
                plantaGuardada
            );

        } catch (error) {

            console.error(
                "No se pudo leer la planta seleccionada:",
                error
            );

            return null;
        }
    }


    /* =========================
       ID DE CONVERSACIÓN
       ========================= */

    function obtenerIdConversacion() {

        const archivo =
            obtenerArchivo();

        const conversacion =
            archivo[fechaActual];

        if (
            conversacion &&
            conversacion.conversacion_id
        ) {

            return conversacion.conversacion_id;

        }

        return null;
    }


    function guardarIdConversacion(
        conversacionId
    ) {

        if (!conversacionId) {
            return;
        }

        const archivo =
            obtenerArchivo();


        if (!archivo[fechaActual]) {

            archivo[fechaActual] = {

                fecha: fechaActual,

                mensajes: []

            };
        }


        archivo[fechaActual].conversacion_id =
            conversacionId;


        guardarArchivo(archivo);
    }


    /* =========================
       CREAR CONVERSACIÓN DEL DÍA
       ========================= */

    let archivo =
        obtenerArchivo();


    if (!archivo[fechaActual]) {

        archivo[fechaActual] = {

            fecha: fechaActual,

            conversacion_id: null,

            mensajes: [

                {
                    autor: "bot",

                    texto:
                        "¡Hola! 👋 Soy Hidroma. Estoy aquí para ayudarte con tu planta y con Hidromatic."
                }

            ]

        };

        guardarArchivo(archivo);

    } else {

        /*
         * Compatibilidad con conversaciones
         * creadas con la versión anterior.
         */

        if (
            !Object.prototype.hasOwnProperty.call(
                archivo[fechaActual],
                "conversacion_id"
            )
        ) {

            archivo[fechaActual].conversacion_id =
                null;

            guardarArchivo(archivo);
        }
    }


    /* =========================
       PROCESAR MARKDOWN
       ========================= */

    function escaparHTML(texto) {

        const div =
            document.createElement("div");

        div.textContent =
            texto;

        return div.innerHTML;
    }


    function procesarMarkdown(texto) {

        if (!texto) {
            return "";
        }


        /*
         * Primero escapamos cualquier HTML.
         * Esto evita que una respuesta pueda
         * ejecutar código dentro de la página.
         */

        let contenido =
            escaparHTML(String(texto));


        /*
         * Saltos de línea.
         */

        contenido =
            contenido.replace(
                /\r\n/g,
                "\n"
            );


        /*
         * Código en línea:
         * `texto`
         */

        contenido =
            contenido.replace(
                /`([^`\n]+)`/g,
                "<code>$1</code>"
            );


        /*
         * Negrilla:
         * **texto**
         */

        contenido =
            contenido.replace(
                /\*\*([^*\n]+)\*\*/g,
                "<strong>$1</strong>"
            );


        /*
         * Cursiva:
         * *texto*
         */

        contenido =
            contenido.replace(
                /(^|[^\*])\*([^*\n]+)\*(?!\*)/g,
                "$1<em>$2</em>"
            );


        /*
         * Cursiva con guion bajo:
         * _texto_
         */

        contenido =
            contenido.replace(
                /(^|[^\w])_([^_\n]+)_(?!\w)/g,
                "$1<em>$2</em>"
            );


        /*
         * Listas con guiones:
         *
         * - Elemento
         * - Elemento
         */

        contenido =
            contenido.replace(
                /(?:^|\n)(?:- ([^\n]+)(?:\n|$))+/g,
                bloque => {

                    const elementos =
                        bloque
                            .trim()
                            .split("\n")
                            .map(
                                linea =>
                                    linea.replace(
                                        /^-\s+/,
                                        ""
                                    )
                            );

                    return (
                        "\n<ul>" +
                        elementos
                            .map(
                                elemento =>
                                    `<li>${elemento}</li>`
                            )
                            .join("") +
                        "</ul>\n"
                    );
                }
            );


        /*
         * Listas numeradas:
         *
         * 1. Elemento
         * 2. Elemento
         */

        contenido =
            contenido.replace(
                /(?:^|\n)(?:\d+\.\s+[^\n]+(?:\n|$))+/g,
                bloque => {

                    const elementos =
                        bloque
                            .trim()
                            .split("\n")
                            .map(
                                linea =>
                                    linea.replace(
                                        /^\d+\.\s+/,
                                        ""
                                    )
                            );

                    return (
                        "\n<ol>" +
                        elementos
                            .map(
                                elemento =>
                                    `<li>${elemento}</li>`
                            )
                            .join("") +
                        "</ol>\n"
                    );
                }
            );


        /*
         * Enlaces Markdown:
         *
         * [texto](https://ejemplo.com)
         *
         * Solo permitimos http y https.
         */

        contenido =
            contenido.replace(
                /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                (coincidencia, textoEnlace, url) => {

                    return (
                        `<a href="${url}" ` +
                        `target="_blank" ` +
                        `rel="noopener noreferrer">` +
                        `${textoEnlace}` +
                        `</a>`
                    );
                }
            );


        /*
         * URLs escritas directamente.
         */

        contenido =
            contenido.replace(
                /(^|[\s>])(https?:\/\/[^\s<]+)/g,
                (coincidencia, inicio, url) => {

                    /*
                     * Evitamos volver a convertir un enlace
                     * que ya haya sido generado.
                     */

                    if (
                        inicio.includes(">")
                    ) {
                        return coincidencia;
                    }

                    return (
                        `${inicio}` +
                        `<a href="${url}" ` +
                        `target="_blank" ` +
                        `rel="noopener noreferrer">` +
                        `${url}` +
                        `</a>`
                    );
                }
            );


        /*
         * Convertimos saltos de línea normales
         * en saltos HTML.
         */

        contenido =
            contenido.replace(
                /\n/g,
                "<br>"
            );


        /*
         * Evitamos que los <br> inmediatamente
         * alrededor de listas generen espacios
         * innecesarios.
         */

        contenido =
            contenido
                .replace(
                    /<br>\s*<ul>/g,
                    "<ul>"
                )
                .replace(
                    /<\/ul>\s*<br>/g,
                    "</ul>"
                )
                .replace(
                    /<br>\s*<ol>/g,
                    "<ol>"
                )
                .replace(
                    /<\/ol>\s*<br>/g,
                    "</ol>"
                );


        return contenido;
    }


    /* =========================
       MOSTRAR MENSAJE
       ========================= */

    function mostrarMensaje(
        texto,
        autor
    ) {

        const mensaje =
            document.createElement("div");

        mensaje.classList.add(
            "hidroma-mensaje"
        );

        mensaje.classList.add(
            autor
        );


        /*
         * Las respuestas de Hidroma pueden
         * contener Markdown.
         */

        if (autor === "bot") {

            mensaje.innerHTML =
                procesarMarkdown(texto);

        } else {

            /*
             * Los mensajes del usuario siempre
             * se muestran como texto normal.
             */

            mensaje.textContent =
                texto;
        }


        mensajesHidroma.appendChild(
            mensaje
        );

        mensajesHidroma.scrollTop =
            mensajesHidroma.scrollHeight;
    }


    /* =========================
       CARGAR CONVERSACIÓN
       ========================= */

    function cargarConversacion(
        fecha
    ) {

        archivo =
            obtenerArchivo();

        const conversacion =
            archivo[fecha];

        if (!conversacion) {
            return;
        }


        mensajesHidroma.innerHTML = "";


        if (
            !conversacion.mensajes ||
            conversacion.mensajes.length === 0
        ) {

            mostrarMensaje(
                "¡Hola! 👋 Soy Hidroma. Estoy aquí para ayudarte con tu planta y con Hidromatic.",
                "bot"
            );

            return;
        }


        conversacion.mensajes.forEach(
            mensaje => {

                mostrarMensaje(
                    mensaje.texto,
                    mensaje.autor
                );

            }
        );
    }


    /* =========================
       GUARDAR MENSAJE
       ========================= */

    function guardarMensaje(
        fecha,
        texto,
        autor
    ) {

        archivo =
            obtenerArchivo();


        if (!archivo[fecha]) {

            archivo[fecha] = {

                fecha: fecha,

                conversacion_id: null,

                mensajes: []

            };
        }


        archivo[fecha].mensajes.push({

            autor: autor,

            texto: texto

        });


        guardarArchivo(archivo);
    }


    /* =========================
       FORMATEAR FECHA
       ========================= */

    function formatearFecha(
        fecha
    ) {

        const partes =
            fecha.split("-");

        const año =
            Number(partes[0]);

        const mes =
            Number(partes[1]) - 1;

        const dia =
            Number(partes[2]);


        const fechaObjeto =
            new Date(
                año,
                mes,
                dia
            );


        return fechaObjeto.toLocaleDateString(
            "es-CO",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }


    /* =========================
       CREAR ELEMENTO CONVERSACIÓN
       ========================= */

    function crearElementoConversacion(
        fecha
    ) {

        const conversacion =
            archivo[fecha];

        const boton =
            document.createElement("button");

        boton.type = "button";

        boton.classList.add(
            "hidroma-conversacion"
        );


        /* Fecha */

        const fechaTexto =
            document.createElement("span");

        fechaTexto.classList.add(
            "hidroma-conversacion-fecha"
        );

        fechaTexto.textContent =
            "📅 " +
            formatearFecha(fecha);


        /* Vista previa */

        const preview =
            document.createElement("span");

        preview.classList.add(
            "hidroma-conversacion-preview"
        );


        if (
            conversacion &&
            conversacion.mensajes &&
            conversacion.mensajes.length > 0
        ) {

            const ultimoMensaje =
                conversacion.mensajes[
                    conversacion.mensajes.length - 1
                ];

            preview.textContent =
                ultimoMensaje.texto;

        } else {

            preview.textContent =
                "Conversación vacía";
        }


        boton.appendChild(
            fechaTexto
        );

        boton.appendChild(
            preview
        );


        /* Abrir conversación */

        boton.addEventListener(
            "click",
            () => {

                cargarConversacion(
                    fecha
                );

                mostrarChat();

            }
        );


        return boton;
    }


    /* =========================
       MOSTRAR ARCHIVO
       ========================= */

    function mostrarArchivo() {

        if (!archivoVista) {
            return;
        }


        archivo =
            obtenerArchivo();


        listaConversaciones.innerHTML = "";


        const fechas =
            Object.keys(archivo)
                .sort()
                .reverse();


        if (fechas.length === 0) {

            const vacio =
                document.createElement("div");

            vacio.classList.add(
                "hidroma-archivo-vacio"
            );

            vacio.textContent =
                "Todavía no tienes conversaciones guardadas.";

            listaConversaciones.appendChild(
                vacio
            );

            return;
        }


        /* =========================
           CONVERSACIÓN DE HOY
           ========================= */

        if (
            archivo[fechaActual]
        ) {

            const tituloHoy =
                document.createElement("div");

            tituloHoy.classList.add(
                "hidroma-archivo-titulo"
            );

            tituloHoy.textContent =
                "Hoy";


            listaConversaciones.appendChild(
                tituloHoy
            );


            listaConversaciones.appendChild(
                crearElementoConversacion(
                    fechaActual
                )
            );
        }


        /* =========================
           CONVERSACIONES ANTERIORES
           ========================= */

        const anteriores =
            fechas.filter(
                fecha =>
                    fecha !== fechaActual
            );


        if (anteriores.length > 0) {

            const tituloAnteriores =
                document.createElement("div");

            tituloAnteriores.classList.add(
                "hidroma-archivo-titulo"
            );

            tituloAnteriores.textContent =
                "Anteriores";


            listaConversaciones.appendChild(
                tituloAnteriores
            );


            anteriores.forEach(
                fecha => {

                    listaConversaciones.appendChild(
                        crearElementoConversacion(
                            fecha
                        )
                    );

                }
            );
        }
    }


    /* =========================
       MOSTRAR CHAT
       ========================= */

    function mostrarChat() {

        if (!chat || !archivoVista) {
            return;
        }


        chat.style.display =
            "flex";

        archivoVista.style.display =
            "none";


        if (botonChat) {

            botonChat.classList.add(
                "hidroma-nav-activo"
            );
        }


        if (botonArchivo) {

            botonArchivo.classList.remove(
                "hidroma-nav-activo"
            );
        }

    }


    /* =========================
       MOSTRAR VISTA ARCHIVO
       ========================= */

    function mostrarVistaArchivo() {

        if (!chat || !archivoVista) {
            return;
        }


        chat.style.display =
            "none";

        archivoVista.style.display =
            "flex";


        if (botonChat) {

            botonChat.classList.remove(
                "hidroma-nav-activo"
            );
        }


        if (botonArchivo) {

            botonArchivo.classList.add(
                "hidroma-nav-activo"
            );
        }


        mostrarArchivo();
    }


    /* =========================
       ABRIR HIDROMA
       ========================= */

    botonHidroma.addEventListener(
        "click",
        () => {

            ventanaHidroma.classList.toggle(
                "abierto"
            );


            if (
                ventanaHidroma.classList.contains(
                    "abierto"
                )
            ) {

                mostrarChat();


                if (entrada) {

                    entrada.focus();

                }

            }

        }
    );


    /* =========================
       CERRAR HIDROMA
       ========================= */

    if (botonCerrar) {

        botonCerrar.addEventListener(
            "click",
            () => {

                ventanaHidroma.classList.remove(
                    "abierto"
                );

            }
        );

    }


    /* =========================
       BOTÓN CHAT
       ========================= */

    if (botonChat) {

        botonChat.addEventListener(
            "click",
            () => {

                mostrarChat();

                if (entrada) {
                    entrada.focus();
                }

            }
        );

    }


    /* =========================
       BOTÓN ARCHIVO
       ========================= */

    if (botonArchivo) {

        botonArchivo.addEventListener(
            "click",
            () => {

                mostrarVistaArchivo();

            }
        );

    }


    /* =========================
       VOLVER AL CHAT
       ========================= */

    if (botonVolverChat) {

        botonVolverChat.addEventListener(
            "click",
            () => {

                cargarConversacion(
                    fechaActual
                );

                mostrarChat();

            }
        );

    }


    /* =========================
       ENVIAR MENSAJE A HIDROMA
       ========================= */

    if (formulario && entrada) {

        formulario.addEventListener(
            "submit",
            async evento => {

                evento.preventDefault();


                const texto =
                    entrada.value.trim();


                if (texto === "") {
                    return;
                }


                /* =========================
                   MOSTRAR MENSAJE DEL USUARIO
                   ========================= */

                mostrarMensaje(
                    texto,
                    "usuario"
                );


                /* =========================
                   GUARDAR LOCALMENTE
                   ========================= */

                guardarMensaje(
                    fechaActual,
                    texto,
                    "usuario"
                );


                /* =========================
                   LIMPIAR INPUT
                   ========================= */

                entrada.value = "";


                /* =========================
                   DESACTIVAR TEMPORALMENTE
                   ========================= */

                entrada.disabled = true;


                const botonEnviar =
                    formulario.querySelector(
                        "button[type='submit']"
                    );


                if (botonEnviar) {
                    botonEnviar.disabled = true;
                }


                /* =========================
                   MENSAJE DE CARGA
                   ========================= */

                mostrarMensaje(
                    "Estoy pensando... 🌱",
                    "bot"
                );


                try {

                    /* =========================
                       OBTENER USUARIO
                       ========================= */

                    const usuario =
                        obtenerUsuarioActual();


                    let usuarioId =
                        null;


                    if (usuario) {

                        usuarioId =
                            usuario.id ||
                            usuario.usuario_id ||
                            null;

                    }


                    /* =========================
                       OBTENER PLANTA
                       ========================= */

                    const planta =
                        obtenerPlantaSeleccionada();


                    let plantaId =
                        null;


                    if (planta) {

                        plantaId =
                            planta.id ||
                            planta.planta_id ||
                            null;

                    }


                    /* =========================
                       OBTENER CONVERSACIÓN
                       ========================= */

                    const conversacionId =
                        obtenerIdConversacion();


                    /* =========================
                       PREPARAR PETICIÓN
                       ========================= */

                    const datosPeticion = {

                        mensaje: texto,

                        usuario_id:
                            usuarioId,

                        planta_id:
                            plantaId,

                        conversacion_id:
                            conversacionId

                    };


                    /* =========================
                       CONSULTAR BACKEND
                       ========================= */

                    const respuesta =
                        await fetch(
                            `${URL_BACKEND}/hidroma/chat`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        datosPeticion
                                    )
                            }
                        );


                    const datos =
                        await respuesta.json();


                    /* =========================
                       COMPROBAR RESPUESTA
                       ========================= */

                    if (
                        !respuesta.ok ||
                        !datos.ok
                    ) {

                        throw new Error(
                            datos.error ||
                            "Hidroma no pudo responder."
                        );
                    }


                    /* =========================
                       ELIMINAR MENSAJE DE CARGA
                       ========================= */

                    const mensajesBot =
                        mensajesHidroma.querySelectorAll(
                            ".hidroma-mensaje.bot"
                        );


                    const ultimoBot =
                        mensajesBot[
                            mensajesBot.length - 1
                        ];


                    if (
                        ultimoBot &&
                        ultimoBot.textContent ===
                        "Estoy pensando... 🌱"
                    ) {

                        ultimoBot.remove();

                    }


                    /* =========================
                       MOSTRAR RESPUESTA REAL
                       ========================= */

                    mostrarMensaje(
                        datos.respuesta,
                        "bot"
                    );


                    /* =========================
                       GUARDAR RESPUESTA LOCAL
                       ========================= */

                    guardarMensaje(
                        fechaActual,
                        datos.respuesta,
                        "bot"
                    );


                    /* =========================
                       GUARDAR ID CONVERSACIÓN
                       ========================= */

                    if (
                        datos.conversacion_id
                    ) {

                        guardarIdConversacion(
                            datos.conversacion_id
                        );

                    }


                    /* =========================
                       MOSTRAR FUENTES SI EXISTEN
                       ========================= */

                    if (
                        Array.isArray(
                            datos.fuentes
                        ) &&
                        datos.fuentes.length > 0
                    ) {

                        const fuentesTexto =
                            datos.fuentes
                                .map(
                                    (fuente, indice) =>
                                        `${indice + 1}. ${fuente.title}`
                                )
                                .join("\n");


                        mostrarMensaje(
                            `🌐 **Fuentes consultadas:**\n${fuentesTexto}`,
                            "bot"
                        );

                    }


                } catch (error) {

                    console.error(
                        "ERROR AL COMUNICARSE CON HIDROMA:",
                        error
                    );


                    /* =========================
                       ELIMINAR MENSAJE DE CARGA
                       ========================= */

                    const mensajesBot =
                        mensajesHidroma.querySelectorAll(
                            ".hidroma-mensaje.bot"
                        );


                    const ultimoBot =
                        mensajesBot[
                            mensajesBot.length - 1
                        ];


                    if (
                        ultimoBot &&
                        ultimoBot.textContent ===
                        "Estoy pensando... 🌱"
                    ) {

                        ultimoBot.remove();

                    }


                    /* =========================
                       MOSTRAR ERROR AL USUARIO
                       ========================= */

                    mostrarMensaje(
                        "Lo siento, no pude conectarme con mi sistema de inteligencia artificial. 🌱 Revisa que HIDROMATIC esté conectado al servidor e inténtalo nuevamente.",
                        "bot"
                    );

                } finally {

                    /* =========================
                       REACTIVAR INPUT
                       ========================= */

                    entrada.disabled = false;


                    if (botonEnviar) {
                        botonEnviar.disabled = false;
                    }


                    entrada.focus();

                }

            }
        );

    }


    /* =========================
       CARGAR CONVERSACIÓN ACTUAL
       ========================= */

    cargarConversacion(
        fechaActual
    );

});