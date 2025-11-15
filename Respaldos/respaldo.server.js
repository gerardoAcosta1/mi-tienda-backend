const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const path = require('path'); // Módulo necesario para rutas

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '..', 'public')));
/* usando poool */

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'admin',
  database: 'bodega_casa',
  port: 5432
});

// Ruta ejemplo
app.get('/cajas', async (req, res) => {
  console.log('se recibio peticion: obtener cajas')
  const result = await pool.query('SELECT * FROM cajas');
  res.json(result.rows);
});

app.post('/crearCaja', async (req, res) => {
  console.log('se recibio peticion: crear Caja')
  const {numero_caja} = req.body;
  console.log(numero_caja)
  const result = await pool.query(`insert into cajas values (default,'A',${numero_caja})`);
  res.json(result.rows);
});

app.delete('/cajas', async (req, res) => {
  console.log('se recibio peticion: eliminar caja', req.body)
const {caja} =req.body;
  console.log(caja)
  const result = await pool.query(`delete from cajas where id_caja = ${caja}`);
  res.json(result);
});
app.get('/objetos', async (req, res) => {
  console.log('se recibio peticion : seleccionar objetos')
  const result = await pool.query('SELECT * FROM objetos');
  res.json(result.rows);
});

app.post('/crearObjeto', async (req, res) => {
  console.log('se recibio peticion : crear Objeto', req.body)
const {nombre, caja} =req.body;
 
  const result = await pool.query(`insert into objetos values (default,  ${caja},'${nombre}')`);
  res.json(result);
});

app.delete('/eliminarObjeto', async (req, res) => {
  console.log('se recibio peticion: eliminar objeto', req.body)
const {id_objeto} =req.body;
 
  const result = await pool.query(`delete from objetos where id_objeto = ${id_objeto}`);
  res.json(result);
});


/*------------------------- */

app.get('/', (req, res) => {
  res.send('Asistente backend activo');
});
/*app.get('/products', async (req, res) => {
  console.log('se recibio peticion: obtener cajas')
  const result = await pool.query('SELECT * FROM products');
  res.json(result.rows);
});*/
app.get('/categoryId', async (req, res )=> {

  try{
    const id = req.query.id

    const sql = `
          SELECT 
              p.id, 
              p.marca,
              p.title,
              p.price,
              p.category,
              p.category_number,
              json_agg(
                  json_build_object(
                      'id_image', pi.id_image,
                      'image_url', pi.image_url
                  )
              ) as images
          FROM products p
          left JOIN product_images pi ON p.id = pi.product where p.category_number = ${id} -- Unir por la clave foránea
          GROUP BY p.id, p.marca, p.title, p.price, p.category;` 
      
    const result = await pool.query(sql);
    res.json(result.rows);

  }    
      catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: 'Fallo interno del servidor' });
    }
});
app.get('/categories', async (req, res )=> {

  try{
    const id = req.query.id

    const sql = `select * from products` 
    const result = await pool.query(sql);
    res.json(result.rows);

  }    
      catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: 'Fallo interno del servidor' });
    }
});

app.get('/products', async (req, res) => {
  try {
      console.log('se recibio peticion: obtener productos con imágenes');
      
      // 🛑 Consulta SQL que UNE ambas tablas
      const sql = `
          SELECT 
              p.id, 
              p.marca,
              p.title,
              p.price,
              p.category,
              json_agg(
                  json_build_object(
                      'id_image', pi.id_image,
                      'image_url', pi.image_url
                  )
              ) as images
          FROM products p
          left JOIN product_images pi ON p.id = pi.product -- Unir por la clave foránea
          GROUP BY p.id, p.marca, p.title, p.price, p.category; -- Agrupar por producto
      `;
      
      const result = await pool.query(sql);
      res.json(result.rows);

  } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ error: 'Fallo interno del servidor' });
  }
});
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

server.listen(3001, () => {
  console.log('Servidor escuchando en http://localhost:3001');
});


