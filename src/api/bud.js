import express from 'express';
import authenticateToken from '../../middleware/authMiddleware';
import db from '../database.js'; 

const router = express.Router();

router.get('/budget', (req, res) => {
    db.all('SELECT * FROM Budget', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
}
);

router.post('/')