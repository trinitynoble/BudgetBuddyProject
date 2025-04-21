import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import './NavBar.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function NavBar() {
  const [click, setClick] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from local storage
    navigate('/signin'); // Redirect the user to the sign-in page
    closeMobileMenu(); // Close the mobile menu if it's open
  };

  // Function to check if the user is logged in (token exists)
  const isLoggedIn = () => !!localStorage.getItem('token');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <img src="/images/logo.png" alt="Logo" className="logo-image" />
          </Link>

          <div className="menu-icon" onClick={handleClick}>
            <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
          </div>

          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            {isLoggedIn() && (
              <li className="nav-item">
                <Link to="/dashboard" className="nav-links" onClick={closeMobileMenu}>
                  Dashboard
                </Link>
              </li>
            )}
            {!isLoggedIn() && (
              <li className="nav-item">
                <Link to="/signin" className="nav-links" onClick={closeMobileMenu}>
                  Sign In
                </Link>
              </li>
            )}
            {isLoggedIn() && (
              <li className="nav-item">
                <Link to="/transactions" className="nav-links" onClick={closeMobileMenu}>
                  Transactions
                </Link>
              </li>
            )}
            {isLoggedIn() && (
              <li className="nav-item">
                <Link to="/budget" className="nav-links" onClick={closeMobileMenu}>
                  Budget
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link to="/about" className="nav-links" onClick={closeMobileMenu}>
                About
              </Link>
            </li>
            {isLoggedIn() && (
              <li className="nav-item">
                <button className="nav-links logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </>
  );
}

export default NavBar;