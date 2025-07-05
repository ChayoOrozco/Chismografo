document.addEventListener('DOMContentLoaded', () => {

    // 1. Seleccionamos el formulario y los campos de entrada.
    const createUserForm = document.getElementById('create-user-form');
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');

    // 2. Añadimos un listener para cuando se envíe el formulario.
    createUserForm.addEventListener('submit', async (event) => {
        // ¡Crucial! Evitamos que la página se recargue.
        event.preventDefault();

        // 3. Obtenemos los valores de los campos.
        const username = newUsernameInput.value;
        const password = newPasswordInput.value;

        // 4. Validación simple para no enviar campos vacíos.
        if (!username.trim() || !password.trim()) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        // 5. Hacemos la llamada a nuestra API para crear usuarios.
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok) {
                // Si el servidor responde con un error (ej. 409 si el usuario ya existe)
                throw new Error(result.message);
            }

            // Si todo sale bien...
            alert(result.message);
            createUserForm.reset(); // Limpiamos el formulario para poder crear otro usuario.
            newUsernameInput.focus(); // Ponemos el cursor de nuevo en el campo de usuario.

        } catch (error) {
            // Si algo falla, mostramos el mensaje de error.
            alert(`Error al crear la cuenta: ${error.message}`);
        }
    });

});