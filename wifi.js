
// ============================================================
// HIDROMATIC - CONFIGURACION WIFI
// wifi.js
// ============================================================

// IP del ESP32 cuando está creando su propia red
const IP_ESP32 = "192.168.4.1";

const URL_ESP32 = `http://${IP_ESP32}`;


// ============================================================
// ELEMENTOS HTML
// ============================================================

const wifiForm = document.getElementById("wifiForm");

const nombreWifi = document.getElementById("nombreWifi");
const contrasenaWifi = document.getElementById("contrasenaWifi");

const btnConectar = document.getElementById("btnConectar");

const mensaje = document.getElementById("mensaje");


// ============================================================
// CONECTAR REGADERA
// ============================================================

wifiForm.addEventListener("submit", async (evento) => {

    // Evita que el formulario recargue la página
    evento.preventDefault();


    // --------------------------------------------------------
    // OBTENER DATOS
    // --------------------------------------------------------

    const ssid = nombreWifi.value.trim();
    const password = contrasenaWifi.value;


    // --------------------------------------------------------
    // VALIDAR NOMBRE DE RED
    // --------------------------------------------------------

    if (ssid === "") {

        mensaje.textContent =
            "Ingresa el nombre de tu red Wi-Fi.";

        nombreWifi.focus();

        return;
    }


    // --------------------------------------------------------
    // ESTADO DE CONEXION
    // --------------------------------------------------------

    btnConectar.disabled = true;

    btnConectar.textContent = "CONECTANDO...";

    mensaje.textContent =
        "Conectando la regadera a tu red Wi-Fi...";


    try {

        // ----------------------------------------------------
        // PREPARAR URL
        // ----------------------------------------------------

        const url =
            `${URL_ESP32}/configurar-wifi` +
            `?ssid=${encodeURIComponent(ssid)}` +
            `&password=${encodeURIComponent(password)}`;


        // ----------------------------------------------------
        // ENVIAR DATOS AL ESP32
        // ----------------------------------------------------

        const respuesta = await fetch(url);


        if (!respuesta.ok) {

            throw new Error(
                "El ESP32 devolvió un error."
            );
        }


        // ----------------------------------------------------
        // LEER RESPUESTA
        // ----------------------------------------------------

        const datos = await respuesta.json();


        // ====================================================
        // CONEXION EXITOSA
        // ====================================================

        if (datos.resultado === "EXITO") {

            console.log(
                "ESP32 conectado correctamente."
            );

            console.log(
                "Nueva IP:",
                datos.ip
            );


            mensaje.textContent =
                "¡Regadera conectada correctamente!";


            // ------------------------------------------------
            // GUARDAR IP DEL ESP32
            // ------------------------------------------------

            localStorage.setItem(
                "IP_ESP32",
                datos.ip
            );


            // ------------------------------------------------
            // PEQUEÑA ESPERA PARA MOSTRAR EL MENSAJE
            // ------------------------------------------------

            setTimeout(() => {

                window.location.href =
                    "modos.html";

            }, 1000);


            return;
        }


        // ====================================================
        // ERROR DE CONEXION
        // ====================================================

        if (datos.resultado === "ERROR") {

            console.error(
                datos.mensaje
            );


            mensaje.textContent =
                datos.mensaje ||
                "Error de conexión. Intenta nuevamente.";


            // ------------------------------------------------
            // IR A PAGINA DE ERROR
            // ------------------------------------------------

            setTimeout(() => {

                window.location.href =
                    "error.html";

            }, 1500);


            return;
        }


        // ====================================================
        // RESPUESTA DESCONOCIDA
        // ====================================================

        throw new Error(
            "Respuesta desconocida del ESP32."
        );

    }


    // ========================================================
    // ERROR DE COMUNICACION
    // ========================================================

    catch (error) {

        console.error(
            "Error al conectar con el ESP32:",
            error
        );


        mensaje.textContent =
            "No se pudo comunicar con la regadera.";


        setTimeout(() => {

            window.location.href =
                "error.html";

        }, 1500);

    }


    // ========================================================
    // RESTAURAR BOTON
    // ========================================================

    finally {

        btnConectar.disabled = false;

        btnConectar.textContent =
            "CONECTAR REGADERA";
    }

});

