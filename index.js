const express = require('express');
const app = express();
const cors = require('cors')
const port = 8004;
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
      const [rows] = await pool.query('SELECT * FROM responsables WHERE USUARIO = ? AND PASSWORD = ?', [usuario, password]);
      console.log(rows)
      if (rows.length > 0) {
          res.status(200).json({ message: 'Login exitoso', uuid: rows[0].UUID, id: rows[0].ID });
      } else {
          res.status(400).json({ message: 'Usuario o contraseña inválidos' });
      }
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



app.get('/', async(req, res) => {
  const [rows] = await pool.query('SELECT * FROM responsables');
  res.status(200).json(rows)
  return rows
})

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
