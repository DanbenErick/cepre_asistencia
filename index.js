const express = require('express');
const app = express();
const cors = require('cors')
const port = 8004;
const bcrypt = require('bcrypt');
const pool = require('./db');
const cron = require('node-cron');
const axios = require('axios');

// Middleware para parsear JSON
app.use(express.json());

app.use(cors());

// Middleware para parsear datos en formato application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Endpoint para login
app.post('/cepre-login', async (req, res) => {
    const { usuario, password } = req.body;
    console.log(req.body)
    try {
      const [rows] = await pool.query('SELECT * FROM responsables WHERE USUARIO = ? ', [usuario]);
      console.log("rows", rows)
      await bcrypt.compare(password, rows[0].PASSWORD, (err, result) => {
        if (err) {
          console.error(err);
        } else if (result) {
            console.log('La contraseña es correcta');
            res.status(200).json({ ok: true, message: 'Login exitoso', uuid: rows[0].UUID, id: rows[0].ID });
        } else {
          res.status(400).json({ ok: false, message: 'Usuario o contraseña inválidos' });
        }
      })
  } catch (error) {
      res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Endpoint para ingreso
app.post('/cepre-ingreso', async(req, res) => {
  try {
    const { dni, responsable } = req.body;
    console.log(req.body)
    // Aquí podrías agregar lógica para registrar el ingreso
    const [result] = await pool.query('INSERT INTO asistencia_entrada (DNI, RESPONSABLE) VALUES (?,?)', [dni, responsable]);
    
    if (result.affectedRows) {
        res.status(200).json({ message: 'Ingreso registrado', result });
    } else {
        res.status(400).json({ message: 'Datos inválidos' });
    }
  }catch(error) {
    console.log(error)
    res.status(200).json({ok: false, message: 'Esta duplicado el registro'})
  }
});

// Endpoint para ingreso
app.post('/cepre-salida', async(req, res) => {
  try {
    const { dni, responsable } = req.body;
    console.log(req.body)
    // Aquí podrías agregar lógica para registrar el ingreso
    const [result] = await pool.query('INSERT INTO asistencia_salida (DNI, RESPONSABLE) VALUES (?,?)', [dni, responsable]);
    
    if (result.affectedRows) {
        res.status(200).json({ message: 'Ingreso registrado', result });
    } else {
        res.status(400).json({ message: 'Datos inválidos' });
    }
  }catch(error) {
    console.log(error)
    res.status(200).json({ok: false, message: 'Esta duplicado el registro'})
  }
});

app.get('/cepre-asistencia-entrada-hoy', async(req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM asistencia_entrada WHERE DATE(FECHA) = CURDATE()')
    if (result.affectedRows) {
        res.status(200).json({ message: 'Ingreso registrado', result });
    } else {
        res.status(400).json({ message: 'Datos inválidos' });
    }
  }catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Error en el servidor' });
  }
})
app.get('/cepre-asistencia-entrada-mes', async(req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM asistencia_entrada WHERE MONTH(FECHA) = MONTH(CURDATE()) AND YEAR(FECHA) = YEAR(CURDATE())')
    if (result.affectedRows) {
        res.status(200).json({ message: 'Ingreso registrado', result });
    } else {
        res.status(400).json({ message: 'Datos inválidos' });
    }
  }catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Error en el servidor' });
  }
})
app.get('/cepre-asistencia-entrada-total', async(req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM asistencia_entrada')
    if (result.affectedRows) {
        res.status(200).json({ message: 'Ingreso registrado', result });
    } else {
        res.status(400).json({ message: 'Datos inválidos' });
    }
  }catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Error en el servidor' });
  }
})

app.get('/cepre-obtener-docentes', async(req, res) => {
  try {
    const [result] = await pool.query('SELECT * FROM docentes')
    
    if (result.length > 0) {
        res.status(200).json({ message: 'Obtención exitosa', data: result });
    } else {
        res.status(400).json({ message: 'No hay docentes registrados' });
    }
  }catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Error en el servidor' });
  }
})


app.get('/cepre-obtener-asisntencia-estudiante', async(req, res) => {
  try {
    const [rows_estudiante] = await pool.query('SELECT * FROM estudiantes WHERE DNI = ?', [req.query.DNI])
    const [rows_entrada] = await pool.query("SELECT COUNT(*) AS ASISTENCIA FROM asistencia_entrada WHERE HORA < '08:01' AND DNI = ?", [req.query.DNI])
    const [rows_salida] = await pool.query("SELECT COUNT(*) AS ASISTENCIA FROM asistencia_entrada WHERE HORA > '08:01' AND DNI = ?", [req.query.DNI])
    console.log(rows_entrada, rows_salida)
    if (rows_entrada.length > 0 && rows_salida.length > 0 ) {
      res.status(200).json({ ok:true, message: 'Obtención exitosa', data: { NOMBRE_COMPLETO: rows_estudiante[0].NOMBRES, TEMPRANO: rows_entrada[0].ASISTENCIA, TARDE: rows_salida[0].ASISTENCIA } });
    }else {
      res.status(400).json({ ok: false, message: 'No hay asistencia registrada' });
    }
  }catch(error) {
    res.status(500).json({ ok: false, message: 'Error del servidor' })
  }
})

app.post('/cepre-solicitar-permiso', async(req, res) => {
  try {
    const { DNI, SUSTENTO } = req.body
    const [resp] = await pool.query('INSERT INTO permisos (DNI, SUSTENTO) VALUES (?, ?)', [DNI, SUSTENTO])
    if(resp.affectedRows) {
      res.status(200).json({ ok: true, message: 'Se solicito correctamente el permiso'})
    }else {
      res.status(400).json({ ok: false, message: 'No se pudo solicitar el permiso' });
    }
  }catch(error) {
    console.log(error);
    // Manejo del error de duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, message: 'El permiso ya ha sido solicitado anteriormente para este DNI.' });
    } else {
      res.status(500).json({ ok: false, message: 'Error del servidor' });
    }
  }
})

app.get('/', async(req, res) => {
  const [rows] = await pool.query('SELECT * FROM responsables WHERE ID = 111');
  res.status(200).json(rows)
  return rows
})


// Programar un cron job para hacer ping a la API
// cron.schedule('*/5 * * * *', () => {
//   axios.get('http://localhost:8004') // Reemplaza con la URL de tu API en producción si es diferente
//       .then(response => {
//           console.log('Ping exitoso:', response.status);
//       })
//       .catch(error => {
//           console.error('Error en el ping:', error);
//       });
// });

// Hacer ping a la API cada 20 segundos
const pingInterval = 20000; // 20 segundos
setInterval(() => {
    axios.get('http://localhost:8004') // Reemplaza con la URL de tu API en producción si es diferente
        .then(response => {
            console.log('Ping exitoso:', response.status);
        })
        .catch(error => {
            console.error('Error en el ping:', error);
        });
}, pingInterval);

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
