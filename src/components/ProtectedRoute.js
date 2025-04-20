import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token'); // Check if the token exists

  if (!isAuthenticated) {
    // Redirect to the sign-in page if not authenticated
    return <Navigate to="/signin" />;
  }

  // Render the child components (the protected route content) if authenticated
  return children;
};

export default ProtectedRoute;