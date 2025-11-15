// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Obtener el token del encabezado Authorization
    // El formato esperado es: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // Extraer el token después de 'Bearer '
    const token = authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'Formato de token inválido' });
    }

    try {
        //  Verificar el token usando la clave secreta
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        
        //  Adjuntar el payload decodificado (que contiene el user.id) a la petición
        req.user = decoded; 
        
        // Continuar a la ruta solicitada 
        next(); 

    } catch (error) {

        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = verifyToken;