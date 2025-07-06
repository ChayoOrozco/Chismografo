document.addEventListener('DOMContentLoaded', async () => {

    // --- DATOS (Ahora se cargarán desde el servidor) ---
    let preguntas = [];
    let participantes = [];
    let preguntaActualIndex = 0;

    // --- ELEMENTOS DEL DOM ---
    const questionText = document.getElementById('current-question');
    const questionCounter = document.getElementById('question-counter');
    const answersList = document.getElementById('answers-list');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const logoutBtn = document.getElementById('logout-btn-results');

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

    // --- FUNCIÓN PARA RENDERIZAR (CASI IGUAL QUE ANTES) ---
    function mostrarPreguntaYRespuestas() {
        if (preguntas.length === 0) {
            questionText.textContent = "Aún no hay respuestas guardadas.";
            document.querySelector('.navigation-footer').style.display = 'none';
            return;
        }

        questionText.textContent = preguntas[preguntaActualIndex];
        questionCounter.textContent = `Pregunta ${preguntaActualIndex + 1} de ${preguntas.length}`;
        answersList.innerHTML = '';

        participantes.forEach(participante => {
            const respuesta = participante.respuestas[preguntaActualIndex] || 'No respondió';
            const listItem = document.createElement('li');
            listItem.className = 'answer-item';
            const header = document.createElement('div');
            header.className = 'answer-header';
            const colorSwatch = document.createElement('div');
            colorSwatch.className = 'color-swatch';
            colorSwatch.style.backgroundColor = participante.color;
            const name = document.createElement('span');
            name.className = 'participant-name';
            name.textContent = participante.nombre;
            const answerP = document.createElement('p');
            answerP.className = 'answer-text';
            answerP.textContent = respuesta;

            header.addEventListener('click', () => answerP.classList.toggle('visible'));
            
            header.appendChild(colorSwatch);
            header.appendChild(name);
            listItem.appendChild(header);
            listItem.appendChild(answerP);
            answersList.appendChild(listItem);
        });

        prevButton.disabled = (preguntaActualIndex === 0);
        nextButton.disabled = (preguntaActualIndex === preguntas.length - 1);
    }

    // --- EVENT LISTENERS PARA NAVEGACIÓN (SIN CAMBIOS) ---
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