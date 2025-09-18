const mongoose = require("mongoose");

// Batch/Class Schema
const BatchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserTeacher",
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserStudent",
  }],
  schedule: {
    days: [String], // ["Monday", "Wednesday", "Friday"]
    startTime: String, // "10:00"
    endTime: String, // "11:30"
  },
  status: {
    type: String,
    enum: ["active", "inactive", "completed"],
    default: "active",
  },
}, { timestamps: true });

// Attendance Schema
const AttendanceSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserTeacher",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  subject: {
    type: String,
    required: true,
  },
  attendanceRecords: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserStudent",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  totalStudents: Number,
  presentCount: Number,
  absentCount: Number,
}, { timestamps: true });

// Teacher Tasks Schema
const TaskSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserTeacher",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending",
  },
  dueDate: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  category: {
    type: String,
    enum: ["teaching", "administrative", "grading", "meeting", "other"],
    default: "other",
  },
}, { timestamps: true });

// Teacher Check-in/Check-out Schema
const TeacherAttendanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserTeacher",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
  },
  checkIn: {
    time: Date,
    location: String,
    method: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual",
    }
  },
  checkOut: {
    time: Date,
    location: String,
    method: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual",
    }
  },
  totalHours: Number,
  status: {
    type: String,
    enum: ["checked-in", "checked-out", "absent"],
    default: "absent",
  },
}, { timestamps: true });

const Batch = mongoose.model("Batch", BatchSchema);
const Attendance = mongoose.model("Attendance", AttendanceSchema);
const Task = mongoose.model("Task", TaskSchema);
const TeacherAttendance = mongoose.model("TeacherAttendance", TeacherAttendanceSchema);

module.exports = {
  Batch,
  Attendance,
  Task,
  TeacherAttendance,
};