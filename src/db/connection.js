// db/connection.js
/*const { Pool } = require('pg');
// Necesitarías dotenv.config() aquí o en server.js si usas .env
// Pero por ahora, mantenemos tus datos locales:

const pool = new Pool({
    host: process.env.DB_HOST2,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD2,
    database: process.env.DB_NAME2,
    port: process.env.PORT || 5432, 
   
});

module.exports = pool;*/

// src/db/connection.js (CÓDIGO CORREGIDO PARA RENDER)
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Cargar variables de entorno localmente si no están en producción
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// 1. Define la cadena de conexión
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD2}@${process.env.DB_HOST2}:${process.env.PORT || 5432}/${process.env.DB_NAME2}`;

// 2. Define si estamos en producción (Render)
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

// 3. Configura el pool
const pool = new Pool({
    connectionString: connectionString,
    // La configuración SSL es CRÍTICA para Render
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

module.exports = pool;