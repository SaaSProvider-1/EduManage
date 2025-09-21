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
  RefreshCw,
} from "lucide-react";
import "./Dashboard.css";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customTime, setCustomTime] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isMobile] = useState(window.innerWidth < 768);

  // Add state for task operations
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Derived state from dashboard data
  const tasks = dashboardData?.recentTasks || [];
  const students = dashboardData?.recentStudents || [];
  const batchOptions = dashboardData?.batches || [];
  const subjectOptions = dashboardData?.subjects || [];

  // Attendance Management State
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  // Refs for dropdown containers
  const batchDropdownRef = useRef(null);
  const subjectDropdownRef = useRef(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("Token");

    if (!token) {
      setError("No token found. Please login again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://edu-manage-backend.onrender.com/teacher/dashboard-data",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
        // Initialize attendance data based on fetched batches
        if (result.data.batches && result.data.batches.length > 0) {
          const firstBatch = result.data.batches[0];
          setSelectedBatch(firstBatch);
          setSelectedSubject(firstBatch?.subject || firstBatch?.subjectName || '');
        }
        console.log("Dashboard data loaded:", result.data);
        console.log("Recent tasks:", result.data.recentTasks);
      } else {
        toast.error(result.message || "Failed to fetch dashboard data");
        setError(result.message);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Something went wrong while fetching dashboard data.");
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleCheckIn = async () => {
    const token = localStorage.getItem("Token");
    try {
      const response = await fetch(
        "http://localhost:3000/teacher/check-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "checkin",
            customTime: customTime || null,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Checked in successfully!");
        fetchDashboardData(); // Refresh dashboard data
      } else {
        toast.error(result.message || "Failed to check in");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem("Token");
    try {
      const response = await fetch(
        "http://localhost:3000/teacher/check-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "checkout",
            customTime: customTime || null,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Checked out successfully!");
        fetchDashboardData(); // Refresh dashboard data
      } else {
        toast.error(result.message || "Failed to check out");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      toast.error("Failed to check out");
    }
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
    if (!dashboardData?.recentTasks) return 0;
    return dashboardData.recentTasks.filter(
      (task) => task.status === "completed"
    ).length;
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (isLoading) return;

    const token = localStorage.getItem("Token");
    try {
      const response = await fetch("http://localhost:3000/teacher/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          priority: "medium",
          category: "other",
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Task added successfully!");
        setNewTaskTitle("");
        fetchDashboardData(); // Refresh dashboard data
      } else {
        console.error("Add task failed:", result.message);
        toast.error(result.message || "Failed to add task");
      }
    } catch (error) {
      console.error("Add task error:", error);
      toast.error("Failed to add task. Please try again.");
    }
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    if (isLoading || updatingTaskId) return;

    setUpdatingTaskId(taskId);
    const token = localStorage.getItem("Token");
    try {
      const response = await fetch("http://localhost:3000/teacher/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: taskId,
          status: newStatus,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Task updated successfully!");
        fetchDashboardData(); // Refresh dashboard data
      } else {
        console.error("Task update failed:", result.message);
        toast.error(result.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Update task error:", error);
      toast.error("Failed to update task. Please try again.");
    } finally {
      setUpdatingTaskId(null);
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
    if (!selectedBatch?.students) return;

    const allPresentData = {};
    selectedBatch.students.forEach((student) => {
      allPresentData[student._id] = "present";
    });
    setAttendanceData(allPresentData);
  };

  const clearAll = () => {
    setAttendanceData({});
  };

  const saveAttendance = async () => {
    if (!selectedBatch || !selectedSubject) {
      toast.error("Please select batch and subject");
      return;
    }

    if (Object.keys(attendanceData).length === 0) {
      toast.error("Please mark attendance for at least one student");
      return;
    }

    setIsMarkingAttendance(true);
    const token = localStorage.getItem("Token");

    try {
      const attendanceRecords = Object.entries(attendanceData).map(
        ([studentId, status]) => ({
          student: studentId,
          status: status,
        })
      );

      const response = await fetch("http://localhost:3000/teacher/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          batchId: selectedBatch.id,
          subject: selectedSubject,
          attendanceRecords: attendanceRecords,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Attendance saved successfully!");
        setAttendanceData({});
        fetchDashboardData(); // Refresh dashboard data
      } else {
        toast.error(result.message || "Failed to save attendance");
      }
    } catch (error) {
      console.error("Save attendance error:", error);
      toast.error("Failed to save attendance");
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const getAttendanceCount = () => {
    const marked = Object.keys(attendanceData).length;
    const total = selectedBatch?.students?.length || 0;
    return { marked, total };
  };

  // Dropdown functions
  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setSelectedSubject(batch.subject);
    setShowBatchDropdown(false);
    setAttendanceData({}); // Clear attendance data when batch changes
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject?.name || subject);
    setShowSubjectDropdown(false);
  };

  const toggleBatchDropdown = () => {
    setShowBatchDropdown(!showBatchDropdown);
  };

  const toggleSubjectDropdown = () => {
    setShowSubjectDropdown(!showSubjectDropdown);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" size={32} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="teacher-dashboard">
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="teacher-dashboard">
        <div className="no-data-container">
          <p>No dashboard data available</p>
          <button onClick={fetchDashboardData} className="retry-button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>
    );
  }

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
                {getGreeting()}, {dashboardData?.teacher?.name}!
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
                {getCompletedCount()} of{" "}
                {dashboardData?.recentTasks?.length || 0} completed
              </span>
            </div>

            <div className="tasks-list">
              {dashboardData?.recentTasks?.length > 0 ? (
                dashboardData.recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`task-item ${
                      task.status === "completed" ? "completed" : ""
                    } ${updatingTaskId === task.id ? "updating" : ""}`}
                    onClick={() =>
                      updatingTaskId !== task.id &&
                      handleTaskStatusUpdate(
                        task.id,
                        task.status === "completed" ? "pending" : "completed"
                      )
                    }
                  >
                    <div className="task-checkbox">
                      <CheckCircle
                        size={16}
                        className={task.status === "completed" ? "checked" : ""}
                      />
                    </div>
                    <span className="task-text">{task.title}</span>
                    <span
                      className="task-priority"
                      style={{ color: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              ) : (
                <p className="no-tasks">No tasks available</p>
              )}
            </div>

            <div className="add-task-section">
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                className="add-task-input"
              />
              <button onClick={handleAddTask} className="add-task-button">
                <Plus size={16} />
              </button>
            </div>

            <div className="dash-progress-bar">
              <div className="dash-progress-label">Progress</div>
              <div className="dash-progress-container">
                <div
                  className="dash-progress-fill"
                  style={{
                    width: `${
                      dashboardData?.recentTasks?.length > 0
                        ? (getCompletedCount() /
                            dashboardData.recentTasks.length) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <div className="dash-progress-percentage">
                {dashboardData?.recentTasks?.length > 0
                  ? Math.round(
                      (getCompletedCount() / dashboardData.recentTasks.length) *
                        100
                    )
                  : 0}
                %
              </div>
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
                    <span>{selectedBatch?.name || selectedBatch?.batchName || 'Select Batch'}</span>
                    <ChevronDown
                      size={16}
                      className={`dropdown-arrow ${
                        showBatchDropdown ? "open" : ""
                      }`}
                    />
                  </div>
                  {showBatchDropdown && (
                    <div className="batch-dropdown-options">
                      {batchOptions.map((batch, index) => (
                        <div
                          key={batch?.id || batch?.name || index}
                          className="batch-dropdown-option"
                          onClick={() => handleBatchSelect(batch)}
                        >
                          {batch?.name || batch?.batchName || batch}
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
                    <span>{selectedSubject || 'Select Subject'}</span>
                    <ChevronDown
                      size={16}
                      className={`dropdown-arrow ${
                        showSubjectDropdown ? "open" : ""
                      }`}
                    />
                  </div>
                  {showSubjectDropdown && (
                    <div className="batch-dropdown-options">
                      {subjectOptions.map((subject, index) => (
                        <div
                          key={subject?.id || subject?.name || index}
                          className="batch-dropdown-option"
                          onClick={() => handleSubjectSelect(subject)}
                        >
                          {subject?.name || subject}
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
              {students.map((student, index) => (
                <div key={student?.id || student?._id || index} className="student-attendance-item">
                  <div className="student-details">
                    <div className="att-student-name">{student?.name || 'Unknown Student'}</div>
                    <div className="att-student-roll">{student?.rollNo || student?.rollNumber || 'N/A'}</div>
                  </div>
                  <div className="attendance-buttons">
                    <button
                      className={`attendance-action-btn present-btn ${
                        attendanceData[student?.id || student?._id] === "present" ? "active" : ""
                      }`}
                      onClick={() => markAttendance(student?.id || student?._id, "present")}
                    >
                      <UserCheck size={16} />
                    </button>
                    <button
                      className={`attendance-action-btn absent-btn ${
                        attendanceData[student?.id || student?._id] === "absent" ? "active" : ""
                      }`}
                      onClick={() => markAttendance(student?.id || student?._id, "absent")}
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
