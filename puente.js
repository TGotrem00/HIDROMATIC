// ============================================================
// HIDROMATIC - PUENTE JAVASCRIPT
// ============================================================
// HTML <-> JavaScript <-> Wi-Fi <-> ESP32
//
// FUNCIONES:
// - Conexión mediante Wi-Fi
// - Control manual de la bomba
// - Riego temporizado
// - Modo programado
// - Lectura del sensor
// - Conversión RAW -> porcentaje
// - Medidor visual
// - Modo detección automática
// - Registro de riegos en el backend
// ============================================================


// ============================================================
// 🌱 CALIBRACIÓN DEL SENSOR
// ============================================================

const RAW_AIRE = 2550;
const RAW_SECO = 2400;
const RAW_MOJADO = 910;


// ============================================================
// 🌐 CONFIGURACIÓN WI-FI
// ============================================================

// La IP se guarda en el navegador y se puede cambiar desde
// el panel de configuración que se crea en la interfaz.

let IP_ESP32 =
    localStorage.getItem("IP_ESP32") || "";

let URL_ESP32 =
    IP_ESP32 ? "http://" + IP_ESP32 : "";


function normalizarIP(valor) {

    return String(valor || "")
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/$/, "");

}


function guardarIP_ESP32(nuevaIP) {

    const ipLimpia = normalizarIP(nuevaIP);

    if (!ipLimpia) {
        alert("Introduce la dirección IP del ESP32.");
        return false;
    }

    IP_ESP32 = ipLimpia;
    URL_ESP32 = "http://" + IP_ESP32;
    localStorage.setItem("IP_ESP32", IP_ESP32);

    esp32Conectado = false;

    if (botonBomba) {
        botonBomba.disabled = true;
    }

    actualizarEstadoESP32("IP guardada. Conectando...");

    conectarESP32();
    return true;

}


// ============================================================
// VARIABLES PRINCIPALES
// ============================================================

let bombaEncendida = false;

let humedadActual = null;
let humedadRawActual = null;

let esp32Conectado = false;


// ============================================================
// MODO DETECCIÓN
// ============================================================

let deteccionActiva = false;
let riegoAutomaticoEnCurso = false;


// ============================================================
// MODO PROGRAMADO
// ============================================================

let riegoProgramado = false;
let horaRiegoProgramada = null;
let segundosRiegoProgramado = 5;

let ultimoRiegoProgramado = null;


// ============================================================
// REGISTRO DE RIEGOS
// ============================================================
//
// Estas variables solamente controlan el registro del riego.
// No modifican el funcionamiento de la bomba.
//

let tipoRiegoActual = null;
let inicioRiegoManual = null;


// ============================================================
// OBTENER PLANTA SELECCIONADA
// ============================================================

function obtenerPlantaSeleccionada() {

    const plantaGuardada =
        localStorage.getItem(
            "HIDROMATIC_PLANTA_SELECCIONADA"
        );


    if (!plantaGuardada) {

        console.warn(
            "HIDROMATIC | No hay una planta seleccionada."
        );

        return null;

    }


    try {

        const planta =
            JSON.parse(
                plantaGuardada
            );


        return planta;

    }

    catch (error) {

        console.error(
            "HIDROMATIC | Error leyendo la planta seleccionada:",
            error
        );

        return null;

    }

}


// ============================================================
// OBTENER ID DE LA PLANTA
// ============================================================

function obtenerIdPlantaSeleccionada() {

    const planta =
        obtenerPlantaSeleccionada();


    if (!planta) {
        return null;
    }


    const plantaId =
        planta.id ??
        planta.planta_id;


    if (
        plantaId === undefined ||
        plantaId === null
    ) {

        console.warn(
            "HIDROMATIC | La planta seleccionada no tiene ID."
        );

        return null;

    }


    const id =
        Number(plantaId);


    if (
        Number.isNaN(id) ||
        id <= 0
    ) {

        console.warn(
            "HIDROMATIC | ID de planta inválido:",
            plantaId
        );

        return null;

    }


    return id;

}


// ============================================================
// 📴 COMPROBAR MODO OFFLINE
// ============================================================
//
// En modo offline la bomba sigue funcionando normalmente,
// pero NO se registra el riego en la base de datos.
//

