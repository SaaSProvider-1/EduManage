import React, { useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import StudentProfile from "./components/Student-Profile";
import EditProfile from "./components/EditProfile";
import CheckAttendance from "./components/CheckAttendance";
import ExamResult from "./components/ExamResult";
import MakeRequest from "./components/MakeRequest";
import FeeManagement from "./components/FeeManagement";
import StudyMaterials from "./components/StudyMaterials";
import DoubtRequests from "./components/DoubtRequests";
import Notifications from "./components/Notifications";
import BatchBrowser from "./components/BatchBrowser";
import NotFoundPage from "../../NotFoundPage";

export default function Student() {
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      // Handle logout logic here
      alert("Logging out...");
    }
  };

  const handleMargin = (val) => {
    setCollapsed(val);
  };

  const getMarginLeft = () => {
    if (window.innerWidth <= 768) {
      return "0px";
    }
    return collapsed ? "100px" : "300px";
  };

  return (
    <div className="teacher-layout">
      <Navbar onLogout={handleLogout} isHandleMargin={handleMargin} />
      <main
        className="teacher-main"
        style={{
          marginLeft: getMarginLeft(),
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="check-attendance" element={<CheckAttendance />} />
          <Route path="exam-results" element={<ExamResult />} />
          <Route path="make-request" element={<MakeRequest />} />
          <Route path="payment-history" element={<FeeManagement />} />
          <Route path="study-materials" element={<StudyMaterials />} />
          <Route path="doubt-requests" element={<DoubtRequests />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="batches" element={<BatchBrowser />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
