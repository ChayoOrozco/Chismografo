// Espera a que todo el contenido de la página se cargue antes de ejecutar el script
document.addEventListener('DOMContentLoaded', function() {

    // 1. Seleccionamos todos los elementos que vamos a manipular (esto no cambia)
    const loginForm = document.getElementById('login-form');
    
    const tituloPrincipal = document.getElementById('titulo-principal');
    const botonSubmit = document.getElementById('boton-submit');

    const seccionFamiliar = document.getElementById('login-familiar');
    const seccionAdmin = document.getElementById('login-admin');

    const linkIrAAdmin = document.getElementById('ir-a-admin');
    const linkIrAFamiliar = document.getElementById('ir-a-familiar');

    // 2. Función para cambiar al modo Administrador (esto no cambia)
    function mostrarLoginAdmin(event) {
        event.preventDefault(); 
        seccionFamiliar.classList.add('hidden');
        linkIrAAdmin.classList.add('hidden');
        seccionAdmin.classList.remove('hidden');
        linkIrAFamiliar.classList.remove('hidden');
        tituloPrincipal.textContent = 'Acceso de Administrador';
        botonSubmit.textContent = 'Acceder';
    }

    // 3. Función para volver al modo Familiar (esto no cambia)
    function mostrarLoginFamiliar(event) {
        event.preventDefault(); 
        seccionAdmin.classList.add('hidden');
        linkIrAFamiliar.classList.add('hidden');
        seccionFamiliar.classList.remove('hidden');
        linkIrAAdmin.classList.remove('hidden');
        tituloPrincipal.textContent = 'Chismografo Familiar';
        botonSubmit.textContent = '¡Entrar!';
    }
    
    // 4. Asignamos las funciones a los eventos 'click' de los enlaces (esto no cambia)
    linkIrAAdmin.addEventListener('click', mostrarLoginAdmin);
    linkIrAFamiliar.addEventListener('click', mostrarLoginFamiliar);

// En public/js/script.js

loginForm.addEventListener('submit', async (event) => { // ¡Hacemos la función async!
    event.preventDefault(); 
    const esLoginAdmin = !seccionAdmin.classList.contains('hidden');

    if (esLoginAdmin) {
        // Lógica para el login de ADMIN
        const adminUser = document.getElementById('adminUser').value;
        const adminPass = document.getElementById('adminPass').value;

        try {
            const response = await fetch('/api/login/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUser, adminPass })
            });

            const result = await response.json();

            if (!response.ok) {
                // Si el servidor responde con un error (ej. 401 Unauthorized)
                throw new Error(result.message);
            }

            alert(result.message);
            // ¡Próximamente! Aquí redirigiremos al panel de admin
            // window.location.href = '/admin.html';
            console.log("Redirigiendo al panel de admin (en construcción)...");

        } catch (error) {
            alert(`Error de login: ${error.message}`);
        }
    
    } else {
        // Lógica para el login Familiar (no cambia por ahora)
        const familiaId = document.getElementById('familiaId').value;
        localStorage.setItem('idUsuarioLogueado', familiaId);
        alert('¡Bienvenido! Cargando el chismografo...');
        window.location.href = 'preguntas.html';
    }
});

});