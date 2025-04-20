import express from 'express';
import authenticateToken from '../../middleware/authMiddleware.js'; // Import your middleware
import db from '../database.js';

const router = express.Router();

// GET: All transactions (remains the same)
router.get('/', authenticateToken, (req, res) => { // Applied authenticateToken here
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const userId = req.user.id; // Get user ID from the authenticated token
  db.all('SELECT transactionId, amount, description, date, user_id FROM transactions WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// POST: Create new transaction - Apply the authenticateToken middleware
// filepath: /Users/trinitynoble/Documents/BudgetBuddyProject/src/api/trans.js
router.post('/', authenticateToken, (req, res) => {
  const { amount, description, date } = req.body;
  const userId = req.user.id;
  console.log("Received data for new transaction:", { ...req.body, userId });

  db.run(
    `INSERT INTO transactions (amount, description, date, user_id) VALUES (?, ?, ?, ?)`,
    [amount, description, date, userId],
    function (err) {
      if (err) {
        console.error('Database insertion error:', err);
        if (err.message.includes('FOREIGN KEY constraint failed')) {
          return res.status(400).json({ error: 'Invalid user ID. User does not exist.' });
        }
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      db.get('SELECT transactionId, amount, description, date, user_id FROM transactions WHERE transactionId = ?', [this.lastID], (getError, row) => {
        if (getError) {
          console.error('Database retrieval error:', getError);
          return res.status(500).json({ error: 'Failed to retrieve the newly created transaction', details: getError.message });
        }
        console.log('New transaction created:', row);
        res.status(201).json(row);
      });
    }
  );
});

// PUT: Update transaction
router.put('/:transactionId', authenticateToken, (req, res) => { // Path with transactionId
  const { transactionId } = req.params;
  const { amount, description, date } = req.body;
  const currentUserId = req.user.id;
  db.get(`SELECT user_id FROM transactions WHERE transactionId = ?`, [transactionId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row || row.user_id !== currentUserId) {
      return res.status(403).json({ error: 'Unauthorized to update this transaction.' });
    }
    db.run(
      `UPDATE transactions SET amount = ?, description = ?,date = ? WHERE transactionId = ?`,
      [amount, description, date, transactionId],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }
        db.get('SELECT transactionId, amount, description, date, user_id FROM transactions WHERE transactionId = ?', [transactionId], (getError, updatedRow) => {
          if (getError) {
            console.error(getError);
            return res.status(500).json({ error: 'Failed to retrieve the updated transaction.' });
          }
          res.json(updatedRow);
        });
      }
    );
  });
});

// DELETE: Delete transaction
router.delete('/:transactionId', authenticateToken, (req, res) => { // Path with transactionId
  // ... (Your delete route code - likely no changes needed) ...
  const { transactionId } = req.params;
  const currentUserId = req.user.id;
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
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Transaction deleted successfully' });
      }
    );
  });
});

// GET: Single transaction
router.get('/:transactionId', authenticateToken, (req, res) => { // Path with transactionId
  // ... (Your get single transaction route code - likely no changes needed) ...
  const { transactionId } = req.params;
  const userId = req.user.id;
  db.get('SELECT transactionId, amount, description, date, user_id FROM transactions WHERE transactionId = ? AND user_id = ?', [transactionId, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized.' });
    }
    res.json(row);
  });
});

// GET: Search transactions
router.get('/search', authenticateToken, (req, res) => { // Path /search within /api/transactions
  // ... (Your search route code - likely no changes needed) ...
  const { query } = req.query;
  const userId = req.user.id;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }
  const searchTerm = `%${query}%`;
  db.all(
    `SELECT transactionId,amount, description, date, user_id FROM transactions WHERE user_id = ? AND (date LIKE ? OR description LIKE ? OR amount LIKE ?)`,
    [userId, searchTerm, searchTerm, searchTerm],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error during search.' });
      }
      res.json(rows);
    }
  );
});

export default router;