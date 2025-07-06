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
        
        // Mostrar botón de crear pregunta si estamos en la última pregunta
        mostrarBotonCrearPregunta();
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

    // --- FUNCIÓN PARA MOSTRAR EL BOTÓN DE CREAR PREGUNTA ---
    function mostrarBotonCrearPregunta() {
        let createQuestionArea = document.getElementById('create-question-area');
        
        // Si no existe, crear el área
        if (!createQuestionArea) {
            createQuestionArea = document.createElement('div');
            createQuestionArea.id = 'create-question-area';
            createQuestionArea.className = 'create-question-section';
            createQuestionArea.innerHTML = `
                <h3>¿Quieres agregar una nueva pregunta?</h3>
                <textarea id="new-question-input" placeholder="Escribe tu nueva pregunta aquí..." rows="3"></textarea>
                <button id="add-question-btn">Agregar Pregunta</button>
            `;
            
            // Insertar antes de la navegación
            const navigationFooter = document.querySelector('.navigation-footer');
            navigationFooter.parentNode.insertBefore(createQuestionArea, navigationFooter);
            
            // Agregar event listener
            document.getElementById('add-question-btn').addEventListener('click', crearNuevaPregunta);
        }
        
        // Mostrar solo si estamos en la última pregunta
        if (preguntaActualIndex === todasLasPreguntas.length - 1) {
            createQuestionArea.style.display = 'block';
        } else {
            createQuestionArea.style.display = 'none';
        }
    }

    // --- FUNCIÓN PARA CREAR NUEVA PREGUNTA ---
    async function crearNuevaPregunta() {
        const nuevaPreguntaInput = document.getElementById('new-question-input');
        const nuevaPregunta = nuevaPreguntaInput.value.trim();
        const addButton = document.getElementById('add-question-btn');
        
        if (!nuevaPregunta) {
            // Feedback visual en lugar de alert
            nuevaPreguntaInput.style.borderColor = '#ff4444';
            nuevaPreguntaInput.placeholder = 'Por favor escribe una pregunta...';
            setTimeout(() => {
                nuevaPreguntaInput.style.borderColor = '#ccc';
                nuevaPreguntaInput.placeholder = 'Escribe tu nueva pregunta aquí...';
            }, 2000);
            return;
        }
        
        // Feedback visual de carga
        addButton.textContent = 'Guardando...';
        addButton.disabled = true;
        
        try {
            const response = await fetch('/api/preguntas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevaPregunta: nuevaPregunta })
            });
            
            if (!response.ok) throw new Error('No se pudo guardar la pregunta.');
            
            // Feedback de éxito
            addButton.textContent = '¡Pregunta agregada!';
            addButton.style.backgroundColor = '#4a9d4a';
            nuevaPreguntaInput.value = '';
            
            // Recargar preguntas y navegar a la nueva pregunta
            await cargarTodasLasPreguntas();
            preguntaActualIndex = todasLasPreguntas.length - 1;
            await cargarResultados();
            mostrarPreguntaYRespuestas();
            
        } catch (error) {
            // Feedback de error
            addButton.textContent = 'Error - Reintentar';
            addButton.style.backgroundColor = '#ff4444';
        }
        
        // Restaurar botón después de 2 segundos
        setTimeout(() => {
            addButton.textContent = 'Agregar Pregunta';
            addButton.style.backgroundColor = '#5cb85c';
            addButton.disabled = false;
        }, 2000);
    }

    // --- FUNCIÓN PARA GUARDAR LA RESPUESTA DEL USUARIO ---
    async function guardarRespuesta() {
        const respuesta = answerInput.value.trim();
        const submitBtn = document.getElementById('submit-button');
        
        if (!respuesta) {
            // Feedback visual para campo vacío
            answerInput.style.borderColor = '#ff4444';
            answerInput.placeholder = 'Por favor escribe una respuesta...';
            setTimeout(() => {
                answerInput.style.borderColor = '#ccc';
                answerInput.placeholder = 'Escribe tu respuesta aquí...';
            }, 2000);
            return;
        }

        // Feedback visual de carga
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;

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

            // Feedback de éxito y actualizar vista
            submitBtn.textContent = '¡Guardado!';
            submitBtn.style.backgroundColor = '#4a9d4a';
            
            // Recargar datos y actualizar vista
            await cargarResultados();
            mostrarPreguntaYRespuestas();
            
            // Restaurar botón
            setTimeout(() => {
                submitBtn.textContent = 'Guardar Mi Respuesta';
                submitBtn.style.backgroundColor = '#2c7ac9';
                submitBtn.disabled = false;
            }, 1500);

        } catch (error) {
            // Feedback de error
            submitBtn.textContent = 'Error - Reintentar';
            submitBtn.style.backgroundColor = '#ff4444';
            
            setTimeout(() => {
                submitBtn.textContent = 'Guardar Mi Respuesta';
                submitBtn.style.backgroundColor = '#2c7ac9';
                submitBtn.disabled = false;
            }, 2000);
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
        // Redirigir a la última pregunta donde está el botón integrado
        preguntaActualIndex = todasLasPreguntas.length - 1;
        mostrarPreguntaYRespuestas();
    });

    viewResultsButton.addEventListener('click', () => {
        window.location.href = 'resultados.html';
    });

    // --- INICIO DE LA EJECUCIÓN ---
    await cargarTodasLasPreguntas();
    await cargarResultados();
    mostrarPreguntaYRespuestas();
});