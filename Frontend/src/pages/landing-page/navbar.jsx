import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

import "./navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" className="logo-link">
            <span className="logo">
              <GraduationCap size={40} />
            </span>
            <span className="logo-des">EduManage</span>
          </Link>
        </div>
        <div className="nav-menu">
          <ul>
            <Link to={"/"} className="link">
              <li>Home</li>
            </Link>
            <Link to={"/services"} className="link">
              <li>Services</li>
            </Link>
            <Link to={"/prices"} className="link">
              <li>Price</li>
            </Link>
            <Link to={"/about"} className="link">
              <li>About</li>
            </Link>
            <Link to={"/contact"} className="link">
              <li>Contact</li>
            </Link>
          </ul>
          <div className="auth-buttons">
            <Link to={"/login"}>
              <button className="land-login-btn" title="Student Login">
                <span>Login</span>
              </button>
            </Link>
            <Link to={"/register"}>
              <button className="land-register-btn" title="Student Register">
                <span>Register</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
