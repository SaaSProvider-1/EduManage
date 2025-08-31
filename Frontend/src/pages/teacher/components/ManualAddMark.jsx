import React, { useState } from 'react';
import './ManualAddMark.css';

export default function ManualAddMark() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [students] = useState([
    { id: 1, name: 'John Doe', rollNo: '2025001', currentMark: 85 },
    { id: 2, name: 'Jane Smith', rollNo: '2025002', currentMark: 92 },
    { id: 3, name: 'Mike Johnson', rollNo: '2025003', currentMark: 78 },
    { id: 4, name: 'Sarah Wilson', rollNo: '2025004', currentMark: null },
    { id: 5, name: 'David Brown', rollNo: '2025005', currentMark: 88 },
  ]);

  const [marks, setMarks] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const batches = [
    { id: 'batch1', name: 'Mathematics - Grade 10A' },
    { id: 'batch2', name: 'Physics - Grade 11B' },
    { id: 'batch3', name: 'Chemistry - Grade 12A' },
  ];

  const subjects = [
    { id: 'math', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
  ];

  const exams = [
    { id: 'midterm', name: 'Mid-term Examination', maxMarks: 100 },
    { id: 'final', name: 'Final Examination', maxMarks: 100 },
    { id: 'quiz1', name: 'Quiz 1', maxMarks: 50 },
    { id: 'assignment1', name: 'Assignment 1', maxMarks: 25 },
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkChange = (studentId, mark) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: mark
    }));
  };

  const getSelectedExamDetails = () => {
    return exams.find(exam => exam.id === selectedExam);
  };

  const handleSaveMarks = () => {
    if (!selectedBatch || !selectedSubject || !selectedExam) {
      alert('Please select batch, subject, and exam first');
      return;
    }

    const examDetails = getSelectedExamDetails();
    const marksToSave = Object.entries(marks).filter(([_, mark]) => mark !== '');
    
    if (marksToSave.length === 0) {
      alert('Please enter marks for at least one student');
      return;
    }

    // Validate marks
    const invalidMarks = marksToSave.filter(([_, mark]) => 
      mark < 0 || mark > examDetails.maxMarks
    );
    
    if (invalidMarks.length > 0) {
      alert(`Marks should be between 0 and ${examDetails.maxMarks}`);
      return;
    }

    alert(`Marks saved successfully for ${marksToSave.length} students!`);
    setMarks({});
  };

  const handleBulkAction = (action) => {
    if (action === 'clear') {
      setMarks({});
    } else if (action === 'absent') {
      const newMarks = {};
      filteredStudents.forEach(student => {
        newMarks[student.id] = 'Absent';
      });
      setMarks(newMarks);
    }
  };

  return (
    <div className="manual-add-mark">
      <div className="page-header">
        <h2>Manual Add Marks</h2>
        <p>Add or update marks for students manually</p>
      </div>

      <div className="selection-section">
        <div className="selection-grid">
          <div className="form-group">
            <label>Select Batch *</label>
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="select-input"
            >
              <option value="">Choose a batch...</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Subject *</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="select-input"
            >
              <option value="">Choose a subject...</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Exam/Assessment *</label>
            <select 
              value={selectedExam} 
              onChange={(e) => setSelectedExam(e.target.value)}
              className="select-input"
            >
              <option value="">Choose an exam...</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} (Max: {exam.maxMarks})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedBatch && selectedSubject && selectedExam && (
        <div className="marks-section">
          <div className="section-header">
            <div className="exam-info">
              <h3>{getSelectedExamDetails()?.name}</h3>
              <span className="max-marks">Maximum Marks: {getSelectedExamDetails()?.maxMarks}</span>
            </div>
            <div className="search-and-actions">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="bulk-actions">
                <button 
                  className="bulk-btn clear-btn"
                  onClick={() => handleBulkAction('clear')}
                >
                  Clear All
                </button>
                <button 
                  className="bulk-btn absent-btn"
                  onClick={() => handleBulkAction('absent')}
                >
                  Mark All Absent
                </button>
              </div>
            </div>
          </div>

          <div className="students-grid">
            {filteredStudents.map(student => (
              <div key={student.id} className="student-card">
                <div className="student-info">
                  <div className="student-details">
                    <h4>{student.name}</h4>
                    <span className="roll-no">Roll No: {student.rollNo}</span>
                  </div>
                  {student.currentMark !== null && (
                    <div className="current-mark">
                      <span className="mark-label">Current:</span>
                      <span className="mark-value">{student.currentMark}</span>
                    </div>
                  )}
                </div>
                
                <div className="mark-input-section">
                  <label>Enter Marks</label>
                  <div className="mark-input-group">
                    <input
                      type="number"
                      min="0"
                      max={getSelectedExamDetails()?.maxMarks}
                      value={marks[student.id] || ''}
                      onChange={(e) => handleMarkChange(student.id, e.target.value)}
                      placeholder="0"
                      className="mark-input"
                    />
                    <button 
                      className="absent-btn-small"
                      onClick={() => handleMarkChange(student.id, 'Absent')}
                    >
                      Absent
                    </button>
                  </div>
                  <div className="mark-status">
                    {marks[student.id] === 'Absent' ? (
                      <span className="status absent">Marked as Absent</span>
                    ) : marks[student.id] ? (
                      <span className="status entered">
                        {marks[student.id]}/{getSelectedExamDetails()?.maxMarks}
                      </span>
                    ) : (
                      <span className="status empty">Not entered</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="save-section">
            <div className="save-summary">
              <span>
                {Object.keys(marks).filter(key => marks[key] !== '').length} of {filteredStudents.length} students have marks entered
              </span>
            </div>
            <button 
              className="save-btn"
              onClick={handleSaveMarks}
            >
              💾 Save All Marks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
