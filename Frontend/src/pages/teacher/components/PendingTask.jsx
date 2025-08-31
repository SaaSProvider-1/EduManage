import React, { useState } from 'react';
import './PendingTask.css';

export default function PendingTask() {
  const [tasks] = useState([
    {
      id: 1,
      title: 'Grade Math Quiz - Grade 10',
      type: 'grading',
      priority: 'high',
      dueDate: '2025-09-02',
      studentsCount: 25,
      status: 'pending'
    },
    {
      id: 2,
      title: 'Prepare Physics Exam Questions',
      type: 'preparation',
      priority: 'medium',
      dueDate: '2025-09-05',
      studentsCount: null,
      status: 'pending'
    },
    {
      id: 3,
      title: 'Update Chemistry Assignment Marks',
      type: 'grading',
      priority: 'high',
      dueDate: '2025-09-03',
      studentsCount: 30,
      status: 'pending'
    },
    {
      id: 4,
      title: 'Prepare Weekly Report for Biology',
      type: 'report',
      priority: 'low',
      dueDate: '2025-09-07',
      studentsCount: null,
      status: 'pending'
    },
    {
      id: 5,
      title: 'Review Student Assignments - English',
      type: 'review',
      priority: 'medium',
      dueDate: '2025-09-04',
      studentsCount: 22,
      status: 'in-progress'
    }
  ]);

  const [filter, setFilter] = useState('all');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'grading': return '📝';
      case 'preparation': return '📋';
      case 'report': return '📊';
      case 'review': return '👁️';
      default: return '📌';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.priority === filter || task.status === filter;
  });

  const handleTaskComplete = (taskId) => {
    alert(`Task ${taskId} marked as completed!`);
  };

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
            <span className="summary-number">{tasks.filter(t => t.priority === 'high').length}</span>
            <span className="summary-label">High Priority</span>
          </span>
        </div>
      </div>

      <div className="tasks-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Tasks
        </button>
        <button 
          className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
          onClick={() => setFilter('high')}
        >
          High Priority
        </button>
        <button 
          className={`filter-btn ${filter === 'medium' ? 'active' : ''}`}
          onClick={() => setFilter('medium')}
        >
          Medium Priority
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
      </div>

      <div className="tasks-grid">
        {filteredTasks.map(task => (
          <div key={task.id} className="task-card">
            <div className="task-header">
              <div className="task-type-icon">{getTypeIcon(task.type)}</div>
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
                <div className="task-detail">
                  <span className="detail-icon">📅</span>
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                {task.studentsCount && (
                  <div className="task-detail">
                    <span className="detail-icon">👥</span>
                    <span>{task.studentsCount} students</span>
                  </div>
                )}
                <div className="task-detail">
                  <span className="detail-icon">⏱️</span>
                  <span className={`status ${task.status}`}>{task.status.replace('-', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="task-actions">
              {task.status === 'pending' ? (
                <>
                  <button 
                    className="action-btn start-btn"
                    onClick={() => alert(`Starting task: ${task.title}`)}
                  >
                    Start Task
                  </button>
                  <button 
                    className="action-btn complete-btn"
                    onClick={() => handleTaskComplete(task.id)}
                  >
                    Mark Complete
                  </button>
                </>
              ) : (
                <button 
                  className="action-btn complete-btn"
                  onClick={() => handleTaskComplete(task.id)}
                >
                  Mark Complete
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
          <p>All tasks for this filter are completed or no tasks match your criteria.</p>
        </div>
      )}
    </div>
  );
}
