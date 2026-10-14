/* =========================
ELEMENTOS
========================= */

const formulario =
document.getElementById("form-login");

const contraseña =
document.getElementById("contraseña");

const btnMostrarContraseña =
document.getElementById(
"btn-mostrar-contraseña"
);

const btnRegistro =
document.getElementById(
"btn-registro"
);

const btnInvitado =
document.getElementById(
"btn-invitado"
);

/* =========================
MOSTRAR / OCULTAR CONTRASEÑA
========================= */

btnMostrarContraseña.addEventListener(
"click",
() => {


    if (
        contraseña.type ===
        "password"
    ) {

        contraseña.type =
            "text";

        btnMostrarContraseña.textContent =
            "🙈";

        btnMostrarContraseña.setAttribute(
            "aria-label",
            "Ocultar contraseña"
        );

    } else {

        contraseña.type =
            "password";

        btnMostrarContraseña.textContent =
            "👁️";

        btnMostrarContraseña.setAttribute(
            "aria-label",
            "Mostrar contraseña"
        );

    }

}


);

/* =========================
INICIAR SESIÓN
========================= */

formulario.addEventListener(
"submit",
async (evento) => {


    evento.preventDefault();


    const correo =
        document.getElementById(
            "correo"
        ).value.trim();


    const contraseñaValor =
        contraseña.value;


    try {

        const respuesta =
            await fetch(
                "http://localhost:3000/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

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

            alert(
                datos.mensaje ||
                "Correo o contraseña incorrectos."
            );

            return;

        }


        /* =========================
           GUARDAR USUARIO
           ========================= */

        localStorage.setItem(
            "HIDROMATIC_USUARIO",
            JSON.stringify(
                datos.usuario
            )
        );


        /*
           Si anteriormente estaba usando
           modo offline, lo quitamos al
           iniciar sesión.
        */

        localStorage.removeItem(
            "HIDROMATIC_MODO_OFFLINE"
        );


        window.location.href =
            "perfil.html";

    } catch (error) {

        console.error(
            "Error al conectar con el backend:",
            error
        );


        alert(
            "No se pudo conectar con el servidor."
        );

    }

}


);

/* =========================
CREAR CUENTA
========================= */

btnRegistro.addEventListener(
"click",
() => {


    window.location.href =
        "registro.html";

}

);

/* =========================
MODO INVITADO
========================= */

btnInvitado.addEventListener(
"click",
() => {


    /*
       El modo invitado no necesita
       usuario ni contraseña.
    */

    localStorage.removeItem(
        "HIDROMATIC_USUARIO"
    );


    /*
       Entramos directamente al perfil.
    */

    window.location.href =
        "perfil.html";

}


);



