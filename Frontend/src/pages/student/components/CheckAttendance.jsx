import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Calendar, TrendingUp, Users, Award } from "lucide-react";
import "./CheckAttendance.css";

export default function CheckAttendance() {
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [selectedYear, setSelectedYear] = useState("2024");

  // Sample attendance data
  const monthlyData = [
    { month: "Jan", attendance: 85 },
    { month: "Feb", attendance: 95 },
    { month: "Mar", attendance: 76 },
    { month: "Apr", attendance: 88 },
    { month: "May", attendance: 98 },
    { month: "Jun", attendance: 82 },
  ];

  const recentAttendance = [
    {
      date: "Sep 09, 2024",
      status: "Present",
      subject: "Mathematics",
      time: "09:00 AM",
    },
    {
      date: "Sep 08, 2024",
      status: "Present",
      subject: "Science",
      time: "10:30 AM",
    },
    { date: "Sep 07, 2024", status: "Absent", subject: "English", time: "-" },
    {
      date: "Sep 06, 2024",
      status: "Present",
      subject: "History",
      time: "02:00 PM",
    },
    {
      date: "Sep 05, 2024",
      status: "Present",
      subject: "Physics",
      time: "11:15 AM",
    },
    {
      date: "Sep 04, 2024",
      status: "Late",
      subject: "Chemistry",
      time: "09:15 AM",
    },
    {
      date: "Sep 03, 2024",
      status: "Present",
      subject: "Mathematics",
      time: "09:00 AM",
    },
  ];

  return (
    <div className="check-attendance">
      {/* Header Section */}
      <div className="attendance-header">
        <div className="att-header-content">
          <h1>Attendance Overview</h1>
          <p>Track your class attendance and progress</p>
        </div>
        <div className="header-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="control-select"
          >
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
            <option value="Daily">Daily</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="control-select"
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
      </div>

      <div className="att-chart">
        {/* Chart Section */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>Monthly Attendance Trend</h2>
          </div>
          <div className="att-chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }}
                  activeDot={{
                    r: 6,
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                    fill: "white",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="att-stats-grid">
          <div className="att-stat-card">
            <div className="att-stat-header">
              <span className="att-stat-title">Overall Attendance</span>
              <Calendar size={16} className="att-stat-icon" />
            </div>
            <div className="att-stat-value-section">
              <h2 className="att-stat-number blue">87%</h2>
              <span className="att-stat-trend positive">
                <TrendingUp size={12} />
                +2.5% from last month
              </span>
            </div>
          </div>

          <div className="att-stat-card">
            <div className="att-stat-header">
              <span className="att-stat-title">Classes Attended</span>
              <Users size={16} className="att-stat-icon" />
            </div>
            <div className="att-stat-value-section">
              <h2 className="att-stat-number green">104</h2>
              <span className="att-stat-subtitle">
                out of 120 total classes
              </span>
            </div>
          </div>

          <div className="att-stat-card">
            <div className="att-stat-header">
              <span className="att-stat-title">This Month</span>
              <Award size={16} className="att-stat-icon" />
            </div>
            <div className="att-stat-value-section">
              <h2 className="att-stat-number orange">95%</h2>
              <span className="att-stat-trend positive">
                <TrendingUp size={12} />
                Excellent performance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance Section */}
      <div className="recent-attendance">
        <div className="recent-header">
          <h2>Recent Attendance</h2>
        </div>
        <div className="attendance-list">
          {recentAttendance.map((record, index) => (
            <div key={index} className="attendance-item">
              <div className="attendance-info">
                <div className="attendance-date">
                  <Calendar size={14} />
                  <span>{record.date}</span>
                </div>
                <div className="attendance-subject">{record.subject}</div>
              </div>
              <div className="attendance-right">
                <span className="attendance-time">{record.time}</span>
                <div
                  className={`attendance-status ${record.status.toLowerCase()}`}
                >
                  <span className="status-dot"></span>
                  {record.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
