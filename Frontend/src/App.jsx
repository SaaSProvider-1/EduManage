import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LandingPage from "./pages/landing-page/LandingPage";
import Admin from "./pages/admin/Admin";
import Teacher from "./pages/teacher/Teacher";
import StudentRegister from "./pages/student/RegisterOrLogin/StudentRegister";
import StudentLogin from "./pages/student/RegisterOrLogin/StudentLogin";
import Student from "./pages/student/Student";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/teacher/*" element={<Teacher />} />
          <Route path="/student/*" element={<Student />} />
          <Route path="/student-register" element={<StudentRegister />} />
          <Route path="/student-login" element={<StudentLogin />} />
        </Routes>
      </Router>

      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