function estaEnModoOffline() {

    return (
        localStorage.getItem(
            "HIDROMATIC_MODO_OFFLINE"
        ) === "true"
    );

}


// ============================================================
// 💾 REGISTRAR RIEGO EN EL BACKEND
// ============================================================
//
// Esta función NO controla la bomba.
// Únicamente guarda en SQL Server un riego que ya ocurrió.
//
// IMPORTANTE:
// Si HIDROMATIC_MODO_OFFLINE está activo,
// el riego NO se envía al backend.
//

async function registrarRiego(duracionSegundos) {

    // ========================================================
    // MODO OFFLINE
    // ========================================================
    //
    // El riego sí ocurre físicamente,
    // pero no se registra en la base de datos.
    //

    if (estaEnModoOffline()) {

        console.log(
            "HIDROMATIC | Modo offline: riego realizado sin registrar en la base de datos."
        );

        return;

    }


    const plantaId =
        obtenerIdPlantaSeleccionada();


    if (!plantaId) {

        console.warn(
            "HIDROMATIC | No se pudo registrar el riego porque no hay planta seleccionada."
        );

        return;

    }


    let duracion =
        Number(duracionSegundos);


    if (
        Number.isNaN(duracion) ||
        duracion < 1
    ) {

        console.warn(
            "HIDROMATIC | Duración de riego inválida:",
            duracionSegundos
        );

        return;

    }


    // El backend acepta de 1 a 10 segundos.

    if (duracion > 10) {
        duracion = 10;
    }


    duracion =
        Math.round(duracion);


    try {

        const respuesta =
            await fetch(
                "http://localhost:3000/riegos",
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

                            duracion_segundos:
                                duracion
                        })
                }
            );


        if (!respuesta.ok) {

            const textoError =
                await respuesta.text();


            throw new Error(
                "HTTP " +
                respuesta.status +
                " - " +
                textoError
            );

        }


        const datos =
            await respuesta.json();


        console.log(
            "HIDROMATIC | Riego registrado correctamente:",
            datos
        );

    }

    catch (error) {

        console.error(
            "HIDROMATIC | No se pudo registrar el riego en el backend:",
            error
        );

    }

}


// ============================================================
// REGISTRAR RIEGO SEGÚN EL MODO
// ============================================================

async function registrarRiegoSegunModo(
    duracionConocida = null
) {

    if (!tipoRiegoActual) {
        return;
    }


    let duracion =
        duracionConocida;


    // ========================================================
    // RIEGO MANUAL
    // ========================================================

    if (
        tipoRiegoActual ===
        "manual"
    ) {

        if (inicioRiegoManual) {

            const tiempoTranscurrido =
                (
                    Date.now() -
                    inicioRiegoManual
                ) / 1000;


            duracion =
                Math.round(
                    tiempoTranscurrido
                );

        }

    }


    if (
        duracion === null ||
        duracion === undefined
    ) {

        console.warn(
            "HIDROMATIC | No se pudo determinar la duración del riego."
        );

        tipoRiegoActual = null;
        inicioRiegoManual = null;

        return;

    }


    if (duracion < 1) {
        duracion = 1;
    }


    if (duracion > 10) {
        duracion = 10;
    }


    await registrarRiego(
        duracion
    );


    tipoRiegoActual = null;
    inicioRiegoManual = null;

}


// ============================================================
// ELEMENTOS DEL HTML
// ============================================================

// CONEXIÓN

const botonConectar =
    document.getElementById("btn-conectar");


