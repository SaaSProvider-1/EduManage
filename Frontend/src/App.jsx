import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectRoute from "./ProtectRoute";

import LandingPage from "./pages/landing-page/LandingPage";
import Admin from "./pages/admin/Admin";
import Teacher from "./pages/teacher/Teacher";
import Student from "./pages/student/Student";
import Register from "./pages/Register-Login/Register";
import Login from "./pages/Register-Login/Login";
import ForgotPassword from "./pages/Register-Login/ForgotPassword";
import ResetPassword from "./pages/Register-Login/ResetPassword";
import TutorRegister from "./pages/Register-Login/TutorRegister";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFoundPage from "./NotFoundPage";
import AdminRegister from "./pages/Register-Login/AdminRegister";
export default function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/tutor-register" element={<TutorRegister />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/admin-register" element={<AdminRegister />} />

          {/* Protected Routes */}
          {/* <Route element={<ProtectRoute allowedRoles={["admin"]} />}> */}
          <Route path="/admin/*" element={<Admin />} />
          {/* </Route> */}

          {/* <Route element={<ProtectRoute allowedRoles={["student"]} />}> */}
          <Route path="/student/*" element={<Student />} />
          {/* </Route> */}

          {/* <Route element={<ProtectRoute allowedRoles={["teacher"]} />}> */}
          <Route path="/teacher/*" element={<Teacher />} />
          {/* </Route> */}
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
