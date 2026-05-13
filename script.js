/**
 * SISTEMA DE GESTION DE USUARIOS --- BANCA360*/

// getElementById -> obtener los elementos de HTML para manipularlos

// usamos localStorage para que el navegador "recuerde" el registro al cambiar de pagina
let registroValido = localStorage.getItem('registroCompleto') === 'true';

// --- CLASE USUARIO (NODO DE LA LISTA) ---
class Usuario {
    constructor(nombre, cedula, email, pass, respuestas, idsPreguntas) {
        this.nombre = nombre;
        this.cedula = cedula;
        this.email = email;
        this.pass = pass;
        this.preguntas = respuestas;     // Respuestas de seguridad
        this.idsPreguntas = idsPreguntas; // IDs de las preguntas
        this.siguiente = null;           // Puntero al proximo nodo
        this.intentos = 0;               // Contador de errores
        this.bloqueada = false;          // Estado de cuenta
    }
}

// --- CLASE SISTEMA (LISTA ENLAZADA) ---
class SistemaUsuarios {
    constructor() {
        this.cabeza = null;
        this.cargarDesdeArchivo(); 
    }

    registrar(nuevoUsuario) {
        if (this.buscarPorCedula(nuevoUsuario.cedula)) return false;
        if (!this.cabeza) {
            this.cabeza = nuevoUsuario;
        } else {
            let actual = this.cabeza;
            while (actual.siguiente) actual = actual.siguiente;
            actual.siguiente = nuevoUsuario;
        }
        this.guardarEnArchivo();
        return true;
    }

    buscarPorCedula(cedula) {
        if (!cedula) return null;
        let actual = this.cabeza;
        while (actual) {
            if (String(actual.cedula).trim() === String(cedula).trim()) return actual;
            actual = actual.siguiente;
        }
        return null;
    }

    buscarPorEmail(email) {
        if (!email) return null;
        let actual = this.cabeza;
        while (actual) {
            if (actual.email.toLowerCase() === email.toLowerCase()) return actual;
            actual = actual.siguiente;
        }
        return null;
    }

    guardarEnArchivo() {
        let listaArray = [];
        let actual = this.cabeza;
        while (actual) {
            listaArray.push({
                nombre: actual.nombre,
                cedula: actual.cedula,
                email: actual.email,
                pass: actual.pass,
                preguntas: actual.preguntas,
                idsPreguntas: actual.idsPreguntas,
                intentos: actual.intentos,
                bloqueada: actual.bloqueada
            });
            actual = actual.siguiente;
        }
        localStorage.setItem('usuarios_banco', JSON.stringify(listaArray));
    }

    cargarDesdeArchivo() {
        const datosRaw = localStorage.getItem('usuarios_banco');
        if (datosRaw) {
            const datos = JSON.parse(datosRaw);
            this.cabeza = null; 
            datos.forEach(d => {
                const nuevoU = new Usuario(d.nombre, d.cedula, d.email, d.pass, d.preguntas, d.idsPreguntas);
                nuevoU.intentos = d.intentos || 0;
                nuevoU.bloqueada = d.bloqueada || false;
                this._insertarAlFinal(nuevoU);
            });
        }
    }

    _insertarAlFinal(nuevo) {
        if (!this.cabeza) this.cabeza = nuevo;
        else {
            let actual = this.cabeza;
            while (actual.siguiente) actual = actual.siguiente;
            actual.siguiente = nuevo;
        }
    }
}

// Instancia global
const db = new SistemaUsuarios();

const catalogoPreguntas = {
    "1": "¿Nombre de tu primera mascota?",
    "2": "¿Ciudad de nacimiento?",
    "3": "¿Nombre de tu escuela primaria?",
    "4": "¿Marca de tu primer teléfono?",
    "5": "¿Nombre de tu madre o padre?",
    "6": "¿Color favorito?",
    "7": "¿Comida favorita?",
    "8": "¿Nombre de tu libro favorito?",
    "9": "¿Película que más te gusta?"
};

