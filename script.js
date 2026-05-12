//getElementById -> obtener los elementos de HTML para manipularlos

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


// Esta función impide entrar al login si no se han respondido las preguntas 
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


// Funcion de hora y fecha en tiempo real y actualizada cada segundo
function actualizarFechaHora() {
    const tiempoActual = new Date();
    // formateamos la fecha actual para mostrarla en el dashboard
    const opcionesFecha = { day: 'numeric', month: 'long', year: 'numeric' };
    const fechaActual = tiempoActual.toLocaleDateString('es-ES', opcionesFecha);  
    
    // hora con AM/PM o p.m/a.m
    const opcionesHora = {  // Formato de hora con AM/PM o p.m/a.m
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true // <-- activa el AM/PM
    };

     // formateamos la hora para mostrarla en el dashboard
    const horaActual = tiempoActual.toLocaleTimeString('Es-ES', opcionesHora);

    // fecha y hora en el html
    document.getElementById('fecha').textContent = fechaActual;
    document.getElementById('hora').textContent = horaActual;

}

// llamar a la funcion para mostrar la fecha y hora al cargar el dashboard
actualizarFechaHora();

// Actualizar la fecha y hora cada segundo(1000 milisegundos)
setInterval(actualizarFechaHora, 1000);

/**
 * SISTEMA DE GESTION DE USUARIOS
 * Descripcion: Manejo de autenticacion, registro y recuperacion mediante listas enlazadas.
 */

// --- CLASE USUARIO ---
// Representa el nodo de la lista enlazada con la informacion del cliente.
class Usuario {
    constructor(nombre, cedula, email, pass, respuestas, idsPreguntas) {
        this.nombre = nombre;
        this.cedula = cedula;
        this.email = email;
        this.pass = pass;
        this.preguntas = respuestas;     // Respuestas de seguridad
        this.idsPreguntas = idsPreguntas; // Referencia al catalogo de preguntas
        this.siguiente = null;            // Puntero al proximo nodo
        this.intentos = 0;                // Contador para bloqueo de cuenta
        this.bloqueada = false;           // Estado de acceso
    }
}

// --- CLASE SISTEMA (LISTA ENLAZADA) ---
// Gestiona la estructura de datos y la persistencia en LocalStorage.
class SistemaUsuarios {
    constructor() {
        this.cabeza = null;
        this.cargarDesdeArchivo(); 
    }

    // Inserta un nuevo usuario si la cedula no existe previamente.
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

    // Busca un nodo recorriendo la lista por numero de cedula.
    buscarPorCedula(cedula) {
        let actual = this.cabeza;
        while (actual) {
            if (actual.cedula.trim() === cedula.trim()) return actual;
            actual = actual.siguiente;
        }
        return null;
    }

    // Busca un nodo recorriendo la lista por correo electronico.
    buscarPorEmail(email) {
        let actual = this.cabeza;
        while (actual) {
            if (actual.email.toLowerCase() === email.toLowerCase()) return actual;
            actual = actual.siguiente;
        }
        return null;
    }

    // Serializa la lista enlazada a un array para guardarlo en LocalStorage.
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

    // Recupera los datos de LocalStorage y reconstruye la lista enlazada.
    cargarDesdeArchivo() {
        const datosRaw = localStorage.getItem('usuarios_banco');
        if (datosRaw) {
            const datos = JSON.parse(datosRaw);
            datos.forEach(d => {
                const nuevoU = new Usuario(d.nombre, d.cedula, d.email, d.pass, d.preguntas, d.idsPreguntas);
                nuevoU.intentos = d.intentos || 0;
                nuevoU.bloqueada = d.bloqueada || false;
                this._insertarAlFinal(nuevoU);
            });
        }
    }

    // Metodo auxiliar para reconstruir la lista sin disparar guardados adicionales.
    _insertarAlFinal(nuevo) {
        if (!this.cabeza) this.cabeza = nuevo;
        else {
            let actual = this.cabeza;
            while (actual.siguiente) actual = actual.siguiente;
            actual.siguiente = nuevo;
        }
    }
}

