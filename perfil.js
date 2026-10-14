/* =========================
   ELEMENTOS DEL PERFIL
========================= */

const usuarioRegistrado =
    document.getElementById("usuario-registrado");

const usuarioInvitado =
    document.getElementById("usuario-invitado");

const mensajeInvitado =
    document.getElementById("mensaje-invitado");

const btnRegistrarPlanta =
    document.getElementById("btn-registrar-planta");

const btnMiPlanta =
    document.getElementById("btn-mi-planta");

const btnRevisarComportamiento =
    document.getElementById("btn-revisar-comportamiento");

const btnIniciarSesion =
    document.getElementById("btn-iniciar-sesion");

const btnRegistrarse =
    document.getElementById("btn-registrarse");

const btnUsarOffline =
    document.getElementById("btn-usar-offline");

const seccionPlantas =
    document.getElementById("seccion-plantas");

const catalogoPlantas =
    document.getElementById("catalogo-plantas");

const seccionPlanta =
    document.getElementById("seccion-planta");

const nombrePlanta =
    document.getElementById("nombre-planta");


/* =========================
   CONFIGURACIÓN
========================= */

const URL_BACKEND =
    "http://localhost:3000";


/* =========================
   CARGAR USUARIO
========================= */

const usuarioGuardado =
    localStorage.getItem(
        "HIDROMATIC_USUARIO"
    );


/* =========================
   FUNCIÓN PARA OBTENER
   MODO OFFLINE
========================= */

function estaEnModoOffline() {

    return (
        localStorage.getItem(
            "HIDROMATIC_MODO_OFFLINE"
        ) === "true"
    );

}


/* =========================
   CARGAR PLANTAS LOCALES
========================= */

function obtenerPlantasLocales() {

    try {

        const plantasGuardadas =
            localStorage.getItem(
                "HIDROMATIC_PLANTAS"
            );


        if (!plantasGuardadas) {

            return [];

        }


        const plantas =
            JSON.parse(
                plantasGuardadas
            );


        if (!Array.isArray(plantas)) {

            return [];

        }


        return plantas;

    } catch (error) {

        console.error(
            "No se pudieron cargar las plantas locales:",
            error
        );

        return [];

    }

}


/* =========================
   GUARDAR PLANTAS LOCALES
========================= */

function guardarPlantasLocales(
    plantas
) {

    try {

        localStorage.setItem(
            "HIDROMATIC_PLANTAS",
            JSON.stringify(plantas)
        );


        return true;

    } catch (error) {

        console.error(
            "No se pudieron guardar las plantas localmente:",
            error
        );


        return false;

    }

}


/* =========================
   MOSTRAR MENSAJE
   SIN PLANTAS
========================= */

function mostrarSinPlantas() {

    catalogoPlantas.innerHTML = "";


    seccionPlantas.classList.remove(
        "oculto"
    );


    const mensaje =
        document.createElement("div");


    mensaje.className =
        "sin-plantas";


    mensaje.innerHTML = `
        <span>🌱</span>

        <strong>
            Todavía no tienes plantas registradas.
        </strong>

        <small>
            Registra tu primera planta para comenzar.
        </small>
    `;


    catalogoPlantas.appendChild(
        mensaje
    );


    seccionPlanta.classList.add(
        "oculto"
    );


    btnRevisarComportamiento.classList.add(
        "oculto"
    );

}


/* =========================
   MOSTRAR CATÁLOGO
========================= */

