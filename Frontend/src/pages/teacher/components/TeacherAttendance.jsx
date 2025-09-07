export default function TeacherAttendance() {
  return (
    <div className="teacher-attendance">
      <div className="attendance-time-section">
        <h3>Teacher Attendance & Time Management</h3>

        {/* Current Time Display */}
        <div className="current-time-display">
          <Clock size={24} />
          <div className="time-info">
            <span className="current-time">{timeData.currentTime}</span>
            <span className="current-date">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Check In/Out Section */}
        <div className="check-in-out-section">
          <div className="time-input-group">
            <label htmlFor="checkInTime">Check-in Time:</label>
            <div className="time-input-wrapper">
              <input
                type="time"
                id="checkInTime"
                value={timeData.checkInTime}
                onChange={(e) =>
                  handleTimeChange("checkInTime", e.target.value)
                }
                className="time-input"
              />
              <button
                className={`check-btn check-in ${
                  timeData.isCheckedIn ? "checked" : ""
                }`}
                onClick={handleCheckIn}
                disabled={timeData.isCheckedIn}
              >
                {timeData.isCheckedIn ? "Checked In" : "Check In"}
              </button>
            </div>
          </div>

          <div className="time-input-group">
            <label htmlFor="checkOutTime">Check-out Time:</label>
            <div className="time-input-wrapper">
              <input
                type="time"
                id="checkOutTime"
                value={timeData.checkOutTime}
                onChange={(e) =>
                  handleTimeChange("checkOutTime", e.target.value)
                }
                className="time-input"
              />
              <button
                className="check-btn check-out"
                onClick={handleCheckOut}
                disabled={!timeData.isCheckedIn}
              >
                Check Out
              </button>
            </div>
          </div>
        </div>

        {/* Time Summary */}
        <div className="time-summary">
          <div className="summary-item">
            <span className="summary-label">Status:</span>
            <span
              className={`summary-value ${
                timeData.isCheckedIn ? "checked-in" : "checked-out"
              }`}
            >
              {timeData.isCheckedIn ? "Checked In" : "Checked Out"}
            </span>
          </div>
          {timeData.checkInTime && (
            <div className="summary-item">
              <span className="summary-label">Check-in:</span>
              <span className="summary-value">{timeData.checkInTime}</span>
            </div>
          )}
          {timeData.checkOutTime && (
            <div className="summary-item">
              <span className="summary-label">Check-out:</span>
              <span className="summary-value">{timeData.checkOutTime}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
