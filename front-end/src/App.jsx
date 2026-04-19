import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// 1. Import el Pages
import { LoginPage } from "./pages/LoginPage.jsx";
import { StudentDashboard } from "./pages/StudentDashboard.jsx"; // El page el jdida elli sna3neha
import { TeacherDashboard } from "./pages/TeacherDashboard.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";
import { getCurrentUser, isAuthenticated } from "./services/auth.js";

// Component mta3 el Protection (HEDHA MOHIM BARCHA)
function RequireAuth({ children, allowedRoles }) {
  const authed = isAuthenticated();
  const user = getCurrentUser();

  // Ken mouch logged in -> lel Login
  if (!authed || !user) {
    return <Navigate to="/login" replace />;
  }

  // Ken dakhil l'role ghalet (مثلا student y7eb yedkhel admin) -> hazzou l'blastou s7i7a
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}

export function App() {
  return (
    <Routes>
      {/* 1. Redirection mta3 awwel ma t7al el site */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 2. Routes el Login wel Password */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h1>Forgot Password</h1>
          <p>Please contact Horizon Examination Office to reset your password.</p>
        </div>
      } />

      {/* 3. Route el Student (EL JDIDDA) */}
      <Route
        path="/student"
        element={
          <RequireAuth allowedRoles={["student"]}>
            <StudentDashboard />
          </RequireAuth>
        }
      />

      {/* 4. Route el Admin */}
      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={["admin"]}>
            <AdminDashboard />
          </RequireAuth>
        }
      />

      {/* 5. Route el Teacher */}
      <Route
        path="/teacher"
        element={
          <RequireAuth allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </RequireAuth>
        }
      />

      {/* 6. Ay path ghalet -> back to Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;