function mostrarCatalogoPlantas(
    plantas
) {

    catalogoPlantas.innerHTML = "";


    /* =========================
       NO HAY PLANTAS
    ========================= */

    if (
        !Array.isArray(plantas) ||
        plantas.length === 0
    ) {

        mostrarSinPlantas();

        return;

    }


    /* =========================
       MOSTRAR SECCIÓN
    ========================= */

    seccionPlantas.classList.remove(
        "oculto"
    );


    btnRevisarComportamiento.classList.remove(
        "oculto"
    );


    /* =========================
       CREAR TARJETAS
    ========================= */

    plantas.forEach(
        (planta) => {

            const tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.className =
                "tarjeta-planta";


            /* =========================
               FOTO
            ========================= */

            const contenedorFoto =
                document.createElement(
                    "div"
                );


            contenedorFoto.className =
                "tarjeta-planta-foto";


            if (planta.foto) {

                const imagen =
                    document.createElement(
                        "img"
                    );


                imagen.src =
                    planta.foto;


                imagen.alt =
                    "Foto de " +
                    planta.nombre;


                contenedorFoto.appendChild(
                    imagen
                );

            } else {

                contenedorFoto.innerHTML =
                    `
                    <span>🌱</span>
                    `;

            }


            /* =========================
               INFORMACIÓN
            ========================= */

            const informacion =
                document.createElement(
                    "div"
                );


            informacion.className =
                "tarjeta-planta-informacion";


            const nombre =
                document.createElement(
                    "h3"
                );


            nombre.textContent =
                planta.nombre;


            const tipo =
                document.createElement(
                    "p"
                );


            tipo.textContent =
                planta.tipo;


            const configuracion =
                document.createElement(
                    "div"
                );


            configuracion.className =
                "tarjeta-planta-configuracion";


            configuracion.innerHTML = `
                <span>
                    💧 ${planta.humedadMinima}%
                </span>

                <span>
                    ⏱️ ${planta.tiempoRiego} seg
                </span>
            `;


            /* =========================
               CONTENEDOR DE BOTONES
            ========================= */

            const botonesPlanta =
                document.createElement(
                    "div"
                );


            botonesPlanta.className =
                "botones-planta";


            /* =========================
               BOTÓN SELECCIONAR
            ========================= */

            const botonSeleccionar =
                document.createElement(
                    "button"
                );


            botonSeleccionar.type =
                "button";


            botonSeleccionar.className =
                "btn-seleccionar-planta";


            botonSeleccionar.textContent =
                "SELECCIONAR";


            botonSeleccionar.addEventListener(
                "click",
                () => {

                    seleccionarPlanta(
                        planta
                    );

                }
            );


            /* =========================
               BOTÓN ELIMINAR
            ========================= */

            const botonEliminar =
                document.createElement(
                    "button"
                );


            botonEliminar.type =
                "button";


            botonEliminar.className =
                "btn-eliminar-planta";


            botonEliminar.textContent =
                "🗑️ ELIMINAR PLANTA";


            botonEliminar.addEventListener(
                "click",
                () => {

                    eliminarPlanta(
                        planta
                    );

                }
            );


            /* =========================
               AÑADIR BOTONES
            ========================= */

            botonesPlanta.appendChild(
                botonSeleccionar
            );


            botonesPlanta.appendChild(
                botonEliminar
            );


            /* =========================
               AÑADIR INFORMACIÓN
            ========================= */

            informacion.appendChild(
                nombre
            );


            informacion.appendChild(
                tipo
            );


            informacion.appendChild(
                configuracion
            );


            informacion.appendChild(
                botonesPlanta
            );


            /* =========================
               AÑADIR TARJETA
            ========================= */

            tarjeta.appendChild(
                contenedorFoto
            );


            tarjeta.appendChild(
                informacion
            );


            catalogoPlantas.appendChild(
                tarjeta
            );

        }
    );


    /* =========================
       CARGAR PLANTA SELECCIONADA
    ========================= */

    cargarPlantaSeleccionada(
        plantas
    );

}


/* =========================
   CARGAR PLANTAS DESDE SQL
========================= */

