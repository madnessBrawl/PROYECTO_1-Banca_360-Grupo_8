/**
 * SISTEMA DE GESTION DE USUARIOS --- BANCA360 */

let registroValido = localStorage.getItem('registroCompleto') === 'true';

/**
 * Clase Usuario - Representa un nodo en la lista enlazada de usuarios.
 * Cada usuario almacena sus datos personales, credenciales, datos bancarios
 * (telefono, numero de cuenta, saldo) y un puntero al siguiente nodo.
 */
class Usuario {
    constructor(nombre, cedula, email, pass, respuestas, idsPreguntas, telefono, numeroCuenta) {
        this.nombre = nombre;           // Nombre completo del cliente
        this.cedula = cedula;           // Cedula de identidad (identificador unico)
        this.email = email;             // Correo electronico
        this.pass = pass;               // Contraseña numerica de 6 digitos
        this.preguntas = respuestas;    // Array con las 3 respuestas de seguridad
        this.idsPreguntas = idsPreguntas; // Array con los IDs de las preguntas seleccionadas
        this.telefono = telefono || '';  // Numero de telefono (11 digitos, ej: 04121234567)
        this.numeroCuenta = numeroCuenta || ''; // Numero de cuenta bancaria (20 digitos, generado automaticamente)
        this.saldo = 500.00;            // Saldo inicial de Bs. 500 al crear la cuenta
        this.siguiente = null;          // Puntero al siguiente nodo (estructura de lista enlazada)
        this.intentos = 0;              // Contador de intentos fallidos de login
        this.bloqueada = false;         // Indica si la cuenta esta bloqueada
    }
}

class SistemaUsuarios {
    constructor() {
        this.cabeza = null;
        this.cargarDesdeArchivo(); 
    }

    registrar(nuevoUsuario) {
        if (this.buscarPorCedula(nuevoUsuario.cedula)) return false;
        if (!this.cabeza) this.cabeza = nuevoUsuario;
        else {
            let actual = this.cabeza;
            while (actual.siguiente) actual = actual.siguiente;
            actual.siguiente = nuevoUsuario;
        }
        this.guardarEnArchivo();
        return true;
    }

    buscarPorCedula(cedula) {
        let actual = this.cabeza;
        while (actual) {
            if (String(actual.cedula).trim() === String(cedula).trim()) return actual;
            actual = actual.siguiente;
        }
        return null;
    }

    /**
     * Busca un usuario por su numero de telefono recorriendo la lista enlazada.
     * Se usa en el modulo de Pago Movil para encontrar al destinatario.
     * Retorna el nodo Usuario si lo encuentra, o null si no existe.
     */
    buscarPorTelefono(telefono) {
        let actual = this.cabeza;
        while (actual) {
            if (String(actual.telefono).trim() === String(telefono).trim()) return actual;
            actual = actual.siguiente;
        }
        return null;
    }

    /**
     * Busca un usuario por su numero de cuenta recorriendo la lista enlazada.
     * Se usa en el modulo de Transferencia para encontrar al destinatario.
     * Retorna el nodo Usuario si lo encuentra, o null si no existe.
     */
    buscarPorCuenta(numeroCuenta) {
        let actual = this.cabeza;
        while (actual) {
            if (String(actual.numeroCuenta).trim() === String(numeroCuenta).trim()) return actual;
            actual = actual.siguiente;
        }
        return null;
    }

    /**
     * Serializa toda la lista enlazada a un array JSON y lo guarda en localStorage.
     * Se llama cada vez que se modifica un usuario (registro, cambio de saldo, etc.).
     * Incluye telefono, numeroCuenta y saldo para persistir los datos bancarios.
     */
    guardarEnArchivo() {
        let listaArray = [];
        let actual = this.cabeza;
        while (actual) {
            listaArray.push({
                nombre: actual.nombre, cedula: actual.cedula, email: actual.email,
                pass: actual.pass, preguntas: actual.preguntas, idsPreguntas: actual.idsPreguntas,
                telefono: actual.telefono, numeroCuenta: actual.numeroCuenta, saldo: actual.saldo,
                intentos: actual.intentos, bloqueada: actual.bloqueada
            });
            actual = actual.siguiente;
        }
        localStorage.setItem('usuarios_banco', JSON.stringify(listaArray));
    }

