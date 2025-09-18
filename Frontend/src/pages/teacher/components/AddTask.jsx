import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Clock,
  BookOpen,
  Users,
  AlertCircle,
  CheckCircle,
  X,
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

  // Fetch batches from backend
  useEffect(() => {
    fetchBatches();
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
      <div className="add-task-header">
        <div className="header-content">
          <Plus size={24} color="#16a34a" />
          <h1>Create New Task</h1>
        </div>
        <p>Assign tasks, homework, and projects to your students</p>
      </div>

      <form onSubmit={handleSubmit} className="add-task-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
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

          <div className="form-group">
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
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
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

        <div className="form-row">
          <div className="form-group">
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

          <div className="form-group">
            <label htmlFor="priority">Priority Level</label>
            <select
              id="priority"
              name="priority"
              value={taskData.priority}
              onChange={handleInputChange}
            >
              {priorityLevels.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dueDate">Due Date *</label>
            <div className="input-with-icon">
              <Calendar size={18} />
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={taskData.dueDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dueTime">Due Time</label>
            <div className="input-with-icon">
              <Clock size={18} />
              <input
                type="time"
                id="dueTime"
                name="dueTime"
                value={taskData.dueTime}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="attachments">Attachments</label>
          <div className="file-upload-area">
            <input
              type="file"
              id="attachments"
              multiple
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <label htmlFor="attachments" className="file-upload-label">
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

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
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
            className="btn-primary"
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
