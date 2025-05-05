import express from 'express';
import db from '../database.js'; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
const router = express.Router();
router.use(cors());
router.use(express.json());

const SECRET = 'p@ssw0rd'; 

// REGISTER
router.post('/register', async (req, res) => {
  const { user_firstname, user_lastname, user_email, user_phonenumber, user_password } = req.body;
//this is the registration endpoint, it takes the user input and checks if all fields are filled
  //if not, it returns an error message
  if (!user_firstname || !user_lastname || !user_email || !user_phonenumber || !user_password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const hash = await bcrypt.hash(user_password, 10);//this hashes the password using bcrypt

    db.run(
      `INSERT INTO users (user_firstname, user_lastname, user_email, user_phonenumber, user_password) VALUES (?, ?, ?, ?, ?)`,
      [user_firstname, user_lastname, user_email, user_phonenumber, hash],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(400).json({ error: 'Email already registered or DB error.' });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
router.post('/login', (req, res) => {
  const { user_email, user_password } = req.body;

  if (!user_email || !user_password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  db.get(`SELECT * FROM users WHERE user_email = ?`, [user_email], async (err, user) => {
    if (err || !user) {
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

// Error handling for missing or invalid fields
router.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});
// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { user_email, new_password } = req.body;

  if (!user_email || !new_password) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(new_password, 10);

    db.run(
      `UPDATE users SET user_password = ? WHERE user_email = ?`,
      [hashedPassword, user_email],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error during password reset.' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ message: 'Password reset successfully.' });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during password reset.' });
  }
});

export default router;
