import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Admin from "./pages/admin/Admin";
import Teacher from "./pages/teacher/Teacher";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/teacher/*" element={<Teacher />} />
      </Routes>
    </Router>
  );
}