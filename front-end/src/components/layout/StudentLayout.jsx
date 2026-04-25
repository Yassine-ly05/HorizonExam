import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../common/Sidebar";

export function StudentLayout({ children }) {
  const studentMenu = [
    { path: "/student", label: "Dashboard", icon: "📊" },
    { path: "/student/grades", label: "My Grades", icon: "📜" },
    { path: "/student/absences", label: "My Absences", icon: "🚫" },
    { path: "/student/timetable", label: "Timetable", icon: "📅" },
  ];

  return (
    <div className="hx-dashboard-layout">
      <Sidebar role="student" menuItems={studentMenu} />
      <main className="hx-dashboard-main">
        <header className="hx-dashboard-header">
          <div className="hx-header-left">
            <span className="hx-header-badge">Student</span>
            <h2>Student Portal</h2>
          </div>
          <div className="hx-header-right">
            <div className="hx-header-info">
              <span className="hx-academic-year">Academic Year 2025–2026</span>
              <div className="hx-user-avatar">S</div>
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
