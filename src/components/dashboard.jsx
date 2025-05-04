import React, { useEffect, useState } from 'react';
import './dashboard.css';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    method: 'GET',
    mode: 'cors',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const [recentTransaction, setRecentTransaction] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found. Redirecting or showing error...');
          // Optional: redirect to login page
          return;
        }

        console.log('Token:', token);

        const userRes = await fetch('http://localhost:3001/api/user', getAuthHeader());
        const userData = await userRes.json();
        console.log('User:', userData);
        setUsername(userData.username);

        const txRes = await fetch('http://localhost:3001/api/transactions/recent', getAuthHeader());
console.log('Transaction response status:', txRes.status);
const txData = await txRes.json();
console.log('Recent transaction:', txData);
setRecentTransaction(txData);

        const budgetRes = await fetch('http://localhost:3001/api/budget', getAuthHeader());
        const budgetData = await budgetRes.json();
        setBudgets(budgetData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Welcome, {username}!</h1>

      <div className="section">
        <h2>Most Recent Transaction</h2>
        {recentTransaction && recentTransaction.description ? (
          <div className="card">
            <p><strong>{recentTransaction.description}</strong></p>
            {recentTransaction.amount && <p>${recentTransaction.amount} on {recentTransaction.date}</p>}
          </div>
        ) : (
          <p>No recent transactions.</p>
        )}
      </div>

      <div className="section">
        <h2>Your Budgets ({budgets.length})</h2>
        <ul className="budget-list">
          {budgets.map((b) => (
            <li key={b.budgetId} className="card">
              {b.budget_description}: ${b.budget_amount}
            </li>
          ))}
        </ul>
      </div>

      <div className="links">
        <a href="/add-transaction">➕ Add Transaction</a>
        <a href="/add-budget">➕ Add Budget</a>
      </div>
    </div>
  );
};

export default Dashboard;
