import { useEffect, useState } from "react";
import { User, ArrowBigLeft, ArrowBigRight } from "lucide-react";

import "./Personal-Info.css";

export default function PersonalInfo({
  getValues,
  sections,
  activeSection,
  setActiveSection,
}) {
  const [isMobile] = useState(window.innerWidth < 768);
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    dateOfJoining: "",
    photo: "",
  });
  const currentIndex = sections.indexOf(activeSection);

  const handleChages = (e) => {
    const { name, value, file } = e.target;
    setFormValues((prevVals) => ({
      ...prevVals,
      [name]: file ? e.target.file[0] : value,
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
    }
    getValues(formValues);
  };

  return (
    <div className="personal-info">
      <div className="personal-header">
        <div className="icon-container">
          <User className="user-icon" strokeWidth={2.5} size={25} />
        </div>
        <div className="header-desc">
          <h2>Personal Information</h2>
          <p className="personal-hader-desc">Basic student details and photo</p>
        </div>
      </div>
      <form className="personal-form">
        <div className="pers-inp-1 form">
          <label htmlFor="name">Student Name *</label>
          <input
            name="name"
            id="name"
            type="text"
            placeholder="Enter student's full name"
            className="pers-name"
            onChange={(e) => handleChages(e)}
          />
        </div>
        <div className="pers-inp-1 form">
          <label htmlFor="email">Student Email *</label>
          <input
            name="email"
            id="email"
            type="email"
            placeholder="Enter student's Email address"
            className="pers-name"
            onChange={(e) => handleChages(e)}
          />
        </div>
        <div className="pers-inp-1 form">
          <label htmlFor="guardianPhone" className="form-label">
            Student Phone Number {"(optional)"}
          </label>
          <input
            type="tel"
            id="guardianPhone"
            name="guardianPhone"
            // value={formData.guardianPhone}
            // onChange={handleInputChange}
            className="pers-name"
            placeholder="Enter guardian's phone number"
            maxLength="10"
            pattern="[0-9]{10}"
            required
          />
        </div>
        <div className="pers-inp-2 form">
          <label htmlFor="date">Date of joining *</label>
          <input
            name="dateOfJoining"
            id="date"
            type="date"
            placeholder="Enter student's full name"
            className="pers-name"
            onChange={(e) => handleChages(e)}
          />
        </div>
        <div className="pers-inp-3 form">
          <label htmlFor="file">Student photo</label>
          <input
            name="photo"
            id="file"
            type="file"
            placeholder="Enter student's full name"
            className="pers-name"
            onChange={(e) => handleChages(e)}
          />
        </div>
      </form>

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
          disabled={
            (currentIndex === sections.length - 1 && formValues.name === "",
            formValues.dateOfJoining === "",
            formValues.photo === "")
          }
        >
          <span className="next-icon">
            <ArrowBigRight />
          </span>
          <p>Next</p>
        </button>
      </div>
    </div>
  );
}
