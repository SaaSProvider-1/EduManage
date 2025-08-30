import React, { useState } from 'react';
import './Approval.css';

export default function Approval() {
  const [pendingApprovals] = useState([
    {
      id: 1,
      type: 'student_registration',
      title: 'Student Registration Request',
      applicantName: 'Rahul Sharma',
      details: {
        email: 'rahul.sharma@email.com',
        phone: '+91 9876543225',
        batch: 'Physics A',
        documents: ['10th_marksheet.pdf', 'photo.jpg']
      },
      submittedDate: '2025-08-28',
      status: 'pending'
    },
    {
      id: 2,
      type: 'teacher_application',
      title: 'Teacher Application',
      applicantName: 'Dr. Kavita Singh',
      details: {
        email: 'kavita.singh@email.com',
        phone: '+91 9876543226',
        subject: 'Chemistry',
        experience: '15 years',
        qualification: 'Ph.D Chemistry',
        documents: ['resume.pdf', 'certificates.pdf']
      },
      submittedDate: '2025-08-27',
      status: 'pending'
    },
    {
      id: 3,
      type: 'batch_creation',
      title: 'New Batch Creation Request',
      applicantName: 'System Request',
      details: {
        batchName: 'English Literature A',
        subject: 'English',
        capacity: 25,
        teacher: 'Prof. Meera Gupta',
        schedule: 'Mon, Wed, Fri - 11:00 AM',
        startDate: '2025-09-15'
      },
      submittedDate: '2025-08-26',
      status: 'pending'
    },
    {
      id: 4,
      type: 'fee_adjustment',
      title: 'Fee Adjustment Request',
      applicantName: 'Priya Patel',
      details: {
        studentId: 'STU001',
        currentFee: 5000,
        requestedFee: 4000,
        reason: 'Financial hardship',
        supportingDocs: ['income_certificate.pdf']
      },
      submittedDate: '2025-08-25',
      status: 'pending'
    }
  ]);

  const [selectedApproval, setSelectedApproval] = useState(null);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'student_registration': return '👨‍🎓';
      case 'teacher_application': return '👨‍🏫';
      case 'batch_creation': return '📚';
      case 'fee_adjustment': return '💰';
      default: return '📄';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'student_registration': return '#3b82f6';
      case 'teacher_application': return '#10b981';
      case 'batch_creation': return '#f59e0b';
      case 'fee_adjustment': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const handleApprove = (approvalId) => {
    if (window.confirm('Are you sure you want to approve this request?')) {
      alert(`Approved request ID: ${approvalId}`);
      setSelectedApproval(null);
    }
  };

  const handleReject = (approvalId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      alert(`Rejected request ID: ${approvalId} with reason: ${reason}`);
      setSelectedApproval(null);
    }
  };

  const handleViewDetails = (approval) => {
    setSelectedApproval(approval);
  };

  const formatDetailValue = (key, value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value?.toString() || 'N/A';
  };

  return (
    <div className="approval">
      <div className="approval-header">
        <h2>Pending Approvals</h2>
        <div className="approval-stats">
          <div className="stat-badge">
            <span className="stat-number">{pendingApprovals.length}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      <div className="approval-content">
        <div className="approvals-list">
          {pendingApprovals.map(approval => (
            <div key={approval.id} className="approval-card">
              <div className="approval-card-header">
                <div className="approval-icon" style={{ color: getTypeColor(approval.type) }}>
                  {getTypeIcon(approval.type)}
                </div>
                <div className="approval-info">
                  <h3>{approval.title}</h3>
                  <p className="applicant-name">{approval.applicantName}</p>
                  <span className="submission-date">Submitted: {approval.submittedDate}</span>
                </div>
                <div className="approval-actions">
                  <button 
                    className="btn-action view"
                    onClick={() => handleViewDetails(approval)}
                    title="View Details"
                  >
                    👁️
                  </button>
                  <button 
                    className="btn-action approve"
                    onClick={() => handleApprove(approval.id)}
                    title="Approve"
                  >
                    ✅
                  </button>
                  <button 
                    className="btn-action reject"
                    onClick={() => handleReject(approval.id)}
                    title="Reject"
                  >
                    ❌
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedApproval && (
          <div className="approval-detail-panel">
            <div className="detail-header">
              <h3>Approval Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedApproval(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="detail-content">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Type:</label>
                    <span className="type-badge" style={{ backgroundColor: getTypeColor(selectedApproval.type) + '20', color: getTypeColor(selectedApproval.type) }}>
                      {getTypeIcon(selectedApproval.type)} {selectedApproval.title}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Applicant:</label>
                    <span>{selectedApproval.applicantName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Submitted Date:</label>
                    <span>{selectedApproval.submittedDate}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className="status-badge pending">Pending Review</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Request Details</h4>
                <div className="detail-grid">
                  {Object.entries(selectedApproval.details).map(([key, value]) => (
                    <div key={key} className="detail-item">
                      <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</label>
                      <span className={Array.isArray(value) ? 'documents-list' : ''}>
                        {formatDetailValue(key, value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-actions">
                <button 
                  className="btn btn-success"
                  onClick={() => handleApprove(selectedApproval.id)}
                >
                  ✅ Approve Request
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleReject(selectedApproval.id)}
                >
                  ❌ Reject Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {pendingApprovals.length === 0 && (
        <div className="no-approvals">
          <div className="no-approvals-icon">🎉</div>
          <h3>All caught up!</h3>
          <p>No pending approvals at the moment</p>
        </div>
      )}
    </div>
  );
}
