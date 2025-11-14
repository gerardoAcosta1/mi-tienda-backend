// routes/auth.routes.js

const express = require('express');
const router = express.Router();
// Asume que tu conexión a la DB está en db/connection.js
const pool = require('../db/connection'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ----------------------------------------------------
// 1. RUTA DE REGISTRO (POST /users)
// ----------------------------------------------------
router.post('/users', async (req, res) => {
    const { email, password, first_name, last_name, phone } = req.body;
    
    try {
        // 1. Hashear la Contraseña antes de guardar
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. Insertar el nuevo usuario en la tabla 'users'
        const sql = `INSERT INTO users (email, password, firstname, lastname, phone) 
                     VALUES ($1, $2, $3, $4, $5) RETURNING id, firstname, email`;
        
        const result = await pool.query(sql, [email, hashedPassword, first_name, last_name, phone]);

        // 3. Devolver datos seguros
        return res.status(201).json(result.rows[0]); 

    } catch (error) {
        console.error('Error en el registro:', error);
        // Manejo específico para email duplicado
        if (error.code === '23505') { 
            return res.status(400).json({ message: 'El email ya está registrado.' });
        }
        res.status(500).json({ error: 'Fallo interno del servidor' });
    }
});


// ----------------------------------------------------
// 2. RUTA DE INICIO DE SESIÓN (POST /users/login)
// ----------------------------------------------------
router.post('/users/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar el usuario
        const userQuery = 'SELECT id, password, firstname FROM users WHERE email = $1';
        const result = await pool.query(userQuery, [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 2. Comparar la contraseña hasheada
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 3. Crear el Token JWT
        const payload = { id: user.id, name: user.firstname };

        const token = jwt.sign(
            payload,
            process.env.TOKEN_SECRET, // Usa la clave secreta de tu .env
            { expiresIn: '1d' }      
        );

        // 4. Enviar el Token y datos seguros al frontend
        return res.json({ 
            token: token,
            user: { id: user.id, name: user.first_name } 
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Fallo interno del servidor' });
    }
});


module.exports = router;