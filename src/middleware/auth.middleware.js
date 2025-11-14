// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Obtener el token del encabezado 'Authorization'
    // El formato esperado es: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        // 🛑 No autorizado: Token faltante
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // Extraer el token después de 'Bearer '
    const token = authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'Formato de token inválido' });
    }

    try {
        // 2. Verificar el token usando la clave secreta
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        
        // 3. Adjuntar el payload decodificado (que contiene el user.id) a la petición
        req.user = decoded; 
        
        // 4. Continuar a la ruta solicitada (ej. el GET /cart)
        next(); 

    } catch (error) {
        // 🛑 No autorizado: Token expirado o inválido
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = verifyToken;