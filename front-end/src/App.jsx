import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// 1. Import Pages
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { TeacherPage } from "./pages/TeacherPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { RequireAuth } from "./components/layout/RequireAuth.jsx";
import { AdminLayout } from "./components/layout/AdminLayout.jsx";
import { StudentLayout } from "./components/layout/StudentLayout.jsx";
import { TeacherLayout } from "./components/layout/TeacherLayout.jsx";

export function App() {
  return (
    <Routes>
      {/* 1. Redirect to login on initial load */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 2. Login and Password Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h1>Forgot Password</h1>
          <p>Please contact Horizon Examination Office to reset your password.</p>
        </div>
      } />

      {/* 3. Student Routes */}
      <Route path="/student" element={<RequireAuth allowedRoles={["student"]}><StudentLayout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="grades" element={<DashboardPage />} />
        <Route path="absences" element={<DashboardPage />} />
        <Route path="timetable" element={<DashboardPage />} />
      </Route>

      {/* 4. Admin Routes */}
      <Route path="/admin" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminPage />} />
        <Route path="users" element={<AdminPage />} />
        <Route path="sessions" element={<AdminPage />} />
        <Route path="settings" element={<AdminPage />} />
      </Route>

      {/* 5. Teacher Routes */}
      <Route path="/teacher" element={<RequireAuth allowedRoles={["teacher"]}><TeacherLayout /></RequireAuth>}>
        <Route index element={<TeacherPage />} />
        <Route path="grades" element={<TeacherPage />} />
        <Route path="attendance" element={<TeacherPage />} />
        <Route path="reports" element={<TeacherPage />} />
      </Route>

      {/* 6. Catch-all -> redirect to Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;