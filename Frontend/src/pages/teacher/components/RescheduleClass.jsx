import React, { useState } from 'react';
import './RescheduleClass.css';

export default function RescheduleClass() {
  const [activeTab, setActiveTab] = useState('class');
  const [classes] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      grade: 'Grade 10',
      originalDate: '2025-09-02',
      originalTime: '10:00 AM',
      room: 'Room 101',
      studentsCount: 25
    },
    {
      id: 2,
      subject: 'Physics',
      grade: 'Grade 11',
      originalDate: '2025-09-03',
      originalTime: '2:00 PM',
      room: 'Room 203',
      studentsCount: 30
    }
  ]);

  const [exams] = useState([
    {
      id: 1,
      subject: 'Chemistry',
      grade: 'Grade 12',
      originalDate: '2025-09-05',
      originalTime: '9:00 AM',
      duration: '2 hours',
      studentsCount: 28
    },
    {
      id: 2,
      subject: 'Biology',
      grade: 'Grade 11',
      originalDate: '2025-09-06',
      originalTime: '11:00 AM',
      duration: '1.5 hours',
      studentsCount: 32
    }
  ]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });

  const handleReschedule = (item) => {
    setSelectedItem(item);
    setRescheduleData({
      newDate: '',
      newTime: '',
      reason: ''
    });
  };

  const handleSubmitReschedule = () => {
    if (!rescheduleData.newDate || !rescheduleData.newTime || !rescheduleData.reason) {
      alert('Please fill all required fields');
      return;
    }
    
    alert(`${activeTab === 'class' ? 'Class' : 'Exam'} rescheduled successfully!`);
    setSelectedItem(null);
    setRescheduleData({ newDate: '', newTime: '', reason: '' });
  };

  const renderItems = (items) => {
    return items.map(item => (
      <div key={item.id} className="schedule-item">
        <div className="item-header">
          <div className="item-info">
            <h3>{item.subject} - {item.grade}</h3>
            {item.room && <span className="room-info">📍 {item.room}</span>}
            {item.duration && <span className="duration-info">⏰ {item.duration}</span>}
          </div>
          <div className="item-badge">
            👥 {item.studentsCount} students
          </div>
        </div>
        
        <div className="item-details">
          <div className="schedule-info">
            <div className="schedule-detail">
              <span className="detail-label">Current Date:</span>
              <span className="detail-value">{new Date(item.originalDate).toLocaleDateString()}</span>
            </div>
            <div className="schedule-detail">
              <span className="detail-label">Current Time:</span>
              <span className="detail-value">{item.originalTime}</span>
            </div>
          </div>
          
          <button 
            className="reschedule-btn"
            onClick={() => handleReschedule(item)}
          >
            📅 Reschedule {activeTab === 'class' ? 'Class' : 'Exam'}
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="reschedule-container">
      <div className="reschedule-header">
        <h2>Reschedule Classes & Exams</h2>
        <p>Manage and reschedule your classes and exams with proper notifications to students</p>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'class' ? 'active' : ''}`}
            onClick={() => setActiveTab('class')}
          >
            📚 Classes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'exam' ? 'active' : ''}`}
            onClick={() => setActiveTab('exam')}
          >
            📝 Exams
          </button>
        </div>
      </div>

      <div className="schedule-grid">
        {activeTab === 'class' ? renderItems(classes) : renderItems(exams)}
      </div>

      {selectedItem && (
        <div className="modal-overlay">
          <div className="reschedule-modal">
            <div className="modal-header">
              <h3>Reschedule {selectedItem.subject} - {selectedItem.grade}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="current-schedule">
                <h4>Current Schedule</h4>
                <p>📅 {new Date(selectedItem.originalDate).toLocaleDateString()} at {selectedItem.originalTime}</p>
                {selectedItem.room && <p>📍 {selectedItem.room}</p>}
              </div>
              
              <div className="new-schedule">
                <h4>New Schedule</h4>
                <div className="form-group">
                  <label>New Date *</label>
                  <input
                    type="date"
                    value={rescheduleData.newDate}
                    onChange={(e) => setRescheduleData({...rescheduleData, newDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label>New Time *</label>
                  <input
                    type="time"
                    value={rescheduleData.newTime}
                    onChange={(e) => setRescheduleData({...rescheduleData, newTime: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Reason for Rescheduling *</label>
                  <textarea
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})}
                    placeholder="Please provide a reason for rescheduling..."
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setSelectedItem(null)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleSubmitReschedule}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
