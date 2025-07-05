// Archivo: admin-setup.js
const bcrypt = require('bcrypt');

// ¡¡¡CAMBIA ESTA CONTRASEÑA POR LA QUE TÚ QUIERAS!!!
const miContrasenaAdmin = 'supersecreto2024';
const saltRounds = 10; // Un factor de coste para el hasheo

console.log(`Hasheando la contraseña: "${miContrasenaAdmin}"...`);

bcrypt.hash(miContrasenaAdmin, saltRounds, function(err, hash) {
    if (err) {
        console.error("Hubo un error al hashear:", err);
        return;
    }
    console.log("\n¡LISTO! Este es tu hash seguro. Cópialo y pégalo en tu archivo de base de datos de usuarios.");
    console.log("==========================================================================================");
    console.log(hash);
    console.log("==========================================================================================");
    console.log("Después de copiarlo, ya puedes borrar este archivo si quieres.");
});