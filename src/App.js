import React from 'react';
import './App.css';
import NavBar from './components/NavBar.js';
import SignIn from './components/signin.js';
import Budget from './components/budget.js';
import TransactionHistory from './components/transactions.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />

          {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
          {/* <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;