let usuarioTemporal = null;
let indicePreguntaAzar = 0;

// logica de registro inicial
function manejarRegistro() {
    console.log("Datos basicos recibidos. Redirigiendo a seguridad...");
    window.location.href = "preguntas_seguridad.html";
}

// preguntas de seguridad y guardado en lista enlazada
function finalizarProceso() {
    // Capturamos datos de la URL (vienen del formulario anterior)
    const urlParams = new URLSearchParams(window.location.search);
    const nombre = urlParams.get('usuario');
    const cedula = urlParams.get('cedula');
    const email = urlParams.get('email');
    const pass = urlParams.get('pass_reg');

    // Capturamos las preguntas seleccionadas
    const ids = [
        document.getElementById('p1-opcion').value,
        document.getElementById('p2-opcion').value,
        document.getElementById('p3-opcion').value
    ];
    const respuestas = [
        document.getElementById('p1-respuesta').value.trim(),
        document.getElementById('p2-respuesta').value.trim(),
        document.getElementById('p3-respuesta').value.trim()
    ];

    if (nombre && cedula) {
        const nuevoUsuario = new Usuario(nombre, cedula, email, pass, respuestas, ids);
        
        if (db.registrar(nuevoUsuario)) {
            // Marcamos el registro como completado para el navegador
            localStorage.setItem('registroCompleto', 'true');
            registroValido = true;

            // Cambiamos la vista
            document.getElementById('form-preguntas').style.display = 'none';
            document.getElementById('instruccion').innerText = "¡Registro Completado!";
            document.getElementById('mensaje-exito').style.display = 'block';
        } else {
            alert("Error: El usuario ya existe en el sistema.");
        }
    } else {
        alert("Faltan datos del registro.");
    }
}

// Inicio de sesion con validacion real y lista enlazada
function manejarLogin() {
    const cedulaInput = document.getElementById('login_nombre').value.trim();
    const passInput = document.getElementById('login_pass').value.trim();
    const boton = document.getElementById('btn-entrar'); 
    const spinner = document.getElementById('spinner-login');

    const usuario = db.buscarPorCedula(cedulaInput);

    if (!usuario) {
        alert("Usuario no registrado");
        return;
    }

    if (usuario.bloqueada) {
        alert("Cuenta bloqueada. Use la opcion de recuperar.");
        return;
    }

    if (usuario.pass === passInput) {
        // Bloquear boton y mostrar spinner de 2 segundos
        if (boton) boton.disabled = true;
        if (spinner) spinner.style.display = 'block';

        setTimeout(() => {
            usuario.intentos = 0;
            db.guardarEnArchivo();
            localStorage.setItem('usuario_actual', usuario.cedula);
            alert("Acceso concedido a Banca360");
            window.location.href = "menu_inicio_sesion.html";
        }, 2000); 
    } else {
        usuario.intentos++;
        if (usuario.intentos >= 3) {
            usuario.bloqueada = true;
            alert("Has superado los intentos. Cuenta bloqueada.");
        } else {
            alert(`Contraseña incorrecta. Intento ${usuario.intentos} de 3.`);
        }
        db.guardarEnArchivo();
    }
}

// Bloqueo de hash si no hay registro
window.addEventListener('hashchange', function() {
    if (window.location.hash === "#iniciosesion" && !registroValido) {
        alert("Seguridad: Debe completar el registro y las preguntas primero.");
        window.location.hash = "#registro";
    }
});

// Verificacion inicial al cargar la pagina
window.onload = function() {
    if (window.location.hash === "#iniciosesion" && !registroValido) {
        window.location.hash = "#registro";
    }
    // Si estamos en dashboard, arrancar reloj y perfil
    if (document.querySelector('.dashboard-layout')) {
        mostrarDatosPerfil();
        actualizarFechaHora();
        setInterval(actualizarFechaHora, 1000);
    }
};

