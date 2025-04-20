import express from 'express';
import sqlite3 from 'sqlite3';

const router = express.Router();

// Initialize SQLite database
const db = new sqlite3.Database('./db/database.db', (err) => {
    if (err) {
        console.error("Database opening error: " + err.message);
    } else {
        console.log("Successfully opened the database");
        db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
                transactionId INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                amount REAL,
                description TEXT,
                user_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        `, (err) => {
            if (err) {
                console.error("Table creation error: " + err.message);
            } else {
                console.log("Table created or already exists");
            }
        });
    }
});

// GET: All transactions
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
    const { date, amount, description, user_id } = req.body;
    console.log("Received data:", req.body);
    db.run(
        `INSERT INTO transactions (date, amount, description, user_id) VALUES (?, ?, ?, ?)`,
        [date, amount, description, user_id],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Database error' });
            }
            res.json({
                transactionId: this.lastID,
                date,
                amount,
                description,
                user_id
            });
        }
    );
});

// PUT: Update transaction
router.put('/transactions/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const { date, amount, description, user_id } = req.body;
    db.run(
        `UPDATE transactions SET date = ?, amount = ?, description = ?, user_id = ? WHERE transactionId = ?`,
        [date, amount, description, user_id, transactionId],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Database error' });
            }
            res.json({ message: 'Transaction updated successfully' });
        }
    );
});

// DELETE: Delete transaction
router.delete('/transactions/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    db.run(
        `DELETE FROM transactions WHERE transactionId = ?`,
        [transactionId],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Database error' });
            }
            res.json({ message: 'Transaction deleted successfully' });
        }
    );
});

// GET: Single transaction
router.get('/transactions/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    db.get(
        `SELECT * FROM transactions WHERE transactionId = ?`,
        [transactionId],
        (err, row) => {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Database error' });
            }
            res.json(row);
        }
    );
});

// GET: Search transactions
router.get('/transactions/search', (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Missing search query' });

    db.all(
        `SELECT * FROM transactions WHERE 
         transactionId LIKE ? OR 
         date LIKE ? OR 
         description LIKE ? OR 
         user_id LIKE ?`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`],
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
