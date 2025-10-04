import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./navbar";
import Dashboard from "./components/Dashboard";
import TeacherAttendance from "./components/TeacherAttendance";
import PendingTask from "./components/PendingTask";
import AddTask from "./components/AddTask";
import BatchManagement from "./components/BatchManagement";
import StudentManagement from "./components/StudentManagement";
import ExamPerformance from "./components/ExamPerformance";
import ReportsAnalytics from "./components/ReportsAnalytics";
import SalarySummary from "./components/SalarySummary";
import RescheduleClass from "./components/RescheduleClass";
import ManualAddMark from "./components/ManualAddMark";
import "./Teacher.css";

export default function Teacher() {
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
    <div className="teacher-layout">
      <Navbar onLogout={handleLogout} isHandleMargin={handleMargin} />
      <main
        className="teacher-main"
        style={{
          marginLeft: collapsed
            ? "100px"
            : "300px" && window.innerWidth <= 768
            ? "0px"
            : "300px",
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-attendance" element={<TeacherAttendance />} />
          <Route path="pending-tasks" element={<PendingTask />} />
          <Route path="add-task" element={<AddTask />} />
          <Route path="reschedule-class" element={<RescheduleClass />} />
          <Route path="manual-add-mark" element={<ManualAddMark />} />
          <Route path="batch-management" element={<BatchManagement />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="exam-performance" element={<ExamPerformance />} />
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="salary-summary" element={<SalarySummary />} />
        </Routes>
      </main>
    </div>
  );
}
