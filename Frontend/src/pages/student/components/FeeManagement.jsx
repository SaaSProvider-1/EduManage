import React, { useState } from 'react';
import { DollarSign, Calendar, TrendingUp, CreditCard, Download, ChevronDown } from 'lucide-react';
import './FeeManagement.css';

const FeeManagement = () => {
  const [selectedYear, setSelectedYear] = useState('2024');

  const feeStats = [
    {
      title: 'Total Paid',
      value: '$6,150',
      subtitle: '5 payments completed',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Pending Amount',
      value: '$1,200',
      subtitle: 'Due December 1st',
      icon: Calendar,
      color: 'orange'
    },
    {
      title: 'Average Monthly',
      value: '$1,230',
      subtitle: 'Per month',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Payment Status',
      value: 'Good',
      subtitle: 'All payments on time',
      icon: CreditCard,
      color: 'teal'
    }
  ];

  const paymentHistory = [
    {
      id: 'PAY-2024-001',
      month: 'November 2024',
      amount: '$1,200',
      status: 'paid',
      dueDate: '2024-11-01',
      paidDate: '2024-10-28',
      method: 'Credit Card',
      description: 'Monthly Tuition Fee'
    },
    {
      id: 'PAY-2024-002',
      month: 'October 2024',
      amount: '$1,200',
      status: 'paid',
      dueDate: '2024-10-01',
      paidDate: '2024-09-29',
      method: 'Bank Transfer',
      description: 'Monthly Tuition Fee'
    },
    {
      id: 'PAY-2024-003',
      month: 'September 2024',
      amount: '$1,200',
      status: 'paid',
      dueDate: '2024-09-01',
      paidDate: '2024-08-30',
      method: 'Credit Card',
      description: 'Monthly Tuition Fee'
    },
    {
      id: 'PAY-2024-004',
      month: 'August 2024',
      amount: '$1,350',
      status: 'paid',
      dueDate: '2024-08-01',
      paidDate: '2024-07-29',
      method: 'Credit Card',
      description: 'Monthly Tuition + Lab Fee'
    },
    {
      id: 'PAY-2024-005',
      month: 'July 2024',
      amount: '$1,200',
      status: 'paid',
      dueDate: '2024-07-01',
      paidDate: '2024-06-28',
      method: 'Bank Transfer',
      description: 'Monthly Tuition Fee'
    },
    {
      id: 'PAY-2024-006',
      month: 'December 2024',
      amount: '$1,200',
      status: 'pending',
      dueDate: '2024-12-01',
      paidDate: '-',
      method: '',
      description: 'Monthly Tuition Fee'
    }
  ];

  const quickActions = [
    {
      title: 'Pay Now',
      icon: CreditCard,
      action: 'payment',
      primary: true
    },
    {
      title: 'Set Up Auto-Pay',
      icon: Calendar,
      action: 'autopay',
      primary: false
    },
    {
      title: 'Download Receipt',
      icon: Download,
      action: 'receipt',
      primary: false
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { class: 'paid', text: 'paid' },
      pending: { class: 'pending', text: 'pending' },
      overdue: { class: 'overdue', text: 'overdue' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const handleExport = () => {
    alert('Exporting payment history...');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'payment':
        alert('Redirecting to payment gateway...');
        break;
      case 'autopay':
        alert('Setting up auto-pay...');
        break;
      case 'receipt':
        alert('Downloading receipt...');
        break;
      default:
        break;
    }
  };

  return (
    <div className="payment-history">
      <div className="pay-page-header">
        <h1>Fee Management</h1>
        <p>Track your payment history and manage fees</p>
      </div>

      {/* Stats Grid */}
      <div className="pay-stats-grid">
        {feeStats.map((stat, index) => (
          <div key={index} className={`pay-stat-card ${stat.color}`}>
            <div className="pay-stat-header">
              <span className="pay-stat-title">{stat.title}</span>
              <stat.icon className="pay-stat-icon" size={20} />
            </div>
            <div className="pay-stat-value-section">
              <h3 className="pay-stat-number">{stat.value}</h3>
              <p className="pay-stat-subtitle">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment History Section */}
      <div className="payment-history-section">
        <div className="payment-section-header">
          <div className="payment-section-title">
            <h2>Payment History</h2>
            <p>Complete record of your monthly fee payments</p>
          </div>
          <div className="payment-section-controls">
            <div className="year-filter">
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="year-select"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
              <ChevronDown className="pay-select-icon" size={16} />
            </div>
            <button onClick={handleExport} className="export-button">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="payment-table">
          <div className="pay-table-header">
            <div className="pay-table-cell">Payment ID</div>
            <div className="pay-table-cell">Month</div>
            <div className="pay-table-cell">Amount</div>
            <div className="pay-table-cell">Status</div>
            <div className="pay-table-cell">Due Date</div>
            <div className="pay-table-cell">Paid Date</div>
            <div className="pay-table-cell">Method</div>
            <div className="pay-table-cell">Description</div>
          </div>
          
          <div className="pay-table-body">
            {paymentHistory.map((payment) => (
              <div key={payment.id} className="pay-table-row">
                <div className="pay-table-cell payment-id">{payment.id}</div>
                <div className="pay-table-cell month-cell">{payment.month}</div>
                <div className="pay-table-cell amount-cell">{payment.amount}</div>
                <div className="pay-table-cell status-cell">
                  {getStatusBadge(payment.status)}
                </div>
                <div className="pay-table-cell date-cell">{payment.dueDate}</div>
                <div className="pay-table-cell date-cell">{payment.paidDate}</div>
                <div className="pay-table-cell method-cell">
                  {payment.method && (
                    <>
                      <CreditCard size={14} />
                      {payment.method}
                    </>
                  )}
                </div>
                <div className="pay-table-cell description-cell">{payment.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-container">
          {quickActions.map((action, index) => (
            <button 
              key={index} 
              className={`action-button ${action.primary ? 'primary' : 'secondary'}`}
              onClick={() => handleQuickAction(action.action)}
            >
              <action.icon size={16} />
              {action.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeeManagement;
