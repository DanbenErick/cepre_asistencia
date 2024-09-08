const express = require('express');
const app = express();
const cors = require('cors')
const port = 8004;
const bcrypt = require('bcrypt');
const pool = require('./db');


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


app.get('/', async(req, res) => {
  const [rows] = await pool.query('SELECT * FROM responsables');
  res.status(200).json(rows)
  return rows
})

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