// PANEL PARA CONFIGURAR O ACTUALIZAR LA IP DEL ESP32.
// Se inserta desde JS para no exigir cambios en los HTML.
function crearPanelIP() {

    if (!botonConectar || document.getElementById("panel-ip-esp32")) {
        return;
    }

    const panel = document.createElement("div");
    panel.id = "panel-ip-esp32";
    panel.style.margin = "12px 0";
    panel.style.display = "flex";
    panel.style.flexWrap = "wrap";
    panel.style.alignItems = "center";
    panel.style.gap = "8px";

    const etiqueta = document.createElement("label");
    etiqueta.htmlFor = "input-ip-esp32";
    etiqueta.textContent = "IP de la regadera:";

    const entrada = document.createElement("input");
    entrada.id = "input-ip-esp32";
    entrada.type = "text";
    entrada.placeholder = "Ej. 10.10.212.33";
    entrada.value = IP_ESP32;
    entrada.autocomplete = "off";
    entrada.spellcheck = false;
    entrada.style.padding = "8px";
    entrada.style.maxWidth = "190px";
    entrada.style.border = "1px solid #999";
    entrada.style.borderRadius = "6px";

    const botonGuardar = document.createElement("button");
    botonGuardar.type = "button";
    botonGuardar.textContent = "Guardar IP y conectar";
    botonGuardar.style.padding = "8px 12px";
    botonGuardar.style.cursor = "pointer";
    botonGuardar.style.borderRadius = "6px";

    botonGuardar.addEventListener("click", () => {
        guardarIP_ESP32(entrada.value);
    });

    entrada.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            guardarIP_ESP32(entrada.value);
        }
    });

    panel.append(etiqueta, entrada, botonGuardar);
    botonConectar.insertAdjacentElement("beforebegin", panel);
}


// ESTADOS

const estadoESP32 =
    document.getElementById("estado-esp32");

const estadoBomba =
    document.getElementById("estado-bomba");


// HUMEDAD

const humedadGeneral =
    document.getElementById("humedad-general");

const humedad =
    document.getElementById("humedad");

const humedadRaw =
    document.getElementById("humedad-raw");

const contador =
    document.getElementById("count");

const agua =
    document.getElementById("water");

const estadoHumedad =
    document.getElementById("estado-humedad");


// MODO MANUAL

const botonBomba =
    document.getElementById("btn-bomba");


// MODO DETECCIÓN

const botonDeteccion =
    document.getElementById("btn-deteccion");

const humedadMinima =
    document.getElementById("humedad-minima");

const tiempoRiego =
    document.getElementById("tiempo-riego");


// MODO PROGRAMADO

const botonProgramar =
    document.getElementById("btn-programar");

const horaRiego =
    document.getElementById("hora-riego");

const tiempoRiegoProgramado =
    document.getElementById("tiempo-riego-programado");

const estadoProgramado =
    document.getElementById("estado-programado");


// ============================================================
// ACTUALIZAR ESTADO DEL ESP32
// ============================================================

function actualizarEstadoESP32(mensaje) {

    if (estadoESP32) {
        estadoESP32.textContent = mensaje;
    }

}


// ============================================================
// ACTUALIZAR ESTADO DE LA BOMBA
// ============================================================

function actualizarEstadoBomba(mensaje) {

    if (estadoBomba) {
        estadoBomba.textContent = mensaje;
    }

    // Mantener sincronizado el indicador de la tarjeta del modo manual.
    const estadoBombaManual = document.getElementById("estado-bomba-manual");
    if (estadoBombaManual) {
        estadoBombaManual.textContent =
            mensaje.toLowerCase() === "encendida" ? "Bomba encendida" : "Bomba apagada";
    }

}


// ============================================================
// ACTUALIZAR HUMEDAD
// ============================================================

function actualizarHumedadInterfaz() {

    if (humedadActual === null) {

        if (humedadGeneral) {
            humedadGeneral.textContent = "--%";
        }

        if (humedad) {
            humedad.textContent = "--%";
        }

        if (contador) {
            contador.textContent = "--";
        }

        return;
    }


    const textoHumedad =
        humedadActual + "%";


    if (humedadGeneral) {
        humedadGeneral.textContent =
            textoHumedad;
    }


    if (humedad) {
        humedad.textContent =
            textoHumedad;
    }


    if (contador) {
        contador.textContent =
            humedadActual;
    }

}


// ============================================================
// MAPEAR VALORES
// ============================================================

function mapear(
    valor,
    entradaMin,
    entradaMax,
    salidaMin,
    salidaMax
) {

    return (
        (valor - entradaMin) *
        (salidaMax - salidaMin) /
        (entradaMax - entradaMin)
    ) + salidaMin;

}


// ============================================================
// RAW -> PORCENTAJE
// ============================================================

