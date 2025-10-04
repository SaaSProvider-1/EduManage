import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  User,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./TeacherAttendance.css";
import { toast } from "react-toastify";

export default function TeacherAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchDate, setSearchDate] = useState("");
  const datePickerRef = useRef(null);

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      setLoading(true);
      const token = localStorage.getItem("Token");
      const url =
        import.meta.env.MODE === "development"
          ? `${import.meta.env.VITE_API_BASE_URL}/teacher/attendance-records`
          : `${
              import.meta.env.VITE_API_BASE_URL_PROD
            }/teacher/attendance-records`;

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("API Response:", data);

        if (data.success && data.attendanceDetails) {
          // Handle both single object and array responses
          let records = [];

          if (Array.isArray(data.attendanceDetails)) {
            records = data.attendanceDetails;
          } else {
            // If it's a single object, convert it to an array
            records = [data.attendanceDetails];
          }

          // Transform the data to match component expectations
          const transformedRecords = records.map((record) => ({
            date: record.date,
            checkIn: record.checkInTime,
            checkOut: record.checkOutTime,
            duration: record.duration,
          }));

          setAttendanceRecords(transformedRecords);
          toast.success("Records fetched successfully");
        } else {
          console.error("Failed to fetch attendance records:", data.message);
          toast.error("Records not found");
        }
      } catch (error) {
        console.error("Fetch attendance records error:", error);
        toast.error("Error while fetching");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    console.log("Attendance Records Updated:", attendanceRecords);
  }, [attendanceRecords]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSearchDate(formatDate(date));
    setShowDatePicker(false);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1, date2) => {
    return date1 && date2 && date1.toDateString() === date2.toDateString();
  };

  // Filter attendance records based on search date
  const getFilteredRecords = () => {
    if (!searchDate) {
      return attendanceRecords; // Show all records if no date is selected
    }

    return attendanceRecords.filter((record) => {
      // Convert record date string to Date object for comparison
      const recordDate = new Date(record.date);
      const searchDateObj = new Date(searchDate);

      return recordDate.toDateString() === searchDateObj.toDateString();
    });
  };

  const filteredRecords = getFilteredRecords();

  return (
    <div className="teacher-attendance-container">
      {/* Header */}
      <div className="teacher-attendance-header">
        <div className="teacher-header-content">
          <div className="teacher-header-icon">
            <Clock size={28} />
          </div>
          <div className="teacher-header-text">
            <h1>Teacher Attendance</h1>
            <p>Track your daily attendance</p>
          </div>
        </div>
      </div>

      <div className="teacher-attendance-body">
        {/* Statistics Cards */}
        {filteredRecords.length > 0 &&
          filteredRecords.map((record, idx) => (
            <div key={idx} className="teacher-stats-grid">
              <div className="teacher-stat-card">
                <div className="teacher-stat-content">
                  <div className="teacher-stat-text">
                    <span className="teacher-stat-label">Today's Hours</span>
                    <span className="teacher-stat-value">
                      {record.duration || "N/A"}
                    </span>
                    <span className="teacher-stat-change positive">
                      {record.duration ? (`+${record.duration}`) : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="teacher-stat-icon green">
                  <Clock size={24} />
                </div>
              </div>

              <div className="teacher-stat-card">
                <div className="teacher-stat-content">
                  <div className="teacher-stat-text">
                    <span className="teacher-stat-label">This Week</span>
                    <span className="teacher-stat-value">
                      {record.duration || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="teacher-stat-icon blue">
                  <Calendar size={24} />
                </div>
              </div>

              <div className="teacher-stat-card">
                <div className="teacher-stat-content">
                  <div className="teacher-stat-text">
                    <span className="teacher-stat-label">This Month</span>
                    <span className="teacher-stat-value">
                      {record.duration || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="teacher-stat-icon purple">
                  <User size={24} />
                </div>
              </div>

              <div className="teacher-stat-card">
                <div className="teacher-stat-content">
                  <div className="teacher-stat-text">
                    <span className="teacher-stat-label">Avg Check-in</span>
                    <span className="teacher-stat-value">
                      {record.checkIn || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="teacher-stat-icon orange">
                  <Clock size={24} />
                </div>
              </div>
            </div>
          ))}

        {/* Attendance Records Table */}
        <div className="attendance-records">
          <div className="record-header">
            <div className="record-title-section">
              <h3>Attendance Records</h3>
              <span className="record-count">
                {searchDate
                  ? `Showing ${filteredRecords.length} record${
                      filteredRecords.length !== 1 ? "s" : ""
                    } for ${searchDate}`
                  : `${filteredRecords.length} total records`}
              </span>
            </div>
            <div className="rec-search-bar" ref={datePickerRef}>
              <Search size={16} />
              <div
                className="custom-date-input"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <span className="date-text">
                  {searchDate || "Search your Attendance"}
                </span>
              </div>

              {showDatePicker && (
                <div className="custom-date-picker">
                  <div className="date-picker-header">
                    <button
                      className="nav-btn"
                      onClick={() => navigateMonth(-1)}
                      type="button"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="month-year">
                      {selectedDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      className="nav-btn"
                      onClick={() => navigateMonth(1)}
                      type="button"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="date-picker-grid">
                    <div className="weekdays">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div key={day} className="weekday">
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    <div className="days-grid">
                      {getDaysInMonth(selectedDate).map((date, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`day-btn ${
                            date ? (isToday(date) ? "today" : "") : "empty"
                          } ${
                            date && isSameDay(date, new Date(searchDate))
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => date && handleDateSelect(date)}
                          disabled={!date}
                        >
                          {date ? date.getDate() : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="date-picker-footer">
                    <button
                      className="today-btn"
                      onClick={() => handleDateSelect(new Date())}
                      type="button"
                    >
                      Today
                    </button>
                    <button
                      className="clear-btn"
                      onClick={() => {
                        setSearchDate("");
                        setShowDatePicker(false);
                      }}
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="loading-cell">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.duration}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-records">
                      {searchDate
                        ? `No attendance record found for ${searchDate}`
                        : "No attendance records available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
