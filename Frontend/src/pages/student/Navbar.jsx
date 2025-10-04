import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  CircleUserRound,
  User,
  Calendar,
  FileText,
  MessageSquare,
  CreditCard,
  BookOpen,
  Settings,
  Bell,
  LogOut,
  ArrowRight,
  Users,
} from "lucide-react";
import "./Navbar.css";
import { toast } from "react-toastify";

export default function Navbar({ isHandleMargin = () => {} }) {
  const [isMobile] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState("profile");

  const Navigate = useNavigate();

  const menuItems = [
    {
      id: "profile",
      label: "Profile",
      icon: <User />,
      color: "#8b5cf6",
    },
    {
      id: "check-attendance",
      label: "Check Attendance",
      icon: <Calendar />,
      color: "#06b6d4",
    },
    {
      id: "exam-results",
      label: "Exam Results",
      icon: <FileText />,
      color: "#10b981",
    },
    {
      id: "make-request",
      label: "Make Request",
      icon: <MessageSquare />,
      color: "#f59e0b",
    },
    {
      id: "batches",
      label: "My Batches",
      icon: <Users />,
      color: "#8b5cf6",
    },
    {
      id: "payment-history",
      label: "Payment",
      icon: <CreditCard />,
      color: "#ef4444",
    },
    {
      id: "study-materials",
      label: "Study Materials",
      icon: <BookOpen />,
      color: "#3b82f6",
    },
    {
      id: "doubt-requests",
      label: "Doubt Requests",
      icon: <Settings />,
      color: "#6366f1",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell />,
      color: "#f97316",
    },
  ];

  const handleResize = () => {
    if (isMobile) {
      setIsCollapsed((prev) => {
        if (typeof isHandleMargin === "function") {
          isHandleMargin(!prev);
        }
        return !prev;
      });
    } else {
      setIsCollapsed((prev) => {
        if (typeof isHandleMargin === "function") {
          isHandleMargin(!prev);
        }
        return !prev;
      });
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (isMobile) {
      setIsCollapsed(false);
      if (typeof isHandleMargin === "function") {
        isHandleMargin(false);
      }
    }
  };

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem("User"));
    toast.success(`See you soon ${user?.name || "User"}`);

    setTimeout(() => {
      localStorage.removeItem("Name");
      localStorage.removeItem("User");
      localStorage.removeItem("Token");
      localStorage.removeItem("UserType");
      Navigate("/");
    }, 2000);
  };

  if (!isMobile) {
    return (
      <nav
        className={`student-navbar ${isCollapsed ? "student-collapsed" : ""}`}
      >
        <div
          className={`student-nav-header ${
            isCollapsed ? "student-collapsed" : ""
          }`}
        >
          <div className="student-logo">
            <span
              className={`student-logo-icon ${
                isCollapsed ? "student-collapsed" : ""
              }`}
            >
              <GraduationCap size={40} />
            </span>
            <span
              className={`student-logo-text ${
                isCollapsed ? "student-collapsed" : ""
              }`}
            >
              EduManage
            </span>
          </div>
          <button className="student-collapse-btn" onClick={handleResize}>
            {isCollapsed ? (
              <ArrowRight size={35} />
            ) : (
              <i className="fa-solid fa-xmark"></i>
            )}
          </button>
        </div>
        <div
          className={`student-nav-profile ${
            isCollapsed ? "student-collapsed" : ""
          }`}
        >
          <span className="student-user-logo">
            <CircleUserRound size={30} />
          </span>
          <span
            className={`student-user-info ${
              isCollapsed ? "student-collapsed" : ""
            }`}
          >
            <p>STUDENT</p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                fontWeight: 400,
              }}
            >
              LEARNER
            </p>
          </span>
        </div>
        <div
          className={`student-nav-links ${
            isCollapsed ? "student-collapsed" : ""
          }`}
        >
          {menuItems.map((item) => {
            const isActive = item.id === currentView;
            return (
              <Link
                to={`/student/${item.id}`}
                className="student-link-btn"
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
                  className={`student-item-label ${
                    isCollapsed ? "student-collapsed" : ""
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="student-nav-footer">
          <button className="student-logout-btn" onClick={handleLogout}>
            <span className="student-out-icon">
              {React.cloneElement(<LogOut />, { color: "red" })}
            </span>
            <p
              className={`student-out-label ${
                isCollapsed ? "student-collapsed" : ""
              }`}
            >
              Logout
            </p>
          </button>
        </div>
      </nav>
    );
  } else {
    return (
      <nav
        className={`student-navbar ${!isCollapsed ? "student-collapsed" : ""}`}
      >
        <div
          className={`student-nav-header ${
            !isCollapsed ? "student-collapsed" : ""
          }`}
        >
          <div className="student-logo">
            <span
              className={`student-logo-icon ${
                !isCollapsed ? "student-collapsed" : ""
              }`}
            >
              <GraduationCap size={40} />
            </span>
            <span
              className={`student-logo-text ${
                !isCollapsed ? "student-collapsed" : ""
              }`}
            >
              EduManage
            </span>
          </div>
          <button className="student-collapse-btn" onClick={handleResize}>
            {isCollapsed && isMobile ? (
              <i className="fa-solid fa-xmark"></i>
            ) : (
              <ArrowRight size={35} />
            )}
          </button>
        </div>
        <div
          className={`student-profile ${
            !isCollapsed ? "student-collapsed" : ""
          }`}
        >
          <span className="student-user-logo">
            <CircleUserRound size={30} />
          </span>
          <span
            className={`student-user-info ${
              !isCollapsed ? "student-collapsed" : ""
            }`}
          >
            <p>STUDENT</p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                fontWeight: 400,
              }}
            >
              LEARNER
            </p>
          </span>
        </div>
        <div
          className={`student-nav-links ${
            !isCollapsed ? "student-collapsed" : ""
          }`}
        >
          {menuItems.map((item) => {
            const isMobActive = item.id === currentView;
            return (
              <Link
                to={`/student/${item.id}`}
                className="student-link-btn"
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
                  className={`student-item-label ${
                    !isCollapsed ? "student-collapsed" : ""
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="student-nav-footer">
          <button className="student-logout-btn" onClick={handleLogout}>
            <span className="student-out-icon">
              {React.cloneElement(<LogOut />, { color: "red" })}
            </span>
            <p
              className={`student-out-label ${
                !isCollapsed ? "student-collapsed" : ""
              }`}
            >
              Logout
            </p>
          </button>
        </div>
      </nav>
    );
  }
}