function convertirRawAPorcentaje(valorRAW) {

    let porcentaje =
        mapear(
            valorRAW,
            RAW_SECO,
            RAW_MOJADO,
            0,
            100
        );


    porcentaje =
        Math.max(
            0,
            Math.min(
                100,
                porcentaje
            )
        );


    return Math.round(
        porcentaje
    );

}


// ============================================================
// ACTUALIZAR MEDIDOR
// ============================================================

function actualizarMedidor() {

    if (
        !agua ||
        humedadActual === null
    ) {
        return;
    }


    const posicionAgua =
        100 - humedadActual;


    agua.style.transform =
        "translate(0, " +
        posicionAgua +
        "%)";

}


// ============================================================
// PROCESAR HUMEDAD RAW
// ============================================================

function procesarHumedadRAW(valorRAW) {

    humedadRawActual =
        valorRAW;


    if (humedadRaw) {
        humedadRaw.textContent =
            valorRAW;
    }


    console.log(
        "HIDROMATIC | RAW:",
        valorRAW
    );


    // ========================================================
    // SENSOR FUERA DE LA TIERRA
    // ========================================================

    if (valorRAW > RAW_SECO) {

        humedadActual = null;


        if (estadoHumedad) {

            estadoHumedad.textContent =
                "Introduzca el sensor en la tierra";

        }


        if (humedadGeneral) {
            humedadGeneral.textContent = "--%";
        }

        if (humedad) {
            humedad.textContent = "--%";
        }

        if (contador) {
            contador.textContent = "--";
        }


        if (agua) {

            agua.style.transform =
                "translate(0, 100%)";

        }


        return;
    }


    // ========================================================
    // SENSOR DENTRO DE LA TIERRA
    // ========================================================

    humedadActual =
        convertirRawAPorcentaje(
            valorRAW
        );


    if (estadoHumedad) {

        if (deteccionActiva) {

            estadoHumedad.textContent =
                "Detección activa";

        }

        else {

            estadoHumedad.textContent =
                "Sensor detectando humedad";

        }

    }


    actualizarHumedadInterfaz();

    actualizarMedidor();


    // ========================================================
    // COMPROBAR MODO DETECCIÓN
    // ========================================================

    comprobarDeteccion();


    console.log(
        "HIDROMATIC | Humedad:",
        humedadActual + "%"
    );

}


// ============================================================
// 🌐 COMUNICACIÓN CON ESP32 POR WI-FI
// ============================================================

async function enviarComando(comando) {

    if (!esp32Conectado) {

        alert(
            "Primero debes conectar el ESP32."
        );

        return false;
    }


    try {

        const respuesta =
            await fetch(
                URL_ESP32 + "/comando?accion=" + comando,
                {
                    method: "GET"
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "El ESP32 respondió con un error."
            );

        }


        console.log(
            "Comando enviado por Wi-Fi:",
            comando
        );


        return true;

    }

    catch (error) {

        console.error(
            "Error comunicando con el ESP32:",
            error
        );


        esp32Conectado = false;

        actualizarEstadoESP32(
            "ESP32 desconectado"
        );


        if (botonConectar) {

            botonConectar.disabled =
                false;

            botonConectar.textContent =
                "Conectar ESP32";

        }


        return false;

    }

}


// ============================================================
// 📡 LEER HUMEDAD DEL ESP32
// ============================================================

async function leerHumedadWiFi() {

    if (!esp32Conectado) {
        return;
    }


    try {

        const respuesta =
            await fetch(
                URL_ESP32 + "/humedad"
            );


        if (!respuesta.ok) {
            throw new Error(
                "No se pudo leer el sensor."
            );
        }


        const datos =
            await respuesta.json();


        if (
            datos.raw !== undefined
        ) {

            procesarHumedadRAW(
                Number(datos.raw)
            );

        }

    }

    catch (error) {

        console.error(
            "Error leyendo humedad:",
            error
        );

    }

}

// ============================================================
// ENCENDER BOMBA
// ============================================================

async function encenderBomba() {

    const enviado =
        await enviarComando("ON");


    if (!enviado) {
        return;
    }


    bombaEncendida = true;


    actualizarEstadoBomba(
        "Encendida"
    );


    if (botonBomba) {

        botonBomba.textContent =
            "Apagar bomba";

    }

}


