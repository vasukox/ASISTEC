// Configuración
const config = {
    apiZKTeco: '/api/zkteco/attendance',
    apiSiigo: '/api/siigo/payroll',
    refreshInterval: 30000 // 30 segundos
};

// Datos simulados
let empleados = [
    { cedula: '123456789', nombre: 'Juan Pérez', cargo: 'Analista', id_huella: '1', salario_base: 2000000 },
    { cedula: '987654321', nombre: 'María Gómez', cargo: 'Contadora', id_huella: '2', salario_base: 2500000 }
];

let asistencia = [
    { cedula: '123456789', fecha: '2025-04-22', entrada: '08:00', salida: '17:00', horas: 8 },
    { cedula: '987654321', fecha: '2025-04-22', entrada: '09:00', salida: '18:00', horas: 9 }
];

let nomina = [
    { cedula: '123456789', inicio_periodo: '2025-04-01', fin_periodo: '2025-04-15', horas: 80, salario_base: 2000000, deducciones: 200000, neto: 1800000, estado: 'Pendiente' }
];

let bitacora = [
    { usuario: 'admin', fecha: '2025-04-22 10:00', accion: 'Creó empleado 123456789' }
];

let notificaciones = [
    { mensaje: 'Juan Pérez llegó tarde 3 días seguidos', fecha: '2025-04-22 08:30' }
];

// Inicializar usuarios en localStorage (si no existen)
function inicializarUsuarios() {
    if (!localStorage.getItem('usuarios')) {
        const usuariosIniciales = [
            { username: 'admin', password: simpleHash('admin123'), role: 'Admin', email: 'admin@empresa.com' }
        ];
        localStorage.setItem('usuarios', JSON.stringify(usuariosIniciales));
        console.log('Usuarios inicializados:', usuariosIniciales);
    }
}

// Función de hash simple para contraseñas (simulación para prototipo)
function simpleHash(password) {
    try {
        return btoa(password + 'salt');
    } catch (error) {
        console.error('Error en simpleHash:', error);
        return password;
    }
}

// Mostrar mensaje de error en el formulario
function showError(message, formId) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
        setTimeout(() => errorDiv.classList.add('d-none'), 5000);
    } else {
        alert(message);
    }
}

// Registro de usuarios
function register(event) {
    event.preventDefault();
    console.log('Función register ejecutada');
    
    const username = document.getElementById('regUsername')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const role = document.getElementById('regRole')?.value;
    const email = document.getElementById('regEmail')?.value.trim();

    // Validaciones
    if (!username || username.length < 4) {
        showError('El usuario debe tener al menos 4 caracteres', 'registerForm');
        return;
    }
    if (!password || password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres', 'registerForm');
        return;
    }
    if (!role) {
        showError('Seleccione un rol', 'registerForm');
        return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Correo electrónico inválido', 'registerForm');
        return;
    }

    // Verificar si el usuario ya existe
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    if (usuarios.some(u => u.username === username)) {
        showError('El usuario ya existe', 'registerForm');
        return;
    }

    // Agregar nuevo usuario
    try {
        usuarios.push({
            username,
            password: simpleHash(password),
            role,
            email
        });
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        console.log('Usuario registrado:', { username, role, email });
        alert('Usuario registrado con éxito');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        showError('Error al registrar usuario', 'registerForm');
    }
}

// Autenticación
function login(event) {
    event.preventDefault();
    console.log('Función login ejecutada');

    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!username || !password) {
        showError('Complete todos los campos', 'loginForm');
        return;
    }

    try {
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const usuario = usuarios.find(u => u.username === username && u.password === simpleHash(password));

        if (usuario) {
            sessionStorage.setItem('token', 'fake-jwt-token');
            sessionStorage.setItem('user', JSON.stringify({ username: usuario.username, role: usuario.role, email: usuario.email }));
            console.log('Login exitoso:', usuario);
            window.location.href = 'dashboard.html';
        } else {
            showError('Credenciales inválidas', 'loginForm');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error al iniciar sesión', 'loginForm');
    }
}

function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