async function cargarPlantasDesdeSQL(
    usuario
) {

    try {

        const respuesta =
            await fetch(
                `${URL_BACKEND}/plantas/${usuario.id}`
            );


        const datos =
            await respuesta.json();


        /* =========================
           ERROR DEL SERVIDOR
        ========================= */

        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje ||
                "No se pudieron obtener las plantas."
            );

        }


        /* =========================
           OBTENER ARREGLO DE PLANTAS
           
           El backend actualmente
           devuelve directamente:
           
           [
               {...},
               {...}
           ]

           También aceptamos:
           
           {
               plantas: [...]
           }

           para mantener compatibilidad.
        ========================= */

        const plantasSQL =
            Array.isArray(datos)
                ? datos
                : (
                    Array.isArray(datos.plantas)
                        ? datos.plantas
                        : []
                );


        /* =========================
           CONVERTIR DATOS SQL
           A FORMATO DEL FRONTEND
        ========================= */

        const plantas =
            plantasSQL.map(
                (planta) => ({

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

                })
            );


        /* =========================
           ACTUALIZAR COPIA LOCAL
        ========================= */

        guardarPlantasLocales(
            plantas
        );


        /* =========================
           MOSTRAR PLANTAS
        ========================= */

        mostrarCatalogoPlantas(
            plantas
        );


        return true;

    } catch (error) {

        console.error(
            "Error cargando plantas desde SQL:",
            error
        );


        /*
           Si el servidor no responde,
           no inventamos información.
           Mostramos la copia local si
           existe para evitar dejar el
           perfil completamente vacío.
        */

        const plantasLocales =
            obtenerPlantasLocales();


        if (
            plantasLocales.length > 0
        ) {

            mostrarCatalogoPlantas(
                plantasLocales
            );


            console.warn(
                "Se utilizaron las plantas guardadas localmente porque SQL Server no respondió."
            );

        } else {

            mostrarSinPlantas();

        }


        return false;

    }

}


/* =========================
   CARGAR CATÁLOGO
========================= */

async function cargarCatalogoPlantas() {

    /*
       Si estamos offline,
       no intentamos contactar
       al backend.
    */

    if (
        estaEnModoOffline()
    ) {

        const plantas =
            obtenerPlantasLocales();


        mostrarCatalogoPlantas(
            plantas
        );


        return;

    }


    /*
       Si estamos online,
       necesitamos un usuario.
    */

    if (!usuarioGuardado) {

        mostrarSinPlantas();

        return;

    }


    try {

        const usuario =
            JSON.parse(
                usuarioGuardado
            );


        if (
            !usuario ||
            !usuario.id
        ) {

            mostrarSinPlantas();

            return;

        }


        await cargarPlantasDesdeSQL(
            usuario
        );

    } catch (error) {

        console.error(
            "No se pudo cargar el usuario:",
            error
        );


        mostrarSinPlantas();

    }

}


/* =========================
   SELECCIONAR PLANTA
========================= */

function seleccionarPlanta(
    planta
) {

    /*
       Al seleccionar una planta
       real, salimos del modo offline.

       Esto evita que una sesión offline
       anterior continúe bloqueando
       los registros de la base de datos.
    */

    localStorage.setItem(
        "HIDROMATIC_MODO_OFFLINE",
        "false"
    );


    localStorage.setItem(
        "HIDROMATIC_PLANTA_SELECCIONADA",
        JSON.stringify(planta)
    );


    cargarPlantaSeleccionada();


    alert(
        "Has seleccionado: " +
        planta.nombre
    );

}


/* =========================
   ELIMINAR PLANTA
========================= */