// ============================================================
// APAGAR BOMBA
// ============================================================

async function apagarBomba() {

    const enviado =
        await enviarComando("OFF");


    if (!enviado) {
        return;
    }


    bombaEncendida = false;


    actualizarEstadoBomba(
        "Apagada"
    );


    if (botonBomba) {

        botonBomba.textContent =
            "Encender bomba";

    }


    // ========================================================
    // REGISTRAR RIEGO REALIZADO
    // ========================================================

    if (tipoRiegoActual) {

        const tipoRiegoTerminado =
            tipoRiegoActual;


        const inicioManual =
            inicioRiegoManual;


        let duracion =
            null;


        if (
            tipoRiegoTerminado ===
            "manual" &&
            inicioManual
        ) {

            duracion =
                Math.round(
                    (
                        Date.now() -
                        inicioManual
                    ) / 1000
                );

        }


        if (duracion !== null) {

            if (duracion < 1) {
                duracion = 1;
            }

            if (duracion > 10) {
                duracion = 10;
            }

        }


        tipoRiegoActual = null;
        inicioRiegoManual = null;


        if (duracion !== null) {

            await registrarRiego(
                duracion
            );

        }

    }

}


// ============================================================
// MODO MANUAL
// ============================================================

async function modoManual() {

    if (bombaEncendida) {

        await apagarBomba();

    }

    else {

        const enviado =
            await enviarComando("ON");


        if (!enviado) {
            return;
        }


        bombaEncendida = true;


        tipoRiegoActual =
            "manual";


        inicioRiegoManual =
            Date.now();


        actualizarEstadoBomba(
            "Encendida"
        );


        if (botonBomba) {

            botonBomba.textContent =
                "Apagar bomba";

        }

    }

}


// ============================================================
// RIEGO TEMPORIZADO
// ============================================================

async function iniciarRiegoTemporizado() {

    if (!tiempoRiego) {
        return;
    }


    let segundos =
        Number(
            tiempoRiego.value
        );


    if (
        Number.isNaN(segundos) ||
        segundos < 1
    ) {

        alert(
            "Introduce un tiempo de riego válido."
        );

        return;
    }


    if (segundos > 10) {

        segundos = 10;

        tiempoRiego.value = 10;


        alert(
            "El tiempo máximo de riego es de 10 segundos."
        );

    }


    const enviado =
        await enviarComando("ON");


    if (!enviado) {
        return;
    }


    bombaEncendida = true;


    tipoRiegoActual =
        "manual";


    inicioRiegoManual =
        Date.now();


    actualizarEstadoBomba(
        "Encendida"
    );


    setTimeout(
        async function () {

            await apagarBomba();


            console.log(
                "HIDROMATIC | Riego temporizado terminado."
            );

        },
        segundos * 1000
    );

}


// ============================================================
// MODO DETECCIÓN
// ============================================================

async function comprobarDeteccion() {

    if (!deteccionActiva) {
        return;
    }


    if (humedadActual === null) {
        return;
    }


    if (riegoAutomaticoEnCurso) {
        return;
    }


    if (
        !humedadMinima ||
        !tiempoRiego
    ) {
        return;
    }


    const humedadMinimaValor =
        Number(
            humedadMinima.value
        );


    let segundos =
        Number(
            tiempoRiego.value
        );


    if (
        Number.isNaN(humedadMinimaValor) ||
        Number.isNaN(segundos) ||
        segundos < 1
    ) {
        return;
    }


    if (segundos > 10) {
        segundos = 10;
    }


    if (
        humedadActual <=
        humedadMinimaValor
    ) {

        riegoAutomaticoEnCurso =
            true;


        const enviado =
            await enviarComando("ON");


        if (!enviado) {

            riegoAutomaticoEnCurso =
                false;

            return;
        }


        bombaEncendida = true;


        tipoRiegoActual =
            "deteccion";


        actualizarEstadoBomba(
            "Encendida"
        );


        if (estadoHumedad) {

            estadoHumedad.textContent =
                "Regando automáticamente...";

        }


        setTimeout(
            async function () {

                await apagarBomba();


                // ====================================================
                // REGISTRAR RIEGO DE DETECCIÓN
                // ====================================================

                await registrarRiego(
                    segundos
                );


                riegoAutomaticoEnCurso =
                    false;


                if (estadoHumedad) {

                    if (deteccionActiva) {

                        estadoHumedad.textContent =
                            "Detección activa";

                    }

                    else {

                        estadoHumedad.textContent =
                            "Sensor detectando humedad";

                    }

                }

            },
            segundos * 1000
        );

    }

}


