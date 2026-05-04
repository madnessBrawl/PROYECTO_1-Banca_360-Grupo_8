// usamos localStorage para que el navegador "recuerde" el registro al cambiar de página
let registroValido = localStorage.getItem('registroCompleto') === 'true';

// logica de registro
function manejarRegistro() {
    // Aquí puedes agregar validaciones extra si lo deseas
    console.log("Datos básicos recibidos. Redirigiendo a seguridad...");
    window.location.href = "preguntas_seguridad.html";
}

// preguntas de seguridad
function finalizarProceso() {
    // Marcamos el registro como completado
    localStorage.setItem('registroCompleto', 'true');
    registroValido = true;

    // Cambiamos la vista
    document.getElementById('form-preguntas').style.display = 'none';
    document.getElementById('instruccion').style.display = 'none';
    document.getElementById('mensaje-exito').style.display = 'block';
}

// Inicio de sesion 
function manejarLogin() {
    const boton = document.getElementById('btn-entrar');
    const spinner = document.getElementById('spinner-login');

    // Bloquear boton y mostrar spinner de 2 segundos
    boton.disabled = true;
    spinner.style.display = 'block';

    setTimeout(() => {
        alert("Acceso concedido a Banca360");
        window.location.href = "dashboard.html"; // O la pagina principal post-login
    }, 2000); // 2 segundos exactos
}


// Esta función impide entrar al login si no se han respondido las preguntas (no aplicada aun)
window.addEventListener('hashchange', function() {
    if (window.location.hash === "#iniciosesion" && !registroValido) {
        alert("Seguridad: Debe completar el registro y las preguntas primero.");
        window.location.hash = "#registro";
    }
});

// Verificacion inicial al cargar la página
window.onload = function() {
    if (window.location.hash === "#iniciosesion" && !registroValido) {
        window.location.hash = "#registro";
    }
};

// Modo oscuro
const btnModo = document.getElementById('boton-claro-oscuro');
const body = document.body;
if (localStorage.getItem('tema') === 'dark') {
    body.classList.add('dark-mode');
    btnModo.textContent = 'MODO CLARO';
}

btnModo.addEventListener('click', () => {
    // 1. Cambiamos la clase del body
    document.body.classList.toggle('dark-mode');

    // 2. Verificamos si la clase se aplico correctamente para cambiar el texto
    if (document.body.classList.contains('dark-mode')) {
        btnModo.textContent = 'MODO CLARO';
        console.log("Modo oscuro activado"); 
    } else {
        btnModo.textContent = 'MODO OSCURO';
        console.log("Modo claro activado");
    }
});