// Instancia global de la base de datos simulada.
const db = new SistemaUsuarios();

// Diccionario que mapea IDs con las preguntas de seguridad visibles al usuario.
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

// Variables para mantener el contexto durante procesos de varios pasos.
let usuarioTemporal = null;
let indicePreguntaAzar = 0;

// --- FUNCIONES DE INTERFAZ ---

// Finaliza el registro capturando datos de la URL y las preguntas de seguridad.
function finalizarProceso() {
    const urlParams = new URLSearchParams(window.location.search);
    const nombre = urlParams.get('usuario');
    const cedula = urlParams.get('cedula');
    const email = urlParams.get('email');
    const pass = urlParams.get('pass_reg');

    const formPreguntas = document.getElementById('form-preguntas');
    const mensajeExito = document.getElementById('mensaje-exito');
    const tituloInstruccion = document.getElementById('instruccion');

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
        try {
            const nuevoUsuario = new Usuario(nombre, cedula, email, pass, respuestas, ids);
            
            if (db.registrar(nuevoUsuario)) {
                if(formPreguntas) formPreguntas.style.display = 'none';
                if(mensajeExito) mensajeExito.style.display = 'block';
                if(tituloInstruccion) tituloInstruccion.innerText = "¡Registro Exitoso!";
            } else {
                alert("ERROR: La cédula ya está registrada.");
            }
        } catch (error) {
            console.error("Error en el registro:", error);
        }
    } else {
        alert("Faltan datos del registro anterior.");
    }
}

// Valida credenciales e implementa logica de bloqueo tras 3 intentos fallidos.
function manejarLogin() {
    const cedula = document.getElementById('login_nombre').value.trim();
    const pass = document.getElementById('login_pass').value.trim();
    const usuario = db.buscarPorCedula(cedula);

    if (!usuario) return alert("Usuario no encontrado.");
    if (usuario.bloqueada) return alert("CUENTA BLOQUEADA. Use 'Recuperar Cuenta'.");

    if (usuario.pass === pass) {
        usuario.intentos = 0;
        db.guardarEnArchivo();
        alert("Bienvenido " + usuario.nombre);
    } else {
        usuario.intentos++;
        if (usuario.intentos >= 3) {
            usuario.bloqueada = true;
            alert("CUENTA BLOQUEADA por seguridad.");
        } else {
            alert("Clave incorrecta. Intentos: " + usuario.intentos + "/3");
        }
        db.guardarEnArchivo();
    }
}

// Busca al usuario y selecciona una pregunta al azar para validar identidad.
function prepararCambioClave() {
    const cedula = document.getElementById('cambiar-cedula-input').value.trim();
    usuarioTemporal = db.buscarPorCedula(cedula);

    if (usuarioTemporal) {
        if (usuarioTemporal.bloqueada) return alert("Cuenta bloqueada.");
        
        indicePreguntaAzar = Math.floor(Math.random() * 3);
        const idPregunta = usuarioTemporal.idsPreguntas[indicePreguntaAzar];
        
        document.getElementById('mostrar-pregunta-vol').innerText = catalogoPreguntas[idPregunta];
        document.getElementById('cambiar-paso1').style.display = 'none';
        document.getElementById('cambiar-paso2').style.display = 'block';
    } else {
        alert("Cédula no registrada.");
    }
}

// Compara respuesta y actualiza la clave en el nodo correspondiente.
function ejecutarCambioClave() {
    const respuesta = document.getElementById('cambiar-resp-input').value.trim();
    const nueva = document.getElementById('nueva-clave-input').value.trim();

    if (usuarioTemporal.preguntas[indicePreguntaAzar].toLowerCase() === respuesta.toLowerCase()) {
        usuarioTemporal.pass = nueva;
        db.guardarEnArchivo();
        alert("Contraseña actualizada.");
        location.reload();
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