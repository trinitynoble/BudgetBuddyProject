import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import transactionRoutes from './api/trans.js';
import budgetRoutes from './api/bud.js';
import authenticateToken from '../middleware/authMiddleware.js';
import db from './database.js';

const PORT = 3001;
const app = express();
const SECRET = 'p@ssw0rd'; 

// this is the cors middleware, it allows the frontend to access the backend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());


app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/budget', authenticateToken, budgetRoutes);

// this gets the first name of the user logged in
app.get('/api/user', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.get('SELECT user_firstname FROM users WHERE user_id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ username: row.user_firstname });
  });
});

// this is the registration endpoint, it takes the user input and checks if all fields are filled
app.post('/api/register', async (req, res) => {
  const { user_firstname, user_lastname, user_email, user_phonenumber, user_password } = req.body;
  if (!user_firstname || !user_lastname || !user_email || !user_phonenumber || !user_password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.get('SELECT * FROM users WHERE user_email = ?', [user_email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (user) return res.status(400).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(user_password, 10);
    db.run(
      `INSERT INTO users (user_firstname, user_lastname, user_email, user_phonenumber, user_password)
       VALUES (?, ?, ?, ?, ?)`,
      [user_firstname, user_lastname, user_email, user_phonenumber, hash],
      function (err) {
        if (err) return res.status(500).json({ error: 'Registration failed' });
        res.json({
          id: this.lastID,
          user_firstname,
          user_lastname,
          user_email,
          user_phonenumber,
        });
      }
    );
  });
});

// login endpoint
// this checks if the email and password are correct
app.post('/api/login', (req, res) => {
  const { user_email, user_password } = req.body;
  if (!user_email || !user_password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE user_email = ?', [user_email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(user_password, user.user_password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.user_id, email: user.user_email }, SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        id: user.user_id,
        user_firstname: user.user_firstname,
        user_lastname: user.user_lastname,
        user_email: user.user_email,
        user_phonenumber: user.user_phonenumber,
      },
    });
  });
});
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  db.get('SELECT user_id FROM users WHERE user_email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'No user found with that email' });

    // Simulate sending email (no actual email service)
    console.log(`Password reset link would be emailed to ${email} (User ID: ${user.user_id})`);
    res.json({ message: 'Password reset instructions sent (mock).' });
  });
});


// this is the profile endpoint, it checks if the user is authenticated and returns the user data
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.email}!`, user: req.user });
});
app.get('/', (req, res) => res.send('API is running!'));
app.get('/api/test', (req, res) => res.status(200).json({ message: 'Server is working' }));

// errir handling middleware
process.on('uncaughtException', (err) => console.error('Unhandled exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
