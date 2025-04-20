import React, { useEffect, useState } from 'react';
import './budget.css'; 
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Budget = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [formData, setFormData] = useState({
    budgetId: '',
    budgetAmount: '',
    budgetDescription: '',
    budgetDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(false);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return decodedToken.id;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchBudgetItems = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/budget', getAuthHeader());
      setBudgetItems(response.data);
    } catch (err) {
      console.error('Failed to fetch budget items:', err);
    }
  };

  useEffect(() => {
    fetchBudgetItems();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = getUserIdFromToken();
    if (!userId) {
      alert('User not authenticated.');
      return;
    }

    try {
      const budgetData = { ...formData, userId: userId };
      if (editing) {
        await axios.put(`http://localhost:3001/api/budget/${formData.budgetId}`, budgetData, getAuthHeader());
      } else {
        await axios.post('http://localhost:3001/api/budget', budgetData, getAuthHeader());
      }
      setFormData({ budgetId: '', budgetAmount: '', budgetDescription: '', budgetDate: '' });
      setEditing(false);
      fetchBudgetItems();
    } catch (err) {
      console.error('Error saving budget item:', err);
    }
  };

  const handleEdit = (budget) => {
    setFormData({
      budgetId: budget.Budget_id,
      budgetAmount: budget.Budget_Amount,
      budgetDescription: budget.Budget_Description,
      budgetDate: budget.Budget_Date,
    });
    setEditing(true);
  };

  const handleDelete = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget item?')) {
      try {
        await axios.delete(`http://localhost:3001/api/budget/${budgetId}`, getAuthHeader());
        fetchBudgetItems();
      } catch (err) {
        console.error('Error deleting budget item:', err);
      }
    }
  };

  const filteredBudgetItems = budgetItems.filter((item) =>
    item.Budget_Amount?.toString().includes(searchTerm) ||
    item.Budget_Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Budget_Date?.includes(searchTerm)
  );

  return (
    <div className="budget-container">
      <h2 className="budget-header">Budget</h2>
      <input
        type="text"
        placeholder="Search budget items..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <form onSubmit={handleSubmit} className="budget-form">
        <div className="form-row">
          <div className="input-group">
            <label htmlFor="budgetAmount">Amount:</label>
            <input
              type="number"
              id="budgetAmount"
              name="budgetAmount"
              className="input-boxes"
              placeholder="Amount"
              value={formData.budgetAmount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="budgetDescription">Description:</label>
            <input
              type="text"
              id="budgetDescription"
              name="budgetDescription"
              className="input-boxes"
              placeholder="Description"
              value={formData.budgetDescription}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="budgetDate">Date:</label>
            <input
              type="date"
              id="budgetDate"
              name="budgetDate"
              className="input-boxes"
              value={formData.budgetDate}
              onChange={handleChange}
              required
            />
          </div>
          {editing && <input type="hidden" name="budgetId" value={formData.budgetId} />}
        </div>
        <button type="submit" className="create-button">
          {editing ? 'Update' : 'Add'} Budget Item
        </button>
      </form>

      <table className="budget-table">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Description</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBudgetItems.length > 0 ? (
            filteredBudgetItems.map((item) => (
              <tr key={item.Budget_id}>
                <td>{item.Budget_Amount}</td>
                <td>{item.Budget_Description}</td>
                <td>{item.Budget_Date}</td>
                <td>
                  <button className="update-button" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(item.Budget_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>
                No budget items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Budget;