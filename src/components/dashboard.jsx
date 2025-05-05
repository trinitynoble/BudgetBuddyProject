import React, { useEffect, useState, useRef } from 'react';
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const messages = [
  "Let's crush your savings goals 💰",
  "Another day, another dollar 💵",
  "You're doing amazing! 🤑",
  "Keep tracking those expenses! 📊",
];

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const [recentTransaction, setRecentTransaction] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [motivationalMsg, setMotivationalMsg] = useState('');
const fullMessageRef = useRef(messages[Math.floor(Math.random() * messages.length)]);
const indexRef = useRef(0);

useEffect(() => {
  const interval = setInterval(() => {
    if (indexRef.current <= fullMessageRef.current.length) {
      const partial = fullMessageRef.current.slice(0, indexRef.current + 1);
      setMotivationalMsg(partial);
      indexRef.current += 1;
    } else {
      clearInterval(interval);
    }
  }, 75);

  return () => clearInterval(interval);
}, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const userRes = await fetch('http://localhost:3001/api/user', getAuthHeader());
        const userData = await userRes.json();
        setUsername(userData.username);

        const txRes = await fetch('http://localhost:3001/api/transactions/recent', getAuthHeader());
        const txData = await txRes.json();
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
    <>
    <div className="welcome-banner">
      <h1>{getGreeting()}, {username}!</h1>
      <p className="motivational-msg">{motivationalMsg}</p>
    </div>
    <div className="dashboard">

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
        <a href="/transactions">➕ Add a Transaction</a>
        <a href="/budget">➕ Add a Budget</a>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
