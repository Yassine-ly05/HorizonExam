import React from "react";
import { NavLink } from "react-router-dom";
import HorizonLogo from "../../assets/Horizon.png";
import { logout } from "../../api/auth";

export function Sidebar({ role, menuItems = [] }) {
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <aside className="hx-sidebar">
      <div className="hx-sidebar-header">
        <div className="hx-logo-container">
          <img src={HorizonLogo} alt="Horizon" className="hx-sidebar-logo" />
        </div>
        <div className="hx-sidebar-brand-wrapper">
          <span className="hx-sidebar-brand">HorizonExam</span>
          <span className="hx-sidebar-subtitle">Examination Management</span>
        </div>
      </div>
      
      <nav className="hx-sidebar-nav">
        <div className="hx-sidebar-section-title">Main Menu</div>
        <ul className="hx-sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="hx-sidebar-item">
              <NavLink 
                to={item.path} 
                className={({ isActive }) => 
                  `hx-sidebar-link ${isActive ? "active" : ""}`
                }
                end={item.path === "/admin" || item.path === "/teacher" || item.path === "/student" || item.path === "/dashboard"}
              >
                <span className="hx-sidebar-icon">{item.icon}</span>
                <span className="hx-sidebar-label">{item.label}</span>
                <span className="hx-sidebar-active-indicator"></span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="hx-sidebar-footer">
        <button onClick={handleLogout} className="hx-sidebar-logout">
          <span className="hx-sidebar-icon">🚪</span>
          <span className="hx-sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
