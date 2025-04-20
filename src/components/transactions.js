import React, { useEffect, useState } from 'react';
import './transactions.css';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode'; 

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ transactionId: '', date: '', amount: '', description: '', user_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(false);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return decodedToken.id; //this is what gets the user id from whoever is logged in, so that if they create a new transaction, it will be linked to their user id
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

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/transactions', getAuthHeader());
      setTransactions(response.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //Create but only if your session is still active
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = getUserIdFromToken();
    if (!userId) {
      alert('User not authenticated.');
      return;
    }

    try {
      const transactionData = { ...formData, user_id: userId };
      if (editing) {
        const response = await axios.put(`http://localhost:3001/api/transactions/${formData.transactionId}`, transactionData, getAuthHeader());
        console.log('API Response (Update):', response.data);
      } else {
        await axios.post('http://localhost:3001/api/transactions', transactionData, getAuthHeader());
      }
      setFormData({ transactionId: '', date: '', amount: '', description: '', user_id: '' });
      setEditing(false);
      fetchTransactions(); //fetching the updated list
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };
  //Update
  const handleEdit = (transaction) => {
    setFormData(transaction);
    setEditing(true);
  };

  //Delete
  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`http://localhost:3001/api/transactions/${transactionId}`, getAuthHeader());
        fetchTransactions();
      } catch (err) {
        console.error('Error deleting transaction:', err);
      }
    }
  };

  //Search
  const filteredTransactions = transactions.filter((t) =>
    t.transactionId?.toString().includes(searchTerm) ||
    t.date.includes(searchTerm) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.amount?.toString().includes(searchTerm) ||
    t.user_id?.toString().includes(searchTerm)
  );
  return (
    <div className="transactions-container">
      <h2 className="transactions-header">Transaction History</h2>
      <input
        type="text"
        placeholder="Search transactions..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <form onSubmit={handleSubmit} className="transaction-form">
  <div className="form-row">
    <div className="input-group">
      <label htmlFor="date">Date:</label>
      <input name="date" type="date" id="date" className='input-boxes' value={formData.date} onChange={handleChange} required />
    </div>
    <div className="input-group">
      <label htmlFor="amount">Amount:</label>
      <input name="amount" type="number" id="amount" className='input-boxes' placeholder='Amount' value={formData.amount} onChange={handleChange} required />
    </div>
    <div className="input-group">
      <label htmlFor="description">Description:</label>
      <input name="description" type="text" id="description" className='input-boxes' placeholder='Description' value={formData.description} onChange={handleChange} required />
    </div>
    {editing && <input name="transactionId" type="hidden" value={formData.transactionId} />}
  </div>
  <button type="submit" className='create-button'>{editing ? 'Update' : 'Create'} Transaction</button>
</form>
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Description</th>
            <th>User ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => (
              <tr key={t.transactionId}>
                <td>{t.transactionId}</td>
                <td>{t.date}</td>
                <td>{t.amount}</td>
                <td>{t.description}</td>
                <td>{t.user_id}</td>
                <td>
                  <button className='update-button' onClick={() => handleEdit(t)}>Edit</button>
                  <button className='delete-button'onClick={() => handleDelete(t.transactionId)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>No transactions found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;