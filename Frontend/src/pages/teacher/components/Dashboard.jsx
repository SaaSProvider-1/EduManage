import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  CheckCircle,
  Plus,
  RotateCcw,
  GraduationCap,
  Moon,
  Users,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";
import "./Dashboard.css";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [teacherData, setTeacherData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customTime, setCustomTime] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [isMobile] = useState(window.innerWidth < 768);

  // Attendance Management State
  const [selectedBatch, setSelectedBatch] = useState("Select Batch");
  const [selectedSubject, setSelectedSubject] = useState("Select Subject");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Refs for dropdown containers
  const batchDropdownRef = useRef(null);
  const subjectDropdownRef = useRef(null);

  const batchOptions = ["Batch A", "Batch B", "Batch C"];
  const subjectOptions = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Computer Science",
  ];

  const [students] = useState([
    { id: 1, name: "Alice Johnson", rollNo: "CS001", status: null },
    { id: 2, name: "Bob Smith", rollNo: "CS002", status: "present" },
    { id: 3, name: "Carol Davis", rollNo: "CS003", status: null },
    { id: 4, name: "David Wilson", rollNo: "CS004", status: null },
  ]);
  const [attendanceData, setAttendanceData] = useState({
    2: "present",
  });

  const [tasks] = useState([
    {
      id: 1,
      text: "Review homework submissions",
      completed: true,
      priority: "high",
    },
    {
      id: 2,
      text: "Prepare lesson plan for Math",
      completed: true,
      priority: "high",
    },
    { id: 3, text: "Grade quiz papers", completed: true, priority: "medium" },
    {
      id: 4,
      text: "Parent-teacher meeting at 3 PM",
      completed: true,
      priority: "high",
    },
    {
      id: 5,
      text: "Update student progress reports",
      completed: true,
      priority: "low",
    },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("Token");

    if (!token) {
      setError("No token found. Please login again.");
      setIsLoading(false);
      return;
    }

    fetch("http://localhost:3000/teacher/dashboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTeacherData(data.teacher);
          console.log(data.teacher);
        } else {
          toast.error(data.message || "Failed to fetch profile");
        }
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setError("Something went wrong while fetching profile.");
      })
      // .finally(() => {
      //   setTimeout(() => {
      //     setIsLoading(false);
      //   }, 2000);
      // });
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        batchDropdownRef.current &&
        !batchDropdownRef.current.contains(event.target)
      ) {
        setShowBatchDropdown(false);
      }
      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(event.target)
      ) {
        setShowSubjectDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    // Handle check-in logic here
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    // Handle check-out logic here
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getCompletedCount = () => {
    return tasks.filter((task) => task.completed).length;
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      // Add task logic here
      setNewTask("");
    }
  };

  // Attendance Management Functions
  const markAttendance = (studentId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAllPresent = () => {
    const allPresentData = {};
    students.forEach((student) => {
      allPresentData[student.id] = "present";
    });
    setAttendanceData(allPresentData);
  };

  const clearAll = () => {
    setAttendanceData({});
  };

  const getAttendanceCount = () => {
    const marked = Object.keys(attendanceData).length;
    const total = students.length;
    return { marked, total };
  };

  // Dropdown functions
  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setShowBatchDropdown(false);
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setShowSubjectDropdown(false);
  };

  const toggleBatchDropdown = () => {
    console.log("Batch dropdown clicked, current state:", showBatchDropdown);
    setShowBatchDropdown(!showBatchDropdown);
  };

  const toggleSubjectDropdown = () => {
    console.log(
      "Subject dropdown clicked, current state:",
      showSubjectDropdown
    );
    setShowSubjectDropdown(!showSubjectDropdown);
  };

  return (
    <div className="teacher-dashboard">
      {/* Header */}
      <div className="teacher-dashboard-header">
        <div className="header-left">
          <span className="dash-icon-container">
            <GraduationCap
              size={isMobile ? 40 : 32}
              className="dash-header-icon"
            />
          </span>
          <div className="dash-header-text">
            <h1>Teacher Dashboard</h1>
          </div>
        </div>
        <div className="header-right">
          <Moon size={20} />
          <span>{getGreeting()}!</span>
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="teacher-dashboard-body">
        {/* Welcome Card */}
        <div className="welcome-card">
          <div className="welcome-content">
            <div className="welcome-icon">
              <Moon size={32} />
            </div>
            <div className="welcome-text">
              <h2>
                {getGreeting()}, {teacherData?.name}!
              </h2>
              <p>
                Ready to make today a great learning experience? Let's check
                your schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Current Time Card */}
          <div className="dash-time-attendance">
            <div className="current-time-card">
              <div className="time-header">
                <Clock size={24} className="time-icon" />
                <h3>Current Time</h3>
              </div>
              <div className="time-display">
                <div className="current-time">{formatTime(currentTime)}</div>
                <div className="current-date">{formatDate(currentTime)}</div>
              </div>
            </div>

            {/* Attendance Tracking Card */}
            <div className="dash-attendance-card">
              <div className="dash-attendance-header">
                <GraduationCap size={24} className="dash-attendance-icon" />
                <div>
                  <h3>Attendance Tracking</h3>
                  <p className="dash-attendance-subtitle">
                    Record your check-in and check-out times
                  </p>
                </div>
              </div>

              <div className="dash-attendance-form">
                <div className="dash-form-row">
                  <label htmlFor="customTime">Custom Time</label>
                  <input
                    type="time"
                    id="customTime"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="Select time"
                    className="dash-form-input"
                  />
                </div>

                <div className="dash-attendance-buttons">
                  <button
                    className="dash-btn btn-check-in"
                    onClick={handleCheckIn}
                  >
                    ➡️ Check In
                  </button>
                  <button
                    className="dash-btn btn-check-out"
                    onClick={handleCheckOut}
                  >
                    ↩️ Check Out
                  </button>
                </div>

                <div className="system-status">
                  <div className="teacher-status-indicator"></div>
                  <span>System ready for attendance tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Tasks Card */}
          <div className="teacher-tasks-card">
            <div className="teacher-tasks-header">
              <div className="teacher-tasks-title">
                <CheckCircle size={24} />
                <h3>Today's Tasks</h3>
              </div>
              <div className="add-task-btn" onClick={handleAddTask}>
                <Plus size={16} />
                <span>Add Task</span>
              </div>
            </div>

            <div className="tasks-summary">
              <span>
                {getCompletedCount()} of {tasks.length} completed
              </span>
            </div>

            <div className="tasks-list">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item ${task.completed ? "completed" : ""}`}
                >
                  <div className="task-checkbox">
                    <CheckCircle
                      size={16}
                      className={task.completed ? "checked" : ""}
                    />
                  </div>
                  <span className="task-text">{task.text}</span>
                  <span
                    className="task-priority"
                    style={{ color: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>

            <div className="dash-progress-bar">
              <div className="dash-progress-label">Progress</div>
              <div className="dash-progress-container">
                <div
                  className="dash-progress-fill"
                  style={{
                    width: `${(getCompletedCount() / tasks.length) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="dash-progress-percentage">100%</div>
            </div>
          </div>

          {/* Attendance Management Card */}
          <div className="attendance-management-card">
            <div className="attendance-management-header">
              <div className="attendance-mgmt-title">
                <Users size={24} />
                <h3>Attendance Management</h3>
              </div>
              <div className="attendance-selectors">
                <div className="batch-custom-dropdown" ref={batchDropdownRef}>
                  <div className="batch-selector" onClick={toggleBatchDropdown}>
                    <span>{selectedBatch}</span>
                    <ChevronDown
                      size={16}
                      className={`dropdown-arrow ${
                        showBatchDropdown ? "open" : ""
                      }`}
                    />
                  </div>
                  {showBatchDropdown && (
                    <div className="batch-dropdown-options">
                      {batchOptions.map((batch) => (
                        <div
                          key={batch}
                          className="batch-dropdown-option"
                          onClick={() => handleBatchSelect(batch)}
                        >
                          {batch}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="batch-custom-dropdown" ref={subjectDropdownRef}>
                  <div
                    className="subject-selector"
                    onClick={toggleSubjectDropdown}
                  >
                    <span>{selectedSubject}</span>
                    <ChevronDown
                      size={16}
                      className={`dropdown-arrow ${
                        showSubjectDropdown ? "open" : ""
                      }`}
                    />
                  </div>
                  {showSubjectDropdown && (
                    <div className="batch-dropdown-options">
                      {subjectOptions.map((subject) => (
                        <div
                          key={subject}
                          className="batch-dropdown-option"
                          onClick={() => handleSubjectSelect(subject)}
                        >
                          {subject}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="attendance-actions">
              <div className="attendance-section-title">
                <h4>Mark Attendance</h4>
              </div>
              <div className="bulk-actions">
                <button
                  className="mark-all-present-btn"
                  onClick={markAllPresent}
                >
                  Mark All Present
                </button>
                <button className="clear-all-btn" onClick={clearAll}>
                  Clear All
                </button>
              </div>
            </div>

            <div className="students-attendance-list">
              {students.map((student) => (
                <div key={student.id} className="student-attendance-item">
                  <div className="student-details">
                    <div className="att-student-name">{student.name}</div>
                    <div className="att-student-roll">{student.rollNo}</div>
                  </div>
                  <div className="attendance-buttons">
                    <button
                      className={`attendance-action-btn present-btn ${
                        attendanceData[student.id] === "present" ? "active" : ""
                      }`}
                      onClick={() => markAttendance(student.id, "present")}
                    >
                      <UserCheck size={16} />
                    </button>
                    <button
                      className={`attendance-action-btn absent-btn ${
                        attendanceData[student.id] === "absent" ? "active" : ""
                      }`}
                      onClick={() => markAttendance(student.id, "absent")}
                    >
                      <UserX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="save-attendance">
              <button className="save-attendance-btn">
                <Clock size={16} />
                Save Attendance ({getAttendanceCount().marked}/
                {getAttendanceCount().total})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
