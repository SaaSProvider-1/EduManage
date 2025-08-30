import React, { useState } from 'react';
import './FeesManagement.css';

export default function FeesManagement() {
  const [activeTab, setActiveTab] = useState('pending');
  
  const [feesData] = useState({
    pending: [
      { id: 1, studentName: 'John Doe', batch: 'Physics A', amount: 5000, dueDate: '2025-09-15', status: 'overdue' },
      { id: 2, studentName: 'Sarah Smith', batch: 'Chemistry B', amount: 4500, dueDate: '2025-09-30', status: 'due' },
      { id: 3, studentName: 'Mike Johnson', batch: 'Math Advanced', amount: 6000, dueDate: '2025-10-05', status: 'due' },
      { id: 4, studentName: 'Emily Davis', batch: 'Biology A', amount: 4000, dueDate: '2025-08-20', status: 'overdue' }
    ],
    collected: [
      { id: 5, studentName: 'Alex Wilson', batch: 'Physics A', amount: 5000, paidDate: '2025-08-25', method: 'online' },
      { id: 6, studentName: 'Lisa Brown', batch: 'Chemistry B', amount: 4500, paidDate: '2025-08-24', method: 'cash' },
      { id: 7, studentName: 'Tom Anderson', batch: 'Math Basic', amount: 3500, paidDate: '2025-08-23', method: 'online' }
    ]
  });

  const handleCollectFee = (studentId) => {
    alert(`Processing fee collection for student ID: ${studentId}`);
  };

  const handleSendReminder = (studentId) => {
    alert(`Sending payment reminder to student ID: ${studentId}`);
  };

  return (
    <div className="fees-management">
      <div className="fees-header">
        <h2>Fees Management</h2>
        <div className="fees-actions">
          <button className="btn btn-primary">Generate Report</button>
          <button className="btn btn-secondary">Export Data</button>
        </div>
      </div>

      <div className="fees-tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Fees ({feesData.pending.length})
        </button>
        <button 
          className={`tab ${activeTab === 'collected' ? 'active' : ''}`}
          onClick={() => setActiveTab('collected')}
        >
          Collected Fees ({feesData.collected.length})
        </button>
      </div>

      <div className="fees-content">
        {activeTab === 'pending' && (
          <div className="pending-fees">
            <div className="fees-table">
              <div className="table-header">
                <div>Student Name</div>
                <div>Batch</div>
                <div>Amount</div>
                <div>Due Date</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {feesData.pending.map(fee => (
                <div key={fee.id} className="table-row">
                  <div className="student-info">
                    <div className="student-avatar">
                      {fee.studentName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{fee.studentName}</span>
                  </div>
                  <div>{fee.batch}</div>
                  <div className="amount">₹{fee.amount.toLocaleString()}</div>
                  <div>{fee.dueDate}</div>
                  <div>
                    <span className={`status ${fee.status}`}>
                      {fee.status === 'overdue' ? 'Overdue' : 'Due'}
                    </span>
                  </div>
                  <div className="actions">
                    <button 
                      className="btn-action collect"
                      onClick={() => handleCollectFee(fee.id)}
                      title="Mark as Collected"
                    >
                      💰
                    </button>
                    <button 
                      className="btn-action reminder"
                      onClick={() => handleSendReminder(fee.id)}
                      title="Send Reminder"
                    >
                      📧
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'collected' && (
          <div className="collected-fees">
            <div className="fees-table">
              <div className="table-header">
                <div>Student Name</div>
                <div>Batch</div>
                <div>Amount</div>
                <div>Paid Date</div>
                <div>Method</div>
                <div>Receipt</div>
              </div>
              {feesData.collected.map(fee => (
                <div key={fee.id} className="table-row">
                  <div className="student-info">
                    <div className="student-avatar">
                      {fee.studentName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{fee.studentName}</span>
                  </div>
                  <div>{fee.batch}</div>
                  <div className="amount">₹{fee.amount.toLocaleString()}</div>
                  <div>{fee.paidDate}</div>
                  <div>
                    <span className={`payment-method ${fee.method}`}>
                      {fee.method === 'online' ? '💳 Online' : '💵 Cash'}
                    </span>
                  </div>
                  <div className="actions">
                    <button className="btn-action download" title="Download Receipt">
                      📄
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