// Modo oscuro
const btnModo = document.getElementById('boton-claro-oscuro');
if (localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark-mode');
    if (btnModo) btnModo.textContent = 'MODO CLARO';
}

if (btnModo) {
    btnModo.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            btnModo.textContent = 'MODO CLARO';
            localStorage.setItem('tema', 'dark');
        } else {
            btnModo.textContent = 'MODO OSCURO';
            localStorage.setItem('tema', 'light');
        }
    });
}


// --- FUNCIONES DEL DASHBOARD ---

function mostrarDatosPerfil() {
    const cedulaActiva = localStorage.getItem('usuario_actual');
    const user = db.buscarPorCedula(cedulaActiva);
    if (user) {
        if (document.getElementById('perf-nombre')) document.getElementById('perf-nombre').textContent = user.nombre;
        if (document.getElementById('perf-cedula')) document.getElementById('perf-cedula').textContent = user.cedula;
        if (document.getElementById('perf-email')) document.getElementById('perf-email').textContent = user.email;
    }
}

function cambiarVistaInterna(seccion) {
    const vistaPerfil = document.getElementById('vista-perfil');
    const vistaSeguridad = document.getElementById('vista-seguridad');
    const linkP = document.getElementById('link-perfil');
    const linkS = document.getElementById('link-seguridad');

    if (seccion === 'perfil') {
        if(vistaPerfil) vistaPerfil.style.display = 'block';
        if(vistaSeguridad) vistaSeguridad.style.display = 'none';
        linkP?.classList.add('activo');
        linkS?.classList.remove('activo');
    } else {
        if(vistaPerfil) vistaPerfil.style.display = 'none';
        if(vistaSeguridad) vistaSeguridad.style.display = 'block';
        linkP?.classList.remove('activo');
        linkS?.classList.add('activo');
    }
}

function cerrarSesion() {
    if(confirm("¿Seguro que deseas cerrar sesion?")) {
        localStorage.removeItem('usuario_actual');
        window.location.href = 'pagina_principal.html';
    }
}

// --- LOGICA DE CAMBIO DE CLAVE (DENTRO DEL DASHBOARD) ---
function prepararCambioClave() {
    const cedulaActiva = localStorage.getItem('usuario_actual');
    usuarioTemporal = db.buscarPorCedula(cedulaActiva);

    if (usuarioTemporal) {
        indicePreguntaAzar = Math.floor(Math.random() * 3);
        const idPregunta = usuarioTemporal.idsPreguntas[indicePreguntaAzar];
        const labelPregunta = document.getElementById('mostrar-pregunta-vol');
        
        if (labelPregunta) {
            labelPregunta.innerText = catalogoPreguntas[idPregunta];
            document.getElementById('contenedor-btn-inicio').style.display = 'none';
            document.getElementById('seccion-verificacion').style.display = 'block';
        }
    }
}

function ejecutarCambioClave() {
    const respuestaUser = document.getElementById('cambiar-resp-input').value.trim();
    const nuevaClave = document.getElementById('nueva-clave-input').value.trim();

    if (nuevaClave.length !== 6 || isNaN(nuevaClave)) {
        alert("La clave debe ser de 6 numeros.");
        return;
    }

    if (respuestaUser.toLowerCase() === usuarioTemporal.preguntas[indicePreguntaAzar].toLowerCase()) {
        usuarioTemporal.pass = nuevaClave;
        db.guardarEnArchivo();
        alert("Contraseña actualizada.");
        cambiarVistaInterna('perfil');
    } else {
        alert("Respuesta incorrecta.");
    }
}

