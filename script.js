
let registroValido = localStorage.getItem('registroCompleto') === 'true';

function manejarRegistro() {
    window.location.href = "preguntas_seguridad.html";
}

function finalizarProceso() {
    localStorage.setItem('registroCompleto', 'true');
    registroValido = true;
    document.getElementById('form-preguntas').style.display = 'none';
    document.getElementById('instruccion').style.display = 'none';
    document.getElementById('mensaje-exito').style.display = 'block';
}

function manejarLogin() {
    const boton = document.getElementById('btn-entrar');
    const spinner = document.getElementById('spinner-login');
    boton.disabled = true;
    spinner.style.display = 'block';

    setTimeout(() => {
        window.location.href = "dashboard.html"; 
    }, 2000); 
}

const btnModo = document.getElementById('boton-claro-oscuro');
if (btnModo) {
    if (localStorage.getItem('tema') === 'dark') {
        document.body.classList.add('dark-mode');
        btnModo.textContent = 'MODO CLARO';
    }

    btnModo.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const esOscuro = document.body.classList.contains('dark-mode');
        localStorage.setItem('tema', esOscuro ? 'dark' : 'light');
        btnModo.textContent = esOscuro ? 'MODO CLARO' : 'MODO OSCURO';
    });
}


let saldoActual = 5000.00;
let saldoOculto = false;
let movimientos = [
    { fecha: '06/05/2026', detalle: 'Depósito Nómina', tipo: 'Entrada', monto: 4500.00 },
    { fecha: '05/05/2026', detalle: 'Pago Supermercado', tipo: 'Salida', monto: 120.50 }
];

function toggleSaldo() {
    saldoOculto = !saldoOculto;
    actualizarVista();
}

function mostrarForm(tipo) {
    const forms = ['transferencia', 'pago-movil', 'deposito'];
    forms.forEach(f => {
        const el = document.getElementById(`form-${f}`);
        if(el) el.style.display = 'none';
    });
    const target = document.getElementById(`form-${tipo}`);
    if(target) target.style.display = 'block';
}

function ejecutarOperacion(event, tipoOp, detalleOp) {
    event.preventDefault();
    let inputID = "";
    if (detalleOp === 'Transferencia') inputID = 'monto-trans';
    if (detalleOp === 'Pago Móvil') inputID = 'monto-pm';
    if (detalleOp === 'Depósito') inputID = 'monto-dep';

    const inputMonto = document.getElementById(inputID);
    const monto = parseFloat(inputMonto.value);

    if (tipoOp === 'Salida' && monto > saldoActual) {
        alert("Saldo insuficiente."); return;
    }

    if (tipoOp === 'Entrada') saldoActual += monto;
    else saldoActual -= monto;

    movimientos.unshift({
        fecha: new Date().toLocaleDateString(),
        detalle: detalleOp,
        tipo: tipoOp,
        monto: monto
    });

    inputMonto.value = "";
    alert("Operación completada con éxito");
    actualizarVista();
}

function actualizarVista() {
    const txtSaldo = document.getElementById('txt-saldo');
    if (txtSaldo) {
        txtSaldo.textContent = saldoOculto ? "********" : `$ ${saldoActual.toFixed(2)}`;
    }
    renderizarTabla(movimientos, 'lista-movimientos-completo');
    renderizarTabla(movimientos.slice(0, 3), 'lista-resumen');
}

function renderizarTabla(datos, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    contenedor.innerHTML = "";
    datos.forEach(mov => {
        const fila = `<tr>
            ${idContenedor.includes('completo') ? `<td>${mov.fecha}</td>` : ''}
            <td>${mov.detalle}</td>
            ${idContenedor.includes('completo') ? `<td>${mov.tipo}</td>` : ''}
            <td style="color: ${mov.tipo === 'Entrada' ? '#2ecc71' : '#e74c3c'}; font-weight:bold;">
                ${mov.tipo === 'Entrada' ? '+' : '-'} $${mov.monto.toFixed(2)}
            </td>
        </tr>`;
        contenedor.innerHTML += fila;
    });
}

function filtrarHistorial(filtro) {
    if (filtro === 'todos') renderizarTabla(movimientos, 'lista-movimientos-completo');
    else renderizarTabla(movimientos.filter(m => m.tipo === filtro), 'lista-movimientos-completo');
}

window.addEventListener('load', actualizarVista);