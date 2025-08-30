import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Admin from "./pages/admin/Admin";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Admin />} />
      </Routes>
    </Router>
  );
}