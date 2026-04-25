import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../common/Sidebar";

export function TeacherLayout({ children }) {
  const teacherMenu = [
    { path: "/teacher", label: "Dashboard", icon: "📊" },
    { path: "/teacher/grades", label: "Grade Entry", icon: "✍️" },
    { path: "/teacher/attendance", label: "Attendance", icon: "📅" },
    { path: "/teacher/reports", label: "Reports", icon: "📄" },
  ];

  return (
    <div className="hx-dashboard-layout">
      <Sidebar role="teacher" menuItems={teacherMenu} />
      <main className="hx-dashboard-main">
        <header className="hx-dashboard-header">
          <div className="hx-header-left">
            <span className="hx-header-badge">Teacher</span>
            <h2>Teacher Portal</h2>
          </div>
          <div className="hx-header-right">
            <div className="hx-header-info">
              <span className="hx-academic-year">Academic Year 2025–2026</span>
              <div className="hx-user-avatar">E</div>
            </div>
          </div>
        </header>
        <div className="hx-dashboard-content">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
