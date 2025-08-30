import React, { useState } from 'react';
import './TeacherManagement.css';

export default function TeacherManagement() {
  const [teachers] = useState([
    { 
      id: 1, 
      name: 'Dr. Rajesh Kumar', 
      email: 'rajesh@edumanage.com', 
      phone: '+91 9876543220', 
      subject: 'Physics', 
      experience: '8 years',
      qualification: 'M.Sc Physics, B.Ed',
      batches: ['Physics A', 'Physics Advanced'],
      joinDate: '2023-01-15', 
      status: 'active',
      rating: 4.8
    },
    { 
      id: 2, 
      name: 'Prof. Priya Sharma', 
      email: 'priya@edumanage.com', 
      phone: '+91 9876543221', 
      subject: 'Chemistry', 
      experience: '12 years',
      qualification: 'M.Sc Chemistry, Ph.D',
      batches: ['Chemistry A', 'Chemistry B'],
      joinDate: '2022-08-10', 
      status: 'active',
      rating: 4.9
    },
    { 
      id: 3, 
      name: 'Mr. Amit Patel', 
      email: 'amit@edumanage.com', 
      phone: '+91 9876543222', 
      subject: 'Mathematics', 
      experience: '6 years',
      qualification: 'M.Sc Mathematics',
      batches: ['Math Basic', 'Math Advanced'],
      joinDate: '2023-03-20', 
      status: 'active',
      rating: 4.7
    },
    { 
      id: 4, 
      name: 'Dr. Sunita Mehta', 
      email: 'sunita@edumanage.com', 
      phone: '+91 9876543223', 
      subject: 'Biology', 
      experience: '10 years',
      qualification: 'M.Sc Biology, Ph.D',
      batches: ['Biology A'],
      joinDate: '2022-11-05', 
      status: 'on-leave',
      rating: 4.6
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSubject === 'all' || teacher.subject === filterSubject;
    return matchesSearch && matchesFilter;
  });

  const subjects = ['all', ...new Set(teachers.map(teacher => teacher.subject))];

  const handleViewTeacher = (teacherId) => {
    alert(`Viewing details for teacher ID: ${teacherId}`);
  };

  const handleEditTeacher = (teacherId) => {
    alert(`Editing teacher ID: ${teacherId}`);
  };

  const handleAssignBatch = (teacherId) => {
    alert(`Assigning batch to teacher ID: ${teacherId}`);
  };

  return (
    <div className="teacher-management">
      <div className="teacher-header">
        <h2>Teacher Management</h2>
        <button className="btn btn-primary">Add New Teacher</button>
      </div>

      <div className="teacher-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search teachers by name, email, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        <select 
          value={filterSubject} 
          onChange={(e) => setFilterSubject(e.target.value)}
          className="filter-select"
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>
              {subject === 'all' ? 'All Subjects' : subject}
            </option>
          ))}
        </select>
      </div>

      <div className="teachers-grid">
        {filteredTeachers.map(teacher => (
          <div key={teacher.id} className="teacher-card">
            <div className="teacher-card-header">
              <div className="teacher-avatar-large">
                {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="teacher-rating">
                <span className="rating-stars">⭐</span>
                <span className="rating-score">{teacher.rating}</span>
              </div>
            </div>

            <div className="teacher-info">
              <h3>{teacher.name}</h3>
              <div className="subject-badge">
                {teacher.subject}
              </div>
              
              <div className="info-item">
                <span className="info-icon">📧</span>
                <span>{teacher.email}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">📞</span>
                <span>{teacher.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">🎓</span>
                <span>{teacher.qualification}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">💼</span>
                <span>{teacher.experience} experience</span>
              </div>
              <div className="info-item">
                <span className="info-icon">📅</span>
                <span>Joined: {teacher.joinDate}</span>
              </div>
            </div>

            <div className="teacher-batches">
              <h4>Assigned Batches:</h4>
              <div className="batch-tags">
                {teacher.batches.map(batch => (
                  <span key={batch} className="batch-tag">{batch}</span>
                ))}
              </div>
            </div>

            <div className="teacher-status">
              <span className={`status-badge ${teacher.status}`}>
                {teacher.status === 'active' ? '✅ Active' : 
                 teacher.status === 'on-leave' ? '🏖️ On Leave' : '❌ Inactive'}
              </span>
            </div>

            <div className="teacher-actions">
              <button 
                className="btn-action view"
                onClick={() => handleViewTeacher(teacher.id)}
                title="View Details"
              >
                👁️
              </button>
              <button 
                className="btn-action edit"
                onClick={() => handleEditTeacher(teacher.id)}
                title="Edit Teacher"
              >
                ✏️
              </button>
              <button 
                className="btn-action assign"
                onClick={() => handleAssignBatch(teacher.id)}
                title="Assign Batch"
              >
                📝
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">👨‍🏫</div>
          <h3>No teachers found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
