// routes/product.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection'); // Importa el pool de la DB

// 1. OBTENER TODOS LOS PRODUCTOS CON IMAGENES
router.get('/products', async (req, res) => {
    try {
        console.log('se recibio peticion: obtener productos con imágenes');
        const sql = `
            SELECT p.id, p.marca, p.title, p.price, p.category, 
                   json_agg(json_build_object('id_image', pi.id_image, 'image_url', pi.image_url)) as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product 
            GROUP BY p.id, p.marca, p.title, p.price, p.category;
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: 'Fallo interno del servidor' });
    }
});

// 2. OBTENER PRODUCTOS POR CATEGORÍA CON IMAGENES
router.get('/categoryId', async (req, res) => {
    try {
        const id = req.query.id;
        // 🛑 Corregida la consulta SQL para usar WHERE correctamente (como vimos antes)
        const sql = `
            SELECT p.id, p.marca, p.title, p.price, p.category, p.category_number,
                   json_agg(json_build_object('id_image', pi.id_image, 'image_url', pi.image_url)) as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product 
            WHERE p.category_number = ${id}
            GROUP BY p.id, p.marca, p.title, p.price, p.category, p.category_number;
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener productos por categoría:", error);
        res.status(500).json({ error: 'Fallo interno del servidor' });
    }
});
//obtener imagenes por id de producto
// routes/product.routes.js (CORRECCIÓN FINAL)

router.get('/products/:id', async (req, res, next) => {
    const productId = req.params.id; 

    try {
        const productSql = `
            SELECT 
                p.id, 
                p.title, 
                p.description, 
                p.price,
                c.name AS category_name,
                c.id AS category_id
            FROM products p
            -- 🛑 REINSERTAR EL JOIN CORREGIDO:
            LEFT JOIN categories c ON p.category_number = c.id
            WHERE p.id = $1
        `;
        const productResult = await pool.query(productSql, [productId]);

        if (productResult.rowCount === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        
        const product = productResult.rows[0];

        // 2. Consulta SQL para obtener las imágenes asociadas al producto
        const imagesSql = `
            SELECT image_url 
            FROM product_images 
            WHERE product = $1 
            ORDER BY image_url ASC
        `;
        const imagesResult = await pool.query(imagesSql, [productId]);
        
        // 3. Agregar las URLs de las imágenes como un array al objeto producto
        product.images = imagesResult.rows.map(row => row.image_url);

        // 4. Devolver el objeto producto completo
        return res.json(product);

    } catch (error) {
        console.error('Error al obtener el producto por ID:', error);
        next(error);
    }
});
module.exports = router; // Exporta el router