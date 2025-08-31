import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./navbar";
import Dashboard from "./components/Dashboard";
import StudentManagement from "./components/StudentManagement";
import TeacherManagement from "./components/TeacherManagement";
import BatchManagement from "./components/BatchManagement";
import FeesManagement from "./components/FeesManagement";
import UploadResources from "./components/UploadResources";
import ReportsAnalytics from "./components/ReportsAnalytics";
import Approval from "./components/Approval";
import Settings from "./components/Settings";
import "./Admin.css";

export default function Admin() {
  const [collapsed, setCollapsed] = useState();
  const [isMenuClicked, setIsMenuClicked] = useState(false);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      // Handle logout logic here
      alert("Logging out...");
    }
  };

  const handleMargin = (val) => {
    setCollapsed(val);
  };

  return (
    <div className="admin-layout">
      <Navbar onLogout={handleLogout} isHandleMargin={handleMargin} />
      <main
        className="admin-main"
        style={{
          marginLeft: collapsed
            ? "100px"
            : "300px" && window.innerWidth <= 768
            ? "100px"
            : "300px",
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="batches" element={<BatchManagement />} />
          <Route path="fees" element={<FeesManagement />} />
          <Route path="resources" element={<UploadResources />} />
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="approval" element={<Approval />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
