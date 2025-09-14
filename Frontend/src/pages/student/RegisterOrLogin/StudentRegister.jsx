import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  const formDataRef = useRef(null);
  const [formData, setFormData] = useState({
    // Personal Info
    name: "",
    email: "",
    studentPhone: "",
    dateOfJoining: "",
    photo: "",
    bloodGroup: "",
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
    aadharDocument: "",
    completeAddress: "",
    // Password Info
    password: "",
    confirmPassword: "",
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
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const checkSectionFilled = () => {
      setIsSectionFilled({
        personal: !!(
          formData.name &&
          formData.studentPhone &&
          formData.dateOfJoining &&
          formData.photo &&
          formData.bloodGroup
        ),
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
        password: !!formData.confirmPassword,
      });
    };

    checkSectionFilled();
  }, [formData]);

  const getAndSetValues = (values) => {
    console.log("Received values in parent:", values);
    setFormData((prevVals) => {
      const newFormData = { ...prevVals, ...values };
      console.log("Updated form data:", newFormData);
      return newFormData;
    });
  };

  const handleSubmit = async () => {
    const currentFormData = formDataRef.current;
    const formDataToSend = new FormData();
    for (const key in currentFormData) {
      formDataToSend.append(key, currentFormData[key]);
    }

    const url = "http://localhost:3000/student/register";
    try {
      const response = await fetch(url, {
        method: "POST",
        body: formDataToSend,
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Registration successful!");
        navigate("/student-login");
      } else {
        toast.error("Registration failed: " + data.message);
      }
    } catch (error) {
      console.error("Error during submission:", error);
    }
    setTimeout(() => {
      console.log("Final form data being submitted:", currentFormData);
    }, 500);
  };

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
              initialValues={formData}
            />
          )}
          {activeSection === "academic" && (
            <AcademicInfo
              getValues={getAndSetValues}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              initialValues={formData}
            />
          )}
          {activeSection === "family" && (
            <FamilyInfo
              getValues={getAndSetValues}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              initialValues={formData}
            />
          )}
          {activeSection === "document" && (
            <DocumentsAddress
              getValues={getAndSetValues}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              initialValues={formData}
            />
          )}
          {activeSection === "password" && (
            <PasswordInfo
              getValues={getAndSetValues}
              print={handleSubmit}
              sections={sections}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              initialValues={formData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
