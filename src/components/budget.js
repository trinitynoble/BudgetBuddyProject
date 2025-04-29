import React, { useEffect, useState, useCallback } from 'react';
import './budget.css'; 
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
//the state variables for budget
const BudgetHistory = () => {
  const [Budget, setBudget] = useState([]);
  const [formData, setFormData] = useState({ budgetId: '', budget_amount: '', budget_description: '', user_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(false);
//gettinf the user token
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
//this fetches the budget from the database
  const fetchBudget = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/budget', getAuthHeader());
      setBudget(response.data);
      console.log('Fetched Budget Data:', response.data); // Log fetched data
    } catch (err) {
      console.error('Failed to fetch budget:', err);
    }
  }, []);
//this is the useEffect that runs when the component mounts
  useEffect(() => {
    console.log('Fetching budget on mount...');
    const token = localStorage.getItem('token');
    console.log('Token on mount:', token);
    fetchBudget();
  }, [fetchBudget]);
//this is the update
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
//submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = getUserIdFromToken();
    if (!userId) {
      alert('User not authenticated.');
      return;
    }

    try {
      const budgetData = { ...formData, user_id: userId };
      let response;
      //this is the edit, it updates the budget based on user input, it uses axios to send the data to the db through the api
      if (editing) {
        response = await axios.put(`http://localhost:3001/api/budget/${formData.budgetId}`, budgetData, getAuthHeader());
        console.log('API Response (Update):', response.data);
        setBudget(prevBudget =>
          prevBudget.map(budget =>
            budget.budgetId === response.data.budgetId ? response.data : budget
          )
        );
      } else {
        await axios.post('http://localhost:3001/api/budget/', budgetData, getAuthHeader());
      }
      setFormData({ budgetId: '',  budget_amount: '', budget_description: '', user_id: '' });
      setEditing(false);
      fetchBudget(); //refetch all budget after creating/updating
    } catch (err) {
      console.error('Error saving budget:', err);
    }
  };

  const handleEdit = (budget) => {
    console.log('Editing budget:', budget);
    setFormData(budget);
    setEditing(true);
  };

  const handleDelete = async (budgetId) => {
    const confirmed = window.confirm('Are you sure you want to delete this budget?');
    if (!confirmed) return;
    try {
      console.log('Deleting budget with ID:', budgetId);
      await axios.delete(`http://localhost:3001/api/budget/${budgetId}`, getAuthHeader());
      fetchBudget();
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };
//this is the search
    const filteredBudget = Budget.filter((b) =>
    b.budgetId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.budget_amount?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.budget_description?.toLowerCase()?.includes(searchTerm.toLowerCase()) || '') ||
    b.user_id?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="b-container">
      <h2 className="b-header">Budget History</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search budgets..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

<form onSubmit={handleSubmit} className="b-form">
  <div className="form-row">
    <div className="input-group">
      <label htmlFor="budget_amount">Amount:</label>
      <input name="budget_amount" type="number" id="budget_amount" className='input-boxes' placeholder='Amount' value={formData.budget_amount} onChange={handleChange} required />
    </div>
    <div className="input-group">
      <label htmlFor="budget_description">Description:</label>
      <input name="budget_description" type="text" id="budget_description" className='input-boxes' placeholder='Description' value={formData.budget_description} onChange={handleChange} required />
    </div>
    {editing && <input name="budgetId" type="hidden" value={formData.budgetId} />}
  </div>
  <button type="submit" className='create-button'>{editing ? 'Update' : 'Create'} Budget</button>
</form>

      {/* Table */}
      <table className="b-table">
        <thead>
          <tr>
            <th>Budget ID</th>
            <th>Amount</th>
            <th>Description</th>
            <th>User ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBudget.length > 0 ? (
            filteredBudget.map((b) => (
              <tr key={b.budgetId}>
                <td>{b.budgetId}</td>
                <td>{b.budget_amount}</td>
                <td>{b.budget_description}</td>
                <td>{b.user_id}</td>
                <td>
                  <button className='update-button' onClick={() => handleEdit(b)}>Edit</button>
                  <button className='delete-button' onClick={() => handleDelete(b.budgetId)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>No budgets found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BudgetHistory;