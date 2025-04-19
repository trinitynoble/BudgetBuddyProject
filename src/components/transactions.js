import React, { useEffect, useState } from 'react';
import './transactions.css';
import axios from 'axios';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ date: '', amount: '', status: '', transactionId: '', id: '' });
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
        await axios.put(`http://localhost:3001/api/transactions/${formData.id}`, formData);
      } else {
        await axios.post('http://localhost:3001/api/transactions', formData);
      }
      setFormData({ date: '', amount: '', status: '', transactionId: '', id: '' });
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
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  // Filter by search term
  const filteredTransactions = transactions.filter((t) =>
    t.transactionId?.toString().includes(searchTerm) ||
    t.date.includes(searchTerm) ||
    t.status.toLowerCase().includes(searchTerm.toLowerCase())
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
        <input name="status" type="text" value={formData.status} onChange={handleChange} required />
        <input name="transactionId" type="text" value={formData.transactionId} onChange={handleChange} required />
        {editing && <input name="id" type="hidden" value={formData.id} />}
        <button type="submit">{editing ? 'Update' : 'Create'} Transaction</button>
      </form>

      {/* Table */}
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Transaction ID</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.transactionId}</td>
                <td>{t.amount}</td>
                <td>{t.status}</td>
                <td>
                  <button onClick={() => handleEdit(t)}>Edit</button>
                  <button onClick={() => handleDelete(t.id)}>Delete</button>
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