// ============================================================
// BOTÓN MODO DETECCIÓN
// ============================================================

if (botonDeteccion) {

    botonDeteccion.addEventListener(
        "click",
        function () {

            if (!deteccionActiva) {

                deteccionActiva =
                    true;


                botonDeteccion.textContent =
                    "Desactivar detección";


                if (estadoHumedad) {

                    estadoHumedad.textContent =
                        "Detección activa";

                }


                comprobarDeteccion();

            }

            else {

                deteccionActiva =
                    false;


                botonDeteccion.textContent =
                    "Activar detección";


                if (estadoHumedad) {

                    estadoHumedad.textContent =
                        "Detección desactivada";

                }

            }

        }
    );

}


// ============================================================
// 🕐 MODO PROGRAMADO
// ============================================================

async function ejecutarRiegoProgramado() {

    if (!riegoProgramado) {
        return;
    }


    if (!horaRiegoProgramada) {
        return;
    }


    if (!esp32Conectado) {
        return;
    }


    const ahora =
        new Date();


    const horaActual =
        String(
            ahora.getHours()
        ).padStart(2, "0");


    const minutoActual =
        String(
            ahora.getMinutes()
        ).padStart(2, "0");
        


    const horaActualTexto =
        horaActual +
        ":" +
        minutoActual;


    const fechaActual =
        ahora.getFullYear() +
        "-" +
        String(
            ahora.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            ahora.getDate()
        ).padStart(2, "0");


    if (
        ultimoRiegoProgramado ===
        fechaActual
    ) {

        return;

    }


    if (
        horaActualTexto !==
        horaRiegoProgramada
    ) {

        return;

    }


    ultimoRiegoProgramado =
        fechaActual;


    if (estadoProgramado) {

        estadoProgramado.textContent =
            "🌱 Regando ahora...";

    }


    const enviado =
        await enviarComando("ON");


    if (!enviado) {

        ultimoRiegoProgramado =
            null;

        return;
    }


    bombaEncendida = true;


    tipoRiegoActual =
        "programado";


    actualizarEstadoBomba(
        "Encendida"
    );


    setTimeout(
        async function () {

            await apagarBomba();


            // ====================================================
            // REGISTRAR RIEGO PROGRAMADO
            // ====================================================

            await registrarRiego(
                segundosRiegoProgramado
            );


            if (estadoProgramado) {

                estadoProgramado.textContent =
                    "Riego realizado. Próximo riego: " +
                    horaRiegoProgramada;

            }

        },
        segundosRiegoProgramado * 1000
    );

}


// ============================================================
// COMPROBAR MODO PROGRAMADO CADA SEGUNDO
// ============================================================

setInterval(
    ejecutarRiegoProgramado,
    1000
);


// ============================================================
// BOTÓN PROGRAMAR RIEGO
// ============================================================

if (botonProgramar) {

    botonProgramar.addEventListener(
        "click",
        function () {

            if (!esp32Conectado) {

                alert(
                    "Primero debes conectar el ESP32."
                );

                return;
            }


            if (
                !horaRiego ||
                horaRiego.value === ""
            ) {

                alert(
                    "Selecciona una hora para el riego."
                );

                return;
            }


            let segundos = 5;


            if (tiempoRiegoProgramado) {

                segundos =
                    Number(
                        tiempoRiegoProgramado.value
                    );

            }


            if (
                Number.isNaN(segundos) ||
                segundos < 1
            ) {

                alert(
                    "Introduce un tiempo de riego válido."
                );

                return;
            }


            if (segundos > 10) {

                segundos = 10;


                if (tiempoRiegoProgramado) {

                    tiempoRiegoProgramado.value =
                        10;

                }


                alert(
                    "El tiempo máximo de riego es de 10 segundos."
                );

            }


            horaRiegoProgramada =
                horaRiego.value;


            segundosRiegoProgramado =
                segundos;


            riegoProgramado =
                true;


            ultimoRiegoProgramado =
                null;


            if (estadoProgramado) {

                estadoProgramado.textContent =
                    "⏰ Riego programado para las " +
                    horaRiegoProgramada +
                    " durante " +
                    segundosRiegoProgramado +
                    " segundos.";

            }


            alert(
                "Riego programado correctamente.\n\n" +
                "Hora: " +
                horaRiegoProgramada +
                "\n" +
                "Duración: " +
                segundosRiegoProgramado +
                " segundos."
            );

        }
    );

}


