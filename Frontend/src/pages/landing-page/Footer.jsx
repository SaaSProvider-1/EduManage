import React from "react";
import { GraduationCap } from "lucide-react";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [icon, setIcon] = React.useState();

  React.useEffect(() => {
    fetch("/images/graduation-cap.svg")
      .then((response) => response.text())
      .then((data) => setIcon(data))
      .catch((error) => console.error("Error fetching SVG:", error));
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="brand-logo">
                <div className="logo-icon">
                  <GraduationCap size={35} strokeWidth={2} color="yellow" />
                </div>
                <span className="brand-name">EduManage</span>
              </div>
              <p className="brand-description">
                Streamline your educational institution management with our
                comprehensive SaaS platform. Trusted by 500+ schools and
                colleges worldwide.
              </p>
            </div>

            <div className="brand-stats">
              <div className="brand-stat">
                <span className="brand-stat-number">50+</span>
                <span className="brand-stat-label">Institutions</span>
              </div>
              <div className="brand-stat">
                <span className="brand-stat-number">200+</span>
                <span className="brand-stat-label">Teachers</span>
              </div>
              <div className="brand-stat">
                <span className="brand-stat-number">2000+</span>
                <span className="brand-stat-label">Students</span>
              </div>
            </div>

            <div className="footer-links">
              <div className="link-group">
                <h4 className="link-group-title">Quick Links</h4>
                <ul className="link-list">
                  <li>
                    <a href="#features">Home Section</a>
                  </li>
                  <li>
                    <a href="#integrations">Services Section</a>
                  </li>
                  <li>
                    <a href="#pricing">Price Section</a>
                  </li>
                  <li>
                    <a href="#demo">About Section</a>
                  </li>
                  <li>
                    <a href="#security">Contact Section</a>
                  </li>
                </ul>
              </div>

              <div className="link-group">
                <h4 className="link-group-title">Solutions</h4>
                <ul className="link-list">
                  <li>
                    <a href="#schools">For Schools</a>
                  </li>
                  <li>
                    <a href="#colleges">For Colleges</a>
                  </li>
                  <li>
                    <a href="#universities">For Universities</a>
                  </li>
                  <li>
                    <a href="#training-centers">Training Centers</a>
                  </li>
                  <li>
                    <a href="#coaching-institutes">Coaching Institutes</a>
                  </li>
                  <li>
                    <a href="#online-education">Online Education</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <div className="footer-legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#cookies">Cookie Policy</a>
              <a href="#compliance">Compliance</a>
              <a href="#gdpr">GDPR</a>
            </div>
            <div className="footer-copyright">
              © {currentYear} EduManage. All rights reserved. Made with ❤️ in
              India.
            </div>
          </div>

          <div className="footer-bottom-right">
            <div className="footer-social">
              <span className="social-label">Follow us:</span>
              <div className="social-links">
                <a href="#twitter" className="social-link twitter">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.95718 14.8821 3.2845C14.0247 3.61183 13.2884 4.19445 12.773 4.95371C12.2575 5.71297 11.9877 6.61234 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39624C5.36074 6.60667 4.01032 5.43666 3 4V4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.099 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3V3Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a href="#facebook" className="social-link facebook">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a href="#linkedin" className="social-link linkedin">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8V8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="2"
                      y="9"
                      width="4"
                      height="12"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="4"
                      cy="4"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </a>
                <a href="#youtube" className="social-link youtube">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.54 6.42C22.4212 5.94541 22.1793 5.51057 21.8387 5.15941C21.4981 4.80824 21.0708 4.55318 20.6 4.42C18.88 4 12 4 12 4S5.12 4 3.4 4.46C2.92925 4.59318 2.50191 4.84824 2.16131 5.19941C1.82071 5.55057 1.57879 5.98541 1.46 6.46C1.14625 8.20556 0.991319 9.97631 1 11.75C0.988267 13.537 1.14319 15.3213 1.46 17.08C1.59877 17.5398 1.8489 17.9581 2.19084 18.2945C2.53277 18.6308 2.96053 18.8721 3.43 19C5.12 19.46 12 19.46 12 19.46S18.88 19.46 20.59 19C21.0592 18.8721 21.4872 18.6308 21.8292 18.2945C22.1711 17.9581 22.4212 17.5398 22.56 17.08C22.8468 15.3213 22.9917 13.537 22.98 11.75C22.9917 9.97631 22.8468 8.20556 22.54 6.42Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <polygon
                      points="9.75,15.02 15.5,11.75 9.75,8.48"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </a>
                <a href="#instagram" className="social-link instagram">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5931 15.1514 13.8416 15.5297C13.0901 15.9079 12.2384 16.0396 11.4078 15.9059C10.5771 15.7723 9.80976 15.3801 9.21484 14.7852C8.61992 14.1902 8.22773 13.4229 8.09407 12.5922C7.9604 11.7616 8.09207 10.9099 8.47033 10.1584C8.84859 9.40685 9.45419 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87658 12.63 8C13.4789 8.12588 14.2649 8.52146 14.8717 9.1283C15.4785 9.73515 15.8741 10.5211 16 11.37Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M17.5 6.5H17.51"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-certifications">
              <div className="certification-badge">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7V10C2 16 12 22 12 22S22 16 22 10V7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12L11 14L15 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>ISO 27001</span>
              </div>
              <div className="certification-badge">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="16"
                    r="1"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <span>GDPR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
