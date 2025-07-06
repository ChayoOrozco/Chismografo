document.addEventListener('DOMContentLoaded', async () => {
    
    // --- ELEMENTOS DEL DOM ---
    const questionCard = document.getElementById('question-card');
    const questionText = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const nextButton = document.getElementById('next-button');
    const endScreen = document.getElementById('end-screen');
    const generateButton = document.getElementById('generate-question-button');
    const viewResultsButton = document.getElementById('view-results-button');
    const logoutBtn = document.getElementById('logout-btn-questions');

    // --- FUNCIONALIDAD DEL BOTÓN DE LOGOUT ---
    logoutBtn.addEventListener('click', () => {
        const confirmLogout = confirm('¿Estás seguro de que quieres cerrar sesión?');
        if (confirmLogout) {
            // Limpiar datos de sesión
            localStorage.removeItem('idUsuarioLogueado');
            // Redirigir al login
            window.location.href = '/index.html';
        }
    });

    // --- DATOS ---
    let preguntas = [];
    let respuestas = [];
    let preguntaActualIndex = 0;
    const idUsuario = localStorage.getItem('idUsuarioLogueado') || 'usuario_anonimo';

    // --- FUNCIÓN PARA CARGAR PREGUNTAS ---
    async function cargarPreguntas() {
        try {
            const response = await fetch(`/api/preguntas/${idUsuario}`);
            if (!response.ok) throw new Error('No se pudo conectar con el servidor.');
            
            const data = await response.json();
            // ¡LÍNEA DE DEFENSA! Nos aseguramos de que preguntas sea siempre un array.
            preguntas = Array.isArray(data) ? data : [];

        } catch (error) {
            console.error("Error al cargar las preguntas:", error);
            questionText.textContent = "¡Ups! No pudimos cargar las preguntas.";
            nextButton.disabled = true;
        }
    }

    // --- FUNCIÓN PARA MOSTRAR PREGUNTA ---
    function mostrarPregunta() {
        if (preguntas.length === 0) {
            questionText.textContent = "¡Estás al día con todas las preguntas!";
            answerInput.style.display = 'none';
            nextButton.textContent = 'Ver Resultados';
            nextButton.onclick = () => { window.location.href = 'resultados.html'; };
            return;
        }
        if (preguntaActualIndex < preguntas.length) {
            questionText.textContent = preguntas[preguntaActualIndex];
            answerInput.style.display = 'block';
            answerInput.value = '';
            answerInput.focus();
        } else {
            finalizarChismografo();
        }
    }
    // (El resto del archivo no necesita cambios)
    async function finalizarChismografo() { const payload = { usuario: idUsuario, respuestas: respuestas }; try { const response = await fetch('/api/respuestas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error('El servidor no pudo guardar las respuestas.'); const result = await response.json(); console.log('Respuesta del servidor:', result.message); } catch (error) { console.error('Error al enviar las respuestas:', error); alert('Hubo un problema al guardar tus respuestas.'); } questionCard.classList.add('hidden'); endScreen.classList.remove('hidden'); }
    nextButton.addEventListener('click', () => { respuestas.push({ pregunta: preguntas[preguntaActualIndex], respuesta: answerInput.value }); preguntaActualIndex++; mostrarPregunta(); });
    generateButton.addEventListener('click', async () => { const nuevaPregunta = prompt("Escribe la nueva pregunta:"); if (nuevaPregunta && nuevaPregunta.trim() !== '') { try { const response = await fetch('/api/preguntas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nuevaPregunta: nuevaPregunta.trim() }) }); if (!response.ok) throw new Error('El servidor no pudo guardar la pregunta.'); const result = await response.json(); alert(result.message); alert("Ahora, por favor responde la pregunta que acabas de crear."); window.location.reload(); } catch (error) { console.error('Error al añadir la pregunta:', error); alert('Hubo un problema al guardar tu pregunta.'); } } });
    viewResultsButton.addEventListener('click', () => { window.location.href = 'resultados.html'; });

    // --- INICIO DE LA EJECUCIÓN ---
    await cargarPreguntas();
    mostrarPregunta();
});