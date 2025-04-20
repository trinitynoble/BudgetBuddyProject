import express from 'express';
import db from '../db/database.js'; 
import { authenticateToken } from '../middleware/authMiddleware.js'; // Adjust path as needed

const router = express.Router();

router.get('/', authenticateToken, (req, res) => { // Keep the leading '/'
  const userId = req.user.id;
  db.all('SELECT * FROM Budget WHERE User_id = ?', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});
router.post('/', authenticateToken, (req, res) => { // Keep the leading '/'
  const { budgetAmount, budgetDescription, budgetDate } = req.body;
  const userId = req.user.id;
  db.run('INSERT INTO Budget (Budget_Amount, Budget_Description, Budget_Date, User_id) VALUES (?, ?, ?, ?)', [budgetAmount, budgetDescription, budgetDate, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.get('SELECT * FROM Budget WHERE Budget_id = ?', [this.lastID], (getError, row) => {
      res.status(201).json(row);
    });
  });
});
router.put('/:budgetId', authenticateToken, (req, res) => { // Keep the leading '/'
  const { budgetId } = req.params;
  const { budgetAmount, budgetDescription, budgetDate } = req.body;
  const userId = req.user.id;
  db.run('UPDATE Budget SET Budget_Amount = ?, Budget_Description = ?, Budget_Date = ? WHERE Budget_id = ? AND User_id = ?',
    [budgetAmount, budgetDescription, budgetDate, budgetId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes > 0) {
        db.get('SELECT * FROM Budget WHERE Budget_id = ?', [budgetId], (getError, row) => {
          res.json(row);
        });
      } else {
        res.status(404).json({ message: 'Budget item not found or unauthorized to update.' });
      }
    });
});

router.delete('/:budgetId', authenticateToken, (req, res) => { // Keep the leading '/'
  const { budgetId } = req.params;
  const userId = req.user.id;
  db.run('DELETE FROM Budget WHERE Budget_id = ? AND User_id = ?', [budgetId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes > 0) {
      res.json({ message: 'Budget item deleted successfully' });
    } else {
      res.status(404).json({ message: 'Budget item not found or unauthorized to delete.' });
    }
  });
});

export default router;