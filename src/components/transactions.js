import React, { useEffect, useState } from 'react';
import './transactions.css';
import axios from 'axios';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ transactionId: '', date: '', amount: '', description: '', user_id: '' });
  const [userId, setUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(false);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/transactions');
      setTransactions(response.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const response = await axios.put(`http://localhost:3001/api/transactions/${formData.transactionId}`, formData);
        console.log('API Response:', response.data);
        setTransactions(response.data);
      } else {
        await axios.post('http://localhost:3001/api/transactions', formData);
      }
      setFormData({ transactionId: '', date: '', amount: '', description: '', user_id: '' });
      setUserId('');
      setEditing(false);
      fetchTransactions();
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };

  // Set form data for update
  const handleEdit = (transaction) => {
    setFormData(transaction);
    setEditing(true);
  };

  // Delete transaction
  const handleDelete = async (transactionId) => {
    try {
      await axios.delete(`http://localhost:3001/api/transactions/${transactionId}`);
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  // Filter by search term
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

      {/* Search */}
      <input
        type="text"
        placeholder="Search transactions..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Form for Create & Update */}
      <form onSubmit={handleSubmit} className="transaction-form">
        <input name="date" type="date" value={formData.date} onChange={handleChange} required />
        <input name="amount" type="number" value={formData.amount} onChange={handleChange} required />
        <input name="description" type="text" value={formData.description} onChange={handleChange} required />
        <input name="user_id" type="text" value={formData.user_id} onChange={handleChange} required />
        {editing && <input name="transactionId" type="hidden" value={formData.transactionId} />}
        <button type="submit">{editing ? 'Update' : 'Create'} Transaction</button>
      </form>

      {/* Table */}
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
                  <button onClick={() => handleEdit(t)}>Edit</button>
                  <button onClick={() => handleDelete(t.transactionId)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No transactions found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
