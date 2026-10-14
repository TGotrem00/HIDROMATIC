/* =========================
   ELEMENTOS
========================= */

const formulario =
    document.getElementById("form-registro-planta");

const fotoCamara =
    document.getElementById("foto-camara");

const fotoArchivo =
    document.getElementById("foto-archivo");

const vistaPrevia =
    document.getElementById("vista-previa");

const fotoPlaceholder =
    document.getElementById("foto-placeholder");

const btnQuitarFoto =
    document.getElementById("btn-quitar-foto");

const mensajeError =
    document.getElementById("mensaje-error");


let fotoSeleccionada = null;


/* =========================
   CONFIGURACIÓN
========================= */

const URL_BACKEND =
    "http://localhost:3000";


/* =========================
   MOSTRAR FOTO
========================= */

function mostrarFoto(archivo) {

    if (!archivo) {
        return;
    }


    if (!archivo.type.startsWith("image/")) {

        mensajeError.textContent =
            "El archivo seleccionado no es una imagen.";

        return;

    }


    const lector =
        new FileReader();


    lector.onload = function(evento) {

        fotoSeleccionada =
            evento.target.result;


        vistaPrevia.src =
            fotoSeleccionada;


        vistaPrevia.style.display =
            "block";


        fotoPlaceholder.style.display =
            "none";


        btnQuitarFoto.style.display =
            "block";


        mensajeError.textContent =
            "";

    };


    lector.readAsDataURL(archivo);

}


/* =========================
   CÁMARA
========================= */

fotoCamara.addEventListener(
    "change",
    function() {

        if (this.files.length > 0) {

            mostrarFoto(
                this.files[0]
            );

        }

    }
);


/* =========================
   ARCHIVO
========================= */

fotoArchivo.addEventListener(
    "change",
    function() {

        if (this.files.length > 0) {

            mostrarFoto(
                this.files[0]
            );

        }

    }
);


/* =========================
   QUITAR FOTO
========================= */

btnQuitarFoto.addEventListener(
    "click",
    function() {

        fotoSeleccionada = null;


        vistaPrevia.src = "";

        vistaPrevia.style.display =
            "none";


        fotoPlaceholder.style.display =
            "flex";


        btnQuitarFoto.style.display =
            "none";


        fotoCamara.value = "";

        fotoArchivo.value = "";

    }
);


/* =========================
   GUARDAR PLANTA LOCALMENTE
========================= */

function guardarPlantaLocal(nuevaPlanta) {

    let plantas = [];


    try {

        const plantasGuardadas =
            localStorage.getItem(
                "HIDROMATIC_PLANTAS"
            );


        if (plantasGuardadas) {

            plantas =
                JSON.parse(
                    plantasGuardadas
                );

        }


        if (!Array.isArray(plantas)) {

            plantas = [];

        }

    } catch (error) {

        console.error(
            "No se pudieron cargar las plantas existentes:",
            error
        );

        plantas = [];

    }


    /*
       Evitamos duplicar la planta
       si ya existe en la copia local.
    */

    const indiceExistente =
        plantas.findIndex(
            planta =>
                Number(planta.id) ===
                Number(nuevaPlanta.id)
        );


    if (indiceExistente !== -1) {

        plantas[indiceExistente] =
            nuevaPlanta;

    } else {

        plantas.push(
            nuevaPlanta
        );

    }


    try {

        localStorage.setItem(
            "HIDROMATIC_PLANTAS",
            JSON.stringify(plantas)
        );


        /*
           IMPORTANTE:
           Guardamos el objeto completo,
           no solamente el ID.
        */

        localStorage.setItem(
            "HIDROMATIC_PLANTA_SELECCIONADA",
            JSON.stringify(nuevaPlanta)
        );


        return true;

    } catch (error) {

        console.error(
            "No se pudo guardar la planta localmente:",
            error
        );

        return false;

    }

}


/* =========================
   REGISTRAR PLANTA
========================= */

