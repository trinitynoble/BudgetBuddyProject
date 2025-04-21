import React from 'react';
import './dashboard.css';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const Dashboard = () => {
    return (
        <div className ="dashboard-container">
            <h2 className="dashboard-header">Dashboard</h2>
            <div className = "dashboard-grid">
                <div className="dashboard-item">
                    <img src="/images/monthlysavings.png" className="savings-image" alt="Monthly Savings" />
                </div>
                <div className="dashboard-item">
                    <img src="/images/monthlyexpenses.png" className="expenses-image" alt="Monthly Expenses" />
                </div>
                <div className="dashboard-item">
                    <img src="/images/monthlyincome.png" className="income-image" alt="Monthly Income" />
                </div>
                <div className="dashboard-item">
                    <img src="/images/graph.png" className="graph-image" alt="Financial Graph" />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;