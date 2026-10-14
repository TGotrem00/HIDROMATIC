/* =========================
ELEMENTOS
========================= */

const formulario =
document.getElementById("form-registro");

const contraseña =
document.getElementById("contraseña");

const confirmarContraseña =
document.getElementById("confirmar-contraseña");

const btnMostrarContraseña =
document.getElementById("btn-mostrar-contraseña");

const btnMostrarConfirmacion =
document.getElementById("btn-mostrar-confirmacion");

const mensajeError =
document.getElementById("mensaje-error");

const btnVolverLogin =
document.getElementById("btn-volver-login");

const btnInvitado =
document.getElementById("btn-invitado");

/* =========================
MOSTRAR / OCULTAR CONTRASEÑA
========================= */

btnMostrarContraseña.addEventListener(
"click",
() => {


    if (contraseña.type === "password") {

        contraseña.type = "text";

        btnMostrarContraseña.textContent =
            "🙈";

    } else {

        contraseña.type = "password";

        btnMostrarContraseña.textContent =
            "👁️";

    }

}


);

btnMostrarConfirmacion.addEventListener(
"click",
() => {


    if (confirmarContraseña.type === "password") {

        confirmarContraseña.type = "text";

        btnMostrarConfirmacion.textContent =
            "🙈";

    } else {

        confirmarContraseña.type = "password";

        btnMostrarConfirmacion.textContent =
            "👁️";

    }

}


);

/* =========================
REGISTRO
========================= */

formulario.addEventListener(
"submit",
async (evento) => {


    evento.preventDefault();


    const nombre =
        document.getElementById(
            "nombre"
        ).value.trim();


    const correo =
        document.getElementById(
            "correo"
        ).value.trim();


    const contraseñaValor =
        contraseña.value;


    const confirmacionValor =
        confirmarContraseña.value;


    mensajeError.textContent = "";


    /* CONTRASEÑAS */

    if (
        contraseñaValor !==
        confirmacionValor
    ) {

        mensajeError.textContent =
            "Las contraseñas no coinciden.";

        return;

    }


    /* LONGITUD */

    if (
        contraseñaValor.length < 6
    ) {

        mensajeError.textContent =
            "La contraseña debe tener al menos 6 caracteres.";

        return;

    }


    /* =========================
       CONEXIÓN CON BACKEND
       ========================= */

    try {

        const respuesta =
            await fetch(
                "http://localhost:3000/registro",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        nombre:
                            nombre,

                        correo:
                            correo,

                        contrasena:
                            contraseñaValor

                    })

                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            mensajeError.textContent =
                datos.mensaje ||
                "No se pudo crear la cuenta.";

            return;

        }


        alert(
            "Cuenta creada correctamente."
        );


        window.location.href =
            "login.html";

    } catch (error) {

        console.error(
            "Error al conectar con el backend:",
            error
        );


        mensajeError.textContent =
            "No se pudo conectar con el servidor.";

    }

}


);

/* =========================
VOLVER AL LOGIN
========================= */

btnVolverLogin.addEventListener(
"click",
() => {


    window.location.href =
        "login.html";

}


);

/* =========================
MODO INVITADO
========================= */

btnInvitado.addEventListener(
"click",
() => {


    /*
       Nos aseguramos de que no quede
       una sesión anterior guardada.
    */

    localStorage.removeItem(
        "HIDROMATIC_USUARIO"
    );


    /*
       El usuario entra al perfil
       como invitado.
    */

    window.location.href =
        "perfil.html";

}


);

