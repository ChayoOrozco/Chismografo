function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {

    const usersListContainer = document.getElementById('users-list');
    const logoutBtn = document.getElementById('logout-btn');
    const grupoNombreEl = document.getElementById('grupo-actual-nombre');
    const cambiarGrupoBtn = document.getElementById('cambiar-grupo-btn');

    // Guard: solo admins logueados pasan de aquí
    const sesion = await fetch('/api/session').then(r => r.json());
    if (!sesion.loggedIn || sesion.role !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    logoutBtn.addEventListener('click', async () => {
        const confirmLogout = confirm('¿Estás seguro de que quieres cerrar sesión?');
        if (!confirmLogout) return;
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/index.html';
    });

    let grupoActual = sesion.grupo;

    async function elegirGrupo(mensaje) {
        const codigo = prompt(mensaje, grupoActual || '');
        if (codigo === null) return false;
        const res = await fetch('/api/grupo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo })
        });
        const result = await res.json();
        if (!res.ok) { alert(result.message); return false; }
        grupoActual = result.grupo;
        grupoNombreEl.textContent = grupoActual;
        return true;
    }

    cambiarGrupoBtn.addEventListener('click', async () => {
        if (await elegirGrupo('Cambiar a qué chismógrafo:')) cargarListaUsuarios();
    });

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

    function mostrarListaUsuarios(users) {
        if (!users || users.length === 0) {
            usersListContainer.innerHTML = '<p class="no-users-text">Nadie ha entrado con Google todavía.</p>';
            return;
        }

        const usersList = users.map(user => {
            const nombreSeguro = escapeHtml(user.username);
            const iniciales = escapeHtml(user.username.substring(0, 2).toUpperCase());
            return `
                <div class="user-item">
                    <div class="user-info">
                        <div class="user-avatar">${iniciales}</div>
                        <div class="user-details">
                            <h3>${nombreSeguro}</h3>
                            <p>Amigo/a</p>
                        </div>
                    </div>
                    <button class="delete-btn" data-username="${nombreSeguro}" title="Eliminar cuenta">
                        ×
                    </button>
                </div>
            `;
        }).join('');

        usersListContainer.innerHTML = usersList;

        usersListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => eliminarUsuario(btn.dataset.username, btn));
        });
    }

    async function eliminarUsuario(username, deleteBtn) {
        const confirmacion = confirm(`¿Eliminar la cuenta "${username}"? Podrá volver a entrar con Google si quiere.`);
        if (!confirmacion) return;

        const originalText = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '⚙️';
        deleteBtn.disabled = true;

        try {
            const response = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            await cargarListaUsuarios();
        } catch (error) {
            deleteBtn.innerHTML = '❌';
            setTimeout(() => {
                deleteBtn.innerHTML = originalText;
                deleteBtn.disabled = false;
            }, 2000);
        }
    }

    if (!grupoActual) {
        await elegirGrupo('¿Qué chismógrafo vas a administrar? (ej. amigos, familia)');
    }
    grupoNombreEl.textContent = grupoActual || '(ninguno)';

    cargarListaUsuarios();
});
