// routes/cart.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection'); 
const verifyToken = require('../middleware/auth.middleware');

// ----------------------------------------------------
// A. OBTENER CARRITO (GET /cart)
// ----------------------------------------------------
router.get('/cart', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const sql =`
           SELECT 
    c.product_id, 
    c.quantity, 
    p.title, 
    p.price,
    (
        SELECT pi.image_url
        FROM product_images pi
        WHERE pi.product = c.product_id  
        ORDER BY pi.is_main DESC, pi.image_url ASC 
        LIMIT 1
    ) AS image_url,
    (c.quantity * p.price) AS subtotal
FROM cart c
JOIN products p ON c.product_id = p.id
WHERE c.user_id = $1
        `;
        const result = await pool.query(sql, [userId]);
        
        // Calcular el total general del carrito
        const total = result.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

        return res.json({
            cartItems: result.rows,
            total: total
        });
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ error: 'Fallo al obtener el carrito' });
    }
});


// ----------------------------------------------------
// B. AÑADIR AL CARRITO (POST /cart)
// ----------------------------------------------------
router.post('/cart', verifyToken, async (req, res) => {
    const userId = req.user.id; 
    const { productId, quantity } = req.body; 

    try {
        // Verificar si ya existe (usa el constraint UNIQUE de la tabla)
        const updateSql = `
            INSERT INTO cart (user_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, product_id) 
            DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
            RETURNING *
        `;
        
        const result = await pool.query(updateSql, [userId, productId, quantity]);
        
        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error al añadir/actualizar carrito:', error);
        res.status(500).json({ error: 'Fallo al procesar el carrito' });
    }
});


// ----------------------------------------------------
// C. ACTUALIZAR CANTIDAD O ELIMINAR (PUT /cart)
// ----------------------------------------------------
router.put('/cart/:productId', verifyToken, async (req, res) => {
    const userId = req.user.id; 
    // 🛑 CORRECCIÓN 1: Obtener productId de la URL (req.params)
        const productId = req.params.productId; 
    
    // 🛑 CORRECCIÓN 2: Obtener quantity del cuerpo (req.body)
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un número positivo o cero para eliminar.' });
    }

    try {
        if (quantity === 0) {
            // ELIMINAR el artículo si la cantidad es 0
            const deleteSql = `DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING *`;
            const result = await pool.query(deleteSql, [userId, productId]);

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Artículo no encontrado en el carrito.' });
            }
            
            return res.json({ message: 'Artículo eliminado correctamente.' });
            
        } else {
            // ACTUALIZAR la cantidad
            const updateSql = `UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *`;
            const result = await pool.query(updateSql, [quantity, userId, productId]);

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Artículo no encontrado para actualizar.' });
            }
            
            return res.json(result.rows[0]);
        }

    } catch (error) {
        console.error('Error al actualizar/eliminar carrito:', error);
        res.status(500).json({ error: 'Fallo al procesar la actualización del carrito' });
    }
});
/* **************************  */

router.delete('/cart/:productId', verifyToken, async (req, res) => {
    const userId = req.user.id;
    // 🛑 Obtener el ID del producto desde la URL (req.params)
    const productId = req.params.productId; 

    try {
        const deleteSql = `DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING *`;
        const result = await pool.query(deleteSql, [userId, productId]);

        if (result.rowCount === 0) {
            // Esto ocurre si el producto no está en el carrito del usuario
            return res.status(404).json({ message: 'Artículo no encontrado en el carrito.' });
        }

        return res.json({ message: 'Artículo eliminado correctamente.' });

    } catch (error) {
        console.error('Error al eliminar artículo del carrito:', error);
        res.status(500).json({ error: 'Fallo al eliminar artículo del carrito' });
    }
});

module.exports = router;