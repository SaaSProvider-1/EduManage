import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import './AddTask.css';

const AddTask = () => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    type: 'assignment',
    batch: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    attachments: []
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const taskTypes = [
    { value: 'assignment', label: 'Assignment', icon: <BookOpen size={16} /> },
    { value: 'exam', label: 'Exam', icon: <AlertCircle size={16} /> },
    { value: 'project', label: 'Project', icon: <Users size={16} /> },
    { value: 'homework', label: 'Homework', icon: <BookOpen size={16} /> },
    { value: 'quiz', label: 'Quiz', icon: <CheckCircle size={16} /> }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: '#22c55e' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' }
  ];

  const batches = [
    'Batch A - Mathematics',
    'Batch B - Physics',
    'Batch C - Chemistry',
    'Batch D - Biology',
    'Batch E - Computer Science'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setTaskData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setTaskData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form
        setTaskData({
          title: '',
          description: '',
          type: 'assignment',
          batch: '',
          dueDate: '',
          dueTime: '',
          priority: 'medium',
          attachments: []
        });
      }, 3000);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = taskData.title && taskData.description && taskData.batch && taskData.dueDate;

  if (showSuccess) {
    return (
      <div className="add-task-container">
        <div className="success-message">
          <CheckCircle size={48} color="#22c55e" />
          <h2>Task Created Successfully!</h2>
          <p>Your task has been assigned to {taskData.batch}</p>
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
            <label htmlFor="type">Task Type</label>
            <select
              id="type"
              name="type"
              value={taskData.type}
              onChange={handleInputChange}
            >
              {taskTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
            <label htmlFor="batch">Select Batch *</label>
            <select
              id="batch"
              name="batch"
              value={taskData.batch}
              onChange={handleInputChange}
              required
            >
              <option value="">Choose a batch</option>
              {batches.map(batch => (
                <option key={batch} value={batch}>
                  {batch}
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
              {priorityLevels.map(priority => (
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
              style={{ display: 'none' }}
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
                title: '',
                description: '',
                type: 'assignment',
                batch: '',
                dueDate: '',
                dueTime: '',
                priority: 'medium',
                attachments: []
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
