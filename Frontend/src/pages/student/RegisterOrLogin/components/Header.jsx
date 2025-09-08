import React, { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import "./Header.css";

export default function Header() {
  const [isMobile] = React.useState(window.innerWidth < 768);

  return (
    <div className="register-header">
      <span className="register-header-icon">
        <GraduationCap size={isMobile ? 30 : 50} />
      </span>
      <h1>Student Registration</h1>
      <p style={{ color: "rgb(219 234 254)", letterSpacing: "1px" }}>
        Complete all sections to register the student
      </p>
    </div>
  );
}
