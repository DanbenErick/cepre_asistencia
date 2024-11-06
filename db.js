const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '143.110.151.82',
    // host: 'localhost',
    user: 'cepre',
    password: 'cepre-asistencia-pedro-castillo',
    database: 'cepre_asistencia',   
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        // Obtener una conexión del pool
        const connection = await pool.getConnection();
        console.log('Conexión exitosa!');

        // Liberar la conexión
        connection.release();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
}

// Ejecutar la función de prueba
testConnection();

module.exports = pool;
