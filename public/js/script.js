document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const loginForm = document.getElementById('login-form');
    const tituloPrincipal = document.getElementById('titulo-principal');
    const seccionFamiliar = document.getElementById('login-familiar');
    const seccionAdmin = document.getElementById('login-admin');
    const linkIrAAdmin = document.getElementById('ir-a-admin');
    const linkIrAFamiliar = document.getElementById('ir-a-familiar');
    const googleError = document.getElementById('google-login-error');
    const seccionGrupo = document.getElementById('seleccionar-grupo');
    const grupoCodigoInput = document.getElementById('grupo-codigo');
    const grupoError = document.getElementById('grupo-error');
    const botonEntrarGrupo = document.getElementById('boton-entrar-grupo');

    let destinoTrasGrupo = 'preguntas.html';

    // --- SI YA HABÍA SESIÓN ACTIVA, NO HACER LOGUEAR DE NUEVO ---
    (async () => {
        const sesion = await fetch('/api/session').then(r => r.json());
        if (!sesion.loggedIn) return;
        const destino = sesion.role === 'admin' ? '/admin.html' : 'preguntas.html';
        if (sesion.grupo) {
            window.location.href = destino;
        } else {
            destinoTrasGrupo = destino;
            loginForm.classList.add('hidden');
            seccionGrupo.classList.remove('hidden');
        }
    })();

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

    // --- DESPUÉS DE CUALQUIER LOGIN: ¿ya tiene chismógrafo elegido? ---
    async function continuarTrasLogin(destino) {
        destinoTrasGrupo = destino;
        const sesion = await fetch('/api/session').then(r => r.json());
        if (sesion.grupo) {
            window.location.href = destino;
            return;
        }
        loginForm.classList.add('hidden');
        seccionGrupo.classList.remove('hidden');
        grupoCodigoInput.focus();
    }

    botonEntrarGrupo.addEventListener('click', async () => {
        const codigo = grupoCodigoInput.value;
        grupoError.classList.add('hidden');
        try {
            const res = await fetch('/api/grupo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            window.location.href = destinoTrasGrupo;
        } catch (error) {
            grupoError.textContent = error.message || 'No se pudo entrar a ese chismógrafo.';
            grupoError.classList.remove('hidden');
        }
    });
    grupoCodigoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); botonEntrarGrupo.click(); }
    });

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
            await continuarTrasLogin('preguntas.html');
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

            await continuarTrasLogin('/admin.html');

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
