import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './signin.css';
import 'boxicons/css/boxicons.min.css';

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phonenumber: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phonenumber: '',
    password: '',
    confirmPassword: '',
  });

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const toggle = () => {
    setIsSignUp((prev) => !prev);
    setFormData({
      firstname: '',
      lastname: '',
      email: '',
      phonenumber: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({
      firstname: '',
      lastname: '',
      email: '',
      phonenumber: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: '', //clear the error(s) for the changed input
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    const validationErrors = {};
    const nameMinLength = 2;
    const emailMinLength = 8;
    const phoneMinLength = 10;
    const passwordMinLength = 8;
    if (isSignUp){
    //setting errors if the input fields are invalid, for eg if they are empty or too short or if email or password arent correctly formatted
    if (formData.firstname.length < nameMinLength) {
      validationErrors.firstname = `First name must be at least ${nameMinLength} characters long.`;
    }
    if (formData.lastname.length < nameMinLength) {
      validationErrors.lastname = `Last name must be at least ${nameMinLength} characters long.`;
    }
    if (formData.email.length < emailMinLength) {
      validationErrors.email = `Email must be at least ${emailMinLength} characters long.`;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      validationErrors.email = 'Email address is invalid.';
    }
    if (formData.phonenumber.length < phoneMinLength) {
      validationErrors.phonenumber = `Phone number must be at least ${phoneMinLength} digits long.`;
    }
    if (formData.password.length < passwordMinLength) {
      validationErrors.password = `Password must be at least ${passwordMinLength} characters long.`;
    }
    if (formData.password && !/^(?=.*[a-z])(?=.*\d).{8,}$/.test(formData.password)) {
      validationErrors.password = 'Password must be at least 8 characters and include one lowercase letter and one number.';
    }
    if (isSignUp) {
      if (formData.confirmPassword !== formData.password) {
        validationErrors.confirmPassword = "Passwords do not match.";
      } else if (formData.confirmPassword.length < passwordMinLength) {
        validationErrors.confirmPassword = `Confirm password must be at least ${passwordMinLength} characters long.`;
      }
    }
  } else {
    if (formData.email.length === 0) {
      validationErrors.email = 'Email is required.';
    }
    if (formData.password.length === 0) {
      validationErrors.password = 'Password is required.';
    }
  }

    setErrors(validationErrors);

    // if there are any validation errors, show a popup
    if (Object.keys(validationErrors).length > 0) {
      const errorMessage = Object.values(validationErrors).join('\n');
      setPopupMessage(errorMessage);
      setShowPopup(true);
      return;
    }

    try {
      if (isSignUp) {
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
          setIsSignUp(false); //switch to login view
        } else {
          alert(result.error || 'Registration failed');
        }
      } else {
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
          localStorage.setItem('token', result.token);
          navigate('/dashboard');
        } else {
          alert(result.error || 'Login failed');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
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
  
  const handleForgotPassword = async () => {
    const email = formData.email;
    if (!email) {
      alert('Please enter your email to reset password.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3001/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
  
      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Check your email for password reset instructions.');
      } else {
        alert(result.error || 'Failed to send reset instructions.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      alert('Something went wrong.');
    }
  };
  
  //setting up the maximum length of the input fields
  const nameMaxLength = 20;
  const emailMaxLength = 40;
  const phoneMaxLength = 10;
  const passwordMaxLength = 30;

  return (
    <div ref={containerRef} id="container" className="container">
      {showPopup && (
        <div className="popup">
          <p>{popupMessage}</p>
          <button onClick={closePopup}>Close</button>
        </div>
      )}
      <div className="row">
        {/* SIGN UP */}
        <div className="col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            <form className="form sign-up" onSubmit={handleSubmit} method="POST">
              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  type="text"
                  name="firstname"
                  placeholder="John"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  maxLength={nameMaxLength}
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
                  maxLength={nameMaxLength}
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
                  maxLength={emailMaxLength}
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
                  maxLength={phoneMaxLength}
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
                  maxLength={passwordMaxLength}
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
                  maxLength={passwordMaxLength}
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
                  maxLength={emailMaxLength}
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
                  maxLength={passwordMaxLength}
                />
              </div>
              <button type="submit">Sign in</button>
              <p><b className="pointer" onClick={handleForgotPassword}>Forgot password?</b></p>
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