// Inicia flujo de desbloqueo buscando al usuario por su correo electronico.
function prepararDesbloqueo() {
    const email = document.getElementById('rec-email-input').value.trim();
    usuarioTemporal = db.buscarPorEmail(email);

    if (usuarioTemporal) {
        indicePreguntaAzar = Math.floor(Math.random() * 3);
        const idPregunta = usuarioTemporal.idsPreguntas[indicePreguntaAzar];
        
        document.getElementById('mostrar-pregunta-rec').innerText = catalogoPreguntas[idPregunta];
        document.getElementById('rec-paso1').style.display = 'none';
        document.getElementById('rec-paso2').style.display = 'block';
    } else {
        alert("Correo no encontrado.");
    }
}

// Valida respuesta y contraseña anterior para resetear el estado de bloqueo.
function ejecutarDesbloqueo() {
    const respuesta = document.getElementById('rec-resp-input').value.trim();
    const passConfirm = document.getElementById('rec-pass-confirm').value.trim();

    if (usuarioTemporal.preguntas[indicePreguntaAzar].toLowerCase() === respuesta.toLowerCase() && 
        usuarioTemporal.pass === passConfirm) {
        
        usuarioTemporal.bloqueada = false;
        usuarioTemporal.intentos = 0;
        db.guardarEnArchivo();
        alert("Cuenta desbloqueada.");
        location.reload();
    } else {
        alert("Los datos no coinciden.");
    }
}
// --- MODO OSCURO --- //
if (localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark-mode');
    if(btnModoExtra) btnModoExtra.textContent = 'MODO CLARO';
}
if(btnModoExtra) {
    btnModoExtra.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const esOscuro = document.body.classList.contains('dark-mode');
        btnModoExtra.textContent = esOscuro ? 'MODO CLARO' : 'MODO OSCURO';
        localStorage.setItem('tema', esOscuro ? 'dark' : 'light');
    });
}


/*--------------------------- DASHBOARD ---------------------------*/ 

// --- FUNCIÓN PARA CAMBIAR ENTRE PAGO MÓVIL Y TRANSFERENCIA ---
const linksNav = document.querySelectorAll('.nav-op-link');  // Seleccionamos todos los enlaces de navegación dentro del dashboard

// Funcion de hora y fecha
function actualizarFechaHora() {
    const tiempoActual = new Date();

    // Configuración de formato
    const opcionesFecha = { day: 'numeric', month: 'long', year: 'numeric' };
    const opcionesHora = { hour: '2-digit', minute: '2-digit', hour12: true };

    // Obtener los elementos usando los IDs exactos del HTML
    const elFecha = document.getElementById('fecha-navbar'); 
    const elHora = document.getElementById('hora-navbar');

    // Solo intentar escribir si los elementos existen en la página actual
    if (elFecha && elHora) {
        elFecha.textContent = tiempoActual.toLocaleDateString('es-ES', opcionesFecha);
        elHora.textContent = tiempoActual.toLocaleTimeString('es-ES', opcionesHora);
    }
}

// Ejecución inicial y configuración del intervalo
actualizarFechaHora();
setInterval(actualizarFechaHora, 1000);


// --- FUNCIÓN PARA OCULTAR/MOSTRAR SALDO ---
function toggleSaldo(boton) {
    // Buscamos el elemento de texto del monto dentro del mismo contenedor
    const textoMonto = document.getElementById('monto-valor');
    const icono = document.getElementById('icono-ojo-saldo');

    // Obtenemos el monto real guardado en el atributo data-monto
    const montoReal = textoMonto.getAttribute('data-monto');

    // Si el contenido actual es el monto, lo ocultamos con ####, de lo contrario, lo mostramos
    if (textoMonto.textContent !== '####') {

        // ESTADO: VISIBLE -> OCULTAR
        textoMonto.textContent = '####';

        // Cambia a la imagen del ojo tachado
        icono.src = 'imagenes/ojo-cerrado.png'; 
    } else {
        // ESTADO: OCULTO -> MOSTRAR
        textoMonto.textContent = 'Bs. ' + montoReal;
        icono.src = 'imagenes/ojo-abierto.png';
    }
}

