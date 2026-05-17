import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../../api/auth.js";

/**
 * Component for protecting routes based on authentication and roles.
 */
export function RequireAuth({ children, allowedRoles }) {
  const authed = isAuthenticated();
  const user = getCurrentUser();

  // If not logged in -> redirect to login
  if (!authed || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not allowed -> redirect to their appropriate dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}

export default RequireAuth;
