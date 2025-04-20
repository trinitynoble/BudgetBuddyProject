import express from 'express';
import sqlite3 from 'sqlite3';
import authenticateToken from '../middleware/authMiddleware.js'; 

const router = express.Router();

const db = new sqlite3.Database('../db/database.db', (err) => { /* ... */ });

router.get('/transactions', (req, res) => {
    db.all('SELECT * FROM transactions', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

router.post('/transactions', authenticateToken, (req, res) => {
    const { date, amount, description } = req.body;
    const userId = req.user.id; 

    console.log("Received data for new transaction:", { ...req.body, userId });

    db.run(
        `INSERT INTO transactions (date, amount, description, user_id) VALUES (?, ?, ?, ?)`,
        [date, amount, description, userId],
        function (err) {
            if (err) {
                console.error(err);
                if (err.message.includes('FOREIGN KEY constraint failed')) {
                    return res.status(400).json({ error: 'Invalid user ID. User does not exist.' });
                }
                return res.status(400).json({ error: 'Database error' });
            }
            res.json({
                transactionId: this.lastID,
                date,
                amount,
                description,
                user_id: userId
            });
        }
    );
});

router.put('/transactions/:transactionId', authenticateToken, (req, res) => {
    const { transactionId } = req.params;
    const { date, amount, description, user_id } = req.body;
    const currentUserId = req.user.id; //this gets the user ID from the token
    db.get(`SELECT user_id FROM transactions WHERE transactionId = ?`, [transactionId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row || row.user_id !== currentUserId) {
            return res.status(403).json({ error: 'Unauthorized to update this transaction.' });
        }

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
});

// DELETE: Delete transaction (you'll likely want to authenticate this)
router.delete('/transactions/:transactionId', authenticateToken, (req, res) => {
    const { transactionId } = req.params;
    const currentUserId = req.user.id;

    // Optional: Check if the user deleting the transaction owns it
    db.get(`SELECT user_id FROM transactions WHERE transactionId = ?`, [transactionId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row || row.user_id !== currentUserId) {
            return res.status(403).json({ error: 'Unauthorized to delete this transaction.' });
        }

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
});

// GET: Single transaction (you might want to authenticate this)
router.get('/transactions/:transactionId', authenticateToken, (req, res) => { /* ... */ });

// GET: Search transactions (you might want to authenticate this)
router.get('/transactions/search', authenticateToken, (req, res) => { /* ... */ });

export default router;