// ============================================================
// 🔌 CONECTAR ESP32 POR WI-FI
// ============================================================

async function conectarESP32() {

    if (!botonConectar) {
        return;
    }


    if (!IP_ESP32 || !URL_ESP32) {

        actualizarEstadoESP32(
            "Configura la IP del ESP32"
        );

        alert(
            "Primero introduce y guarda la IP del ESP32."
        );

        return;

    }


    actualizarEstadoESP32(
        "Conectando..."
    );


    botonConectar.disabled =
        true;


    try {

        const respuesta =
            await fetch(
                URL_ESP32 + "/estado",
                {
                    method: "GET"
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "El ESP32 no respondió correctamente."
            );

        }


        const datos =
            await respuesta.json();


        console.log(
            "ESP32:",
            datos
        );


        esp32Conectado =
            true;


        actualizarEstadoESP32(
            "Conectado por Wi-Fi"
        );


        botonConectar.textContent =
            "ESP32 conectado";


        if (botonBomba) {

            botonBomba.disabled =
                false;

        }


        console.log(
            "HIDROMATIC: ESP32 conectado correctamente por Wi-Fi."
        );


        // Leer humedad inmediatamente

        leerHumedadWiFi();

    }

    catch (error) {

        console.error(
            "Error conectando con ESP32:",
            error
        );


        esp32Conectado =
            false;


        actualizarEstadoESP32(
            "ESP32 no encontrado"
        );


        botonConectar.disabled =
            false;


        botonConectar.textContent =
            "Conectar ESP32";


        if (botonBomba) {

            botonBomba.disabled =
                true;

        }


        alert(
            "No se pudo conectar con el ESP32.\n\n" +
            "Comprueba que:\n" +
            "• El ESP32 esté encendido.\n" +
            "• Esté conectado al mismo Wi-Fi que el computador.\n" +
            "• La IP guardada sea correcta: " + (IP_ESP32 || "no configurada") + "\n" +
            "Puedes actualizarla en el campo IP de la regadera."
        );

    }

}


// ============================================================
// 📡 ACTUALIZAR SENSOR AUTOMÁTICAMENTE
// ============================================================
//
// El ESP32 se consulta cada 500 ms.
// Esto reemplaza la lectura Serial que teníamos antes.
// ============================================================

setInterval(
    leerHumedadWiFi,
    500
);


// ============================================================
// EVENTOS
// ============================================================

// BOTÓN CONECTAR

if (botonConectar) {

    botonConectar.addEventListener(
        "click",
        conectarESP32
    );

}


// BOTÓN MANUAL

if (botonBomba) {

    botonBomba.addEventListener(
        "click",
        modoManual
    );

}


// ============================================================
// ESTADO INICIAL
// ============================================================

actualizarEstadoESP32(
    "Desconectado"
);


actualizarEstadoBomba(
    "Apagada"
);


if (botonBomba) {

    botonBomba.disabled =
        true;

}


if (estadoHumedad) {

    estadoHumedad.textContent =
        "Esperando sensor...";

}


if (estadoProgramado) {

    estadoProgramado.textContent =
        "Sin riego programado.";

}


// ============================================================
// CONEXIÓN AUTOMÁTICA AL ENTRAR A UN MODO
// ============================================================

window.addEventListener("load", () => {

    crearPanelIP();

    if (IP_ESP32) {
        conectarESP32();
    } else {
        actualizarEstadoESP32("Configura la IP del ESP32 para conectar");
    }

});


// ============================================================
// FIN DEL PUENTE JAVASCRIPT
// ============================================================