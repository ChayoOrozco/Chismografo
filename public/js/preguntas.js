// Envolvemos todo en DOMContentLoaded para asegurar que el HTML esté listo.
// Hacemos la función 'async' para poder usar 'await' al cargar los datos.
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- ELEMENTOS DEL DOM ---
    const questionCard = document.getElementById('question-card');
    const questionText = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const nextButton = document.getElementById('next-button');
    
    const endScreen = document.getElementById('end-screen');
    const generateButton = document.getElementById('generate-question-button');
    const viewResultsButton = document.getElementById('view-results-button');

    // --- DATOS ---
    // El array de preguntas ahora empieza vacío. Lo llenaremos desde el servidor.
    let preguntas = [];
    // Este array guardará temporalmente las respuestas del usuario en esta sesión.
    let respuestas = [];
    let preguntaActualIndex = 0;

    // --- FUNCIÓN PARA CARGAR LAS PREGUNTAS DESDE EL SERVIDOR ---
    async function cargarPreguntas() {
        try {
            // Hacemos una petición GET a nuestra API para traer las preguntas.
            const response = await fetch('/api/preguntas');
            if (!response.ok) {
                throw new Error('No se pudo conectar con el servidor.');
            }
            // Llenamos nuestro array local con los datos que nos dio el servidor.
            preguntas = await response.json();
        } catch (error) {
            console.error("Error al cargar las preguntas:", error);
            questionText.textContent = "¡Ups! No pudimos cargar las preguntas. Intenta de nuevo más tarde.";
            nextButton.disabled = true; // Desactivamos el botón si no hay preguntas.
        }
    }

    // --- FUNCIONES DE LA INTERFAZ ---

    // Muestra la pregunta actual en la pantalla.
    function mostrarPregunta() {
        if (preguntaActualIndex < preguntas.length) {
            questionText.textContent = preguntas[preguntaActualIndex];
            answerInput.value = '';
            answerInput.focus();
        } else {
            // Si ya no hay preguntas, finalizamos el proceso.
            finalizarChismografo();
        }
    }

    // Se ejecuta cuando el usuario ha respondido todas las preguntas.
    async function finalizarChismografo() {
        // Obtenemos el ID del usuario que guardamos en el localStorage durante el login.
        const idUsuario = localStorage.getItem('idUsuarioLogueado') || 'usuario_anonimo';

        // Preparamos el "paquete" de datos que enviaremos al servidor.
        const payload = {
            usuario: idUsuario,
            respuestas: respuestas
        };
        
        try {
            // Hacemos la petición POST a nuestro servidor para guardar los datos.
            const response = await fetch('/api/respuestas', {
                method: 'POST', // Indicamos que es una petición para enviar datos.
                headers: {
                    'Content-Type': 'application/json' // Le decimos que los datos van en formato JSON.
                },
                body: JSON.stringify(payload) // Convertimos nuestro objeto JS a un string JSON.
            });

            if (!response.ok) {
                throw new Error('El servidor no pudo guardar las respuestas.');
            }

            const result = await response.json();
            console.log('Respuesta del servidor:', result.message);

        } catch (error) {
            console.error('Error al enviar las respuestas:', error);
            alert('Hubo un problema al guardar tus respuestas. Revisa la consola.');
        }

        // Mostramos la pantalla final.
        questionCard.classList.add('hidden');
        endScreen.classList.remove('hidden');
    }

    // --- EVENT LISTENERS (MANEJADORES DE EVENTOS) ---

    // Cuando el usuario hace clic en "Siguiente Pregunta".
    nextButton.addEventListener('click', () => {
        respuestas.push({
            pregunta: preguntas[preguntaActualIndex],
            respuesta: answerInput.value
        });
        preguntaActualIndex++;
        mostrarPregunta();
    });

    // Botón para generar una nueva pregunta (funcionalidad futura).
    generateButton.addEventListener('click', () => {
        alert("¡Próximamente! Podrás añadir tus propias preguntas al chismografo.");
    });

    // Botón para ver resultados.
    viewResultsButton.addEventListener('click', () => {
        window.location.href = 'resultados.html';
    });

    // --- INICIO DE LA EJECUCIÓN ---
    // 1. Esperamos a que las preguntas se carguen desde el servidor.
    await cargarPreguntas();
    // 2. Una vez cargadas, mostramos la primera pregunta.
    if (preguntas.length > 0) {
        mostrarPregunta();
    }
});