formulario.addEventListener(
    "submit",
    async function(evento) {

        evento.preventDefault();


        /* =========================
           OBTENER DATOS
        ========================= */

        const nombre =
            document
                .getElementById("nombre-planta")
                .value
                .trim();


        const tipo =
            document
                .getElementById("tipo-planta")
                .value;


        const humedad =
            Number(
                document
                    .getElementById("humedad-minima")
                    .value
            );


        const tiempo =
            Number(
                document
                    .getElementById("tiempo-riego")
                    .value
            );


        mensajeError.textContent =
            "";


        /* =========================
           VALIDACIONES
        ========================= */

        if (nombre === "") {

            mensajeError.textContent =
                "Ingresa el nombre de tu planta.";

            return;

        }


        if (tipo === "") {

            mensajeError.textContent =
                "Selecciona el tipo de planta.";

            return;

        }


        if (
            !Number.isFinite(humedad) ||
            humedad < 0 ||
            humedad > 100
        ) {

            mensajeError.textContent =
                "La humedad debe estar entre 0% y 100%.";

            return;

        }


        if (
            !Number.isFinite(tiempo) ||
            tiempo < 1 ||
            tiempo > 10
        ) {

            mensajeError.textContent =
                "El tiempo de riego debe estar entre 1 y 10 segundos.";

            return;

        }


        /* =========================
           COMPROBAR USUARIO
        ========================= */

        let usuario = null;


        try {

            const usuarioGuardado =
                localStorage.getItem(
                    "HIDROMATIC_USUARIO"
                );


            if (usuarioGuardado) {

                usuario =
                    JSON.parse(
                        usuarioGuardado
                    );

            }

        } catch (error) {

            console.error(
                "No se pudo obtener el usuario:",
                error
            );

        }


        /* =========================
           MODO OFFLINE
        ========================= */

        const modoOffline =
            localStorage.getItem(
                "HIDROMATIC_MODO_OFFLINE"
            ) === "true";


        if (modoOffline) {

            const nuevaPlanta = {

                id:
                    Date.now(),

                nombre:
                    nombre,

                tipo:
                    tipo,

                humedadMinima:
                    humedad,

                tiempoRiego:
                    tiempo,

                foto:
                    fotoSeleccionada,

                fechaRegistro:
                    new Date().toISOString()

            };


            const guardada =
                guardarPlantaLocal(
                    nuevaPlanta
                );


            if (!guardada) {

                mensajeError.textContent =
                    "No se pudo guardar la planta. La imagen podría ser demasiado grande.";

                return;

            }


            window.location.href =
                "perfil.html";

            return;

        }


        /* =========================
           COMPROBAR SESIÓN
        ========================= */

        if (
            !usuario ||
            !usuario.id
        ) {

            mensajeError.textContent =
                "Debes iniciar sesión para registrar una planta.";

            return;

        }


        /* =========================
           PREPARAR DATOS
        ========================= */

        const datosPlanta = {

            usuario_id:
                usuario.id,

            nombre:
                nombre,

            tipo:
                tipo,

            humedad_minima:
                humedad,

            tiempo_riego:
                tiempo,

            foto:
                fotoSeleccionada

        };


        /* =========================
           ENVIAR AL BACKEND
        ========================= */

        try {

            const respuesta =
                await fetch(
                    `${URL_BACKEND}/plantas`,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                datosPlanta
                            )

                    }
                );


            const datos =
                await respuesta.json();


            /* =========================
               ERROR DEL BACKEND
            ========================= */

            if (!respuesta.ok) {

                mensajeError.textContent =
                    datos.mensaje ||
                    "No se pudo registrar la planta.";

                return;

            }


            /* =========================
               PLANTA CREADA
            ========================= */

            const planta =
                datos.planta;


            if (
                !planta ||
                !planta.id
            ) {

                mensajeError.textContent =
                    "El servidor registró la planta, pero no devolvió sus datos correctamente.";

                return;

            }


            const nuevaPlanta = {

                id:
                    planta.id,

                usuarioId:
                    planta.usuario_id,

                nombre:
                    planta.nombre,

                tipo:
                    planta.tipo,

                humedadMinima:
                    planta.humedad_minima,

                tiempoRiego:
                    planta.tiempo_riego,

                foto:
                    planta.foto,

                fechaRegistro:
                    planta.fecha_registro

            };


            /* =========================
               GUARDAR COPIA LOCAL
            ========================= */

            const guardadaLocalmente =
                guardarPlantaLocal(
                    nuevaPlanta
                );


            if (!guardadaLocalmente) {

                console.warn(
                    "La planta se guardó en SQL Server, pero no se pudo guardar la copia local."
                );

            }


            /* =========================
               REGISTRO EXITOSO
            ========================= */

            alert(
                "Planta registrada correctamente."
            );


            window.location.href =
                "perfil.html";


        } catch (error) {

            console.error(
                "Error conectando con el backend:",
                error
            );


            mensajeError.textContent =
                "No se pudo conectar con el servidor. Si quieres continuar sin conexión, activa el modo offline.";

        }

    }
);


/* =========================
   VOLVER AL PERFIL
========================= */

document
    .getElementById("btn-volver-perfil")
    .addEventListener(
        "click",
        function() {

            window.location.href =
                "perfil.html";

        }
    );


document
    .getElementById("btn-footer-volver")
    .addEventListener(
        "click",
        function() {

            window.location.href =
                "perfil.html";

        }
    );

