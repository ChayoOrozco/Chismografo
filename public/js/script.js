document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const loginForm = document.getElementById('login-form');
    const tituloPrincipal = document.getElementById('titulo-principal');
    const seccionFamiliar = document.getElementById('login-familiar');
    const seccionAdmin = document.getElementById('login-admin');
    const linkIrAAdmin = document.getElementById('ir-a-admin');
    const linkIrAFamiliar = document.getElementById('ir-a-familiar');
    const googleError = document.getElementById('google-login-error');

    // --- FUNCIONES PARA CAMBIAR ENTRE MODOS DE LOGIN ---
    function mostrarLoginAdmin(event) {
        event.preventDefault();
        seccionFamiliar.classList.add('hidden');
        linkIrAAdmin.classList.add('hidden');
        seccionAdmin.classList.remove('hidden');
        linkIrAFamiliar.classList.remove('hidden');
        tituloPrincipal.textContent = 'Acceso de Administrador';
    }

    function mostrarLoginFamiliar(event) {
        event.preventDefault();
        seccionAdmin.classList.add('hidden');
        linkIrAFamiliar.classList.add('hidden');
        seccionFamiliar.classList.remove('hidden');
        linkIrAAdmin.classList.remove('hidden');
        tituloPrincipal.textContent = 'Chismografo de Chayo';
    }

    linkIrAAdmin.addEventListener('click', mostrarLoginAdmin);
    linkIrAFamiliar.addEventListener('click', mostrarLoginFamiliar);

    // --- LOGIN CON GOOGLE ---
    window.handleGoogleCredential = async function(response) {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            window.location.href = 'preguntas.html';
        } catch (error) {
            googleError.textContent = error.message || 'No se pudo iniciar sesión con Google.';
            googleError.classList.remove('hidden');
        }
    };

    fetch('/api/config')
        .then(r => r.json())
        .then(cfg => {
            if (!cfg.googleClientId || typeof google === 'undefined') {
                googleError.textContent = 'El login con Google todavía no está configurado.';
                googleError.classList.remove('hidden');
                return;
            }
            google.accounts.id.initialize({
                client_id: cfg.googleClientId,
                callback: window.handleGoogleCredential
            });
            google.accounts.id.renderButton(document.getElementById('google-btn'), {
                theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill'
            });
        })
        .catch(() => {
            googleError.textContent = 'No se pudo cargar el login con Google.';
            googleError.classList.remove('hidden');
        });

    // --- LOGIN DE ADMIN ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (seccionAdmin.classList.contains('hidden')) return; // el login familiar es por Google, no por este form

        const botonSubmit = document.getElementById('boton-submit');
        botonSubmit.textContent = 'Ingresando...';
        botonSubmit.disabled = true;

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

            botonSubmit.textContent = '¡Acceso concedido!';
            botonSubmit.style.backgroundColor = '#4a9d4a';

            setTimeout(() => {
                window.location.href = '/admin.html';
            }, 800);

        } catch (error) {
            botonSubmit.textContent = 'Error - Reintentar';
            botonSubmit.style.backgroundColor = '#ff4444';

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
    });
});