    /**
     * Reconstruye la lista enlazada desde los datos guardados en localStorage.
     * Se ejecuta al instanciar SistemaUsuarios (al cargar cualquier pagina).
     * Si el saldo no existe (usuarios antiguos), asigna 500 por defecto.
     */
    cargarDesdeArchivo() {
        const datosRaw = localStorage.getItem('usuarios_banco');
        if (datosRaw) {
            const datos = JSON.parse(datosRaw);
            datos.forEach(d => {
                const nuevoU = new Usuario(d.nombre, d.cedula, d.email, d.pass, d.preguntas, d.idsPreguntas, d.telefono, d.numeroCuenta);
                nuevoU.saldo = (d.saldo !== undefined) ? d.saldo : 500.00; // Compatibilidad con datos antiguos
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

const db = new SistemaUsuarios();

function manejarLogin() {
    const cedulaInput = document.getElementById('login_nombre').value.trim();
    const passInput = document.getElementById('login_pass').value.trim();
    const boton = document.getElementById('btn-entrar'); 
    const spinner = document.getElementById('spinner-login');

    const usuario = db.buscarPorCedula(cedulaInput);
    if (!usuario) { alert("Usuario no registrado"); return; }

    if (usuario.pass === passInput) {
        if (boton) boton.disabled = true;
        if (spinner) spinner.style.display = 'block';
        setTimeout(() => {
            localStorage.setItem('usuario_actual', usuario.cedula);
            // REPARADO: Nombre de archivo corregido
            window.location.href = "dashboard.html"; 
        }, 2000); 
    } else {
        alert("Contraseña incorrecta.");
    }
}

/**
 * Finaliza el proceso de registro del usuario.
 * Se llama desde preguntas_seguridad.html al enviar el formulario.
 * Lee los datos del usuario desde los parametros URL (enviados por GET desde el formulario de registro),
 * obtiene el telefono, genera automaticamente un numero de cuenta de 20 digitos,
 * y crea el objeto Usuario con saldo inicial de Bs. 500.
 */
function finalizarProceso() {
    // Leer datos que vienen por URL desde el formulario de registro en index.html
    const parametros = new URLSearchParams(window.location.search);
    const nombre = parametros.get('usuario');
    const cedula = parametros.get('cedula');
    const email = parametros.get('email');
    const pass = parametros.get('pass_reg');
    const telefono = parametros.get('telefono') || ''; // Numero de telefono del formulario de registro

    // Generar numero de cuenta automatico de 20 digitos:
    // '0123' es un codigo de banco ficticio + 16 digitos aleatorios
    const numeroCuenta = '0123' + Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('');

    // Obtener las respuestas de las 3 preguntas de seguridad del formulario actual
    const respuestas = [
        document.getElementById('p1-respuesta').value.trim(),
        document.getElementById('p2-respuesta').value.trim(),
        document.getElementById('p3-respuesta').value.trim()
    ];
    // Obtener los IDs de las preguntas seleccionadas en los <select>
    const ids = [
        document.getElementById('p1-opcion').value,
        document.getElementById('p2-opcion').value,
        document.getElementById('p3-opcion').value
    ];

    if (nombre && cedula) {
        // Crear el usuario con todos los datos: personales + seguridad + bancarios
        const nuevoUsuario = new Usuario(nombre, cedula, email, pass, respuestas, ids, telefono, numeroCuenta);
        if (db.registrar(nuevoUsuario)) {
            localStorage.setItem('registroCompleto', 'true');
            registroValido = true;
            document.getElementById('form-preguntas').style.display = 'none';
            document.getElementById('instruccion').innerText = "¡Registro Exitoso!";
            document.getElementById('mensaje-exito').style.display = 'block';
        } else {
            alert("Error: El usuario ya existe.");
        }
    }
}
function cargarDatosPerfil() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;

    // Buscamos los elementos por ID 
    const nombrePerfil = document.getElementById('perfil-nombre');
    const cedulaPerfil = document.getElementById('perfil-cedula');
    const emailPerfil = document.getElementById('perfil-email');
    const telefonoPerfil = document.getElementById('perfil-telefono');
    const cuentaPerfil = document.getElementById('perfil-cuenta');

    if (nombrePerfil) nombrePerfil.textContent = usuario.nombre;
    if (cedulaPerfil) cedulaPerfil.textContent = usuario.cedula;
    if (emailPerfil) emailPerfil.textContent = usuario.email;
    if (telefonoPerfil) telefonoPerfil.textContent = usuario.telefono;
    if (cuentaPerfil) cuentaPerfil.textContent = usuario.numeroCuenta;
}

window.addEventListener('DOMContentLoaded', () => {
    refrescarVistaBancaria(); 
    cargarDatosPerfil(); 
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
});


/**
 * Cambia entre la vista de Datos Personales y la de Seguridad
 */
function cambiarVistaInterna(vista) {
    const seccionPerfil = document.getElementById('vista-perfil');
    const seccionSeguridad = document.getElementById('vista-seguridad');
    const linkPerfil = document.getElementById('link-perfil');
    const linkSeguridad = document.getElementById('link-seguridad');

    if (vista === 'perfil') {
        seccionPerfil.style.display = 'block';
        seccionSeguridad.style.display = 'none';
        linkPerfil.classList.add('activo');
        linkSeguridad.classList.remove('activo');
    } else {
        seccionPerfil.style.display = 'none';
        seccionSeguridad.style.display = 'block';
        linkPerfil.classList.remove('activo');
        linkSeguridad.classList.add('activo');
    }
}

/*Opciones de preguntas*/
const TEXTO_PREGUNTAS = {
    "1": "¿Nombre de tu primera mascota?",
    "2": "¿Ciudad donde naciste?",
    "3": "¿Nombre de tu abuela materna?",
    "4": "¿Color favorito?",
    "5": "¿Nombre de tu mejor amigo de la infancia?",
    "6": "¿Marca de tu primer carro?",
    "7": "¿Comida favorita?",
    "8": "¿Nombre de tu libro favorito?",
    "9": "¿Película que más te gusta?"
};

/*se eligue una pregunta de seguridad alazar reguistrada y se ejecuta */
function prepararCambioClave() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;
    const indiceAzar = Math.floor(Math.random() * 3);

    const idPregunta = usuario.idsPreguntas[indiceAzar];

    const textoPregunta = TEXTO_PREGUNTAS[idPregunta] || "Pregunta de seguridad registrada";

    sessionStorage.setItem('indicePreguntaAResponder', indiceAzar);

    document.getElementById('mostrar-pregunta-vol').innerText = textoPregunta;


    document.getElementById('contenedor-btn-inicio').style.display = 'none';
    document.getElementById('seccion-verificacion').style.display = 'block';
}


function ejecutarCambioClave() {
    const usuario = obtenerUsuarioActual();
    const indice = sessionStorage.getItem('indicePreguntaAResponder');
    
    const respuestaIngresada = document.getElementById('cambiar-resp-input').value.trim();
    const nuevaClave = document.getElementById('nueva-clave-input').value.trim();

    if (!respuestaIngresada || nuevaClave.length !== 6) {
        alert("Por favor, introduce la respuesta y una nueva clave de 6 dígitos.");
        return;
    }


    const respuestaCorrecta = usuario.preguntas[indice]; 

    if (respuestaIngresada.toLowerCase() === respuestaCorrecta.toLowerCase()) {
        usuario.pass = nuevaClave;
        db.guardarEnArchivo();
        
        alert("¡Contraseña actualizada con éxito!");
        location.reload(); 
    } else {
        alert("La respuesta a la pregunta de seguridad es incorrecta.");
    }
}
/*Cierra sesion y nos redirige a pagina principal */ 
function cerrarSesion() {
    localStorage.removeItem('usuario_actual');
    sessionStorage.clear();
    alert("Has cerrado sesión correctamente. ¡Vuelve pronto!");
    window.location.href = "index.html";
}
/* ====================================

=======================================
 * MODULO DE OPERACIONES BANCARIAS E HISTORIAL (ZAHED)
 * 
 * Este modulo maneja:
 * 1. Pago Movil: envio de dinero buscando al destinatario por telefono + cedula
 * 2. Transferencia: envio de dinero buscando al destinatario por numero de cuenta
 * 3. Deposito: ingreso de dinero a la cuenta del usuario logueado
 * 4. Historial: registro de movimientos por usuario (almacenado en localStorage)
 * 5. Dashboard: visualizacion del saldo, datos de cuenta y ultimos 3 movimientos
 * 6. Modal de detalle: vista individual de cada transaccion
 * 7. Ocultar/Mostrar saldo: funcionalidad de privacidad
 * =========================================================================== */

/**
 * Obtiene el usuario que esta logueado actualmente.
 * Lee la cedula guardada en localStorage al momento del login (linea 122)
 * y busca el nodo correspondiente en la lista enlazada de usuarios.
 * Retorna el objeto Usuario completo o null si no hay sesion activa.
 */
function obtenerUsuarioActual() {
    const cedula = localStorage.getItem('usuario_actual'); // Cedula guardada al hacer login
    if (!cedula) return null;     // Si no hay cedula, no hay sesion activa
    return db.buscarPorCedula(cedula); // Buscar en la lista enlazada
}

/* --- SISTEMA DE HISTORIAL POR USUARIO ---
 * El historial se almacena en localStorage con clave 'historial_' + cedula.
 * Esto permite que cada usuario tenga su propio historial independiente.
 * Ejemplo: historial_12345678 almacena los movimientos del usuario con cedula 12345678.
 */

/**
 * Obtiene el historial de movimientos de un usuario especifico.
 * @param {string} cedula - Cedula del usuario cuyo historial se quiere obtener
 * @returns {Array} Array de objetos movimiento, o array vacio si no hay historial
 */
function obtenerHistorial(cedula) {
    return JSON.parse(localStorage.getItem('historial_' + cedula)) || [];
}

/**
 * Guarda el historial actualizado de un usuario en localStorage.
 * @param {string} cedula - Cedula del usuario
 * @param {Array} hist - Array de movimientos a guardar
 */
function guardarHistorial(cedula, hist) {
    localStorage.setItem('historial_' + cedula, JSON.stringify(hist));
}

/**
 * Agrega un nuevo movimiento al historial de un usuario.
 * Genera un ID unico aleatorio para la transaccion y la fecha actual.
 * Usa unshift() para insertar al inicio (los mas recientes primero).
 * @param {string} cedula - Cedula del usuario al que se le agrega el movimiento
 * @param {string} tipo - 'Entrada' o 'Salida'
 * @param {string} concepto - Descripcion de la operacion (ej: 'Pago movil a Juan')
 * @param {number} monto - Cantidad en bolivares
 */
function agregarAlHistorial(cedula, tipo, concepto, monto) {
    const hist = obtenerHistorial(cedula);
    hist.unshift({
        id: 'OP-' + Math.floor(Math.random() * 9999), // ID unico de la operacion
        fecha: new Date().toLocaleDateString('es-ES'),  // Fecha en formato dd/mm/aaaa
        concepto: concepto, tipo: tipo, monto: monto
    });
    guardarHistorial(cedula, hist);
}

// Variable global que almacena los movimientos del usuario actual para mostrar en la tabla
let historialMovimientos = [];

/* --- FUNCIONES DE OPERACIONES BANCARIAS --- */

/**
 * Funcion dispatcher: determina que tipo de operacion ejecutar segun el concepto.
 * Se llama desde los formularios del dashboard.html mediante el onsubmit.
 * Primero verifica que el usuario este logueado, luego delega a la funcion especifica.
 */
function ejecutarTransaccion(tipo, concepto) {
    const usuario = obtenerUsuarioActual();
    // Si no hay sesion activa, redirigir al login
    if (!usuario) { alert('Debes iniciar sesión primero.'); window.location.href = 'index.html'; return; }
    // Delegar a la funcion especifica segun el tipo de operacion
    if (concepto === 'Pago móvil') ejecutarPagoMovil(usuario);
    else if (concepto === 'Transferencia') ejecutarTransferencia(usuario);
    else if (concepto === 'Depósito') ejecutarDeposito(usuario);
}

/**
 * Ejecuta un Pago Movil: envia dinero a otro usuario buscandolo por telefono.
 * Validaciones:
 * 1. Monto debe ser mayor a 0
 * 2. El usuario debe tener saldo suficiente
 * 3. El telefono destino debe estar registrado en el sistema
 * 4. La cedula proporcionada debe coincidir con el telefono del destinatario
 * 5. No se puede enviar dinero a uno mismo
 * 
 * Al ejecutarse: resta del saldo del emisor, suma al saldo del receptor,
 * guarda ambos saldos actualizados y agrega al historial de AMBOS usuarios.
 */
function ejecutarPagoMovil(usuario) {
    const telefono = document.getElementById('telefono-pm').value.trim();   // Telefono del destinatario
    const cedulaDest = document.getElementById('cedula-pm').value.trim();   // Cedula del destinatario
    const monto = parseFloat(document.getElementById('monto-pm').value);    // Monto a enviar

    // Validacion del monto
    if (monto <= 0 || isNaN(monto)) { alert('Monto inválido.'); return; }
    // Verificar que tiene fondos suficientes
    if (monto > usuario.saldo) { alert('Saldo insuficiente.'); return; }

    // Buscar al destinatario por su telefono en la lista enlazada
    const destino = db.buscarPorTelefono(telefono);
    if (!destino) { alert('El número de teléfono no está registrado en el sistema.'); return; }

    // Verificar que la cedula coincide con el telefono (seguridad adicional)
    if (String(destino.cedula).trim() !== cedulaDest) { alert('La cédula no coincide con el teléfono proporcionado.'); return; }

    // No permitir enviarse dinero a si mismo
    if (destino.cedula === usuario.cedula) { alert('No puedes realizarte un pago a ti mismo.'); return; }

    // Ejecutar la transaccion: restar al emisor y sumar al receptor
    usuario.saldo -= monto;    // Se resta del saldo del que envia
    destino.saldo += monto;    // Se suma al saldo del que recibe
    db.guardarEnArchivo();     // Persistir ambos cambios en localStorage

    // Registrar en el historial de AMBOS usuarios
    agregarAlHistorial(usuario.cedula, 'Salida', 'Pago móvil a ' + destino.nombre, monto);
    agregarAlHistorial(destino.cedula, 'Entrada', 'Pago móvil de ' + usuario.nombre, monto);

    alert('Pago móvil exitoso. Bs. ' + monto.toFixed(2) + ' enviados a ' + destino.nombre);
    window.location.href = 'dashboard.html'; // Recargar el dashboard para ver los cambios
}

/**
 * Ejecuta una Transferencia bancaria: envia dinero a otro usuario por numero de cuenta.
 * Validaciones similares al pago movil, pero busca por numero de cuenta (20 digitos).
 * Al ejecutarse actualiza saldos de ambos usuarios y agrega al historial de ambos.
 */
function ejecutarTransferencia(usuario) {
    const cuenta = document.getElementById('cuenta-tr').value.trim();    // Numero de cuenta destino
    const monto = parseFloat(document.getElementById('monto-tr').value); // Monto a transferir

    if (monto <= 0 || isNaN(monto)) { alert('Monto inválido.'); return; }
    if (monto > usuario.saldo) { alert('Saldo insuficiente.'); return; }

    // Buscar al destinatario por su numero de cuenta en la lista enlazada
    const destino = db.buscarPorCuenta(cuenta);
    if (!destino) { alert('El número de cuenta no está registrado en el sistema.'); return; }
    if (destino.cedula === usuario.cedula) { alert('No puedes transferirte dinero a ti mismo.'); return; }

    // Ejecutar la transaccion entre ambas cuentas
    usuario.saldo -= monto;
    destino.saldo += monto;
    db.guardarEnArchivo();

    // Registrar en el historial de ambos usuarios
    agregarAlHistorial(usuario.cedula, 'Salida', 'Transferencia a ' + destino.nombre, monto);
    agregarAlHistorial(destino.cedula, 'Entrada', 'Transferencia de ' + usuario.nombre, monto);

    alert('Transferencia exitosa. Bs. ' + monto.toFixed(2) + ' enviados a ' + destino.nombre);
    window.location.href = 'dashboard.html';
}

/**
 * Ejecuta un Deposito: ingresa dinero a la cuenta del usuario logueado.
 * A diferencia del pago movil y la transferencia, solo modifica UNA cuenta.
 * No requiere buscar a otro usuario ya que el dinero entra a la propia cuenta.
 */
function ejecutarDeposito(usuario) {
    const monto = parseFloat(document.getElementById('monto-dp').value); // Monto a depositar

    if (monto <= 0 || isNaN(monto)) { alert('Monto inválido.'); return; }

    usuario.saldo += monto;    // Sumar al saldo del usuario actual
    db.guardarEnArchivo();     // Persistir en localStorage

    // Solo se agrega al historial del usuario que deposita
    agregarAlHistorial(usuario.cedula, 'Entrada', 'Depósito', monto);

    alert('Depósito exitoso. Bs. ' + monto.toFixed(2) + ' ingresados.');
    window.location.href = 'dashboard.html';
}

/* --- FUNCIONES DE VISUALIZACION DEL DASHBOARD --- */

/**
 * Refresca toda la vista del dashboard al cargar la pagina:
 * 1. Actualiza el saldo mostrado con el valor actual del usuario
 * 2. Muestra el numero de cuenta y telefono del usuario
 * 3. Carga el historial del usuario desde localStorage
 * 4. Pinta las ultimas 3 transacciones en la tabla
 */
function refrescarVistaBancaria() {
    const usuario = obtenerUsuarioActual();
    const elSaldo = document.getElementById('monto-valor');

    // Actualizar el monto del saldo en la interfaz
    if (elSaldo && usuario) {
        elSaldo.setAttribute('data-monto', usuario.saldo.toFixed(2)); // Guardar en data-attribute para ocultar/mostrar
        if (elSaldo.textContent !== '####') elSaldo.textContent = 'Bs. ' + usuario.saldo.toFixed(2);
    }

    // Mostrar los datos bancarios del usuario (numero de cuenta y telefono)
    const cuentaEl = document.getElementById('info-cuenta-usuario');
    const telEl = document.getElementById('info-tel-usuario');
    if (cuentaEl && usuario) cuentaEl.textContent = usuario.numeroCuenta;
    if (telEl && usuario) telEl.textContent = usuario.telefono;

    // Cargar el historial personal del usuario logueado
    if (usuario) historialMovimientos = obtenerHistorial(usuario.cedula);

    // Mostrar las ultimas 3 transacciones en la tabla del dashboard
    filtrarDashboard('todos');
}

/**
 * Genera las filas HTML de la tabla de movimientos.
 * Asigna clase CSS 'positivo' (verde) o 'negativo' (rojo) segun el tipo.
 * Cada fila incluye un boton "Ver" que abre el modal de detalle.
 * Si la lista esta vacia, muestra un mensaje de "No hay movimientos".
 */
function pintarFilas(lista, contenedor) {
    contenedor.innerHTML = '';
    if (lista.length === 0) {
        contenedor.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">No hay movimientos.</td></tr>';
        return;
    }
    lista.forEach(mov => {
        const color = mov.tipo === 'Entrada' ? 'positivo' : 'negativo'; // Clase CSS para el color
        const signo = mov.tipo === 'Entrada' ? '+' : '-';               // Signo visual del monto
        contenedor.innerHTML += `<tr>
            <td>${mov.fecha}</td>
            <td class="${color}">${mov.concepto}</td>
            <td>Bs. ${signo}${mov.monto.toFixed(2)}</td>
            <td><button class="btn-ver-detalle" onclick="verDetalle('${mov.id}')">Ver</button></td>
        </tr>`;
    });
}

/**
 * Filtra los movimientos del dashboard y limita a los ultimos 3.
 * Se usa slice(0, 3) para mostrar solo las 3 transacciones mas recientes,
 * cumpliendo con el requerimiento del PDF: "ultimas 3 transacciones realizadas".
 * @param {string} filtro - 'todos', 'Entrada' o 'Salida'
 */
function filtrarDashboard(filtro) {
    const cont = document.getElementById('cuerpo-tabla-movimientos');
    if (!cont) return; // Si no estamos en el dashboard, no hacer nada
    const lista = (filtro === 'todos') ? historialMovimientos : historialMovimientos.filter(m => m.tipo === filtro);
    pintarFilas(lista.slice(0, 3), cont); // Solo las ultimas 3
}

/* --- MODAL DE DETALLE DE TRANSACCION --- */

/**
 * Muestra un modal con los datos completos de una transaccion seleccionada.
 * Busca el movimiento por su ID en el historial y llena los campos del modal.
 * El tipo se muestra con un badge de color (verde para Entrada, rojo para Salida).
 * Reemplaza el uso de alert() por una interfaz visual mas profesional.
 */
function verDetalle(id) {
    const mov = historialMovimientos.find(m => m.id === id); // Buscar por ID unico
    if (!mov) return;

    // Obtener el elemento del modal y llenar cada campo con los datos
    const modal = document.getElementById('modal-detalle');
    document.getElementById('detalle-id').textContent = mov.id;
    document.getElementById('detalle-fecha').textContent = mov.fecha;
    document.getElementById('detalle-concepto').textContent = mov.concepto;

    // Tipo con badge de color usando clases CSS 'entrada' o 'salida'
    const tipoSpan = document.getElementById('detalle-tipo');
    tipoSpan.innerHTML = `<span class="badge-tipo ${mov.tipo === 'Entrada' ? 'entrada' : 'salida'}">${mov.tipo}</span>`;

    // Monto con signo + o - segun el tipo
    document.getElementById('detalle-monto').textContent = `Bs. ${mov.tipo === 'Entrada' ? '+' : '-'}${mov.monto.toFixed(2)}`;

    // Hacer visible el modal agregando la clase CSS 'visible'
    modal.classList.add('visible');
}

/** Cierra el modal removiendo la clase 'visible' */
function cerrarModal() { document.getElementById('modal-detalle').classList.remove('visible'); }

/** Cierra el modal al hacer clic en el overlay oscuro (fuera del contenido) */
function cerrarModalDetalle(event) { if (event.target === document.getElementById('modal-detalle')) cerrarModal(); }

/* --- FUNCIONALIDAD OCULTAR/MOSTRAR SALDO --- */

/**
 * Alterna entre mostrar el saldo real y ocultarlo con '####'.
 * Funcion de privacidad para que el usuario pueda ocultar su saldo en publico.
 * Usa el atributo data-monto para recordar el valor real cuando esta oculto.
 * Cambia el icono del ojo (abierto/cerrado) segun el estado.
 */
function toggleSaldo(boton) {
    const textoMonto = document.getElementById('monto-valor');
    const icono = document.getElementById('icono-ojo-saldo');
    if (textoMonto.textContent !== '####') {
        textoMonto.textContent = '####';                          // Ocultar: reemplazar con ####
        icono.src = 'imagenes/ojo-cerrado.png';                   // Icono de ojo cerrado
    } else {
        textoMonto.textContent = 'Bs. ' + textoMonto.getAttribute('data-monto'); // Mostrar: leer del data-attribute
        icono.src = 'imagenes/ojo-abierto.png';                   // Icono de ojo abierto
    }
}

/* --- RELOJ EN TIEMPO REAL Y MODO OSCURO --- */

/**
 * Actualiza la fecha y hora en la barra de navegacion del dashboard.
 * Se ejecuta cada segundo mediante setInterval().
 * Formato: "13 de mayo de 2026 - 06:02 p. m."
 */
function actualizarFechaHora() {
    const t = new Date();
    const f = document.getElementById('fecha-navbar'), h = document.getElementById('hora-navbar');
    if (f && h) {
        f.textContent = t.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        h.textContent = t.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
}

/* Modo Oscuro: lee el tema guardado en sessionStorage y aplica la clase dark-mode al body.
 * Al hacer clic en el boton, alterna la clase y guarda la preferencia. */
const btnTema = document.getElementById('boton-claro-oscuro');
if (sessionStorage.getItem('tema') === 'dark') document.body.classList.add('dark-mode');
if (btnTema) {
    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode'); // Alternar la clase CSS
        sessionStorage.setItem('tema', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); // Persistir preferencia
    });
}

/* Inicializacion: al cargar la pagina, refrescar la vista bancaria y activar el reloj.
 * Usa addEventListener('DOMContentLoaded') en vez de window.onload para no
 * sobreescribir otros handlers (como el de historial.html). */
window.addEventListener('DOMContentLoaded', () => {
    refrescarVistaBancaria();         // Cargar saldo, datos y ultimos movimientos
    actualizarFechaHora();            // Mostrar fecha y hora actual
    setInterval(actualizarFechaHora, 1000); // Actualizar cada segundo
});