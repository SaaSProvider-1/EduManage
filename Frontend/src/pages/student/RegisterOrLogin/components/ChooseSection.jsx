import { User, GraduationCap, Users, FileCheck, Lock } from "lucide-react";
import "./ChooseSection.css";

export default function ChooseSection({
  isSectionFilled,
  activeSection,
  setActiveSection,
}) {
  const sectionPercentages = {
    personal: 10,
    academic: 37,
    family: 63,
    document: 90,
    password: 100,
  };

  let progressPercent = 0;

  // Loop through sections and pick the highest completed one
  for (const section in isSectionFilled) {
    if (isSectionFilled[section]) {
      progressPercent = sectionPercentages[section];
    }
  }

  return (
    <div className="choose-section">
      <div className="progress-container">
        <span
          className="progress-bar"
          style={{
            width: `${progressPercent}%`,
          }}
        ></span>
      </div>
      <div className="all-sections">
        <span
          className={`personal-section choose-sec ${
            activeSection === "personal" && "active"
          }`}
          onClick={() => setActiveSection("personal")}
        >
          <span
            className="pers-icon choose-icon"
            style={{
              backgroundColor:
                isSectionFilled.personal && "hsl(233, 100%, 40%)",
            }}
          >
            <User strokeWidth={2.5} size={26} />
          </span>
          <span className="pers-text">Personal Information</span>
        </span>
        <span
          className={`personal-section choose-sec ${
            activeSection === "academic" && "active"
          }`}
          onClick={() => setActiveSection("academic")}
        >
          <span
            className="pers-icon choose-icon"
            style={{
              backgroundColor:
                isSectionFilled.academic && "hsl(233, 100%, 40%)",
            }}
          >
            <GraduationCap strokeWidth={2.5} size={26} />
          </span>
          <span className="pers-text">Academic Information</span>
        </span>
        <span
          className={`personal-section choose-sec ${
            activeSection === "family" && "active"
          }`}
          onClick={() => setActiveSection("family")}
        >
          <span
            className="pers-icon choose-icon"
            style={{
              backgroundColor: isSectionFilled.family && "hsl(233, 100%, 40%)",
            }}
          >
            <Users strokeWidth={2.5} size={24} />
          </span>
          <span className="pers-text">Family Information</span>
        </span>
        <span
          className={`personal-section choose-sec ${
            activeSection === "document" && "active"
          }`}
          onClick={() => setActiveSection("document")}
        >
          <span
            className="pers-icon choose-icon"
            style={{
              backgroundColor:
                isSectionFilled.document && "hsl(233, 100%, 40%)",
            }}
          >
            <FileCheck strokeWidth={2.5} size={24} />
          </span>
          <span className="pers-text">Documents & Address</span>
        </span>
        <span
          className={`personal-section choose-sec ${
            activeSection === "password" && "active"
          }`}
          onClick={() => setActiveSection("password")}
        >
          <span
            className="pers-icon choose-icon"
            style={{
              backgroundColor:
                isSectionFilled.password && "hsl(233, 100%, 40%)",
            }}
          >
            <Lock strokeWidth={2.5} size={24} />
          </span>
          <span className="pers-text">Password & Security</span>
        </span>
      </div>
    </div>
  );
}
