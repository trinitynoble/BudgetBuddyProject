import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


function NavBar() {
  const [click, setClick] = useState(false);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

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
            <li className="nav-item">
              <Link to="/dashboard" className="nav-links" onClick={closeMobileMenu}>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/signin" className="nav-links" onClick={closeMobileMenu}>
                Sign In
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/transactions" className="nav-links" onClick={closeMobileMenu}>
                Transactions
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/forms" className="nav-links" onClick={closeMobileMenu}>
                Forms
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-links" onClick={closeMobileMenu}>
                About
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default NavBar;
