import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedAccess: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedAccess }) => {
  const accessType = localStorage.getItem('accessType');

  return accessType === allowedAccess ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;