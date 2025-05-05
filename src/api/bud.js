import express from 'express';
import authenticateToken from '../../middleware/authMiddleware.js';
import db from '../database.js'; 

const router = express.Router();

// Utility function for conditional logging
const logError = (message, ...args) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(message, ...args);
  }
};

//this is what gets the token to ensure that the user is logged in
router.get('/', authenticateToken, (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const userId = req.user.id;
  db.all('SELECT budgetId, budget_amount, budget_description, user_id FROM Budget WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});
  
router.post('/', authenticateToken, (req, res) => {
  const { budget_amount, budget_description } = req.body;
  const userId = req.user.id;

  console.log("Creating budget for:", { budget_amount, budget_description, userId });

  // make sure user exists using correct table name: Users
  db.get('SELECT user_id FROM Users WHERE user_id = ?', [userId], (userErr, userRow) => {
    if (userErr) {
      console.error('User check error:', userErr);
      return res.status(500).json({ error: 'Database error while checking user.' });
    }
    if (!userRow) {
      console.warn(`User with ID ${userId} not found`);
      return res.status(400).json({ error: 'Invalid user ID. User does not exist.' });
    }

    // insert the budget only if user exists
    db.run(
      `INSERT INTO Budget (budget_amount, budget_description, user_id) VALUES (?, ?, ?)`,
      [budget_amount, budget_description, userId],
      function (err) {
        if (err) {
          console.error('Insert error:', err.message);
          return res.status(500).json({ error: 'Database error', details: err.message });
        }

        db.get(
          'SELECT budgetId, budget_amount, budget_description, user_id FROM Budget WHERE budgetId = ?',
          [this.lastID],
          (getErr, row) => {
            if (getErr) {
              return res.status(500).json({ error: 'Failed to retrieve new budget' });
            }
            res.status(201).json(row);
          }
        );
      }
    );
  });
});


router.put('/:budgetId', authenticateToken, (req, res) => {
  const { budgetId } = req.params;
  const { budget_amount, budget_description } = req.body;
  const currentUserId = req.user.id;

  console.log('budgetId:', budgetId);
  console.log('budget_amount:', budget_amount);
  console.log('budget_description:', budget_description);
  console.log('currentUserId:', currentUserId);

  db.get(`SELECT user_id FROM Budget WHERE budgetId = ?`, [budgetId], (err, row) => {
    if (err) {
      logError('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row || row.user_id !== currentUserId) {
      return res.status(403).json({ error: 'Unauthorized to update this budget.' });
    }
    db.run(
      `UPDATE Budget SET budget_amount = ?, budget_description = ? WHERE budgetId = ?`,
      [budget_amount, budget_description, budgetId],
      function (err) {
        if (err) {
          logError('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        db.get('SELECT budgetId, budget_amount, budget_description,  user_id FROM Budget WHERE budgetId = ?', [budgetId], (getError, updatedRow) => {
          if (getError) {
            logError('Failed to retrieve the updated budget:', getError);
            return res.status(500).json({ error: 'Failed to retrieve the updated budget.' });
          }
          console.log('Updated budget:', updatedRow);
          res.json(updatedRow);
        });
      }
    );
  });
});

router.delete('/:budgetId', authenticateToken, (req, res) => { 
  const { budgetId } = req.params;
  const currentUserId = req.user.id;
  db.get(`SELECT user_id FROM Budget WHERE budgetId = ?`, [budgetId], (err, row) => {
    if (err) {
      logError('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row || row.user_id !== currentUserId) {//this makes it so that you cant delete someone elses budget
      return res.status(403).json({ error: 'Unauthorized to delete this budget.' });
    }
    db.run(
      `DELETE FROM Budget WHERE budgetId = ?`,
      [budgetId],
      function (err) {
        if (err) {
          logError('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Budget deleted successfully' });
      }
    );
  });
});

//this is the search
router.get('/:budgetId', authenticateToken, (req, res) => { 
  const { budgetId } = req.params;
  const userId = req.user.id;
  db.get('SELECT budgetId, budget_amount, budget_description, user_id FROM Budget WHERE budgetId = ? AND user_id = ?', [budgetId, userId], (err, row) => {
    if (err) {
      logError('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Budget not found or unauthorized.' });
    }
    res.json(row);
  });
});

router.get('/search', authenticateToken, (req, res) => { 
  const { query } = req.query;
  const userId = req.user.id;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }
  const searchTerm = `%${query}%`;
  db.all(
    `SELECT budgetId , budget_amount, budget_description, user_id FROM Budget WHERE user_id = ? AND (budget_description LIKE ? OR budget_amount LIKE ?)`,
    [userId, searchTerm, searchTerm],
    (err, rows) => {
      if (err) {
        logError('Database error during search:', err);
        return res.status(500).json({ error: 'Database error during search.' });
      }
      res.json(rows);
    }
  );
});

export default router;