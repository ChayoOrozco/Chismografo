// Espera a que todo el contenido del DOM se cargue antes de ejecutar cualquier código.
document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    // ¡AQUÍ ESTÁ LA PARTE IMPORTANTE!
    // Nos aseguramos de que TODAS las variables estén declaradas aquí.
    const loginForm = document.getElementById('login-form');
    
    const tituloPrincipal = document.getElementById('titulo-principal');
    const botonSubmit = document.getElementById('boton-submit');

    const seccionFamiliar = document.getElementById('login-familiar');
    const seccionAdmin = document.getElementById('login-admin');

    const linkIrAAdmin = document.getElementById('ir-a-admin'); // La variable que causaba el error
    const linkIrAFamiliar = document.getElementById('ir-a-familiar');

    // --- FUNCIONES PARA CAMBIAR ENTRE MODOS DE LOGIN ---
    function mostrarLoginAdmin(event) {
        event.preventDefault();
        seccionFamiliar.classList.add('hidden');
        linkIrAAdmin.classList.add('hidden');
        seccionAdmin.classList.remove('hidden');
        linkIrAFamiliar.classList.remove('hidden');
        tituloPrincipal.textContent = 'Acceso de Administrador';
        botonSubmit.textContent = 'Acceder';
    }

    function mostrarLoginFamiliar(event) {
        event.preventDefault();
        seccionAdmin.classList.add('hidden');
        linkIrAFamiliar.classList.add('hidden');
        seccionFamiliar.classList.remove('hidden');
        linkIrAAdmin.classList.remove('hidden');
        tituloPrincipal.textContent = 'Chismografo Familiar';
        botonSubmit.textContent = '¡Entrar!';
    }
    
    // Asignamos las funciones a los eventos 'click' de los enlaces.
    linkIrAAdmin.addEventListener('click', mostrarLoginAdmin);
    linkIrAFamiliar.addEventListener('click', mostrarLoginFamiliar);

    // --- LÓGICA DE ENVÍO DEL FORMULARIO ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const esLoginAdmin = !seccionAdmin.classList.contains('hidden');

        if (esLoginAdmin) {
            // LÓGICA PARA EL LOGIN DE ADMIN
            const adminUser = document.getElementById('adminUser').value;
            const adminPass = document.getElementById('adminPass').value;
            try {
                const response = await fetch('/api/login/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminUser, adminPass })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                window.location.href = '/admin.html';
            } catch (error) {
                alert(`Error de login: ${error.message}`);
            }
        
        } else {
            // LÓGICA PARA EL LOGIN FAMILIAR
            const username = document.getElementById('familiaId').value;
            const password = document.getElementById('clave').value;
            if (!username.trim() || !password.trim()) {
                alert("Por favor, ingresa tu ID de Familia y tu Clave Secreta.");
                return;
            }
            try {
                const response = await fetch('/api/login/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                localStorage.setItem('idUsuarioLogueado', username);
                alert(result.message);
                window.location.href = 'preguntas.html';
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    });
});