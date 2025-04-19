import React from 'react';
import './App.css';
import NavBar from './components/NavBar.js';
import SignIn from './components/signin.js';
import TransactionHistory from './components/transactions.js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

//import Test from './components/Test';
//import Forms from './components/Forms';

function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          {/* <Route path="/forms" element={<Forms />} /> */}
          {/* <Route path="/about" element={<About />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
