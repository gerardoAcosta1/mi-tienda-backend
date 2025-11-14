// server.js (Archivo principal)
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path'); 
const app = express();
require('dotenv').config();
const PORT = 3001; // Usamos 3001 como puerto local por defecto

// Rutas Importadas
const productRoutes = require('./routes/product.routes'); // ⬅️ Quita el './src'
const authRoutes = require('./routes/auth.routes'); 
const cartRoutes = require('./routes/cart.routes');

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

//  Montar Rutas del E-commerce
// Todas estas rutas tendrán el prefijo /api/v1 
app.use('/api/v1', productRoutes); 
app.use('/api/v1', authRoutes); 
app.use('/api/v1', cartRoutes); 


//  Configuración de Carpeta Pública 
app.use(express.static(path.join(__dirname, '..', 'public')));

// app.get('/cajas', ...), app.post('/crearCaja', ...), etc.

app.get('/', (req, res) => {
    res.send('Asistente backend activo');
});

// 🛑 Lógica de Socket.io (la dejamos aquí)
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    socket.on('mensaje', (data) => {
        console.log('Mensaje recibido:', data);
        socket.emit('respuesta', `Recibí: ${data.texto}`);
    });
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});