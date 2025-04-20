import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './signin.css';
import 'boxicons/css/boxicons.min.css';

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phonenumber: '',
    password: '',
    confirmPassword: '',
  });

  const toggle = () => {
    setIsSignUp((prev) => !prev);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);

    try {
      if (isSignUp) {
        // ✅ Signup: validate passwords
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match.");
          return;
        }

        const response = await fetch('http://localhost:3001/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_firstname: formData.firstname,
            user_lastname: formData.lastname,
            user_email: formData.email,
            user_phonenumber: formData.phonenumber,
            user_password: formData.password,
          }),
        });

        const result = await response.json();
        if (response.ok) {
          alert('Registration successful!');
          setIsSignUp(false); // switch to login view
        } else {
          alert(result.error || 'Registration failed');
        }

      } else {
        // ✅ Login
        const response = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: formData.email,
            user_password: formData.password,
          }),
        });

        const result = await response.json();
        if (response.ok) {
          alert('Login successful!');
          localStorage.setItem('token', result.token); // Store token
          navigate('/transactions'); // Redirect to the transactions page upon successful login
        } else {
          alert(result.error || 'Login failed');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    }
  };


  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      container.classList.add('sign-in');
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.classList.toggle('sign-in', !isSignUp);
    container.classList.toggle('sign-up', isSignUp);
  }, [isSignUp]);

  return (
    <div ref={containerRef} id="container" className="container">
      <div className="row">
        {/* SIGN UP */}
        <div className="col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            <form className="form sign-up" onSubmit={handleSubmit} method = "POST">
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  type="text"
                  name="firstname"
                  placeholder="John"
                  value={formData.firstname}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  type="text"
                  name="lastname"
                  placeholder="Doe"
                  value={formData.lastname}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <i className="bx bx-mail-send"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <i className="bx bx-phone"></i>
                <input
                  type="tel"
                  name="phonenumber"
                  placeholder="000-000-0000"
                  value={formData.phonenumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit">Sign up</button>
              <p>
                <span>Already have an account? </span>
                <b onClick={toggle} className="pointer">Sign in here</b>
              </p>
            </form>
          </div>
        </div>

        {/* SIGN IN */}
        <div className="col align-items-center flex-col sign-in">
          <div className="form-wrapper align-items-center">
            <form className="form sign-in" onSubmit={handleSubmit}>
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  type="text"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit">Sign in</button>
              <p><b>Forgot password?</b></p>
              <p>
                <span>Don't have an account? </span>
                <b onClick={toggle} className="pointer">Sign up here</b>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="row content-row">
        <div className="col align-items-center flex-col">
          <div className="text sign-in"><h2>Welcome</h2></div>
          <div className="img sign-in"></div>
        </div>
        <div className="col align-items-center flex-col">
          <div className="img sign-up"></div>
          <div className="text sign-up"><h2>Join with us</h2></div>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;