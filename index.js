const express = require('express');
const pool = require('./db');

const app = express();

// MIDDLEWARE
app.use(express.json());

// logging middleware
app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

// ENDPOINTS

// GET semua 
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET task by id
app.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST task
app.post('/tasks', async (req, res) => {
  try {
    let { title, description } = req.body;

    // validasi
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title tidak boleh kosong' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT update
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { title, description, is_completed } = req.body;

    const check = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    const existing = check.rows[0];

    // validasi kalau dikirim
    if (title !== undefined && title.trim() === '') {
      return res.status(400).json({ message: 'Title tidak boleh kosong' });
    }

    // pakai data lama kalau tidak dikirim
    title = title !== undefined ? title : existing.title;
    description = description !== undefined ? description : existing.description;
    is_completed = is_completed !== undefined ? is_completed : existing.is_completed;

    const result = await pool.query(
      'UPDATE tasks SET title=$1, description=$2, is_completed=$3 WHERE id=$4 RETURNING *',
      [title, description, is_completed, id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const check = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Task tidak ditemukan' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    res.json({ message: 'Task berhasil dihapus' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// SERVER
app.listen(3000, () => {
  console.log('Server jalan di port 3000');
});