async function eliminarPlanta(
    planta
) {

    const confirmar =
        confirm(
            "¿Seguro que deseas eliminar la planta \"" +
            planta.nombre +
            "\"?"
        );


    if (!confirmar) {

        return;

    }


    /* =========================
       MODO OFFLINE
    ========================= */

    if (
        estaEnModoOffline()
    ) {

        eliminarPlantaLocal(
            planta
        );


        return;

    }


    /* =========================
       COMPROBAR ID
    ========================= */

    if (!planta.id) {

        alert(
            "No se pudo identificar la planta."
        );

        return;

    }


    /* =========================
       ELIMINAR DE SQL
    ========================= */

    try {

        const respuesta =
            await fetch(
                `${URL_BACKEND}/plantas/${planta.id}`,
                {

                    method:
                        "DELETE"

                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            alert(
                datos.mensaje ||
                "No se pudo eliminar la planta."
            );

            return;

        }


        /* =========================
           ELIMINAR COPIA LOCAL
        ========================= */

        let plantas =
            obtenerPlantasLocales();


        plantas =
            plantas.filter(
                (plantaActual) =>
                    plantaActual.id !== planta.id
            );


        guardarPlantasLocales(
            plantas
        );


        /* =========================
           COMPROBAR SELECCIÓN
        ========================= */

        comprobarPlantaSeleccionadaEliminada(
            planta
        );


        /* =========================
           ACTUALIZAR PERFIL
        ========================= */

        mostrarCatalogoPlantas(
            plantas
        );


        alert(
            "La planta \"" +
            planta.nombre +
            "\" fue eliminada."
        );


    } catch (error) {

        console.error(
            "Error eliminando la planta:",
            error
        );


        alert(
            "No se pudo conectar con el servidor. La planta no fue eliminada."
        );

    }

}


/* =========================
   ELIMINAR PLANTA LOCAL
========================= */

function eliminarPlantaLocal(
    planta
) {

    let plantas =
        obtenerPlantasLocales();


    plantas =
        plantas.filter(
            (plantaActual) =>
                plantaActual.id !== planta.id
        );


    const guardado =
        guardarPlantasLocales(
            plantas
        );


    if (!guardado) {

        alert(
            "No se pudo eliminar la planta."
        );

        return;

    }


    comprobarPlantaSeleccionadaEliminada(
        planta
    );


    mostrarCatalogoPlantas(
        plantas
    );


    alert(
        "La planta \"" +
        planta.nombre +
        "\" fue eliminada."
    );

}


/* =========================
   COMPROBAR PLANTA
   SELECCIONADA ELIMINADA
========================= */

function comprobarPlantaSeleccionadaEliminada(
    planta
) {

    const plantaSeleccionadaGuardada =
        localStorage.getItem(
            "HIDROMATIC_PLANTA_SELECCIONADA"
        );


    if (!plantaSeleccionadaGuardada) {

        return;

    }


    try {

        const plantaSeleccionada =
            JSON.parse(
                plantaSeleccionadaGuardada
            );


        if (
            plantaSeleccionada &&
            plantaSeleccionada.id === planta.id
        ) {

            localStorage.removeItem(
                "HIDROMATIC_PLANTA_SELECCIONADA"
            );


            seccionPlanta.classList.add(
                "oculto"
            );

        }

    } catch (error) {

        console.error(
            "No se pudo comprobar la planta seleccionada:",
            error
        );

    }

}


/* =========================
   CARGAR PLANTA SELECCIONADA
========================= */

function cargarPlantaSeleccionada(
    plantas = null
) {

    const plantaGuardada =
        localStorage.getItem(
            "HIDROMATIC_PLANTA_SELECCIONADA"
        );


    if (!plantaGuardada) {

        seccionPlanta.classList.add(
            "oculto"
        );

        return;

    }


    try {

        const planta =
            JSON.parse(
                plantaGuardada
            );


        if (!planta) {

            seccionPlanta.classList.add(
                "oculto"
            );

            return;

        }


        /*
           Si conocemos el catálogo,
           comprobamos que la planta
           todavía exista.
        */

        if (
            Array.isArray(plantas)
        ) {

            const existe =
                plantas.some(
                    (plantaActual) =>
                        String(plantaActual.id) ===
                        String(planta.id)
                );


            if (!existe) {

                localStorage.removeItem(
                    "HIDROMATIC_PLANTA_SELECCIONADA"
                );


                seccionPlanta.classList.add(
                    "oculto"
                );

                return;

            }

        }


        seccionPlanta.classList.remove(
            "oculto"
        );


        nombrePlanta.textContent =
            planta.nombre;


    } catch (error) {

        console.error(
            "No se pudo cargar la planta seleccionada:",
            error
        );


        localStorage.removeItem(
            "HIDROMATIC_PLANTA_SELECCIONADA"
        );


        seccionPlanta.classList.add(
            "oculto"
        );

    }

}


/* =========================
   USUARIO REGISTRADO
========================= */

if (usuarioGuardado) {

    try {

        const usuario =
            JSON.parse(
                usuarioGuardado
            );


        usuarioRegistrado.classList.remove(
            "oculto"
        );


        usuarioInvitado.classList.add(
            "oculto"
        );


        mensajeInvitado.classList.add(
            "oculto"
        );


        if (usuario.nombre) {

            document.getElementById(
                "nombre-usuario"
            ).textContent =
                "Hola, " +
                usuario.nombre;

        }


        if (usuario.correo) {

            document.getElementById(
                "correo-usuario"
            ).textContent =
                usuario.correo;

        }


        /* =========================
           CARGAR PLANTAS
        ========================= */

        cargarCatalogoPlantas();


    } catch (error) {

        console.error(
            "No se pudo cargar el usuario:",
            error
        );

    }

} else {

    /* =========================
       USUARIO INVITADO
    ========================= */

    usuarioRegistrado.classList.add(
        "oculto"
    );


    usuarioInvitado.classList.remove(
        "oculto"
    );


    mensajeInvitado.classList.remove(
        "oculto"
    );


    /*
       Un invitado no puede registrar
       plantas ni acceder a sus datos.
    */

    btnRegistrarPlanta.classList.add(
        "oculto"
    );


    seccionPlantas.classList.add(
        "oculto"
    );


    seccionPlanta.classList.add(
        "oculto"
    );


    btnRevisarComportamiento.classList.add(
        "oculto"
    );

}


/* =========================
   REGISTRAR PLANTA
========================= */

btnRegistrarPlanta.addEventListener(
    "click",
    () => {

        if (!usuarioGuardado) {

            alert(
                "Debes iniciar sesión o registrarte para guardar una planta."
            );

            return;

        }


        window.location.href =
            "registro-planta.html";

    }
);


/* =========================
   MI PLANTA
========================= */

btnMiPlanta.addEventListener(
    "click",
    () => {

        const plantaSeleccionada =
            localStorage.getItem(
                "HIDROMATIC_PLANTA_SELECCIONADA"
            );


        if (!usuarioGuardado) {

            return;

        }


        if (!plantaSeleccionada) {

            alert(
                "Primero selecciona una planta."
            );

            return;

        }


        /*
           Entramos mediante una planta real,
           así que aseguramos que no quede
           activa una sesión offline anterior.
        */

        localStorage.setItem(
            "HIDROMATIC_MODO_OFFLINE",
            "false"
        );


        window.location.href =
            "modoP.html";

    }
);


/* =========================
   REVISAR COMPORTAMIENTO
========================= */

btnRevisarComportamiento.addEventListener(
    "click",
    () => {

        const plantaSeleccionada =
            localStorage.getItem(
                "HIDROMATIC_PLANTA_SELECCIONADA"
            );


        if (!usuarioGuardado) {

            return;

        }


        if (!plantaSeleccionada) {

            alert(
                "Primero selecciona una planta."
            );

            return;

        }


        /*
           El comportamiento pertenece
           a una planta real y no al
           modo offline.
        */

        localStorage.setItem(
            "HIDROMATIC_MODO_OFFLINE",
            "false"
        );


        window.location.href =
            "comportamiento.html";

    }
);


/* =========================
   INICIAR SESIÓN
========================= */

btnIniciarSesion.addEventListener(
    "click",
    () => {

        window.location.href =
            "login.html";

    }
);


/* =========================
   REGISTRARSE
========================= */

btnRegistrarse.addEventListener(
    "click",
    () => {

        window.location.href =
            "registro.html";

    }
);


/* =========================
   USAR OFFLINE
========================= */

btnUsarOffline.addEventListener(
    "click",
    () => {

        localStorage.setItem(
            "HIDROMATIC_MODO_OFFLINE",
            "true"
        );


        window.location.href =
            "modoP.html";

    }
);


/* =========================
   ATENCIÓN AL CLIENTE
========================= */

const btnAtencion =
    document.getElementById(
        "btn-atencion"
    );


btnAtencion.addEventListener(
    "click",
    () => {

        alert(
            "La sección de Atención al cliente estará disponible próximamente."
        );

    }
);


/* =========================
   CERRAR SESIÓN
========================= */

const btnCerrarSesion =
    document.getElementById(
        "btn-cerrar-sesion"
    );


btnCerrarSesion.addEventListener(
    "click",
    () => {

        if (!usuarioGuardado) {

            window.location.href =
                "login.html";

            return;

        }


        const confirmar =
            confirm(
                "¿Seguro que deseas cerrar sesión?"
            );


        if (!confirmar) {

            return;

        }


        localStorage.removeItem(
            "HIDROMATIC_USUARIO"
        );


        localStorage.removeItem(
            "HIDROMATIC_MODO_OFFLINE"
        );


        localStorage.removeItem(
            "HIDROMATIC_PLANTA_SELECCIONADA"
        );


        window.location.href =
            "login.html";

    }
);