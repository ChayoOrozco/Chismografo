document.addEventListener('DOMContentLoaded', async () => {

    // --- DATOS (Ahora se cargarán desde el servidor) ---
    let preguntas = [];
    let participantes = [];
    let preguntaActualIndex = 0;

    // --- ELEMENTOS DEL DOM ---
    const questionText = document.getElementById('current-question');
    const questionCounter = document.getElementById('question-counter');
    const answersContainer = document.getElementById('answers-container');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    // --- FUNCIÓN PARA CARGAR LOS RESULTADOS DESDE LA API ---
    async function cargarResultados() {
        try {
            const response = await fetch('/api/resultados');
            if (!response.ok) throw new Error('No se pudo conectar al servidor.');
            
            const data = await response.json();
            
            // Llenamos nuestras variables locales con los datos del servidor
            preguntas = data.preguntas;
            participantes = data.participantes;

        } catch (error) {
            console.error("Error al cargar los resultados:", error);
            questionText.textContent = "No se pudieron cargar los resultados.";
        }
    }

    // --- FUNCIÓN PARA RENDERIZAR EN FORMATO LISTA CON POSICIONES FIJAS ---
    function mostrarPreguntaYRespuestas() {
        if (preguntas.length === 0) {
            questionText.textContent = "Aún no hay respuestas guardadas.";
            answersContainer.innerHTML = '<div class="no-responses">No hay respuestas disponibles</div>';
            document.querySelector('.navigation-footer').style.display = 'none';
            return;
        }

        // Actualizar header
        questionText.textContent = preguntas[preguntaActualIndex];
        questionCounter.textContent = `Pregunta ${preguntaActualIndex + 1} de ${preguntas.length}`;
        
        // Limpiar contenedor
        answersContainer.innerHTML = '';
        
        // Generar lista con posiciones fijas (cada usuario siempre en el mismo renglón)
        participantes.forEach((participante, index) => {
            const numeroRenglon = index + 1; // El número de renglón es fijo para cada usuario
            const respuesta = participante.respuestas[preguntaActualIndex];
            
            // Mostrar siempre el renglón, aunque esté vacío
            const answerEntry = document.createElement('div');
            answerEntry.className = 'answer-entry';
            
            // Si hay respuesta válida, la mostramos; si no, mostramos una línea vacía
            const respuestaTexto = (respuesta && respuesta !== 'No respondió' && respuesta.trim() !== '') 
                ? respuesta 
                : '___________________________________'; // Línea vacía como en las libretas
            
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
        
        // Si no hay participantes
        if (participantes.length === 0) {
            answersContainer.innerHTML = '<div class="no-responses">Aún no hay usuarios registrados</div>';
        }

        // Actualizar botones de navegación
        prevButton.disabled = (preguntaActualIndex === 0);
        nextButton.disabled = (preguntaActualIndex === preguntas.length - 1);
    }

    // --- EVENT LISTENERS PARA NAVEGACIÓN ---
    nextButton.addEventListener('click', () => {
        if (preguntaActualIndex < preguntas.length - 1) {
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

    // --- INICIO DE LA EJECUCIÓN ---
    await cargarResultados();      // 1. Carga los datos reales
    mostrarPreguntaYRespuestas(); // 2. Muestra la primera pregunta con los datos reales
});