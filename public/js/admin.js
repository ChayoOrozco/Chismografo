function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {

    const usersListContainer = document.getElementById('users-list');
    const gruposListContainer = document.getElementById('grupos-list');
    const preguntasListContainer = document.getElementById('preguntas-list');
    const respuestasListContainer = document.getElementById('respuestas-list');
    const logoutBtn = document.getElementById('logout-btn');
    const grupoNombreEl = document.getElementById('grupo-actual-nombre');
    const cambiarGrupoBtn = document.getElementById('cambiar-grupo-btn');
    const nuevoGrupoCodigoInput = document.getElementById('nuevo-grupo-codigo');
    const generarGrupoBtn = document.getElementById('generar-grupo-btn');
    const nuevaPreguntaInput = document.getElementById('nueva-pregunta-texto');
    const crearPreguntaBtn = document.getElementById('crear-pregunta-btn');
    const nuevaRespUsuario = document.getElementById('nueva-resp-usuario');
    const nuevaRespPregunta = document.getElementById('nueva-resp-pregunta');
    const nuevaRespTexto = document.getElementById('nueva-resp-texto');
    const crearRespuestaBtn = document.getElementById('crear-respuesta-btn');

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

    function cargarTodoDelGrupo() {
        cargarListaUsuarios();
        cargarListaGrupos();
        cargarPreguntas();
        cargarRespuestas();
    }

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

    async function entrarAGrupo(codigo) {
        const res = await fetch('/api/grupo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo })
        });
        const result = await res.json();
        if (!res.ok) { alert(result.message); return; }
        grupoActual = result.grupo;
        grupoNombreEl.textContent = grupoActual;
        cargarTodoDelGrupo();
    }

    cambiarGrupoBtn.addEventListener('click', async () => {
        if (await elegirGrupo('Cambiar a qué chismógrafo:')) cargarTodoDelGrupo();
    });

    // --- USUARIOS ---
    async function cargarListaUsuarios() {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('No se pudo cargar la lista de usuarios');
            mostrarListaUsuarios(await response.json());
        } catch (error) {
            usersListContainer.innerHTML = '<p class="loading-text">Error al cargar usuarios</p>';
        }
    }

    function mostrarListaUsuarios(users) {
        if (!users || users.length === 0) {
            usersListContainer.innerHTML = '<p class="no-users-text">Nadie ha entrado con Google todavía.</p>';
            return;
        }
        usersListContainer.innerHTML = users.map(user => {
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
                    <button class="delete-btn" data-username="${nombreSeguro}" title="Eliminar cuenta">×</button>
                </div>
            `;
        }).join('');

        usersListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => eliminarUsuario(btn.dataset.username, btn));
        });
    }

    async function eliminarUsuario(username, deleteBtn) {
        if (!confirm(`¿Eliminar la cuenta "${username}"? Podrá volver a entrar con Google si quiere.`)) return;
        deleteBtn.disabled = true;
        try {
            const response = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            await cargarListaUsuarios();
        } catch (error) {
            alert(error.message);
            deleteBtn.disabled = false;
        }
    }

    // --- GRUPOS (CHISMÓGRAFOS) ---
    async function cargarListaGrupos() {
        try {
            const response = await fetch('/api/admin/grupos');
            if (!response.ok) throw new Error('No se pudo cargar la lista de grupos');
            mostrarListaGrupos(await response.json());
        } catch (error) {
            gruposListContainer.innerHTML = '<p class="loading-text">Error al cargar grupos</p>';
        }
    }

    function mostrarListaGrupos(grupos) {
        if (!grupos || grupos.length === 0) {
            gruposListContainer.innerHTML = '<p class="no-users-text">Todavía no hay ningún chismógrafo.</p>';
            return;
        }
        gruposListContainer.innerHTML = grupos.map(g => {
            const codigo = escapeHtml(g.codigo);
            const esActual = g.codigo === grupoActual;
            return `
                <div class="user-item" style="${esActual ? 'border-left-color:#4a9d4a;' : ''}">
                    <div class="user-info">
                        <div class="user-details">
                            <h3>${codigo}${esActual ? ' (actual)' : ''}</h3>
                            <p>${g.preguntas} preguntas · ${g.respuestas} respuestas · ${g.usuarios} amigos</p>
                        </div>
                    </div>
                    <div class="admin-row-botones">
                        ${esActual ? '' : `<button class="edit-btn" data-codigo="${codigo}" title="Entrar a este grupo">→</button>`}
                        <button class="delete-btn" data-codigo="${codigo}" title="Eliminar chismógrafo">×</button>
                    </div>
                </div>
            `;
        }).join('');

        gruposListContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => entrarAGrupo(btn.dataset.codigo));
        });
        gruposListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => eliminarGrupo(btn.dataset.codigo));
        });
    }

    async function eliminarGrupo(codigo) {
        if (!confirm(`¿Eliminar el chismógrafo "${codigo}" con todas sus preguntas y respuestas? Esto no se puede deshacer.`)) return;
        try {
            const response = await fetch(`/api/admin/grupos/${encodeURIComponent(codigo)}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            if (codigo === grupoActual) {
                grupoActual = null;
                grupoNombreEl.textContent = '(ninguno)';
                await elegirGrupo('Eliminaste tu grupo actual. ¿A cuál chismógrafo te cambias?');
            }
            cargarTodoDelGrupo();
        } catch (error) {
            alert(error.message);
        }
    }

    generarGrupoBtn.addEventListener('click', async () => {
        const codigo = nuevoGrupoCodigoInput.value.trim();
        try {
            const response = await fetch('/api/admin/grupos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            nuevoGrupoCodigoInput.value = '';
            alert(`Chismógrafo creado: "${result.codigo}". Comparte ese código con ese grupo.`);
            cargarListaGrupos();
        } catch (error) {
            alert(error.message);
        }
    });

    // --- PREGUNTAS ---
    async function cargarPreguntas() {
        try {
            const response = await fetch('/api/admin/preguntas');
            if (!response.ok) throw new Error('No se pudo cargar las preguntas');
            mostrarPreguntas(await response.json());
        } catch (error) {
            preguntasListContainer.innerHTML = '<p class="loading-text">Error al cargar preguntas</p>';
        }
    }

    function mostrarPreguntas(preguntas) {
        if (!preguntas || preguntas.length === 0) {
            preguntasListContainer.innerHTML = '<p class="no-users-text">Este chismógrafo todavía no tiene preguntas.</p>';
            return;
        }
        preguntasListContainer.innerHTML = preguntas.map((texto, index) => `
            <div class="user-item">
                <div class="user-info"><div class="user-details"><h3>${escapeHtml(texto)}</h3></div></div>
                <div class="admin-row-botones">
                    <button class="edit-btn" data-index="${index}" title="Editar">✎</button>
                    <button class="delete-btn" data-index="${index}" title="Eliminar">×</button>
                </div>
            </div>
        `).join('');

        preguntasListContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editarPregunta(Number(btn.dataset.index), preguntas[btn.dataset.index]));
        });
        preguntasListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => eliminarPregunta(Number(btn.dataset.index)));
        });
    }

    async function editarPregunta(index, actual) {
        const texto = prompt('Editar pregunta:', actual);
        if (texto === null || !texto.trim()) return;
        try {
            const response = await fetch(`/api/admin/preguntas/${index}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto })
            });
            if (!response.ok) throw new Error((await response.json()).message);
            cargarPreguntas();
        } catch (error) {
            alert(error.message);
        }
    }

    async function eliminarPregunta(index) {
        if (!confirm('¿Eliminar esta pregunta?')) return;
        try {
            const response = await fetch(`/api/admin/preguntas/${index}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).message);
            cargarPreguntas();
        } catch (error) {
            alert(error.message);
        }
    }

    crearPreguntaBtn.addEventListener('click', async () => {
        const nuevaPregunta = nuevaPreguntaInput.value.trim();
        if (!nuevaPregunta) return;
        try {
            const response = await fetch('/api/preguntas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevaPregunta })
            });
            if (!response.ok) throw new Error((await response.json()).message);
            nuevaPreguntaInput.value = '';
            cargarPreguntas();
        } catch (error) {
            alert(error.message);
        }
    });

    // --- RESPUESTAS ---
    async function cargarRespuestas() {
        try {
            const response = await fetch('/api/admin/respuestas');
            if (!response.ok) throw new Error('No se pudo cargar las respuestas');
            mostrarRespuestas(await response.json());
        } catch (error) {
            respuestasListContainer.innerHTML = '<p class="loading-text">Error al cargar respuestas</p>';
        }
    }

    function mostrarRespuestas(filas) {
        if (!filas || filas.length === 0) {
            respuestasListContainer.innerHTML = '<p class="no-users-text">Todavía no hay respuestas.</p>';
            return;
        }
        respuestasListContainer.innerHTML = filas.map(f => `
            <div class="user-item">
                <div class="user-info">
                    <div class="user-details">
                        <h3>${escapeHtml(f.usuario)}</h3>
                        <p><em>${escapeHtml(f.pregunta)}</em> — ${escapeHtml(f.respuesta)}</p>
                    </div>
                </div>
                <div class="admin-row-botones">
                    <button class="edit-btn" data-entry="${f.entryId}" data-index="${f.index}" title="Editar">✎</button>
                    <button class="delete-btn" data-entry="${f.entryId}" data-index="${f.index}" title="Eliminar">×</button>
                </div>
            </div>
        `).join('');

        respuestasListContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editarRespuesta(btn.dataset.entry, Number(btn.dataset.index)));
        });
        respuestasListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => eliminarRespuesta(btn.dataset.entry, Number(btn.dataset.index)));
        });
    }

    async function editarRespuesta(entryId, index) {
        const respuesta = prompt('Editar respuesta:');
        if (respuesta === null || !respuesta.trim()) return;
        try {
            const response = await fetch(`/api/admin/respuestas/${entryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index, respuesta })
            });
            if (!response.ok) throw new Error((await response.json()).message);
            cargarRespuestas();
        } catch (error) {
            alert(error.message);
        }
    }

    async function eliminarRespuesta(entryId, index) {
        if (!confirm('¿Eliminar esta respuesta?')) return;
        try {
            const response = await fetch(`/api/admin/respuestas/${entryId}?index=${index}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).message);
            cargarRespuestas();
        } catch (error) {
            alert(error.message);
        }
    }

    crearRespuestaBtn.addEventListener('click', async () => {
        const usuario = nuevaRespUsuario.value.trim();
        const pregunta = nuevaRespPregunta.value.trim();
        const respuesta = nuevaRespTexto.value.trim();
        if (!usuario || !pregunta || !respuesta) return;
        try {
            const response = await fetch('/api/admin/respuestas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, pregunta, respuesta })
            });
            if (!response.ok) throw new Error((await response.json()).message);
            nuevaRespUsuario.value = '';
            nuevaRespPregunta.value = '';
            nuevaRespTexto.value = '';
            cargarRespuestas();
        } catch (error) {
            alert(error.message);
        }
    });

    // --- ARRANQUE ---
    if (!grupoActual) {
        await elegirGrupo('¿Qué chismógrafo vas a administrar? (ej. amigos, familia)');
    }
    grupoNombreEl.textContent = grupoActual || '(ninguno)';

    cargarTodoDelGrupo();
});
