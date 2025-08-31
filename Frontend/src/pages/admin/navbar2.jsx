import React, { useState, useEffect } from "react";
import "./navbar2.css";

export default function Navbar({ currentView, onViewChange, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setIsCollapsed(false); // Always uncollapse on desktop
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "students", label: "Students", icon: "👨‍🎓" },
    { id: "teachers", label: "Teachers", icon: "👨‍🏫" },
    { id: "batches", label: "Batches", icon: "📚" },
    { id: "fees", label: "Fees", icon: "💰" },
    { id: "resources", label: "Resources", icon: "📁" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "approval", label: "Approval", icon: "✅" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  // Hide labels if collapsed, or if mobile and not expanded
  const hideLabels = isCollapsed || (isMobile && !isCollapsed);

  return (
    <nav className={`admin-navbar${isCollapsed ? " collapsed" : ""}`}>
      <div className={`navbar-header${isCollapsed ? " collapsed" : ""}`}>
        <div className="logo">
          <span className="logo-icon">🎓</span>
          {!hideLabels && (
            <span className={`logo-text${isCollapsed ? " collapsed" : ""}`}>
              EduManage
            </span>
          )}
        </div>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {!hideLabels && (
        <div className="admin-profile">
          <div className="profile-avatar">A</div>
          <div className="profile-info">
            <div className={`profile-name${isCollapsed ? " collapsed" : ""}`}>
              Admin
            </div>
            <div className={`profile-role${isCollapsed ? " collapsed" : ""}`}>
              Administrator
            </div>
          </div>
        </div>
      )}

      <ul className="nav-menu">
        {menuItems.map((item) => (
          <li key={item.id} className="nav-item">
            <button
              className={`nav-link${currentView === item.id ? " active" : ""}`}
              onClick={() => onViewChange(item.id)}
              title={hideLabels ? item.label : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {!hideLabels && (
                <span className={`nav-text${isCollapsed ? " collapsed" : ""}`}>
                  {item.label}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {!hideLabels && (
        <div className="navbar-footer">
          <button
            className="logout-btn"
            onClick={onLogout}
            title={isCollapsed ? "Logout" : ""}
          >
            <span className="logout-icon">🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      )}
    </nav>
  );
}
