import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserRole } from '../../types';
import { getCurrentUser } from '../../services/storage';

interface RoleGuardProps {
  allowedRole?: UserRole;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRole }) => {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their own home dashboard
    return <Navigate to={user.role === 'bidder' ? '/bidder/dashboard' : '/officer/dashboard'} replace />;
  }

  return <Outlet />;
};
