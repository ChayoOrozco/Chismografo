// 1. Requerimos las herramientas necesarias
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt'); // ¡¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA!!

// 2. Inicializamos la aplicación de Express
const app = express();
const PORT = 3000;

// =================================================================
// --- MIDDLEWARE ---
// =================================================================
app.use(express.static('public'));
app.use(express.json());


// =================================================================
// --- BASE DE DATOS EN ARCHIVOS JSON ---
// =================================================================
const RESPUESTAS_DB_FILE = './respuestas.json';
const PREGUNTAS_DB_FILE = './preguntas.json';
const USERS_DB_FILE = './users.json'; // Definimos la ruta para los usuarios

// (Las funciones leerDatos y escribirDatos se quedan igual)
function leerDatos(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error(`Error al leer el archivo ${filePath}:`, error);
        return [];
    }
}
function escribirDatos(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}


// =================================================================
// --- API DE DATOS (RUTAS) ---
// =================================================================

// --- Ruta de LOGIN ---
app.post('/api/login/admin', (req, res) => {
    const { adminUser, adminPass } = req.body;
    const usersDB = leerDatos(USERS_DB_FILE);
    const adminAccount = usersDB.admin;

    if (!adminAccount || adminUser !== adminAccount.username) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    // Ahora sí, 'bcrypt' está definido y podemos usarlo.
    bcrypt.compare(adminPass, adminAccount.passwordHash, function(err, result) {
        if (err) {
            console.error("Error en bcrypt.compare:", err);
            return res.status(500).json({ message: "Error interno del servidor." });
        }
        if (result === true) {
            console.log("Login de admin exitoso.");
            res.status(200).json({ message: 'Login exitoso.', role: 'admin' });
        } else {
            console.log("Intento de login de admin fallido (contraseña incorrecta).");
            res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }
    });
});


// --- Rutas para PREGUNTAS ---
app.get('/api/preguntas/:usuario', (req, res) => {
    // ... (esta ruta no cambia)
    const usuarioActual = req.params.usuario;
    const todasLasPreguntas = leerDatos(PREGUNTAS_DB_FILE);
    const todasLasRespuestas = leerDatos(RESPUESTAS_DB_FILE);
    const submissionDelUsuario = todasLasRespuestas.find(s => s.usuario === usuarioActual);

    if (!submissionDelUsuario) {
        return res.json(todasLasPreguntas);
    }
    const preguntasYaRespondidas = submissionDelUsuario.respuestas.map(r => r.pregunta);
    const preguntasPendientes = todasLasPreguntas.filter(pregunta => !preguntasYaRespondidas.includes(pregunta));
    res.json(preguntasPendientes);
});

app.post('/api/preguntas', (req, res) => {
    // ... (esta ruta no cambia)
    const { nuevaPregunta } = req.body;
    if (!nuevaPregunta || nuevaPregunta.trim() === '') {
        return res.status(400).json({ message: 'La pregunta no puede estar vacía.' });
    }
    const preguntasActuales = leerDatos(PREGUNTas_DB_FILE);
    const preguntaLimpia = nuevaPregunta.trim();
    preguntasActuales.push(preguntaLimpia);
    escribirDatos(PREGUNTAS_DB_FILE, preguntasActuales);
    res.status(201).json({ message: '¡Pregunta añadida con éxito!' });
});


// --- Ruta para RESPUESTAS ---
app.post('/api/respuestas', (req, res) => {
    // ... (esta ruta no cambia)
    const nuevasRespuestas = req.body;
    nuevasRespuestas.id = Date.now();
    nuevasRespuestas.fecha = new Date().toLocaleString("es-MX");
    const respuestasActuales = leerDatos(RESPUESTAS_DB_FILE);
    respuestasActuales.push(nuevasRespuestas);
    escribirDatos(RESPUESTAS_DB_FILE, respuestasActuales);
    res.status(201).json({ message: 'Respuestas guardadas con éxito!' });
});


// --- Ruta para RESULTADOS ---
app.get('/api/resultados', (req, res) => {
    // ... (esta ruta no cambia)
    const respuestasActuales = leerDatos(RESPUESTAS_DB_FILE);
    if (respuestasActuales.length === 0) {
        return res.json({ preguntas: [], participantes: [] });
    }
    // ... (la lógica de transformación de datos no cambia)
    const colorPalette = ['#ffadad', '#a0c4ff', '#fdffb6', '#caffbf', '#9bf6ff', '#ffc6ff', '#ffd6a5'];
    const todasLasPreguntas = [...new Set(respuestasActuales.flatMap(p => p.respuestas.map(r => r.pregunta)))];
    const participantesUnicos = {};
    respuestasActuales.forEach(submission => {
        if (!participantesUnicos[submission.usuario]) {
            participantesUnicos[submission.usuario] = { nombre: submission.usuario, color: colorPalette[Object.keys(participantesUnicos).length % colorPalette.length], respuestas: [] };
        }
    });
    todasLasPreguntas.forEach(pregunta => {
        Object.values(participantesUnicos).forEach(participante => {
            const submissionDelParticipante = respuestasActuales.find(s => s.usuario === participante.nombre);
            const respuestaEncontrada = submissionDelParticipante ? submissionDelParticipante.respuestas.find(r => r.pregunta === pregunta) : null;
            participante.respuestas.push(respuestaEncontrada ? respuestaEncontrada.respuesta : 'No respondió');
        });
    });
    res.json({ preguntas: todasLasPreguntas, participantes: Object.values(participantesUnicos) });
});


// =================================================================
// --- INICIO DEL SERVIDOR ---
// =================================================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor del Chismografo escuchando en http://localhost:${PORT}`);
});