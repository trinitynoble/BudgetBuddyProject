import express from 'express';
import sqlite3 from'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import transactionRoutes from './src/api/trans.js';
import authenticateToken from './middleware/authMiddleware.js';

const PORT = 3001;
const app = express();
const db = new sqlite3.Database('./db/database.db');
const SECRET = 'p@ssw0rd'; // Use a strong secret in production

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use('/api', transactionRoutes);

// REGISTER
app.post('/api/register', async (req, res) => {
  const { user_firstname, user_lastname, user_email, user_phonenumber, user_password } = req.body;

  if (!user_firstname || !user_lastname || !user_email || !user_phonenumber || !user_password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Check if user already exists
    db.get(`SELECT * FROM users WHERE user_email = ?`, [user_email], async (err, existingUser) => {
      if (err) {
        console.error('❌ DB Lookup Error:', err.message);
        return res.status(500).json({ error: 'Database error.' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      const hash = await bcrypt.hash(user_password, 10);
      db.run(
        `INSERT INTO users (user_firstname, user_lastname, user_email, user_phonenumber, user_password) VALUES (?, ?, ?, ?, ?)`,
        [user_firstname, user_lastname, user_email, user_phonenumber, hash],
        function (err) {
          if (err) {
            console.error('❌ DB Insert Error:', err.message);
            return res.status(500).json({ error: 'Registration failed.' });
          }

          res.json({
            id: this.lastID,
            user_firstname,
            user_lastname,
            user_email,
            user_phonenumber
          });
        }
      );
    });
  } catch (err) {
    console.error('❌ Register Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
app.post('/api/login', (req, res) => {
  const { user_email, user_password } = req.body;

  if (!user_email || !user_password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  db.get(`SELECT * FROM users WHERE user_email = ?`, [user_email], async (err, user) => {
    if (err) {
      console.error('❌ DB Lookup Error:', err.message);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(user_password, user.user_password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.user_email },
      SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        user_firstname: user.user_firstname,
        user_lastname: user.user_lastname,
        user_email: user.user_email,
        user_phonenumber: user.user_phonenumber
      }
    });
  });
});

// Protected route example
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.email}!`, user: req.user });
});

app.get('/', (req, res) => {
    res.send('API is running!');
  });
  

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
