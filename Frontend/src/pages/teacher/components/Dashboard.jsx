import React, { useState } from "react";
import {
  Clock,
  Calendar,
  PlusCircleIcon,
  LayoutDashboard,
  UserCheck,
  SquareChartGantt,
  BookOpenCheck,
  BadgeAlert,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats] = useState({
    myBatches: 5,
    totalStudents: 125,
    pendingTasks: 8,
    upcomingClasses: 3,
    attendanceToday: 92,
    assignmentsToGrade: 15,
  });

  const [timeData, setTimeData] = useState({
    checkInTime: "",
    checkOutTime: "",
    currentTime: new Date().toLocaleTimeString(),
    isCheckedIn: false,
  });
  const [isComplete, setIsComplete] = useState(0);
  const [isMobile] = useState(window.innerWidth < 768);

  // Update current time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeData((prev) => ({
        ...prev,
        currentTime: new Date().toLocaleTimeString(),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    const formatTimeForInput = (date) =>
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const currentTime = formatTimeForInput(new Date());
    setTimeData((prev) => ({
      ...prev,
      checkInTime: currentTime,
      isCheckedIn: true,
    }));

    // Show success toast notification
    toast.success(`✅ Checked in at ${currentTime}`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        width: "max-content",
        padding: "10px 30px",
      },
    });
  };

  const handleCheckOut = () => {
    const currentTime = new Date().toLocaleTimeString();
    setTimeData((prev) => ({
      ...prev,
      checkOutTime: currentTime,
      isCheckedIn: false,
    }));

    // Show info toast notification
    toast.info(`🏃‍♂️ Checked out at ${currentTime}`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleTimeChange = (field, value) => {
    setTimeData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="teacher-dashboard">
      <div className="teacher-dashboard-header">
        <span className="dash-header-title">
          <p className="header-icon">
            <LayoutDashboard size={isMobile ? 18 : 24} />
          </p>
          <h3>Teacher Dashboard</h3>
        </span>
        <div className="welcome-message">
          <span className="greeting-icon">👋</span>
          <span>Welcome back, Teacher!</span>
        </div>
      </div>

      <div className="greetings-msg">
        <div className="msg">
          <div className="msg-body">
            <h2>Good morning, Mr. John!</h2>
            <p>Ready to inspire minds today? Here's your quick overview.</p>
            <span className="msg-stats">
              <p> 12 classes today</p>
              <p>6 subjects</p>
            </span>
          </div>
          <div className="header-btns">
            <button>Quick Attendance</button>
            <button>View Schedule</button>
          </div>
        </div>
      </div>

      <div className="attend-actions">
        <div className="teacher-attendance">
          <div className="attendance-time-section">
            <h3>Teacher Attendance</h3>

            {/* Current Time Display with Check In/Out Controls */}
            <div className="current-time-display">
              <div className="time-info">
                <span className="current-time">
                  <Clock size={isMobile ? 18 : 24} className="time-icon" />
                  <p>{timeData.currentTime}</p>
                </span>
                <span className="current-date">
                  <Calendar size={isMobile ? 18 : 24} className="date-icon" />
                  <p>{new Date().toLocaleDateString()}</p>
                </span>
              </div>

              <div className="time-display-right">
                <div className="inline-check-controls">
                  <div className="inline-time-input-group">
                    <label htmlFor="checkInTime">Check-in:</label>
                    <div className="inline-time-input-wrapper">
                      <input
                        type="time"
                        id="checkInTime"
                        value={timeData.checkInTime}
                        onChange={(e) =>
                          handleTimeChange("checkInTime", e.target.value)
                        }
                        className="inline-time-input"
                      />
                      <button
                        className={`inline-check-btn check-in ${
                          timeData.isCheckedIn ? "checked" : ""
                        }`}
                        onClick={handleCheckIn}
                        disabled={timeData.isCheckedIn}
                      >
                        {timeData.isCheckedIn ? "✓" : "In"}
                      </button>
                    </div>
                  </div>

                  <div className="inline-time-input-group">
                    <label htmlFor="checkOutTime">Check-out:</label>
                    <div className="inline-time-input-wrapper">
                      <input
                        type="time"
                        id="checkOutTime"
                        value={timeData.checkOutTime}
                        onChange={(e) =>
                          handleTimeChange("checkOutTime", e.target.value)
                        }
                        className="inline-time-input"
                      />
                      <button
                        className="inline-check-btn check-out"
                        onClick={handleCheckOut}
                        disabled={!timeData.isCheckedIn}
                      >
                        Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-quick-actions">
          <div className="quick-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="action-contents">
            <div className="track-attendance action-item">
              <span className="icon-span">
                <UserCheck size={isMobile ? 22 : 26} />
              </span>
              <span className="text-span">
                <h4>Mark Attendance</h4>
                <p>Quick attendance making for today's classes.</p>
              </span>
              <button className="act-btn">Mark Attendance</button>
            </div>
            <div className="manage-batches action-item">
              <span className="icon-span">
                <SquareChartGantt size={isMobile ? 22 : 26} />
              </span>
              <span className="text-span">
                <h4>Manage Batches</h4>
                <p>View and manage your class batches and schedules.</p>
              </span>
              <button className="act-btn">View Batches</button>
            </div>
            <div className="manage-exams action-item">
              <span className="icon-span">
                <BookOpenCheck size={isMobile ? 22 : 26} />
              </span>
              <span className="text-span">
                <h4>Manage Exams</h4>
                <p>Set up and review exams for your students.</p>
              </span>
              <button className="act-btn">Manage Exams</button>
            </div>
            <div className="pending-actions action-item">
              <span className="icon-span">
                <BadgeAlert size={isMobile ? 22 : 26} />
              </span>
              <span className="text-span">
                <h4>Pending Tasks</h4>
                <p>You have {stats.pendingTasks} tasks to complete.</p>
              </span>
              <button className="act-btn">View all</button>
            </div>
          </div>
        </div>
      </div>
      <div className="add-task">
        <div className="dash-add-task-header">
          <span>Add New Task</span>
        </div>
        <div className="add-task-body">
          <input
            type="text"
            className="new-task-input"
            placeholder="Enter new task..."
          />
          <button className="add-task-btn">
            <span>
              <PlusCircleIcon size={isMobile ? 18 : 22} />
            </span>
            <p>Add Task</p>
          </button>
        </div>
      </div>
    </div>
  );
}
