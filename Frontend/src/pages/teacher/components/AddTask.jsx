import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Calendar,
  Clock,
  BookOpen,
  Users,
  AlertCircle,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import "./AddTask.css";

const AddTask = () => {
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    category: "teaching", // Changed from type to category to match backend
    batch: "",
    dueDate: "",
    dueTime: "",
    priority: "medium",
    attachments: [],
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const datePickerRef = useRef(null);

  // Fetch batches from backend
  useEffect(() => {
    fetchBatches();
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchBatches = async () => {
    const token = localStorage.getItem("Token");

    if (!token) {
      toast.error("No token found. Please login again.");
      setLoadingBatches(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/teacher/batches", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setBatches(result.batches || []);
      } else {
        toast.error(result.message || "Failed to fetch batches");
      }
    } catch (error) {
      console.error("Fetch batches error:", error);
      toast.error("Failed to load batches");
    } finally {
      setLoadingBatches(false);
    }
  };

  const taskCategories = [
    { value: "teaching", label: "Teaching", icon: <BookOpen size={16} /> },
    {
      value: "administrative",
      label: "Administrative",
      icon: <AlertCircle size={16} />,
    },
    { value: "grading", label: "Grading", icon: <CheckCircle size={16} /> },
    { value: "meeting", label: "Meeting", icon: <Users size={16} /> },
    { value: "other", label: "Other", icon: <BookOpen size={16} /> },
  ];

  const priorityLevels = [
    { value: "low", label: "Low", color: "#22c55e" },
    { value: "medium", label: "Medium", color: "#f59e0b" },
    { value: "high", label: "High", color: "#ef4444" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setTaskData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index) => {
    setTaskData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // Date picker helper functions
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  };

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const formattedDate = formatDateForInput(date);
    setTaskData(prev => ({
      ...prev,
      dueDate: formattedDate
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem("Token");

    if (!token) {
      toast.error("No token found. Please login again.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare task data for backend
      const taskPayload = {
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: taskData.dueDate
          ? new Date(
              `${taskData.dueDate}${
                taskData.dueTime ? "T" + taskData.dueTime : ""
              }`
            ).toISOString()
          : null,
      };

      const response = await fetch("http://localhost:3000/teacher/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskPayload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Task created successfully!");
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // Reset form
          setTaskData({
            title: "",
            description: "",
            category: "teaching",
            batch: "",
            dueDate: "",
            dueTime: "",
            priority: "medium",
            attachments: [],
          });
        }, 3000);
      } else {
        toast.error(result.message || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    taskData.title && taskData.description && taskData.dueDate;

  if (showSuccess) {
    return (
      <div className="add-task-container">
        <div className="success-message">
          <CheckCircle size={48} color="#22c55e" />
          <h2>Task Created Successfully!</h2>
          <p>Your task has been added to your task list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-task-container">
      <div className="add-task-cont-header">
        <div className="task-header-content">
          <span className="task-header-icon">
            <Plus size={24} color="#16a34a" />
          </span>
          <h1>Create New Task</h1>
        </div>
        <p>Assign tasks, homework, and projects to your students</p>
      </div>

      <form onSubmit={handleSubmit} className="add-task-form">
        <div className="add-task-form-row">
          <div className="add-task-form-group">
            <label htmlFor="title">
              Task Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={taskData.title}
              onChange={handleInputChange}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="add-task-form-group">
            <label htmlFor="batch">Select Batch (Optional)</label>
            <select
              id="batch"
              name="batch"
              value={taskData.batch}
              onChange={handleInputChange}
              disabled={loadingBatches}
            >
              <option value="">
                {loadingBatches
                  ? "Loading batches..."
                  : "Choose a batch (optional)"}
              </option>
              {batches.map((batch) => (
                <option
                  key={batch.id || batch._id}
                  value={batch.batchName || batch.name}
                >
                  {batch.batchName || batch.name} - {batch.subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="add-task-form-row">
          <div className="add-task-form-group">
            <label htmlFor="category">Task Category</label>
            <select
              id="category"
              name="category"
              value={taskData.category}
              onChange={handleInputChange}
            >
              {taskCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="add-task-form-group">
            <label htmlFor="dueDate">
              Due Date <span className="required">*</span>
            </label>
            <div className="custom-date-input-container" ref={datePickerRef}>
              <div 
                className="custom-date-input" 
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar size={18} />
                <span className="date-text">
                  {taskData.dueDate ? formatDate(new Date(taskData.dueDate)) : "Select Due Date"}
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
                        year: "numeric" 
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
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                      ))}
                    </div>
                    
                    <div className="days-grid">
                      {getDaysInMonth(selectedDate).map((date, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`day-btn ${
                            date ? (isToday(date) ? 'today' : '') : 'empty'
                          } ${
                            date && taskData.dueDate && isSameDay(date, new Date(taskData.dueDate)) ? 'selected' : ''
                          }`}
                          onClick={() => date && handleDateSelect(date)}
                          disabled={!date}
                        >
                          {date ? date.getDate() : ''}
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
                        setTaskData(prev => ({ ...prev, dueDate: "" }));
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
        </div>

        <div className="add-task-form-row">
          <div className="add-task-form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={taskData.description}
              onChange={handleInputChange}
              placeholder="Provide detailed instructions for the task"
              rows="4"
              required
            />
          </div>

          <div className="add-task-form-group">
            <label htmlFor="attachments">Attachments</label>
            <div className="add-task-file-upload-area">
              <input
                type="file"
                id="attachments"
                multiple
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <label
                htmlFor="attachments"
                className="add-task-file-upload-label"
              >
                <Plus size={20} />
                Add Files
              </label>
              {taskData.attachments.length > 0 && (
                <div className="attachments-list">
                  {taskData.attachments.map((file, index) => (
                    <div key={index} className="attachment-item">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="remove-attachment"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="add-task-form-actions">
          <button
            type="button"
            className="add-task-btn-secondary"
            onClick={() => {
              setTaskData({
                title: "",
                description: "",
                category: "teaching",
                batch: "",
                dueDate: "",
                dueTime: "",
                priority: "medium",
                attachments: [],
              });
            }}
          >
            Clear Form
          </button>

          <button
            type="submit"
            className="add-task-btn-primary"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Creating Task...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Task
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTask;
