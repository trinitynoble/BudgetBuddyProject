import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token'); 

  if (!isAuthenticated) {
    // If not authenticated, redirect to the sign-in page
    return <Navigate to="/signin" />;
  }
  return children;
};

export default ProtectedRoute;