function protectPage() {
    if (!sessionStorage.getItem('token')) {
        window.location.href = 'login.html';
    } else {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `Usuario: ${user.username} (${user.role})`;
        }
        if (user.role === 'Admin') {
            const btnManual = document.getElementById('btnManual');
            if (btnManual) btnManual.style.display = 'block';
        }
    }
}

// Dashboard
function actualizarDashboard() {
    const totalEmpleados = document.getElementById('totalEmpleados');
    const asistentesHoy = document.getElementById('asistentesHoy');
    const horasTotales = document.getElementById('horasTotales');
    const notificationsDiv = document.getElementById('notifications');

    if (totalEmpleados) totalEmpleados.textContent = empleados.length;
    if (asistentesHoy) asistentesHoy.textContent = asistencia.filter(a => a.fecha === '2025-04-22').length;
    if (horasTotales) horasTotales.textContent = asistencia.reduce((sum, a) => sum + a.horas, 0);
    if (notificationsDiv) {
        notificationsDiv.innerHTML = notificaciones.map(n => `
            <div class="list-group-item">${n.fecha}: ${n.mensaje}</div>
        `).join('');
    }
}

// Asistencia
function renderAsistencia(page = 1) {
    const itemsPerPage = 10;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const tbody = document.querySelector('#asistenciaTable tbody');
    if (tbody) {
        tbody.innerHTML = asistencia.slice(start, end).map(a => `
            <tr>
                <td>${a.cedula}</td>
                <td>${empleados.find(e => e.cedula === a.cedula)?.nombre || 'Desconocido'}</td>
                <td>${a.fecha}</td>
                <td>${a.entrada}</td>
                <td>${a.salida}</td>
                <td>${a.horas}</td>
            </tr>
        `).join('');
        renderPagination(Math.ceil(asistencia.length / itemsPerPage), page, renderAsistencia);
    }
}

function renderPresentesAusentes() {
    const div = document.getElementById('presentesAusentes');
    if (div) {
        div.innerHTML = empleados.map(e => {
            const hoy = asistencia.find(a => a.cedula === e.cedula && a.fecha === '2025-04-22');
            return `
                <div class="col-md-4">
                    <div class="card shadow">
                        <div class="card-body">
                            <h5>${e.nombre}</h5>
                            <p>Estado: ${hoy ? 'Presente' : 'Ausente'}</p>
                            <p>Horas: ${hoy ? hoy.horas : 0}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function registrarAsistenciaManual(event) {
    event.preventDefault();
    const cedula = document.getElementById('manualCedula')?.value;
    const tipo = document.getElementById('manualTipo')?.value;
    const justificacion = document.getElementById('manualJustificacion')?.value;

    if (!cedula || !tipo || !justificacion) {
        showError('Complete todos los campos', 'manualForm');
        return;
    }

    asistencia.push({
        cedula,
        fecha: new Date().toISOString().split('T')[0],
        entrada: tipo === 'entrada' ? new Date().toTimeString().split(' ')[0] : '',
        salida: tipo === 'salida' ? new Date().toTimeString().split(' ')[0] : '',
        horas: 0
    });
    bitacora.push({ usuario: 'admin', fecha: new Date().toISOString(), accion: `Registró ${tipo} manual para ${cedula}` });
    alert('Asistencia registrada');
    document.getElementById('manualForm')?.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('manualModal'));
    if (modal) modal.hide();
    renderAsistencia();
}

function generarReporte() {
    const fecha = document.getElementById('reporteFecha')?.value;
    if (!fecha) {
        showError('Seleccione una fecha', 'reporteFecha');
        return;
    }
    const data = asistencia.filter(a => a.fecha === fecha);
    const doc = new jspdf.jsPDF();
    doc.text(`Reporte de Asistencia - ${fecha}`, 10, 10);
    data.forEach((a, i) => {
        doc.text(`${a.cedula} | ${empleados.find(e => e.cedula === a.cedula)?.nombre || 'Desconocido'} | ${a.horas} horas`, 10, 20 + i * 10);
    });
    doc.save(`reporte_${fecha}.pdf`);
}

// Paginación
function renderPagination(totalPages, currentPage, callback) {
    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => `
            <li class="page-item ${i + 1 === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="${callback.name}(${i + 1}); return false;">${i + 1}</a>
            </li>
        `).join('');
    }
}

// Empleados
function renderEmpleados() {
    const tbody = document.querySelector('#empleadosTable tbody');
    if (tbody) {
        tbody.innerHTML = empleados.map(e => `
            <tr>
                <td>${e.cedula}</td>
                <td>${e.nombre}</td>
                <td>${e.cargo}</td>
                <td>
                    <button class="btn btn-sm btn-warning btn-animated" onclick="editarEmpleado('${e.cedula}')">Editar</button>
                    <button class="btn btn-sm btn-danger btn-animated" onclick="eliminarEmpleado('${e.cedula}')">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }
}

function agregarEditarEmpleado(event) {
    event.preventDefault();
    const cedula = document.getElementById('empCedula')?.value;
    const nombre = document.getElementById('empNombre')?.value;
    const cargo = document.getElementById('empCargo')?.value;
    const id_huella = document.getElementById('empHuella')?.value;

    if (!cedula || !nombre || !cargo || !id_huella) {
        showError('Complete todos los campos', 'empleadoForm');
        return;
    }

    const index = empleados.findIndex(e => e.cedula === cedula);
    if (index === -1) {
        empleados.push({ cedula, nombre, cargo, id_huella, salario_base: 2000000 });
        bitacora.push({ usuario: 'admin', fecha: new Date().toISOString(), accion: `Creó empleado ${cedula}` });
    } else {
        empleados[index] = { ...empleados[index], nombre, cargo, id_huella };
        bitacora.push({ usuario: 'admin', fecha: new Date().toISOString(), accion: `Editó empleado ${cedula}` });
    }
    document.getElementById('empleadoForm')?.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('empleadoModal'));
    if (modal) modal.hide();
    renderEmpleados();
}

function editarEmpleado(cedula) {
    const emp = empleados.find(e => e.cedula === cedula);
    if (emp) {
        document.getElementById('empCedula').value = emp.cedula;
        document.getElementById('empNombre').value = emp.nombre;
        document.getElementById('empCargo').value = emp.cargo;
        document.getElementById('empHuella').value = emp.id_huella;
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('empleadoModal'));
        modal.show();
    }
}

