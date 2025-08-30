import React, { useState } from 'react';
import './UploadResources.css';

export default function UploadResources() {
  const [uploadedFiles] = useState([
    { 
      id: 1, 
      name: 'Physics_Chapter1_Notes.pdf', 
      subject: 'Physics', 
      batch: 'Physics A', 
      type: 'notes',
      size: '2.5 MB',
      uploadDate: '2025-08-25',
      downloads: 45
    },
    { 
      id: 2, 
      name: 'Chemistry_Lab_Manual.pdf', 
      subject: 'Chemistry', 
      batch: 'Chemistry B', 
      type: 'manual',
      size: '5.2 MB',
      uploadDate: '2025-08-24',
      downloads: 32
    },
    { 
      id: 3, 
      name: 'Math_Practice_Problems.pdf', 
      subject: 'Mathematics', 
      batch: 'Math Advanced', 
      type: 'worksheet',
      size: '1.8 MB',
      uploadDate: '2025-08-23',
      downloads: 67
    },
    { 
      id: 4, 
      name: 'Biology_Diagram_Examples.jpg', 
      subject: 'Biology', 
      batch: 'Biology A', 
      type: 'image',
      size: '0.9 MB',
      uploadDate: '2025-08-22',
      downloads: 28
    }
  ]);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const batches = ['Physics A', 'Chemistry B', 'Math Advanced', 'Biology A'];
  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    alert(`Selected ${fileArray.length} file(s) for upload:\n${fileArray.map(f => f.name).join('\n')}`);
  };

  const getFileTypeIcon = (type) => {
    switch (type) {
      case 'notes': return '📝';
      case 'manual': return '📚';
      case 'worksheet': return '📋';
      case 'image': return '🖼️';
      default: return '📄';
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'notes': return '#3b82f6';
      case 'manual': return '#10b981';
      case 'worksheet': return '#f59e0b';
      case 'image': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const handleDownload = (fileId) => {
    alert(`Downloading file ID: ${fileId}`);
  };

  const handleDelete = (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      alert(`Deleting file ID: ${fileId}`);
    }
  };

  const filteredFiles = uploadedFiles.filter(file => {
    const matchesBatch = !selectedBatch || file.batch === selectedBatch;
    const matchesSubject = !selectedSubject || file.subject === selectedSubject;
    return matchesBatch && matchesSubject;
  });

  return (
    <div className="upload-resources">
      <div className="upload-header">
        <h2>Upload Resources</h2>
        <div className="resource-stats">
          <span className="stat">📁 {uploadedFiles.length} Files</span>
          <span className="stat">📥 {uploadedFiles.reduce((sum, file) => sum + file.downloads, 0)} Downloads</span>
        </div>
      </div>

      <div className="upload-section">
        <div className="upload-form">
          <h3>Upload New Resource</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Subject</label>
              <select className="form-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Batch</label>
              <select className="form-select" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                <option value="">Select Batch</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </div>

          <div 
            className={`upload-dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="dropzone-content">
              <div className="upload-icon">☁️</div>
              <h4>Drag & Drop Files Here</h4>
              <p>Or click to select files</p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="file-input"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              />
              <div className="file-types">
                Supported: PDF, DOC, PPT, Images (Max 10MB each)
              </div>
            </div>
          </div>

          <button className="btn btn-primary upload-btn">
            📤 Upload Resources
          </button>
        </div>

        <div className="upload-guidelines">
          <h4>📋 Upload Guidelines</h4>
          <ul>
            <li>Maximum file size: 10MB per file</li>
            <li>Supported formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG</li>
            <li>Use descriptive file names</li>
            <li>Select appropriate subject and batch</li>
            <li>Ensure content is educational and appropriate</li>
          </ul>
        </div>
      </div>

      <div className="resources-section">
        <div className="section-header">
          <h3>Uploaded Resources</h3>
          <div className="filter-controls">
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="filter-select"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="filter-select"
            >
              <option value="">All Batches</option>
              {batches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="resources-grid">
          {filteredFiles.map(file => (
            <div key={file.id} className="resource-card">
              <div className="resource-header">
                <div className="file-icon" style={{ color: getFileTypeColor(file.type) }}>
                  {getFileTypeIcon(file.type)}
                </div>
                <div className="resource-actions">
                  <button 
                    className="action-btn download"
                    onClick={() => handleDownload(file.id)}
                    title="Download"
                  >
                    📥
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(file.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="resource-info">
                <h4 className="file-name">{file.name}</h4>
                <div className="file-meta">
                  <span className="subject-tag" style={{ backgroundColor: getFileTypeColor(file.type) + '20', color: getFileTypeColor(file.type) }}>
                    {file.subject}
                  </span>
                  <span className="batch-tag">{file.batch}</span>
                </div>
                <div className="file-details">
                  <span>📏 {file.size}</span>
                  <span>📅 {file.uploadDate}</span>
                  <span>📥 {file.downloads} downloads</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFiles.length === 0 && (
          <div className="no-resources">
            <div className="no-resources-icon">📂</div>
            <h3>No resources found</h3>
            <p>Upload some resources or adjust your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
