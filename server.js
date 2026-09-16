// --- Archivo server.js COMPLETO Y VERIFICADO ---
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || './data';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

fs.mkdirSync(DATA_DIR, { recursive: true });

app.set('trust proxy', 1); // detrás de Traefik, para que la cookie 'secure' funcione
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-cambia-esto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
    }
}));
app.use(express.static('public'));

const RESPUESTAS_DB_FILE = path.join(DATA_DIR, 'respuestas.json');
const PREGUNTAS_DB_FILE = path.join(DATA_DIR, 'preguntas.json');
const USERS_DB_FILE = path.join(DATA_DIR, 'users.json');

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

// Si no existe cuenta admin, la crea desde ADMIN_PASSWORD (o 'admin' por defecto)
function asegurarAdmin() {
    const usersDB = leerDatos(USERS_DB_FILE, 'object');
    if (!usersDB.admin) {
        const passwordInicial = process.env.ADMIN_PASSWORD || 'admin';
        usersDB.admin = {
            username: 'admin',
            passwordHash: bcrypt.hashSync(passwordInicial, 10),
            role: 'admin'
        };
        escribirDatos(USERS_DB_FILE, usersDB);
        console.log('👤 Cuenta admin creada (usa ADMIN_PASSWORD del .env para la contraseña).');
    }
}
asegurarAdmin();

// --- MIDDLEWARES DE AUTENTICACIÓN ---
function requireUser(req, res, next) {
    if (!req.session.user) return res.status(401).json({ message: 'Debes iniciar sesión.' });
    next();
}
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Solo el administrador puede hacer esto.' });
    }
    next();
}

// --- CONFIG PÚBLICA PARA EL FRONTEND ---
app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID || null });
});

// --- SESIÓN ACTUAL ---
app.get('/api/session', (req, res) => {
    if (!req.session.user) return res.json({ loggedIn: false });
    res.json({ loggedIn: true, name: req.session.user.name, role: req.session.user.role });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.status(200).json({ message: 'Sesión cerrada.' }));
});

// --- Rutas de Login y Gestión de Usuarios ---
app.post('/api/login/admin', (req, res) => {
    const { adminUser, adminPass } = req.body;
    const usersDB = leerDatos(USERS_DB_FILE, 'object');
    const adminAccount = usersDB.admin;
    if (!adminAccount || adminUser !== adminAccount.username) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }
    bcrypt.compare(adminPass, adminAccount.passwordHash, (err, result) => {
        if (err) return res.status(500).json({ message: "Error interno del servidor." });
        if (!result) return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        req.session.user = { username: adminAccount.username, name: adminAccount.username, role: 'admin' };
        res.status(200).json({ message: 'Login exitoso.', role: 'admin' });
    });
});

// Login de amigos/familia con Google
app.post('/api/auth/google', async (req, res) => {
    if (!googleClient) return res.status(500).json({ message: 'Login con Google no está configurado en el servidor.' });
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Falta el token de Google.' });

    try {
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const email = payload.email;
        const nombre = payload.name || email;

        const usersDB = leerDatos(USERS_DB_FILE, 'object');
        if (!usersDB.users) usersDB.users = [];
        let cuenta = usersDB.users.find(u => u.username === email);
        if (!cuenta) {
            cuenta = { username: email, displayName: nombre, role: 'user', provider: 'google' };
            usersDB.users.push(cuenta);
            escribirDatos(USERS_DB_FILE, usersDB);
        }

        req.session.user = { username: cuenta.username, name: cuenta.displayName || nombre, role: 'user' };
        res.status(200).json({ message: `¡Bienvenido, ${req.session.user.name}!` });
    } catch (error) {
        console.error('Error verificando token de Google:', error);
        res.status(401).json({ message: 'No se pudo verificar tu cuenta de Google.' });
    }
});

app.get('/api/users', requireAdmin, (req, res) => {
    const usersDB = leerDatos(USERS_DB_FILE, 'object');
    const users = usersDB.users || [];
    const usersInfo = users.map(user => ({ username: user.displayName || user.username, role: user.role }));
    res.json(usersInfo);
});

app.delete('/api/users/:username', requireAdmin, (req, res) => {
    const usernameToDelete = req.params.username;
    const usersDB = leerDatos(USERS_DB_FILE, 'object');
    const initialLength = (usersDB.users || []).length;
    usersDB.users = (usersDB.users || []).filter(user => user.username !== usernameToDelete);
    if (usersDB.users.length === initialLength) return res.status(404).json({ message: 'Usuario no encontrado.' });
    escribirDatos(USERS_DB_FILE, usersDB);
    res.status(200).json({ message: `Usuario ${usernameToDelete} eliminado.` });
});

// --- Rutas de Preguntas y Resultados ---
app.get('/api/admin/preguntas', requireUser, (req, res) => {
    const preguntas = leerDatos(PREGUNTAS_DB_FILE);
    res.json(preguntas);
});
app.post('/api/preguntas', requireUser, (req, res) => {
    const { nuevaPregunta } = req.body;
    if (!nuevaPregunta || nuevaPregunta.trim() === '') return res.status(400).json({ message: 'La pregunta no puede estar vacía.' });
    let preguntas = leerDatos(PREGUNTAS_DB_FILE);
    preguntas.push(nuevaPregunta.trim());
    escribirDatos(PREGUNTAS_DB_FILE, preguntas);
    res.status(201).json({ message: '¡Pregunta añadida con éxito!' });
});
app.post('/api/respuestas', requireUser, (req, res) => {
    const nuevasRespuestas = req.body;
    nuevasRespuestas.usuario = req.session.user.name; // ignoramos lo que mande el cliente
    nuevasRespuestas.id = Date.now();
    nuevasRespuestas.fecha = new Date().toLocaleString("es-MX");
    let respuestas = leerDatos(RESPUESTAS_DB_FILE);
    respuestas.push(nuevasRespuestas);
    escribirDatos(RESPUESTAS_DB_FILE, respuestas);
    res.status(201).json({ message: 'Respuestas guardadas con éxito!' });
});
app.get('/api/resultados', requireUser, (req, res) => {
    const respuestasActuales = leerDatos(RESPUESTAS_DB_FILE);
    if (respuestasActuales.length === 0) return res.json({ preguntas: [], participantes: [] });

    const colorPalette = ['#ffadad', '#a0c4ff', '#fdffb6', '#caffbf', '#9bf6ff', '#ffc6ff', '#ffd6a5'];

    // Participantes = quienes ya respondieron algo (así los amigos por Google aparecen sin necesitar alta manual)
    const nombresParticipantes = [...new Set(respuestasActuales.map(s => s.usuario))];
    const todasLasPreguntas = [...new Set(respuestasActuales.flatMap(p => p.respuestas.map(r => r.pregunta)))];

    const participantesOrdenados = nombresParticipantes.map((nombre, index) => {
        const participante = { nombre, color: colorPalette[index % colorPalette.length], respuestas: [] };

        todasLasPreguntas.forEach(pregunta => {
            const respuestasDelUsuario = respuestasActuales
                .filter(s => s.usuario === nombre)
                .map(s => s.respuestas.find(r => r.pregunta === pregunta))
                .filter(r => r !== undefined);

            const ultimaRespuesta = respuestasDelUsuario.length > 0
                ? respuestasDelUsuario[respuestasDelUsuario.length - 1].respuesta
                : 'No respondió';

            participante.respuestas.push(ultimaRespuesta);
        });

        return participante;
    });

    res.json({ preguntas: todasLasPreguntas, participantes: participantesOrdenados });
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => console.log(`🚀 Servidor del Chismografo escuchando en http://localhost:${PORT}`));
