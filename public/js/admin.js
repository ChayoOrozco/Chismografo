document.addEventListener('DOMContentLoaded', () => {

    // 1. Seleccionamos los elementos del DOM
    const createUserForm = document.getElementById('create-user-form');
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');
    const usersListContainer = document.getElementById('users-list');
    const logoutBtn = document.getElementById('logout-btn');

    // 2. Event listener para el botón de cerrar sesión
    logoutBtn.addEventListener('click', () => {
        const confirmLogout = confirm('¿Estás seguro de que quieres cerrar sesión?');
        if (confirmLogout) {
            // Redirigir al login principal
            window.location.href = '/index.html';
        }
    });

    // 3. Función para cargar y mostrar la lista de usuarios
    async function cargarListaUsuarios() {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('No se pudo cargar la lista de usuarios');
            
            const users = await response.json();
            mostrarListaUsuarios(users);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            usersListContainer.innerHTML = '<p class="loading-text">Error al cargar usuarios</p>';
        }
    }

    // 4. Función para mostrar la lista de usuarios en el DOM
    function mostrarListaUsuarios(users) {
        if (!users || users.length === 0) {
            usersListContainer.innerHTML = '<p class="no-users-text">No hay cuentas familiares creadas aún.</p>';
            return;
        }

        const usersList = users.map(user => {
            const iniciales = user.username.substring(0, 2).toUpperCase();
            return `
                <div class="user-item">
                    <div class="user-info">
                        <div class="user-avatar">${iniciales}</div>
                        <div class="user-details">
                            <h3>${user.username}</h3>
                            <p>Cuenta familiar</p>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="eliminarUsuario('${user.username}')" title="Eliminar cuenta">
                        ×
                    </button>
                </div>
            `;
        }).join('');

        usersListContainer.innerHTML = usersList;
    }

    // 5. Función para eliminar usuario
    window.eliminarUsuario = async function(username) {
        const confirmacion = confirm(`¿Estás seguro de que quieres eliminar la cuenta "${username}"? Esta acción no se puede deshacer.`);
        
        if (!confirmacion) return;

        try {
            const response = await fetch(`/api/users/${username}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            alert(result.message);
            // Recargar la lista de usuarios
            await cargarListaUsuarios();

        } catch (error) {
            alert(`Error al eliminar la cuenta: ${error.message}`);
        }
    };

    // 6. Listener para crear nuevo usuario (sin cambios)
    createUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = newUsernameInput.value;
        const password = newPasswordInput.value;

        if (!username.trim() || !password.trim()) {
            alert('Por favor, completa todos los campos.');
            return;
        }

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
                throw new Error(result.message);
            }

            alert(result.message);
            createUserForm.reset();
            newUsernameInput.focus();
            
            // Recargar la lista de usuarios después de crear uno nuevo
            await cargarListaUsuarios();

        } catch (error) {
            alert(`Error al crear la cuenta: ${error.message}`);
        }
    });

    // 7. Cargar la lista de usuarios al inicio
    cargarListaUsuarios();

});