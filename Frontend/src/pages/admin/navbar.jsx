import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  CircleUserRound,
  LayoutDashboard,
  User,
  SquareUserRound,
  Users,
  IndianRupee,
  FolderOpen,
  ClipboardPlus,
  BookCheck,
  BarChart3,
  Cog,
  LogOut,
  ArrowRight,
} from "lucide-react";
import "./navbar.css";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard />,
    color: "#3b82f6",
  },
  { id: "students", label: "Students", icon: <User />, color: "#10b981" },
  {
    id: "teachers",
    label: "Teachers",
    icon: <SquareUserRound />,
    color: "#ff8400",
  },
  { id: "batches", label: "Batches", icon: <Users />, color: "#a855f7" },
  { id: "fees", label: "Fees", icon: <IndianRupee />, color: "#ff8400" },
  {
    id: "resources",
    label: "Resources",
    icon: <FolderOpen />,
    color: "#ff8400",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <ClipboardPlus />,
    color: "#6366f1",
  },
  {
    id: "academic-performance",
    label: "Academic Performance",
    icon: <BarChart3 />,
    color: "#059669",
  },
  {
    id: "approval",
    label: "Approval",
    icon: <BookCheck />,
    color: "#0095ff",
  },
  { id: "settings", label: "Settings", icon: <Cog />, color: "#4e5c6e" },
];

export default function Navbar({ isHandleMargin }) {
  const [isMobile] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");

  const handleResize = () => {
    if (isMobile) {
      // setIsMobileMenuOpen((prev) => !prev);
      setIsCollapsed((prev) => {
        isHandleMargin(!prev);
        return !prev;
      });
    } else {
      setIsCollapsed((prev) => {
        isHandleMargin(!prev);
        return !prev;
      });
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (isMobile) {
      setIsCollapsed(false);
      isHandleMargin(false);
    }
  };

  if (!isMobile) {
    return (
      <nav className={`admin-navbar ${isCollapsed ? "collapsed" : ""}`}>
        <div className={`nav-header ${isCollapsed ? "collapsed" : ""}`}>
          <div className="logo">
            <span className={`logo-icon ${isCollapsed ? "collapsed" : ""}`}>
              <GraduationCap size={40} />
            </span>
            <span className={`logo-text ${isCollapsed ? "collapsed" : ""}`}>
              EduManage
            </span>
          </div>
          <button className="collapse-btn" onClick={handleResize}>
            {isCollapsed ? (
              <ArrowRight size={35} />
            ) : (
              <i className="fa-solid fa-xmark"></i>
            )}
          </button>
        </div>
        <div className={`admin-profile ${isCollapsed ? "collapsed" : ""}`}>
          <span className="user-logo">
            <CircleUserRound size={30} />
          </span>
          <span className={`user-info ${isCollapsed ? "collapsed" : ""}`}>
            <p>ADMIN</p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                fontWeight: 400,
              }}
            >
              ADMINISTRATOR
            </p>
          </span>
        </div>
        <div className={`nav-links ${isCollapsed ? "collapsed" : ""}`}>
          {menuItems.map((item) => {
            const isActive = item.id === currentView;
            return (
              <Link
                to={`/admin/${item.id}`}
                className="link-btn"
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                style={{
                  borderLeft: isActive
                    ? `4px solid ${item.color}`
                    : "4px solid transparent",
                  backgroundColor: item.color + "22",
                  color: item.color,
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                  transition: "transform 0.3s ease-in-out",
                }}
              >
                <span>
                  {React.cloneElement(item.icon, { color: item.color })}
                </span>
                <span
                  className={`item-label ${isCollapsed ? "collapsed" : ""}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="nav-footer">
          <button className="logout-btn">
            <span className="out-icon">
              {React.cloneElement(<LogOut />, { color: "red" })}
            </span>
            <p className={`out-label ${isCollapsed ? "collapsed" : ""}`}>
              Logout
            </p>
          </button>
        </div>
      </nav>
    );
  } else {
    return (
      <nav className={`admin-navbar ${!isCollapsed ? "collapsed" : ""}`}>
        <div className={`nav-header ${!isCollapsed ? "collapsed" : ""}`}>
          <div className="logo">
            <span className={`logo-icon ${!isCollapsed ? "collapsed" : ""}`}>
              <GraduationCap size={40} />
            </span>
            <span className={`logo-text ${!isCollapsed ? "collapsed" : ""}`}>
              EduManage
            </span>
          </div>
          <button className="collapse-btn" onClick={handleResize}>
            {isCollapsed && isMobile ? (
              <i className="fa-solid fa-xmark"></i>
            ) : (
              <ArrowRight size={35} />
            )}
          </button>
        </div>
        <div className={`admin-profile ${!isCollapsed ? "collapsed" : ""}`}>
          <span className="user-logo">
            <CircleUserRound size={30} />
          </span>
          <span className={`user-info ${!isCollapsed ? "collapsed" : ""}`}>
            <p>ADMIN</p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                fontWeight: 400,
              }}
            >
              ADMINISTRATOR
            </p>
          </span>
        </div>
        <div className={`nav-links ${!isCollapsed ? "collapsed" : ""}`}>
          {menuItems.map((item) => {
            const isMobActive = item.id === currentView;
            return (
              <Link
                to={`/admin/${item.id}`}
                className="link-btn"
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                style={{
                  borderLeft: isMobActive
                    ? `4px solid ${item.color}`
                    : "4px solid transparent",
                  backgroundColor: item.color + "22",
                  color: item.color,
                }}
              >
                <span>
                  {React.cloneElement(item.icon, { color: item.color })}
                </span>
                <span
                  className={`item-label ${!isCollapsed ? "collapsed" : ""}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="nav-footer">
          <button className="logout-btn">
            <span className="out-icon">
              {React.cloneElement(<LogOut />, { color: "red" })}
            </span>
            <p className={`out-label ${!isCollapsed ? "collapsed" : ""}`}>
              Logout
            </p>
          </button>
        </div>
      </nav>
    );
  }
}
