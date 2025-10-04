import React from "react";
import Lottie from "lottie-react";
import "./HeroSection.css";

const HeroSection = () => {
  const [animationData, setAnimationData] = React.useState(null);
  React.useEffect(() => {
    fetch("/Animate-Hero.json")
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Error loading animation:", error));
  }, []);
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text animate-on-scroll fade-in-up">
            <h1 className="heading-xl">
              Smart Education Management{" "}
              <span className="text-primary">Made Easy</span>
            </h1>
            <p className="text-lg hero-subtitle">
              Manage teachers, students, batches, fees, attendance, and exams
              from one simple dashboard. Streamline your educational institution
              with our comprehensive management platform.
            </p>
            <div className="hero-buttons">
              <a
                href="#pricing"
                className="start-btn start-btn-primary btn-large"
              >
                Get Started
              </a>
              <a href="#contact" className="req-btn btn-outline btn-large">
                Request Demo
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="hero-stat-number">500+</span>
                <span className="hero-stat-label">Schools Trust Us</span>
              </div>
              <div className="stat-item">
                <span className="hero-stat-number">50K+</span>
                <span className="hero-stat-label">Students Managed</span>
              </div>
              <div className="stat-item">
                <span className="hero-stat-number">99.9%</span>
                <span className="hero-stat-label">Uptime</span>
              </div>
            </div>
          </div>
          <div className="hero-illustration animate-on-scroll slide-in-right">
            {animationData && (
              <Lottie className="hero-animate" animationData={animationData} loop={true} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
