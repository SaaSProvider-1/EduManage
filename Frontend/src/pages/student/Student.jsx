import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import StudentProfile from "./components/Student-Profile";
import CheckAttendance from "./components/CheckAttendance";
import ExamResult from "./components/ExamResult";
import MakeRequest from "./components/MakeRequest";
import FeeManagement from "./components/FeeManagement";
import StudyMaterials from "./components/StudyMaterials";
import DoubtRequests from "./components/DoubtRequests";
import Notifications from "./components/Notifications";
import NotFoundPage from "./NotFoundPage";

export default function Student() {
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
          <Route path="/" element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="check-attendance" element={<CheckAttendance />} />
          <Route path="exam-results" element={<ExamResult />} />
          <Route path="make-request" element={<MakeRequest />} />
          <Route path="payment-history" element={<FeeManagement />} />
          <Route path="study-materials" element={<StudyMaterials />} />
          <Route path="doubt-requests" element={<DoubtRequests />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
