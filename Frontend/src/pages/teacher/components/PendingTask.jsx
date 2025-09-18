import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "./PendingTask.css";

export default function PendingTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Fetch tasks from backend
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const token = localStorage.getItem("Token");

    if (!token) {
      setError("No token found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/teacher/tasks", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setTasks(result.tasks || []);
        console.log("Tasks loaded:", result.tasks);
      } else {
        toast.error(result.message || "Failed to fetch tasks");
        setError(result.message);
      }
    } catch (error) {
      console.error("Fetch tasks error:", error);
      toast.error("Failed to load tasks");
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
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

  const getTypeIcon = (type) => {
    switch (type) {
      case "grading":
      case "teaching":
        return "📝";
      case "preparation":
      case "administrative":
        return "📋";
      case "report":
        return "📊";
      case "review":
      case "meeting":
        return "👁️";
      case "other":
      default:
        return "📌";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.priority === filter || task.status === filter;
  });

  const handleTaskComplete = async (taskId) => {
    if (updatingTaskId) return;

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
          status: "completed",
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Task marked as completed!");
        fetchTasks(); // Refresh tasks
      } else {
        toast.error(result.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Update task error:", error);
      toast.error("Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleTaskStart = async (taskId) => {
    if (updatingTaskId) return;

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
          status: "in-progress",
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Task started!");
        fetchTasks(); // Refresh tasks
      } else {
        toast.error(result.message || "Failed to start task");
      }
    } catch (error) {
      console.error("Start task error:", error);
      toast.error("Failed to start task");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="pending-tasks">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-tasks">
        <div className="error-state">
          <h3>Failed to load tasks</h3>
          <p>{error}</p>
          <button onClick={fetchTasks} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-tasks">
      <div className="tasks-header">
        <h2>Pending Tasks</h2>
        <div className="tasks-summary">
          <span className="summary-item">
            <span className="summary-number">{tasks.length}</span>
            <span className="summary-label">Total Tasks</span>
          </span>
          <span className="summary-item">
            <span className="summary-number">
              {tasks.filter((t) => t.priority === "high").length}
            </span>
            <span className="summary-label">High Priority</span>
          </span>
        </div>
      </div>

      <div className="tasks-filters">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Tasks
        </button>
        <button
          className={`filter-btn ${filter === "high" ? "active" : ""}`}
          onClick={() => setFilter("high")}
        >
          High Priority
        </button>
        <button
          className={`filter-btn ${filter === "medium" ? "active" : ""}`}
          onClick={() => setFilter("medium")}
        >
          Medium Priority
        </button>
        <button
          className={`filter-btn ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>
      </div>

      <div className="tasks-grid">
        {filteredTasks.map((task) => (
          <div key={task._id || task.id} className="task-card">
            <div className="task-header">
              <div className="task-type-icon">
                {getTypeIcon(task.category || task.type)}
              </div>
              <div
                className="task-priority"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              >
                {task.priority}
              </div>
            </div>

            <div className="task-content">
              <h3 className="task-title">{task.title}</h3>
              <div className="task-details">
                {task.dueDate && (
                  <div className="task-detail">
                    <span className="detail-icon">📅</span>
                    <span>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {task.description && (
                  <div className="task-detail">
                    <span className="detail-icon">�</span>
                    <span>{task.description}</span>
                  </div>
                )}
                <div className="task-detail">
                  <span className="detail-icon">⏱️</span>
                  <span className={`status ${task.status}`}>
                    {task.status.replace("-", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="task-actions">
              {task.status === "pending" ? (
                <>
                  <button
                    className={`action-btn start-btn ${
                      updatingTaskId === (task._id || task.id) ? "loading" : ""
                    }`}
                    onClick={() => handleTaskStart(task._id || task.id)}
                    disabled={updatingTaskId === (task._id || task.id)}
                  >
                    {updatingTaskId === (task._id || task.id)
                      ? "Starting..."
                      : "Start Task"}
                  </button>
                  <button
                    className={`action-btn complete-btn ${
                      updatingTaskId === (task._id || task.id) ? "loading" : ""
                    }`}
                    onClick={() => handleTaskComplete(task._id || task.id)}
                    disabled={updatingTaskId === (task._id || task.id)}
                  >
                    {updatingTaskId === (task._id || task.id)
                      ? "Updating..."
                      : "Mark Complete"}
                  </button>
                </>
              ) : (
                <button
                  className={`action-btn complete-btn ${
                    updatingTaskId === (task._id || task.id) ? "loading" : ""
                  }`}
                  onClick={() => handleTaskComplete(task._id || task.id)}
                  disabled={
                    updatingTaskId === (task._id || task.id) ||
                    task.status === "completed"
                  }
                >
                  {updatingTaskId === (task._id || task.id)
                    ? "Updating..."
                    : task.status === "completed"
                    ? "Completed"
                    : "Mark Complete"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="no-tasks">
          <div className="no-tasks-icon">✅</div>
          <h3>No tasks found</h3>
          <p>
            All tasks for this filter are completed or no tasks match your
            criteria.
          </p>
        </div>
      )}
    </div>
  );
}
