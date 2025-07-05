// 1. Requerimos las herramientas necesarias
const express = require('express');
const fs = require('fs'); // Módulo para interactuar con el sistema de archivos

// 2. Inicializamos la aplicación de Express
const app = express();
const PORT = 3000;

// =================================================================
// --- MIDDLEWARE ---
// Se ejecutan en orden por cada petición que llega al servidor.
// =================================================================

// Sirve todos los archivos estáticos (HTML, CSS, JS del cliente, imágenes) desde la carpeta 'public'
app.use(express.static('public'));
// Parsea (interpreta) el cuerpo de las peticiones que vienen en formato JSON
app.use(express.json());

// =================================================================
// --- BASE DE DATOS EN ARCHIVOS JSON ---
// Definimos las rutas a nuestros archivos que actúan como base de datos.
// =================================================================

const RESPUESTAS_DB_FILE = './respuestas.json';
const PREGUNTAS_DB_FILE = './preguntas.json';

// Función reutilizable para leer datos de cualquier archivo JSON
function leerDatos(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return []; // Si el archivo no existe, devuelve un array vacío
    } catch (error) {
        console.error(`Error al leer el archivo ${filePath}:`, error);
        return [];
    }
}

// Función reutilizable para escribir datos en cualquier archivo JSON
function escribirDatos(filePath, data) {
    const dataString = JSON.stringify(data, null, 2); // El 'null, 2' formatea el JSON para que sea legible
    fs.writeFileSync(filePath, dataString);
}


// =================================================================
// --- API DE DATOS (RUTAS / ENDPOINTS) ---
// Estas son las URLs que nuestro frontend puede "llamar".
// =================================================================

// --- Rutas para PREGUNTAS ---

// GET /api/preguntas/:usuario  <-- ¡LA RUTA INTELIGENTE!
// Devuelve una lista de preguntas personalizada para el usuario especificado.
app.get('/api/preguntas/:usuario', (req, res) => {
    // Obtenemos el nombre de usuario de los parámetros de la URL
    const usuarioActual = req.params.usuario;

    // Cargamos la versión más reciente de preguntas y respuestas desde los archivos
    const todasLasPreguntas = leerDatos(PREGUNTAS_DB_FILE);
    const todasLasRespuestas = leerDatos(RESPUESTAS_DB_FILE);

    // Buscamos si este usuario ya ha enviado respuestas antes
    const submissionDelUsuario = todasLasRespuestas.find(s => s.usuario === usuarioActual);

    if (!submissionDelUsuario) {
        // CASO 1: El usuario es nuevo. Le enviamos todas las preguntas.
        console.log(`Usuario nuevo '${usuarioActual}'. Enviando ${todasLasPreguntas.length} preguntas.`);
        return res.json(todasLasPreguntas);
    }

    // CASO 2: El usuario ya existe. Filtramos las preguntas que ya ha contestado.
    const preguntasYaRespondidas = submissionDelUsuario.respuestas.map(r => r.pregunta);
    const preguntasPendientes = todasLasPreguntas.filter(pregunta => !preguntasYaRespondidas.includes(pregunta));

    console.log(`Usuario recurrente '${usuarioActual}'. Enviando ${preguntasPendientes.length} preguntas pendientes.`);
    res.json(preguntasPendientes);
});

// POST /api/preguntas: Añade una nueva pregunta a la lista general.
app.post('/api/preguntas', (req, res) => {
    const { nuevaPregunta } = req.body;
    if (!nuevaPregunta || nuevaPregunta.trim() === '') {
        return res.status(400).json({ message: 'La pregunta no puede estar vacía.' });
    }
    const preguntasActuales = leerDatos(PREGUNTAS_DB_FILE);
    const preguntaLimpia = nuevaPregunta.trim();
    preguntasActuales.push(preguntaLimpia);
    escribirDatos(PREGUNTAS_DB_FILE, preguntasActuales);
    console.log(`Nueva pregunta añadida: "${preguntaLimpia}"`);
    res.status(201).json({ message: '¡Pregunta añadida con éxito!' });
});


// --- Ruta para RESPUESTAS ---

// POST /api/respuestas: Guarda las respuestas de un usuario.
// Esta lógica ahora es más simple, pero la podemos hacer más inteligente después
// para que actualice en lugar de siempre añadir. Por ahora, funciona.
app.post('/api/respuestas', (req, res) => {
    const nuevasRespuestas = req.body;
    nuevasRespuestas.id = Date.now();
    nuevasRespuestas.fecha = new Date().toLocaleString("es-MX");
    
    const respuestasActuales = leerDatos(RESPUESTAS_DB_FILE);
    respuestasActuales.push(nuevasRespuestas);
    escribirDatos(RESPUESTAS_DB_FILE, respuestasActuales);

    console.log(`Nuevas respuestas guardadas para el usuario: ${nuevasRespuestas.usuario}`);
    res.status(201).json({ message: 'Respuestas guardadas con éxito!' });
});


// --- Ruta para RESULTADOS ---

// GET /api/resultados: Procesa y devuelve todos los resultados para la visualización.
app.get('/api/resultados', (req, res) => {
    const respuestasActuales = leerDatos(RESPUESTAS_DB_FILE);

    if (respuestasActuales.length === 0) {
        return res.json({ preguntas: [], participantes: [] });
    }

    const colorPalette = ['#ffadad', '#a0c4ff', '#fdffb6', '#caffbf', '#9bf6ff', '#ffc6ff', '#ffd6a5'];
    const todasLasPreguntas = [...new Set(respuestasActuales.flatMap(p => p.respuestas.map(r => r.pregunta)))];
    const participantesUnicos = {};

    respuestasActuales.forEach(submission => {
        if (!participantesUnicos[submission.usuario]) {
            participantesUnicos[submission.usuario] = {
                nombre: submission.usuario,
                color: colorPalette[Object.keys(participantesUnicos).length % colorPalette.length],
                respuestas: []
            };
        }
    });

    todasLasPreguntas.forEach(pregunta => {
        Object.values(participantesUnicos).forEach(participante => {
            const submissionDelParticipante = respuestasActuales.find(s => s.usuario === participante.nombre);
            const respuestaEncontrada = submissionDelParticipante ? submissionDelParticipante.respuestas.find(r => r.pregunta === pregunta) : null;
            participante.respuestas.push(respuestaEncontrada ? respuestaEncontrada.respuesta : 'No respondió');
        });
    });
    
    res.json({
        preguntas: todasLasPreguntas,
        participantes: Object.values(participantesUnicos)
    });
});
// ¡NUEVA RUTA DE LOGIN PARA ADMIN!
app.post('/api/login/admin', (req, res) => {
    const { adminUser, adminPass } = req.body;

    // 1. Leemos nuestra base de datos de usuarios
    const usersDB = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
    const adminAccount = usersDB.admin;

    // 2. Verificamos que el usuario sea 'admin'
    if (adminUser !== adminAccount.username) {
        // Enviamos un error genérico para no dar pistas a atacantes
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    // 3. ¡LA MAGIA! Comparamos la contraseña enviada con el hash guardado
    bcrypt.compare(adminPass, adminAccount.passwordHash, function(err, result) {
        if (result === true) {
            // ¡Éxito! La contraseña coincide
            console.log("Login de admin exitoso.");
            res.status(200).json({ message: 'Login exitoso.', role: 'admin' });
        } else {
            // Fracaso. La contraseña no coincide
            console.log("Intento de login de admin fallido.");
            res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }
    });
});


// =================================================================
// --- INICIO DEL SERVIDOR ---
// =================================================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor del Chismografo escuchando en http://localhost:${PORT}`);
});