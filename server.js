require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Configura Express
const app = express();
const port = process.env.PORT || 3000;

// Conecta a SQLite (crea el archivo si no existe)
const db = new sqlite3.Database('./stress_responses.db', (err) => {
  if (err) console.error('Error al conectar a SQLite:', err);
  else console.log('Conectado a SQLite');
});

// Crea la tabla (se ejecuta solo una vez al iniciar)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age INTEGER,
      gender TEXT,
      academic_load INTEGER,
      symptoms TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ruta para guardar respuestas
app.post('/api/save-response', (req, res) => {
  const { age, gender, academic_load, symptoms } = req.body;
  
  db.run(
    `INSERT INTO responses (age, gender, academic_load, symptoms) 
     VALUES (?, ?, ?, ?)`,
    [age, gender, academic_load, JSON.stringify(symptoms)],
    function(err) {
      if (err) {
        console.error('Error al guardar:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }
      res.json({ 
        success: true,
        id: this.lastID 
      });
    }
  );
});

// Ruta para obtener todas las respuestas (opcional)
app.get('/api/responses', (req, res) => {
  db.all("SELECT * FROM responses ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error('Error al leer:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
    res.json(rows);
  });
});

// Ruta principal (sirve el frontend)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Cierra la conexión al cerrar el servidor
process.on('SIGINT', () => {
  db.close();
  process.exit();
});