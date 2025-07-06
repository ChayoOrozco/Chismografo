document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Nos aseguramos de que TODAS las variables estén declaradas aquí.
    const loginForm = document.getElementById('login-form');
    const tituloPrincipal = document.getElementById('titulo-principal');
    const botonSubmit = document.getElementById('boton-submit');
    const seccionFamiliar = document.getElementById('login-familiar');
    const seccionAdmin = document.getElementById('login-admin');
    const linkIrAAdmin = document.getElementById('ir-a-admin'); // Variable para el enlace
    const linkIrAFamiliar = document.getElementById('ir-a-familiar'); // Variable para el otro enlace

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
    
    // --- ASIGNACIÓN DE EVENTOS ---
    // ¡Esta es la parte que probablemente se rompió!
    // Nos aseguramos de que ambos listeners estén aquí.
    linkIrAAdmin.addEventListener('click', mostrarLoginAdmin);
    linkIrAFamiliar.addEventListener('click', mostrarLoginFamiliar);

    // --- LÓGICA DE ENVÍO DEL FORMULARIO ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const esLoginAdmin = !seccionAdmin.classList.contains('hidden');

        // Feedback visual de carga
        botonSubmit.textContent = 'Ingresando...';
        botonSubmit.disabled = true;

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
                
                // Feedback de éxito antes de redirigir
                botonSubmit.textContent = '¡Acceso concedido!';
                botonSubmit.style.backgroundColor = '#4a9d4a';
                
                setTimeout(() => {
                    window.location.href = '/admin.html';
                }, 800);
                
            } catch (error) {
                // Feedback de error
                botonSubmit.textContent = 'Error - Reintentar';
                botonSubmit.style.backgroundColor = '#ff4444';
                
                // Mostrar mensaje de error en los campos
                document.getElementById('adminUser').style.borderColor = '#ff4444';
                document.getElementById('adminPass').style.borderColor = '#ff4444';
                
                setTimeout(() => {
                    botonSubmit.textContent = 'Acceder';
                    botonSubmit.style.backgroundColor = '#5cb85c';
                    botonSubmit.disabled = false;
                    document.getElementById('adminUser').style.borderColor = '#ccc';
                    document.getElementById('adminPass').style.borderColor = '#ccc';
                }, 2000);
            }
        
        } else {
            // LÓGICA PARA EL LOGIN FAMILIAR
            const username = document.getElementById('familiaId').value;
            const password = document.getElementById('clave').value;
            
            if (!username.trim() || !password.trim()) {
                // Feedback visual para campos vacíos
                botonSubmit.textContent = 'Completa los campos';
                botonSubmit.style.backgroundColor = '#ff4444';
                
                if (!username.trim()) {
                    document.getElementById('familiaId').style.borderColor = '#ff4444';
                }
                if (!password.trim()) {
                    document.getElementById('clave').style.borderColor = '#ff4444';
                }
                
                setTimeout(() => {
                    botonSubmit.textContent = '¡Entrar!';
                    botonSubmit.style.backgroundColor = '#5cb85c';
                    botonSubmit.disabled = false;
                    document.getElementById('familiaId').style.borderColor = '#ccc';
                    document.getElementById('clave').style.borderColor = '#ccc';
                }, 2000);
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
                
                // Feedback de éxito antes de redirigir
                botonSubmit.textContent = `¡Bienvenido ${username}!`;
                botonSubmit.style.backgroundColor = '#4a9d4a';
                
                setTimeout(() => {
                    window.location.href = 'preguntas.html';
                }, 1200);
                
            } catch (error) {
                // Feedback de error
                botonSubmit.textContent = 'Credenciales incorrectas';
                botonSubmit.style.backgroundColor = '#ff4444';
                
                document.getElementById('familiaId').style.borderColor = '#ff4444';
                document.getElementById('clave').style.borderColor = '#ff4444';
                
                setTimeout(() => {
                    botonSubmit.textContent = '¡Entrar!';
                    botonSubmit.style.backgroundColor = '#5cb85c';
                    botonSubmit.disabled = false;
                    document.getElementById('familiaId').style.borderColor = '#ccc';
                    document.getElementById('clave').style.borderColor = '#ccc';
                }, 2000);
            }
        }
    });
});