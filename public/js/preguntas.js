document.addEventListener('DOMContentLoaded', async () => {
    
    // --- ELEMENTOS DEL DOM ---
    const questionText = document.getElementById('question-text');
    const questionCounter = document.getElementById('question-counter');
    const answersContainer = document.getElementById('answers-container');
    const myResponseArea = document.getElementById('my-response-area');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const endScreen = document.getElementById('end-screen');
    const generateButton = document.getElementById('generate-question-button');
    const viewResultsButton = document.getElementById('view-results-button');

    // --- DATOS ---
    let todasLasPreguntas = [];
    let participantes = [];
    let preguntaActualIndex = 0;
    const idUsuario = localStorage.getItem('idUsuarioLogueado') || 'usuario_anonimo';

    // --- FUNCIÓN PARA CARGAR TODAS LAS PREGUNTAS ---
    async function cargarTodasLasPreguntas() {
        try {
            const response = await fetch('/api/admin/preguntas');
            if (!response.ok) throw new Error('No se pudo cargar las preguntas.');
            todasLasPreguntas = await response.json();
        } catch (error) {
            console.error("Error al cargar preguntas:", error);
            questionText.textContent = "Error al cargar preguntas.";
        }
    }

    // --- FUNCIÓN PARA CARGAR TODOS LOS RESULTADOS ---
    async function cargarResultados() {
        try {
            const response = await fetch('/api/resultados');
            if (!response.ok) throw new Error('No se pudo cargar los resultados.');
            const data = await response.json();
            participantes = data.participantes;
        } catch (error) {
            console.error("Error al cargar resultados:", error);
        }
    }

    // --- FUNCIÓN PARA VERIFICAR SI EL USUARIO YA RESPONDIÓ LA PREGUNTA ACTUAL ---
    function usuarioYaRespondio() {
        if (!participantes.length || !todasLasPreguntas.length) return false;
        
        const miParticipante = participantes.find(p => p.nombre === idUsuario);
        if (!miParticipante) return false;
        
        const miRespuesta = miParticipante.respuestas[preguntaActualIndex];
        return miRespuesta && miRespuesta !== 'No respondió' && miRespuesta.trim() !== '';
    }

    // --- FUNCIÓN PARA MOSTRAR LA PREGUNTA Y TODAS LAS RESPUESTAS ---
    function mostrarPreguntaYRespuestas() {
        if (todasLasPreguntas.length === 0) {
            questionText.textContent = "No hay preguntas disponibles.";
            answersContainer.innerHTML = '<div class="no-responses">No hay preguntas creadas aún</div>';
            myResponseArea.style.display = 'none';
            document.querySelector('.navigation-footer').style.display = 'none';
            return;
        }

        // Actualizar header
        questionText.textContent = todasLasPreguntas[preguntaActualIndex];
        questionCounter.textContent = `Pregunta ${preguntaActualIndex + 1} de ${todasLasPreguntas.length}`;
        
        // Mostrar todas las respuestas en formato lista (igual que en resultados)
        mostrarTodasLasRespuestas();
        
        // Mostrar/ocultar área de respuesta personal
        if (usuarioYaRespondio()) {
            myResponseArea.style.display = 'none';
        } else {
            myResponseArea.style.display = 'block';
            answerInput.value = '';
        }

        // Actualizar botones de navegación
        prevButton.disabled = (preguntaActualIndex === 0);
        nextButton.disabled = (preguntaActualIndex === todasLasPreguntas.length - 1);
    }

    // --- FUNCIÓN PARA MOSTRAR TODAS LAS RESPUESTAS (IGUAL QUE EN RESULTADOS) ---
    function mostrarTodasLasRespuestas() {
        answersContainer.innerHTML = '';
        
        if (participantes.length === 0) {
            answersContainer.innerHTML = '<div class="no-responses">Aún no hay usuarios registrados</div>';
            return;
        }
        
        // Generar lista con posiciones fijas (cada usuario siempre en el mismo renglón)
        participantes.forEach((participante, index) => {
            const numeroRenglon = index + 1;
            const respuesta = participante.respuestas[preguntaActualIndex];
            
            const answerEntry = document.createElement('div');
            answerEntry.className = 'answer-entry';
            
            // Si hay respuesta válida, la mostramos; si no, mostramos una línea vacía
            const respuestaTexto = (respuesta && respuesta !== 'No respondió' && respuesta.trim() !== '') 
                ? respuesta 
                : '___________________________________';
            
            answerEntry.innerHTML = `
                <div class="answer-number">${numeroRenglon}.</div>
                <div class="answer-content">
                    <span class="color-indicator" style="background-color: ${participante.color}"></span>
                    <span class="participant-name-inline">${participante.nombre}:</span>
                    <p class="participant-response ${!respuesta || respuesta === 'No respondió' || respuesta.trim() === '' ? 'empty-response' : ''}">${respuestaTexto}</p>
                </div>
            `;
            
            answersContainer.appendChild(answerEntry);
        });
    }

    // --- FUNCIÓN PARA GUARDAR LA RESPUESTA DEL USUARIO ---
    async function guardarRespuesta() {
        const respuesta = answerInput.value.trim();
        if (!respuesta) {
            alert('Por favor escribe una respuesta antes de guardar.');
            return;
        }

        try {
            const payload = {
                usuario: idUsuario,
                respuestas: [{
                    pregunta: todasLasPreguntas[preguntaActualIndex],
                    respuesta: respuesta
                }]
            };

            const response = await fetch('/api/respuestas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('No se pudo guardar la respuesta.');

            // Recargar datos y actualizar vista
            await cargarResultados();
            mostrarPreguntaYRespuestas();
            
            alert('¡Respuesta guardada con éxito!');

        } catch (error) {
            console.error('Error al guardar respuesta:', error);
            alert('Hubo un problema al guardar tu respuesta.');
        }
    }

    // --- EVENT LISTENERS ---
    submitButton.addEventListener('click', guardarRespuesta);

    nextButton.addEventListener('click', () => {
        if (preguntaActualIndex < todasLasPreguntas.length - 1) {
            preguntaActualIndex++;
            mostrarPreguntaYRespuestas();
        }
    });
    
    prevButton.addEventListener('click', () => {
        if (preguntaActualIndex > 0) {
            preguntaActualIndex--;
            mostrarPreguntaYRespuestas();
        }
    });

    generateButton.addEventListener('click', async () => {
        const nuevaPregunta = prompt("Escribe la nueva pregunta:");
        if (nuevaPregunta && nuevaPregunta.trim() !== '') {
            try {
                const response = await fetch('/api/preguntas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nuevaPregunta: nuevaPregunta.trim() })
                });
                if (!response.ok) throw new Error('No se pudo guardar la pregunta.');
                
                alert('¡Pregunta añadida con éxito!');
                await cargarTodasLasPreguntas();
                mostrarPreguntaYRespuestas();
            } catch (error) {
                alert('Hubo un problema al guardar tu pregunta.');
            }
        }
    });

    viewResultsButton.addEventListener('click', () => {
        window.location.href = 'resultados.html';
    });

    // --- INICIO DE LA EJECUCIÓN ---
    await cargarTodasLasPreguntas();
    await cargarResultados();
    mostrarPreguntaYRespuestas();
});