function eliminarEmpleado(cedula) {
    if (confirm('¿Eliminar empleado?')) {
        empleados = empleados.filter(e => e.cedula !== cedula);
        bitacora.push({ usuario: 'admin', fecha: new Date().toISOString(), accion: `Eliminó empleado ${cedula}` });
        renderEmpleados();
    }
}

function renderVacaciones() {
    const vacacionesDiv = document.getElementById('vacaciones');
    if (vacacionesDiv) {
        vacacionesDiv.innerHTML = empleados.map(e => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>${e.nombre}</h5>
                    <p>No hay permisos registrados</p>
                    <button class="btn btn-primary btn-animated" onclick="alert('Funcionalidad en desarrollo')">Registrar Permiso</button>
                </div>
            </div>
        `).join('');
    }
}

function renderBitacora() {
    const tbody = document.querySelector('#bitacoraTable tbody');
    if (tbody) {
        tbody.innerHTML = bitacora.map(b => `
            <tr>
                <td>${b.usuario}</td>
                <td>${b.fecha}</td>
                <td>${b.accion}</td>
            </tr>
        `).join('');
    }
}

// Nómina
function renderNomina() {
    const tbody = document.querySelector('#nominaTable tbody');
    if (tbody) {
        tbody.innerHTML = nomina.map(n => `
            <tr>
                <td>${n.cedula}</td>
                <td>${empleados.find(e => e.cedula === n.cedula)?.nombre || 'Desconocido'}</td>
                <td>${n.horas}</td>
                <td>${n.salario_base}</td>
                <td>${n.deducciones}</td>
                <td>${n.neto}</td>
                <td>${n.estado}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-animated" onclick="simularLiquidacion('${n.cedula}')">Simular</button>
                    <button class="btn btn-sm btn-primary btn-animated" onclick="enviarSiigo('${n.cedula}')">Enviar a Siigo</button>
                </td>
            </tr>
        `).join('');
    }
}

function simularLiquidacion(cedula) {
    const n = nomina.find(n => n.cedula === cedula);
    if (n) {
        document.getElementById('liquidacionDetalles').innerHTML = `
            <p>Horas: ${n.horas}</p>
            <p>Salario Base: ${n.salario_base}</p>
            <p>Deducciones: ${n.deducciones}</p>
            <p>Neto: ${n.neto}</p>
        `;
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('liquidacionModal'));
        modal.show();
    }
}

function enviarSiigo(cedula) {
    const n = nomina.find(n => n.cedula === cedula);
    if (n) {
        n.estado = 'Procesado';
        const enviarCorreo = document.getElementById('enviarCorreo')?.checked;
        bitacora.push({ usuario: 'admin', fecha: new Date().toISOString(), accion: `Envió nómina de ${cedula} a Siigo${enviarCorreo ? ' con correo' : ''}` });
        alert('Nómina enviada a Siigo' + (enviarCorreo ? ' y por correo' : ''));
        renderNomina();
        const modal = bootstrap.Modal.getInstance(document.getElementById('liquidacionModal'));
        if (modal) modal.hide();
    }
}

// Reportes
let reporteChart;
function generarReporteInteractivo() {
    const ctx = document.getElementById('reporteChart')?.getContext('2d');
    if (ctx) {
        if (reporteChart) reporteChart.destroy();
        reporteChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: empleados.map(e => e.nombre),
                datasets: [{
                    label: 'Horas Trabajadas',
                    data: empleados.map(e => asistencia.filter(a => a.cedula === e.cedula).reduce((sum, a) => sum + a.horas, 0)),
                    backgroundColor: '#1e2a38'
                }]
            }
        });
    }
}

function compararPeriodos() {
    const comparativaDiv = document.getElementById('comparativaResultados');
    if (comparativaDiv) {
        comparativaDiv.innerHTML = '<p>Comparativa en desarrollo</p>';
    }
}

function exportarReporte() {
    const doc = new jspdf.jsPDF();
    doc.text('Reporte de Horas', 10, 10);
    empleados.forEach((e, i) => {
        doc.text(`${e.nombre}: ${asistencia.filter(a => a.cedula === e.cedula).reduce((sum, a) => sum + a.horas, 0)} horas`, 10, 20 + i * 10);
    });
    doc.save('reporte_horas.pdf');
}

// Descargas
function descargarArchivo() {
    const tipo = document.getElementById('descargaTipo')?.value;
    if (!tipo) return;

    if (tipo === 'bd') {
        const csv = empleados.map(e => `${e.cedula},${e.nombre},${e.cargo}`).join('\n');
        downloadFile(csv, 'base_datos.csv', 'text/csv');
    } else {
        const doc = new jspdf.jsPDF();
        doc.text(`Descarga: ${tipo}`, 10, 10);
        doc.save(`${tipo}.pdf`);
    }
}

function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando...');
    inicializarUsuarios();

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const asistenciaTable = document.querySelector('#asistenciaTable');
    const empleadosTable = document.querySelector('#empleadosTable');
    const nominaTable = document.querySelector('#nominaTable');
    const reporteChart = document.querySelector('#reporteChart');

    if (loginForm) {
        loginForm.addEventListener('submit', login);
        console.log('Listener de login agregado');
    } else if (registerForm) {
        registerForm.addEventListener('submit', register);
        console.log('Listener de registro agregado');
    } else {
        protectPage();
        if (document.querySelector('#dashboard')) {
            actualizarDashboard();
            setInterval(actualizarDashboard, config.refreshInterval);
        } else if (asistenciaTable) {
            renderAsistencia();
            renderPresentesAusentes();
            const manualForm = document.getElementById('manualForm');
            if (manualForm) manualForm.addEventListener('submit', registrarAsistenciaManual);
            setInterval(renderPresentesAusentes, config.refreshInterval);
        } else if (empleadosTable) {
            renderEmpleados();
            renderVacaciones();
            renderBitacora();
            const empleadoForm = document.getElementById('empleadoForm');
            if (empleadoForm) empleadoForm.addEventListener('submit', agregarEditarEmpleado);
        } else if (nominaTable) {
            renderNomina();
        } else if (reporteChart) {
            generarReporteInteractivo();
        }
    }
});