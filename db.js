const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '172.16.10.100',
    user: 'cepre',
    password: 'cepre-asistencia-pedro-castillo',
    database: 'cepre_asistencia',   
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
