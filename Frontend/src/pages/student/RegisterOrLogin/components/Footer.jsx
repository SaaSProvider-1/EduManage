import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import "./Footer.css";

export default function Footer({ sections, activeSection, setActiveSection }) {
  const currentIndex = sections.indexOf(activeSection);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
    }
  };
  return (
    <div className="personal-footer">
      <button
        className="prev-btn"
        onClick={handlePrev}
        disabled={currentIndex === 0}
      >
        <span className="prev-icon">
          <ArrowBigLeft />
        </span>
        <p>Previous</p>
      </button>
      <button
        className="next-btn"
        onClick={handleNext}
        disabled={currentIndex === sections.length - 1}
      >
        <span className="next-icon">
          <ArrowBigRight />
        </span>
        <p>Next</p>
      </button>
    </div>
  );
}
