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

    // =================================================================
    // ¡AQUÍ ESTÁ LA NUEVA LÓGICA!
    // =================================================================
    loginForm.addEventListener('submit', function(event) {
        // 1. Prevenimos que el formulario recargue la página. ¡Crucial!
        event.preventDefault(); 

        // 2. Verificamos si el formulario de admin está activo o no
        const esLoginAdmin = !seccionAdmin.classList.contains('hidden');

        if (esLoginAdmin) {
            // Si es el login de Admin, mostramos nuestro mensaje "próximamente"
            const adminUser = document.getElementById('adminUser').value;
            console.log('Intento de login admin para:', adminUser);
            alert('¡Panel de Administrador Próximamente! Por ahora, esta función está en construcción.');
        
        } else {
            // Si es el login Familiar, ¡hacemos la redirección!
            const familiaId = document.getElementById('familiaId').value;
            console.log('Iniciando sesión para la cuenta simulada:', familiaId);

            // 3. ¡La línea mágica que nos lleva a la siguiente página!
            alert('¡Bienvenido! Cargando el chismografo...');
            window.location.href = 'preguntas.html';
        }
    });

});