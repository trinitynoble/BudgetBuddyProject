import express from 'express';
import authenticateToken from '../../middleware/authMiddleware.js';
import db from '../database.js';

const router = express.Router();

// ✅ Get all transactions for logged-in user
router.get('/', authenticateToken, (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const userId = req.user.id;

  db.all(
    'SELECT transactionId, amount, description, date, user_id FROM transactions WHERE user_id = ?',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

router.get('/recent/', authenticateToken, (req, res) => {
  console.log('/recent endpoint hit');
  const userId = req.user.id;
  db.get(
    `SELECT transactionId, description, amount, date
     FROM transactions
     WHERE user_id = ?
     ORDER BY transactionId DESC
     LIMIT 1`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ message: 'Transaction not found or unauthorized.' });
      res.json(row);
    }
  );
});



// ✅ Create transaction
router.post('/', authenticateToken, (req, res) => {
  const { amount, description, date } = req.body;
  const userId = req.user.id;

  db.run(
    `INSERT INTO transactions (amount, description, date, user_id) VALUES (?, ?, ?, ?)`,
    [amount, description, date, userId],
    function (err) {
      if (err) {
        console.error('Insert error:', err.message);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      db.get(
        'SELECT transactionId, amount, description, date, user_id FROM transactions WHERE transactionId = ?',
        [this.lastID],
        (getErr, row) => {
          if (getErr) {
            return res.status(500).json({ error: 'Failed to retrieve new transaction' });
          }
          res.status(201).json(row);
        }
      );
    }
  );
});

// ✅ Update transaction
router.put('/:transactionId', authenticateToken, (req, res) => {
  const { transactionId } = req.params;
  const { amount, description, date } = req.body;
  const currentUserId = req.user.id;

  db.get(
    'SELECT user_id FROM transactions WHERE transactionId = ?',
    [transactionId],
    (err, row) => {
      if (err || !row || row.user_id !== currentUserId) {
        return res.status(403).json({ error: 'Unauthorized or not found' });
      }

      db.run(
        'UPDATE transactions SET amount = ?, description = ?, date = ? WHERE transactionId = ?',
        [amount, description, date, transactionId],
        function (err) {
          if (err) return res.status(500).json({ error: 'Update failed' });

          db.get(
            'SELECT transactionId, amount, description, date, user_id FROM transactions WHERE transactionId = ?',
            [transactionId],
            (getErr, updatedRow) => {
              if (getErr) return res.status(500).json({ error: 'Could not fetch updated transaction' });
              res.json(updatedRow);
            }
          );
        }
      );
    }
  );
});

// ✅ Delete transaction
router.delete('/:transactionId', authenticateToken, (req, res) => {
  const { transactionId } = req.params;
  const currentUserId = req.user.id;

  db.get(
    'SELECT user_id FROM transactions WHERE transactionId = ?',
    [transactionId],
    (err, row) => {
      if (err || !row || row.user_id !== currentUserId) {
        return res.status(403).json({ error: 'Unauthorized or not found' });
      }

      db.run(
        'DELETE FROM transactions WHERE transactionId = ?',
        [transactionId],
        (err) => {
          if (err) return res.status(500).json({ error: 'Deletion failed' });
          res.json({ message: 'Transaction deleted successfully' });
        }
      );
    }
  );
});

// ✅ Search transactions
router.get('/search', authenticateToken, (req, res) => {
  const { query } = req.query;
  const userId = req.user.id;

  if (!query) return res.status(400).json({ error: 'Search query required' });

  const searchTerm = `%${query}%`;
  db.all(
    `SELECT transactionId, amount, description, date, user_id
     FROM transactions
     WHERE user_id = ? AND (description LIKE ? OR amount LIKE ? OR date LIKE ?)`,
    [userId, searchTerm, searchTerm, searchTerm],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Search failed' });
      res.json(rows);
    }
  );
});

// ✅ Get transaction by ID
router.get('/:transactionId', authenticateToken, (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  db.get(
    'SELECT transactionId, amount, description, date, user_id FROM transactions WHERE transactionId = ? AND user_id = ?',
    [transactionId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ message: 'Transaction not found' });
      res.json(row);
    }
  );
});

export default router;
