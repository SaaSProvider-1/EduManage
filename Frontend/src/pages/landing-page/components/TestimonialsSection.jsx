import React, { useState, useEffect } from "react";
import "./TestimonialsSection.css";

const TestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Dr. Priya Sharma",
      role: "Principal",
      institution: "St. Mary's High School",
      location: "Mumbai, Maharashtra",
      avatar: "/images/student1.jpg",
      rating: 5,
      testimonial:
        "EduManage has completely transformed how we manage our school. The administrative tasks that used to take hours now take just minutes. Our teachers love the intuitive interface, and parents appreciate the real-time updates about their children's progress.",
      highlight: "Reduced administrative time by 70%",
    },
    {
      name: "Rajesh Kumar",
      role: "Vice Principal",
      institution: "Delhi Public School",
      location: "Delhi, NCR",
      avatar: "/images/student2.jpg",
      rating: 5,
      testimonial:
        "The fee management system alone has saved us countless hours. Automated reminders and easy payment tracking have improved our collection rates significantly. The support team is also incredibly responsive and helpful.",
      highlight: "Improved fee collection by 40%",
    },
    {
      name: "Ms. Anjali Patel",
      role: "Mathematics Teacher",
      institution: "Greenwood Academy",
      location: "Pune, Maharashtra",
      avatar: "/images/student3.jpg",
      rating: 5,
      testimonial:
        "As a teacher, I love how easy it is to manage my classes, track student performance, and communicate with parents. The grade book feature is fantastic, and being able to reschedule classes with automatic notifications is a game-changer.",
      highlight: "Streamlined communication with 500+ parents",
    },
    {
      name: "Prof. Suresh Gupta",
      role: "Head of Administration",
      institution: "National Institute of Technology",
      location: "Bangalore, Karnataka",
      avatar: "/images/student4.jpg",
      rating: 5,
      testimonial:
        "We manage over 2000 students across multiple departments. EduManage's scalability and robust reporting features have been invaluable. The analytics help us make data-driven decisions for better student outcomes.",
      highlight: "Managing 2000+ students seamlessly",
    },
    {
      name: "Dr. Meera Joshi",
      role: "Director",
      institution: "Bright Future College",
      location: "Chennai, Tamil Nadu",
      avatar: "/images/student5.jpg",
      rating: 5,
      testimonial:
        "The transition from our old system was smooth, and the training provided was excellent. Our staff adapted quickly, and we've seen immediate improvements in efficiency and student satisfaction.",
      highlight: "Smooth transition from legacy system",
    },
  ];

  const stats = [
    { number: "500+", label: "Happy Institutions" },
    { number: "50K+", label: "Students Managed" },
    { number: "2K+", label: "Teachers Active" },
    { number: "99.9%", label: "Uptime Record" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index);
  };

  return (
    <section className="testimonials-section section section-light">
      <div className="testimonials-container">
        <div className="section-header text-center animate-on-scroll">
          <h2 className="heading-lg">
            Trusted by <span className="text-primary">Educational Leaders</span>
          </h2>
          <p className="text-lg">
            See what administrators and teachers say about transforming their
            institutions with EduManage
          </p>
        </div>

        <div className="testimonials-container animate-on-scroll">
          <div className="testimonial-carousel">
            <button className="carousel-btn prev-btn" onClick={prevTestimonial}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="testimonial-content">
              <div className="testimonial-card">
                <div className="quote-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 21C3 17.4 3 15.6 3.8 14.2C4.6 12.8 6 12 9 12V9C9 7.9 9.9 7 11 7H12C13.1 7 14 7.9 14 9V12C14 15.3 11.3 18 8 18H3V21Z"
                      fill="currentColor"
                    />
                    <path
                      d="M14 21C14 17.4 14 15.6 14.8 14.2C15.6 12.8 17 12 20 12V9C20 7.9 20.9 7 22 7H23C24.1 7 25 7.9 25 9V12C25 15.3 22.3 18 19 18H14V21Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                <div className="testimonial-text">
                  <p className="testimonial-quote">
                    "{testimonials[currentTestimonial].testimonial}"
                  </p>
                  <div className="testimonial-highlight">
                    <span className="highlight-badge">
                      ✨ {testimonials[currentTestimonial].highlight}
                    </span>
                  </div>
                </div>

                <div className="testimonial-author">
                  <div className="test-author-avatar">
                    <div className="avatar-ring">
                      <img
                        src={testimonials[currentTestimonial].avatar}
                        alt={testimonials[currentTestimonial].name}
                      />
                    </div>
                  </div>
                  <div className="author-info">
                    <div className="author-name">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="author-role">
                      {testimonials[currentTestimonial].role}
                    </div>
                    <div className="author-institution">
                      {testimonials[currentTestimonial].institution} •{" "}
                      {testimonials[currentTestimonial].location}
                    </div>
                    <div className="author-rating">
                      {[...Array(testimonials[currentTestimonial].rating)].map(
                        (_, i) => (
                          <svg
                            key={i}
                            className="star-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                              fill="currentColor"
                            />
                          </svg>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="carousel-btn next-btn" onClick={nextTestimonial}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="testimonial-indicators">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`indicator ${
                  index === currentTestimonial ? "active" : ""
                }`}
                onClick={() => goToTestimonial(index)}
              >
                <span className="sr-only">Go to testimonial {index + 1}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="testimonials-stats animate-on-scroll">
          <div className="test-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="testimonials-grid animate-on-scroll">
          <h3 className="grid-title heading-md text-center">
            More Success Stories
          </h3>
          <div className="mini-testimonials grid grid-3">
            <div className="mini-testimonial card">
              <div className="mini-quote">
                "Student engagement has increased significantly since we started
                using EduManage."
              </div>
              <div className="mini-author">
                <div className="mini-avatar"></div>
                <div className="mini-info">
                  <div className="mini-name">Sarah Johnson</div>
                  <div className="mini-role">English Teacher</div>
                </div>
              </div>
            </div>

            <div className="mini-testimonial card">
              <div className="mini-quote">
                "The reporting features have made our audits so much easier.
                Everything is well-organized."
              </div>
              <div className="mini-author">
                <div className="mini-avatar"></div>
                <div className="mini-info">
                  <div className="mini-name">Michael Chen</div>
                  <div className="mini-role">Admin Officer</div>
                </div>
              </div>
            </div>

            <div className="mini-testimonial card">
              <div className="mini-quote">
                "Parents love getting real-time updates about their children's
                attendance and grades."
              </div>
              <div className="mini-author">
                <div className="mini-avatar"></div>
                <div className="mini-info">
                  <div className="mini-name">Lisa Rodriguez</div>
                  <div className="mini-role">Class Coordinator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
