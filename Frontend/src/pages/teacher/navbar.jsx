import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  CircleUserRound,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  User,
  BarChart,
  PieChart,
  DollarSign,
  LogOut,
  ArrowRight,
  BookMarked,
  Plus,
} from "lucide-react";
import "./navbar.css";
import { toast } from "react-toastify";

export default function Navbar({ isHandleMargin }) {
  const Navigate = useNavigate();
  const location = useLocation();
  const [isMobile] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");

  // Set current view based on URL path
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const currentPath = pathSegments[pathSegments.length - 1]; // Get the last segment
    
    // Check if the current path matches any menu item id
    const matchingItem = menuItems.find(item => item.id === currentPath);
    if (matchingItem) {
      setCurrentView(currentPath);
    } else if (location.pathname === '/teacher' || location.pathname === '/teacher/') {
      setCurrentView("dashboard");
    }
  }, [location.pathname]);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard />,
      color: "#3b82f6",
    },
    {
      id: "my-attendance",
      label: "My Attendance",
      icon: <ClipboardList />,
      color: "#8b5cf6",
    },
    {
      id: "pending-tasks",
      label: "Pending Tasks",
      icon: <ClipboardList />,
      color: "#ef4444",
    },
    {
      id: "add-task",
      label: "Add Task",
      icon: <Plus />,
      color: "#16a34a",
    },
    {
      id: "reschedule-class",
      label: "Reschedule Class/Exam",
      icon: <Calendar />,
      color: "#f59e0b",
    },
    {
      id: "manual-add-mark",
      label: "Manual Add Mark",
      icon: <BookMarked />,
      color: "#10b981",
    },
    {
      id: "batch-management",
      label: "Batch Management",
      icon: <Users />,
      color: "#a855f7",
    },
    {
      id: "students",
      label: "Student Management",
      icon: <User />,
      color: "#06b6d4",
    },
    {
      id: "exam-performance",
      label: "Exam Performance",
      icon: <BarChart />,
      color: "#8b5cf6",
    },
    {
      id: "reports",
      label: "Reports Analytics",
      icon: <PieChart />,
      color: "#f97316",
    },
    {
      id: "salary-summary",
      label: "Salary Summary",
      icon: <DollarSign />,
      color: "#22c55e",
    },
  ];

  const handleResize = () => {
    if (isMobile) {
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

  const handleLogout = () => {
    const user = localStorage.getItem("User");
    const name = user ? JSON.parse(user).name : null;
    toast.success(`See you soon ${name}`);
    setTimeout(() => {
      localStorage.removeItem("User");
      localStorage.removeItem("Token");
      Navigate("/");
    }, 2000);
  };

  if (!isMobile) {
    return (
      <nav className={`teacher-navbar ${isCollapsed ? "collapsed" : ""}`}>
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
        <div className={`teacher-profile ${isCollapsed ? "collapsed" : ""}`}>
          <span className="user-logo">
            <CircleUserRound size={30} />
          </span>
          <span className={`user-info ${isCollapsed ? "collapsed" : ""}`}>
            <p>TEACHER</p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                fontWeight: 400,
              }}
            >
              EDUCATOR
            </p>
          </span>
        </div>
        <div className={`teacher-nav-links ${isCollapsed ? "collapsed" : ""}`}>
          {menuItems.map((item) => {
            const isActive = item.id === currentView;
            return (
              <Link
                to={`/teacher/${item.id}`}
                className="teacher-link-btn"
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
                <span style={{ display: "flex", alignItems: "center" }}>
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
          <button className="logout-btn" onClick={handleLogout}>
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
      <nav className={`teacher-navbar ${!isCollapsed ? "collapsed" : ""}`}>
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
        <div className={`teacher-profile ${!isCollapsed ? "collapsed" : ""}`}>
          <span className="user-logo">
            <CircleUserRound size={30} />
          </span>
          <span className={`user-info ${!isCollapsed ? "collapsed" : ""}`}>
            <p>TEACHER</p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                fontWeight: 400,
              }}
            >
              EDUCATOR
            </p>
          </span>
        </div>
        <div className={`nav-links ${!isCollapsed ? "collapsed" : ""}`}>
          {menuItems.map((item) => {
            const isMobActive = item.id === currentView;
            return (
              <Link
                to={`/teacher/${item.id}`}
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
