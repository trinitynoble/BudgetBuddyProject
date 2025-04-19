import express from 'express';
import sqlite3 from 'sqlite3'; // Import sqlite3

const router = express.Router();

// Initialize SQLite database
const db = new sqlite3.Database('./db/database.db', (err) => {
    if (err) {
        console.error("Database opening error: " + err.message);
    } else {
        console.log("Successfully opened the database");
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transactionId TEXT,
            date TEXT,
            amount REAL,
            status TEXT
        )`, (err) => {
            if (err) {
                console.error("Table creation error: " + err.message);
            } else {
                console.log("Table created or already exists");
            }
        });
    }
});

router.get('/transactions', (req, res) => {
    db.all('SELECT * FROM transactions', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// POST: Create new transaction
router.post('/transactions', (req, res) => {
    const { transactionId, date, amount, status } = req.body;
    db.run(
        `INSERT INTO transactions (transactionId, date, amount, status) VALUES (?, ?, ?, ?)`,
        [transactionId, date, amount, status], // Use transactionId here
        function (err) {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Database error' });
            }
            res.json({
                id: this.lastID,
                transactionId,
                date,
                amount,
                status
            });
        }
    );
});

// PUT: Update existing transaction
router.put('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { transactionId, date, amount, status } = req.body;
    db.run(
        `UPDATE transactions SET transactionId = ?, date = ?, amount = ?, status = ? WHERE id = ?`,
        [transactionId, date, amount, status, id],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Database error' });
            }
            res.json({ message: 'Transaction updated successfully' });
        }
    );
});

router.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.run(
        `DELETE FROM transactions WHERE id = ?`,
        [id],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Database error' });
            }
            res.json({ message: 'Transaction deleted successfully' });
        }
    );
});

router.get('/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.get(
        `SELECT * FROM transactions WHERE id = ?`,
        [id],
        (err, row) => {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Database error' });
            }
            res.json(row);
        }
    );
});

router.get('/transactions/search', (req, res) => {
    const { query } = req.query;
    db.all(
        `SELECT * FROM transactions WHERE transactionId LIKE ? OR date LIKE ? OR status LIKE ?`,
        [`%${query}%`, `%${query}%`, `%${query}%`],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

export default router;
