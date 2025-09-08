import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AcademicInfo from "./components/Academic-Info";
import ChooseSection from "./components/ChooseSection";
import DocumentsAddress from "./components/Document-Info";
import FamilyInfo from "./components/Family-Info";
import Footer from "./components/Footer";
import Header from "./components/Header";
import PersonalInfo from "./components/Personal-Info";
import "./StudentRegister.css";
import PasswordInfo from "./components/Password-Info";

export default function StudentRegister() {
  const sections = ["personal", "academic", "family", "document", "password"];
  const [activeSection, setActiveSection] = useState("personal");
  const [formData, setFormData] = useState({
    // Personal Info
    name: "",
    email: "",
    dateOfJoining: "",
    photo: "",
    // Academic Info
    class: "",
    schoolName: "",
    lastSchoolAttended: "",
    // Family Info
    fatherName: "",
    motherName: "",
    guardianPhone: "",
    // Document Info
    aadharNumber: "",
    aadharDocument: null,
    completeAddress: "",
    // Password Info
    password: '',
    confirmPassword: ''
  });
  const [isSectionFilled, setIsSectionFilled] = useState({
    personal: false,
    academic: false,
    family: false,
    document: false,
    password: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkSectionFilled = () => {
      setIsSectionFilled({
        personal: !!(formData.name && formData.dateOfJoining && formData.photo),
        academic: !!(
          formData.class &&
          formData.schoolName &&
          formData.lastSchoolAttended
        ),
        family: !!(
          formData.fatherName &&
          formData.motherName &&
          formData.guardianPhone
        ),
        document: !!(
          formData.aadharNumber &&
          formData.aadharDocument &&
          formData.completeAddress
        ),
        password: !!(
          formData.password &&
          formData.confirmPassword
        ),
      });
    };

    checkSectionFilled();
  }, [formData]);

  const getAndSetValues = (values) => {
    console.log(values);
    setFormData((prevVals) => ({ ...prevVals, ...values }));
  };

  const handleSubmit = async () => {
    const url = "http://localhost:3000/student-register";
    try {
      const response = await  fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        alert("Registration successful!");
        navigate('/student-login');
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error("Error during submission:", error);
    }
  }

  return (
    <div className="student-register">
      <div className="register-body">
        <Header />
        <ChooseSection
          isSectionFilled={isSectionFilled}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
        <div className="formAndFooter">
          {activeSection === "personal" && (
            <PersonalInfo
              getValues={getAndSetValues}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "academic" && (
            <AcademicInfo
              getValues={getAndSetValues}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "family" && (
            <FamilyInfo
              getValues={getAndSetValues}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "document" && (
            <DocumentsAddress
              getValues={getAndSetValues}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "password" && (
            <PasswordInfo
              getValues={getAndSetValues}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
