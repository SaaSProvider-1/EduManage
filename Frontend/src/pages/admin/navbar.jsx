import React, { useState } from 'react';
import './navbar.css';

export default function Navbar({ currentView, onViewChange, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'students', label: 'Students', icon: '👨‍🎓' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'batches', label: 'Batches', icon: '📚' },
    { id: 'fees', label: 'Fees', icon: '💰' },
    { id: 'resources', label: 'Resources', icon: '📁' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'approval', label: 'Approval', icon: '✅' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <nav className={`admin-navbar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="navbar-header">
        <div className="logo">
          <span className="logo-icon">🎓</span>
          {!isCollapsed && <span className="logo-text">EduManage</span>}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      <div className="admin-profile">
        <div className="profile-avatar">A</div>
        {!isCollapsed && (
          <div className="profile-info">
            <div className="profile-name">Admin</div>
            <div className="profile-role">Administrator</div>
          </div>
        )}
      </div>

      <ul className="nav-menu">
        {menuItems.map(item => (
          <li key={item.id} className="nav-item">
            <button 
              className={`nav-link ${currentView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-text">{item.label}</span>}
            </button>
          </li>
        ))}
      </ul>

      <div className="navbar-footer">
        <button 
          className="logout-btn"
          onClick={onLogout}
          title={isCollapsed ? 'Logout' : ''}
        >
          <span className="logout-icon">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </nav>
  );
}