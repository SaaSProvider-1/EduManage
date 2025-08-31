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
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
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
            <div 
              className="form-group"
              style={{ position: 'relative', minWidth: 180 }}
            >
              <label>Subject</label>
              <div
                className="custom-dropdown"
                tabIndex={0}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
                  cursor: 'pointer',
                  boxShadow: showSubjectDropdown ? '0 4px 20px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: 12,
                  fontSize: '14px',
                  fontWeight: 500,
                  borderColor: showSubjectDropdown ? '#3b82f6' : '#e5e7eb',
                  transform: showSubjectDropdown ? 'translateY(-2px)' : 'translateY(0px)'
                }}
                onClick={() => setShowSubjectDropdown((v) => !v)}
                onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 150)}
              >
                <span style={{ color: selectedSubject ? '#111827' : '#9ca3af' }}>
                  {selectedSubject || 'Select Subject'}
                </span>
                <span style={{ 
                  float: 'right', 
                  color: '#6b7280', 
                  marginLeft: 12,
                  transform: showSubjectDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▼
                </span>
                {showSubjectDropdown && (
                  <div
                    className="dropdown-list"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      zIndex: 9999,
                      background: '#fff',
                      border: '2px solid #3b82f6',
                      borderRadius: 12,
                      marginTop: 8,
                      boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)',
                      animation: 'dropdownSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden'
                    }}
                  >
                    {subjects.map(subject => (
                      <div
                        key={subject}
                        className="dropdown-item"
                        style={{
                          padding: '12px 16px',
                          background: selectedSubject === subject ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                          color: selectedSubject === subject ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontWeight: selectedSubject === subject ? 600 : 500,
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '14px',
                          zIndex: 9999
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSubject !== subject) {
                            e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                            e.target.style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSubject !== subject) {
                            e.target.style.background = 'transparent';
                            e.target.style.transform = 'translateX(0px)';
                          }
                        }}
                        onClick={() => { setSelectedSubject(subject); setShowSubjectDropdown(false); }}
                      >
                        {subject}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group" style={{ position: 'relative', minWidth: 180 }}>
              <label>Batch</label>
              <div
                className="custom-dropdown"
                tabIndex={0}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
                  cursor: 'pointer',
                  boxShadow: showBatchDropdown ? '0 4px 20px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: 12,
                  fontSize: '14px',
                  fontWeight: 500,
                  borderColor: showBatchDropdown ? '#10b981' : '#e5e7eb',
                  transform: showBatchDropdown ? 'translateY(-2px)' : 'translateY(0px)'
                }}
                onClick={() => setShowBatchDropdown((v) => !v)}
                onBlur={() => setTimeout(() => setShowBatchDropdown(false), 150)}
              >
                <span style={{ color: selectedBatch ? '#111827' : '#9ca3af' }}>
                  {selectedBatch || 'Select Batch'}
                </span>
                <span style={{ 
                  float: 'right', 
                  color: '#6b7280', 
                  marginLeft: 12,
                  transform: showBatchDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▼
                </span>
                {showBatchDropdown && (
                  <div
                    className="dropdown-list"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      zIndex: 9999,
                      background: '#fff',
                      border: '2px solid #10b981',
                      borderRadius: 12,
                      marginTop: 8,
                      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)',
                      animation: 'dropdownSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden'
                    }}
                  >
                    {batches.map(batch => (
                      <div
                        key={batch}
                        className="dropdown-item"
                        style={{
                          padding: '12px 16px',
                          background: selectedBatch === batch ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                          color: selectedBatch === batch ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontWeight: selectedBatch === batch ? 600 : 500,
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '14px',
                          zIndex: 9995
                        }}
                        onMouseEnter={(e) => {
                          if (selectedBatch !== batch) {
                            e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                            e.target.style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedBatch !== batch) {
                            e.target.style.background = 'transparent';
                            e.target.style.transform = 'translateX(0px)';
                          }
                        }}
                        onClick={() => { setSelectedBatch(batch); setShowBatchDropdown(false); }}
                      >
                        {batch}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            {/* Subject Dropdown Filter */}
            <div className="form-group" style={{ position: 'relative', minWidth: 140, marginRight: 12 }}>
              <div
                className="custom-dropdown"
                tabIndex={0}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
                  cursor: 'pointer',
                  boxShadow: showSubjectDropdown ? '0 4px 15px rgba(59, 130, 246, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.25s ease',
                  marginBottom: 0,
                  fontSize: '13px',
                  fontWeight: 500,
                  borderColor: showSubjectDropdown ? '#3b82f6' : '#e5e7eb',
                }}
                onClick={() => setShowSubjectDropdown((v) => !v)}
                onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 150)}
              >
                <span style={{ color: selectedSubject ? '#111827' : '#9ca3af' }}>
                  {selectedSubject || 'All Subjects'}
                </span>
                <span style={{ 
                  float: 'right', 
                  color: '#6b7280', 
                  marginLeft: 10,
                  transform: showSubjectDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                  zIndex: 15
                }}>
                  ▼
                </span>
                {showSubjectDropdown && (
                  <div
                    className="dropdown-list"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      zIndex: 15,
                      background: '#fff',
                      border: '2px solid #3b82f6',
                      borderRadius: 10,
                      marginTop: 6,
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.2)',
                      animation: 'dropdownSlideIn 0.25s ease-out',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      className="dropdown-item"
                      style={{
                        padding: '10px 14px',
                        background: !selectedSubject ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                        color: !selectedSubject ? '#fff' : '#374151',
                        cursor: 'pointer',
                        fontWeight: !selectedSubject ? 600 : 500,
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '13px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSubject) {
                          e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedSubject) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                      onClick={() => { setSelectedSubject(''); setShowSubjectDropdown(false); }}
                    >
                      All Subjects
                    </div>
                    {subjects.map(subject => (
                      <div
                        key={subject}
                        className="dropdown-item"
                        style={{
                          padding: '10px 14px',
                          background: selectedSubject === subject ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                          color: selectedSubject === subject ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontWeight: selectedSubject === subject ? 600 : 500,
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '13px'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSubject !== subject) {
                            e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSubject !== subject) {
                            e.target.style.background = 'transparent';
                          }
                        }}
                        onClick={() => { setSelectedSubject(subject); setShowSubjectDropdown(false); }}
                      >
                        {subject}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Batch Dropdown Filter */}
            <div className="form-group" style={{ position: 'relative', minWidth: 140 }}>
              <div
                className="custom-dropdown"
                tabIndex={0}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
                  cursor: 'pointer',
                  boxShadow: showBatchDropdown ? '0 4px 15px rgba(16, 185, 129, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.25s ease',
                  marginBottom: 0,
                  fontSize: '13px',
                  fontWeight: 500,
                  borderColor: showBatchDropdown ? '#10b981' : '#e5e7eb'
                }}
                onClick={() => setShowBatchDropdown((v) => !v)}
                onBlur={() => setTimeout(() => setShowBatchDropdown(false), 150)}
              >
                <span style={{ color: selectedBatch ? '#111827' : '#9ca3af' }}>
                  {selectedBatch || 'All Batches'}
                </span>
                <span style={{ 
                  float: 'right', 
                  color: '#6b7280', 
                  marginLeft: 10,
                  transform: showBatchDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease'
                }}>
                  ▼
                </span>
                {showBatchDropdown && (
                  <div
                    className="dropdown-list"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      zIndex: 15,
                      background: '#fff',
                      border: '2px solid #10b981',
                      borderRadius: 10,
                      marginTop: 6,
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.2)',
                      animation: 'dropdownSlideIn 0.25s ease-out',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      className="dropdown-item"
                      style={{
                        padding: '10px 14px',
                        background: !selectedBatch ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                        color: !selectedBatch ? '#fff' : '#374151',
                        cursor: 'pointer',
                        fontWeight: !selectedBatch ? 600 : 500,
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '13px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedBatch) {
                          e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedBatch) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                      onClick={() => { setSelectedBatch(''); setShowBatchDropdown(false); }}
                    >
                      All Batches
                    </div>
                    {batches.map(batch => (
                      <div
                        key={batch}
                        className="dropdown-item"
                        style={{
                          padding: '10px 14px',
                          background: selectedBatch === batch ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                          color: selectedBatch === batch ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontWeight: selectedBatch === batch ? 600 : 500,
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '13px'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedBatch !== batch) {
                            e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedBatch !== batch) {
                            e.target.style.background = 'transparent';
                          }
                        }}
                        onClick={() => { setSelectedBatch(batch); setShowBatchDropdown(false); }}
                      >
                        {batch}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            {/* Subject Dropdown Filter */}
            <div className="form-group" style={{ position: 'relative', minWidth: 140, marginRight: 12 }}>
              <div
                className="custom-dropdown"
                tabIndex={0}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
                  cursor: 'pointer',
                  boxShadow: showSubjectDropdown ? '0 4px 15px rgba(59, 130, 246, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.25s ease',
                  marginBottom: 0,
                  fontSize: '13px',
                  fontWeight: 500,
                  borderColor: showSubjectDropdown ? '#3b82f6' : '#e5e7eb'
                }}
                onClick={() => setShowSubjectDropdown((v) => !v)}
                onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 150)}
              >
                <span style={{ color: selectedSubject ? '#111827' : '#9ca3af' }}>
                  {selectedSubject || 'All Subjects'}
                </span>
                <span style={{ 
                  float: 'right', 
                  color: '#6b7280', 
                  marginLeft: 10,
                  transform: showSubjectDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease'
                }}>
                  ▼
                </span>
                {showSubjectDropdown && (
                  <div
                    className="dropdown-list"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      zIndex: 15,
                      background: '#fff',
                      border: '2px solid #3b82f6',
                      borderRadius: 10,
                      marginTop: 6,
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.2)',
                      animation: 'dropdownSlideIn 0.25s ease-out',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      className="dropdown-item"
                      style={{
                        padding: '10px 14px',
                        background: !selectedSubject ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                        color: !selectedSubject ? '#fff' : '#374151',
                        cursor: 'pointer',
                        fontWeight: !selectedSubject ? 600 : 500,
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '13px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSubject) {
                          e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedSubject) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                      onClick={() => { setSelectedSubject(''); setShowSubjectDropdown(false); }}
                    >
                      All Subjects
                    </div>
                    {subjects.map(subject => (
                      <div
                        key={subject}
                        className="dropdown-item"
                        style={{
                          padding: '10px 14px',
                          background: selectedSubject === subject ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                          color: selectedSubject === subject ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontWeight: selectedSubject === subject ? 600 : 500,
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '13px'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedSubject !== subject) {
                            e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSubject !== subject) {
                            e.target.style.background = 'transparent';
                          }
                        }}
                        onClick={() => { setSelectedSubject(subject); setShowSubjectDropdown(false); }}
                      >
                        {subject}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Batch Dropdown Filter */}
            <div className="form-group" style={{ position: 'relative', minWidth: 140 }}>
              <div
                className="custom-dropdown"
                tabIndex={0}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
                  cursor: 'pointer',
                  boxShadow: showBatchDropdown ? '0 4px 15px rgba(16, 185, 129, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.25s ease',
                  marginBottom: 0,
                  fontSize: '13px',
                  fontWeight: 500,
                  borderColor: showBatchDropdown ? '#10b981' : '#e5e7eb'
                }}
                onClick={() => setShowBatchDropdown((v) => !v)}
                onBlur={() => setTimeout(() => setShowBatchDropdown(false), 150)}
              >
                <span style={{ color: selectedBatch ? '#111827' : '#9ca3af' }}>
                  {selectedBatch || 'All Batches'}
                </span>
                <span style={{ 
                  float: 'right', 
                  color: '#6b7280', 
                  marginLeft: 10,
                  transform: showBatchDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease'
                }}>
                  ▼
                </span>
                {showBatchDropdown && (
                  <div
                    className="dropdown-list"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      zIndex: 15,
                      background: '#fff',
                      border: '2px solid #10b981',
                      borderRadius: 10,
                      marginTop: 6,
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.2)',
                      animation: 'dropdownSlideIn 0.25s ease-out',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      className="dropdown-item"
                      style={{
                        padding: '10px 14px',
                        background: !selectedBatch ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                        color: !selectedBatch ? '#fff' : '#374151',
                        cursor: 'pointer',
                        fontWeight: !selectedBatch ? 600 : 500,
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '13px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedBatch) {
                          e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedBatch) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                      onClick={() => { setSelectedBatch(''); setShowBatchDropdown(false); }}
                    >
                      All Batches
                    </div>
                    {batches.map(batch => (
                      <div
                        key={batch}
                        className="dropdown-item"
                        style={{
                          padding: '10px 14px',
                          background: selectedBatch === batch ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                          color: selectedBatch === batch ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontWeight: selectedBatch === batch ? 600 : 500,
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '13px'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedBatch !== batch) {
                            e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedBatch !== batch) {
                            e.target.style.background = 'transparent';
                          }
                        }}
                        onClick={() => { setSelectedBatch(batch); setShowBatchDropdown(false); }}
                      >
                        {batch}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
