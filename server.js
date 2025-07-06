// --- Archivo server.js COMPLETO Y VERIFICADO ---

const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

const RESPUESTAS_DB_FILE = './respuestas.json';
const PREGUNTAS_DB_FILE = './preguntas.json';
const USERS_DB_FILE = './users.json';

function leerDatos(filePath, defaultType = 'array') {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            if (data.trim() === '') return defaultType === 'array' ? [] : {};
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error al leer o parsear ${filePath}:`, error);
    }
    return defaultType === 'array' ? [] : {};
}

function escribirDatos(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- API DE DATOS (RUTAS) ---

// --- Rutas de Login y Gestión de Usuarios ---
app.post('/api/login/admin', (req, res) => { const { adminUser, adminPass } = req.body; const usersDB = leerDatos(USERS_DB_FILE, 'object'); const adminAccount = usersDB.admin; if (!adminAccount || adminUser !== adminAccount.username) { return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' }); } bcrypt.compare(adminPass, adminAccount.passwordHash, (err, result) => { if (err) return res.status(500).json({ message: "Error interno del servidor." }); if (result) { res.status(200).json({ message: 'Login exitoso.', role: 'admin' }); } else { res.status(401).json({ message: 'Usuario o contraseña incorrectos.' }); } }); });
app.post('/api/login/user', (req, res) => { const { username, password } = req.body; const usersDB = leerDatos(USERS_DB_FILE, 'object'); const userAccount = usersDB.users ? usersDB.users.find(user => user.username === username) : null; if (!userAccount) { return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' }); } bcrypt.compare(password, userAccount.passwordHash, (err, result) => { if (err) return res.status(500).json({ message: "Error interno del servidor." }); if (result) { res.status(200).json({ message: `¡Bienvenido, ${username}!` }); } else { res.status(401).json({ message: 'Usuario o contraseña incorrectos.' }); } }); });
app.get('/api/users', (req, res) => { const usersDB = leerDatos(USERS_DB_FILE, 'object'); const users = usersDB.users || []; const usersInfo = users.map(user => ({ username: user.username, role: user.role })); res.json(usersInfo); });
app.post('/api/users', (req, res) => { const { username, password } = req.body; if (!username || !password) { return res.status(400).json({ message: 'El usuario y la contraseña son requeridos.' }); } const usersDB = leerDatos(USERS_DB_FILE, 'object'); if (!usersDB.users) { usersDB.users = []; } if (usersDB.users.some(user => user.username === username)) { return res.status(409).json({ message: 'Este ID de Familia ya existe.' }); } bcrypt.hash(password, 10, (err, hash) => { if (err) return res.status(500).json({ message: 'Error interno al crear la cuenta.' }); const newUser = { username: username, passwordHash: hash, role: 'user' }; usersDB.users.push(newUser); escribirDatos(USERS_DB_FILE, usersDB); res.status(201).json({ message: `¡Cuenta para ${username} creada con éxito!` }); }); });
app.delete('/api/users/:username', (req, res) => { const usernameToDelete = req.params.username; const usersDB = leerDatos(USERS_DB_FILE, 'object'); const initialLength = usersDB.users.length; usersDB.users = usersDB.users.filter(user => user.username !== usernameToDelete); if (usersDB.users.length === initialLength) return res.status(404).json({ message: 'Usuario no encontrado.' }); escribirDatos(USERS_DB_FILE, usersDB); res.status(200).json({ message: `Usuario ${usernameToDelete} eliminado.` }); });

// --- Rutas de Preguntas y Resultados ---
app.get('/api/admin/preguntas', (req, res) => { const preguntas = leerDatos(PREGUNTAS_DB_FILE); res.json(preguntas); });
app.get('/api/preguntas/:usuario', (req, res) => { const todasLasPreguntas = leerDatos(PREGUNTAS_DB_FILE); const todasLasRespuestas = leerDatos(RESPUESTAS_DB_FILE); const submissionDelUsuario = todasLasRespuestas.find(s => s.usuario === req.params.usuario); if (!submissionDelUsuario) return res.json(todasLasPreguntas); const preguntasYaRespondidas = submissionDelUsuario.respuestas.map(r => r.pregunta); res.json(todasLasPreguntas.filter(p => !preguntasYaRespondidas.includes(p))); });
app.post('/api/preguntas', (req, res) => { const { nuevaPregunta } = req.body; if (!nuevaPregunta || nuevaPregunta.trim() === '') return res.status(400).json({ message: 'La pregunta no puede estar vacía.' }); let preguntas = leerDatos(PREGUNTAS_DB_FILE); preguntas.push(nuevaPregunta.trim()); escribirDatos(PREGUNTAS_DB_FILE, preguntas); res.status(201).json({ message: '¡Pregunta añadida con éxito!' }); });
app.delete('/api/questions', (req, res) => { const { questionToDelete } = req.body; let preguntas = leerDatos(PREGUNTAS_DB_FILE); const initialLength = preguntas.length; preguntas = preguntas.filter(q => q !== questionToDelete); if (preguntas.length === initialLength) return res.status(404).json({ message: 'Pregunta no encontrada.' }); escribirDatos(PREGUNTAS_DB_FILE, preguntas); res.status(200).json({ message: 'Pregunta eliminada.' }); });
app.post('/api/respuestas', (req, res) => { const nuevasRespuestas = req.body; nuevasRespuestas.id = Date.now(); nuevasRespuestas.fecha = new Date().toLocaleString("es-MX"); let respuestas = leerDatos(RESPUESTAS_DB_FILE); respuestas.push(nuevasRespuestas); escribirDatos(RESPUESTAS_DB_FILE, respuestas); res.status(201).json({ message: 'Respuestas guardadas con éxito!' }); });
app.get('/api/resultados', (req, res) => { const respuestasActuales = leerDatos(RESPUESTAS_DB_FILE); if (respuestasActuales.length === 0) return res.json({ preguntas: [], participantes: [] }); const usersDB = leerDatos(USERS_DB_FILE, 'object'); const usuariosOrdenados = usersDB.users || []; const colorPalette = ['#ffadad', '#a0c4ff', '#fdffb6', '#caffbf', '#9bf6ff', '#ffc6ff', '#ffd6a5']; const todasLasPreguntas = [...new Set(respuestasActuales.flatMap(p => p.respuestas.map(r => r.pregunta)))]; const participantesOrdenados = usuariosOrdenados.map((user, index) => ({ nombre: user.username, color: colorPalette[index % colorPalette.length], respuestas: [] })); todasLasPreguntas.forEach(pregunta => { participantesOrdenados.forEach(participante => { const submissionDelParticipante = respuestasActuales.find(s => s.usuario === participante.nombre); const respuestaEncontrada = submissionDelParticipante ? submissionDelParticipante.respuestas.find(r => r.pregunta === pregunta) : null; participante.respuestas.push(respuestaEncontrada ? respuestaEncontrada.respuesta : 'No respondió'); }); }); res.json({ preguntas: todasLasPreguntas, participantes: participantesOrdenados }); });

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => console.log(`🚀 Servidor del Chismografo escuchando en http://localhost:${PORT}`));