import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../common/Sidebar";

export function AdminLayout({ children }) {
  const adminMenu = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/sessions", label: "Exam Sessions", icon: "📝" },
    { path: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="hx-dashboard-layout">
      <Sidebar role="admin" menuItems={adminMenu} />
      <main className="hx-dashboard-main">
        <header className="hx-dashboard-header">
          <div className="hx-header-left">
            <span className="hx-header-badge">Admin</span>
            <h2>Administrator Portal</h2>
          </div>
          <div className="hx-header-right">
            <div className="hx-header-info">
              <span className="hx-academic-year">Academic Year 2025–2026</span>
              <div className="hx-user-avatar">A</div>
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
