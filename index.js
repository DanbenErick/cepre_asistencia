const express = require('express');
const ExcelJS = require('exceljs');
const app = express();
const cors = require('cors')
const port = 8007;
const bcrypt = require('bcrypt');
const pool = require('./db');
const cron = require('node-cron');
const axios = require('axios');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Middleware para parsear JSON
app.use(express.json());

app.use(cors());

// Middleware para parsear datos en formato application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Configurar morgan para que muestre las solicitudes en consola
app.use(morgan('dev'));

// Crear un stream de escritura para guardar los logs en un archivo
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// Configurar morgan para que también guarde los logs en un archivo
app.use(morgan('combined', { stream: accessLogStream }));

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
    const [result] = await pool.query('SELECT * FROM asistencia_entrada WHERE DATE(FECHA) = CURDATE()')
    if (result.length > 0) {

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Asistencia de Hoy');

      // Añadir encabezados
      worksheet.columns = [
        { header: 'DNI', key: 'DNI', width: 15 },
        { header: 'FECHA', key: 'FECHA', width: 30 },
        { header: 'HORA', key: 'HORA', width: 30 },
        // Añade más columnas según las columnas de tu tabla
      ];

      // Añadir filas
      result.forEach((row) => {
        worksheet.addRow(row);
      });

      // Establecer tipo de contenido y encabezados para descarga
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=asistencia_entrada_hoy.xlsx'
      );

      // Enviar el archivo Excel al cliente
      await workbook.xlsx.write(res);
      res.end();

        // res.status(200).json({ message: 'Ingreso registrado', result });
    } else {
        res.status(400).json({ message: 'Datos inválidos' });
    }
  }catch(e) {
    console.error(e);
    res.status(500).json({ message: 'Error en el servidor', error: e });
  }
})

app.get('/cepre-asistencia-entrada-mes', async(req, res) => {
  try {
    const [result] = await pool.query('SELECT * FROM asistencia_entrada WHERE MONTH(FECHA) = MONTH(CURDATE()) AND YEAR(FECHA) = YEAR(CURDATE())')
    if (result.length > 0) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Asistencia de Hoy');

      // Añadir encabezados
      worksheet.columns = [
        { header: 'DNI', key: 'DNI', width: 15 },
        { header: 'FECHA', key: 'FECHA', width: 30 },
        { header: 'HORA', key: 'HORA', width: 30 },
        // Añade más columnas según las columnas de tu tabla
      ];

      // Añadir filas
      result.forEach((row) => {
        worksheet.addRow(row);
      });

      // Establecer tipo de contenido y encabezados para descarga
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=asistencia_entrada_mes.xlsx'
      );

      // Enviar el archivo Excel al cliente
      await workbook.xlsx.write(res);
      res.end();
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
    const [result] = await pool.query('SELECT * FROM asistencia_entrada')
    if (result.length > 0) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Asistencia de Hoy');

      // Añadir encabezados
      worksheet.columns = [
        { header: 'DNI', key: 'DNI', width: 15 },
        { header: 'FECHA', key: 'FECHA', width: 30 },
        { header: 'HORA', key: 'HORA', width: 30 },
        // Añade más columnas según las columnas de tu tabla
      ];

      // Añadir filas
      result.forEach((row) => {
        worksheet.addRow(row);
      });

      // Establecer tipo de contenido y encabezados para descarga
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=asistencia_entrada_total.xlsx'
      );

      // Enviar el archivo Excel al cliente
      await workbook.xlsx.write(res);
      res.end();
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
    const [rows_entrada] = await pool.query("SELECT COUNT(*) AS ASISTENCIA FROM asistencia_entrada WHERE HORA < '08:01' AND ASISTIO = 1 AND DNI = ?", [req.query.DNI])
    const [rows_salida] = await pool.query("SELECT COUNT(*) AS ASISTENCIA FROM asistencia_entrada WHERE HORA > '08:01' AND ASISTIO = 1 AND DNI = ?", [req.query.DNI])
    const [rows_faltas] = await pool.query("SELECT COUNT(*) AS FALTAS FROM asistencia_entrada WHERE ASISTIO = 0 AND DNI = ?", [req.query.DNI])
    console.log("RESPUESTAS", rows_entrada, rows_salida)
    if (rows_entrada.length > 0 && rows_salida.length > 0 ) {
      res.status(200).json({ ok:true, message: 'Obtención exitosa', data: { 
          NOMBRE_COMPLETO: rows_estudiante[0].NOMBRES, 
          TEMPRANO: rows_entrada[0].ASISTENCIA, 
          TARDE: rows_salida[0].ASISTENCIA,
          FALTAS: rows_faltas[0].FALTAS,
        } 
      });
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

app.get('/cepre-consultar-permiso', async(req, res) => {
  try {
    const [resp] = await pool.query('SELECT permisos.*, estudiantes.NOMBRES AS NOMBRE_COMPLETO FROM permisos LEFT JOIN estudiantes ON estudiantes.DNI = permisos.DNI  WHERE permisos.DNI = ?', [req.query.DNI])
    if(resp.length > 0) {
      res.status(200).json({ ok: true, message: 'Consulta exitosa', result: resp });
    }else {
      res.status(200).json({ ok: false, message: 'No se encontro permiso' });
    }
  }catch(error) {
    console.log(error);
    res.status(500).json({ ok: false, message: 'Error del servidor' });
  }
})

app.get('/cepre-marcar-faltas', async(req, res) => {
  try {
     // Seleccionar todos los estudiantes registrados para el día dado
    const [asistencias] = await pool.query('SELECT DNI FROM asistencia_entrada WHERE DATE(FECHA) = CURDATE()');

    // Seleccionar todos los IDs de los estudiantes que ya asistieron
    const idsAsistieron = asistencias.map(row => row.DNI);

     // Seleccionar todos los IDs de los estudiantes
    const [todosEstudiantes] = await pool.query('SELECT DNI FROM estudiantes');

     // Filtrar los estudiantes que faltaron
    const idsFaltantes = todosEstudiantes.filter(row => !idsAsistieron.includes(row.DNI)).map(row => row.DNI);

    if (idsFaltantes.length > 0) {
      const values = idsFaltantes.map(id => [id, 'Responsable', 0]); // Cambia 'Responsable' si es necesario
      // Ejecutar el INSERT para todos los estudiantes faltantes
      await pool.query('INSERT INTO asistencia_entrada (DNI, RESPONSABLE, ASISTIO) VALUES ?', [values]);

      res.status(200).json({ message: 'Asistencias actualizadas', faltantes: idsFaltantes });
    } else {
        res.status(200).json({ message: 'No hay estudiantes faltantes para actualizar' });
    }

  }catch(error) {
    console.log(error);
    res.status(500).json({ ok: false, message: 'Error del servidor' });
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
    axios.get('http://localhost:8007') // Reemplaza con la URL de tu API en producción si es diferente
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
