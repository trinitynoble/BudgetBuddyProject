import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token'); //checks user token

  if (!isAuthenticated) {
    //redirect to the sign-in page if not authenticated
    return <Navigate to="/signin" />;
  }

  //render the child components (the protected route content) if authenticated
  return children;
};

export default ProtectedRoute;