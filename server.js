// 1. Requerimos las herramientas. ¡Añadimos 'fs'!
const express = require('express');
const fs = require('fs'); // ¡NUEVO! File System module

// 2. Inicializamos la aplicación
const app = express();
const PORT = 3000;

// =================================================================
// --- MIDDLEWARE ---
// =================================================================
app.use(express.static('public'));
app.use(express.json());

// =================================================================
// --- BASE DE DATOS EN ARCHIVO JSON ---
// =================================================================

// Definimos la ruta de nuestro "archivo-base de datos"
const DB_FILE = './respuestas.json';

// Función para leer los datos del archivo
function leerDatos() {
    try {
        // Si el archivo no existe, fs.readFileSync lanzará un error
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data); // Convertimos el string del archivo a un objeto/array
    } catch (error) {
        // Si el archivo no existe o hay otro error, empezamos con un array vacío
        console.log("No se encontró el archivo de base de datos. Creando uno nuevo.");
        return [];
    }
}

// Función para escribir los datos en el archivo
function escribirDatos(data) {
    // Usamos null, 2 para que el JSON se guarde formateado y sea legible
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Cargamos los datos iniciales cuando arranca el servidor
let respuestasGuardadas = leerDatos();

// Mantenemos las preguntas en memoria, ya que son estáticas por ahora
const preguntas = [
    "¿Cuál es tu recuerdo familiar más divertido?",
    "Si pudieras tener un superpoder, ¿cuál sería y por qué?",
    "¿Qué canción te pone de buen humor al instante?",
    "¿Cuál es el mejor consejo que te han dado?",
    "Si tu vida fuera una película, ¿qué título tendría?"
];

// =================================================================
// --- API DE DATOS (RUTAS) ---
// =================================================================

// Ruta GET para obtener la lista de preguntas
app.get('/api/preguntas', (req, res) => {
    res.json(preguntas);
});

// Ruta POST para recibir y guardar las respuestas
app.post('/api/respuestas', (req, res) => {
    const nuevasRespuestas = req.body;
    nuevasRespuestas.id = Date.now();
    nuevasRespuestas.fecha = new Date().toLocaleString("es-MX");

    // Añadimos las nuevas respuestas al array
    respuestasGuardadas.push(nuevasRespuestas);
    
    // ¡LA MAGIA! Guardamos el array completo en el archivo
    escribirDatos(respuestasGuardadas);

    console.log('--- Nuevas respuestas guardadas en el archivo ---');
    console.log(JSON.stringify(nuevasRespuestas, null, 2));
    
    res.status(201).json({ message: 'Respuestas guardadas con éxito!' });
});
// ... después de la ruta app.post('/api/respuestas', ...)

// Paleta de colores para asignar a cada usuario
const colorPalette = ['#ffadad', '#a0c4ff', '#fdffb6', '#caffbf', '#9bf6ff', '#ffc6ff', '#ffd6a5'];

// Ruta GET para obtener y transformar todos los resultados guardados
app.get('/api/resultados', (req, res) => {
    const respuestasGuardadas = leerDatos(); // Reutilizamos nuestra función de lectura

    if (respuestasGuardadas.length === 0) {
        // Si no hay respuestas, enviamos un objeto vacío
        return res.json({ preguntas: [], participantes: [] });
    }

    // --- Magia de Transformación de Datos ---

    // 1. Obtenemos una lista única de todas las preguntas
    const todasLasPreguntas = [...new Set(respuestasGuardadas.flatMap(p => p.respuestas.map(r => r.pregunta)))];
    
    // 2. Creamos una lista de participantes únicos con su color asignado
    const participantesUnicos = {};
    respuestasGuardadas.forEach(submission => {
        if (!participantesUnicos[submission.usuario]) {
            participantesUnicos[submission.usuario] = {
                nombre: submission.usuario,
                color: colorPalette[Object.keys(participantesUnicos).length % colorPalette.length],
                respuestas: [] // Array para llenar después
            };
        }
    });

    // 3. Llenamos las respuestas de cada participante para cada pregunta
    todasLasPreguntas.forEach(pregunta => {
        Object.values(participantesUnicos).forEach(participante => {
            const submissionDelParticipante = respuestasGuardadas.find(s => s.usuario === participante.nombre);
            const respuestaEncontrada = submissionDelParticipante.respuestas.find(r => r.pregunta === pregunta);
            
            participante.respuestas.push(respuestaEncontrada ? respuestaEncontrada.respuesta : 'No respondió');
        });
    });

    // 4. Preparamos el paquete final para el frontend
    const payloadFinal = {
        preguntas: todasLasPreguntas,
        participantes: Object.values(participantesUnicos)
    };
    
    res.json(payloadFinal);
});
// =================================================================
// --- INICIO DEL SERVIDOR ---
// =================================================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor del Chismografo escuchando en http://localhost:${PORT}`);
});