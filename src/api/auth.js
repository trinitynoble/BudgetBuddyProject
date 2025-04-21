import express from 'express';
import db from '../db/database.js'; 
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
//this checks if any of the fields are empty
  if (!user_firstname || !user_lastname || !user_email || !user_phonenumber || !user_password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {//this hashes the paswword
    const hash = await bcrypt.hash(user_password, 10);

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
  //this is what gets the specific user based off of the email address provided
    db.get(`SELECT * FROM users WHERE user_email = ?`, [user_email], async (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
  //this checks if the email address and the password match
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
  

export default router;
