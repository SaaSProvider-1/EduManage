import React, { useState } from 'react';
import './SalarySummary.css';

export default function SalarySummary() {
  const [currentMonth] = useState('September 2025');
  const [salaryData] = useState({
    basicSalary: 50000,
    allowances: {
      houseRent: 15000,
      transport: 5000,
      medical: 3000,
      special: 2000
    },
    deductions: {
      tax: 8000,
      pf: 4000,
      insurance: 1500
    },
    overtime: 3000,
    bonus: 5000
  });

  const [payslips] = useState([
    {
      month: 'August 2025',
      basicSalary: 50000,
      totalAllowances: 25000,
      totalDeductions: 13500,
      netSalary: 61500,
      status: 'paid'
    },
    {
      month: 'July 2025',
      basicSalary: 50000,
      totalAllowances: 25000,
      totalDeductions: 13500,
      netSalary: 61500,
      status: 'paid'
    },
    {
      month: 'June 2025',
      basicSalary: 50000,
      totalAllowances: 20000,
      totalDeductions: 13500,
      netSalary: 56500,
      status: 'paid'
    }
  ]);

  const calculateCurrentSalary = () => {
    const totalAllowances = Object.values(salaryData.allowances).reduce((sum, amount) => sum + amount, 0);
    const totalDeductions = Object.values(salaryData.deductions).reduce((sum, amount) => sum + amount, 0);
    const grossSalary = salaryData.basicSalary + totalAllowances + salaryData.overtime + salaryData.bonus;
    const netSalary = grossSalary - totalDeductions;
    
    return {
      grossSalary,
      totalAllowances,
      totalDeductions,
      netSalary
    };
  };

  const currentCalculation = calculateCurrentSalary();

  const downloadPayslip = (month) => {
    alert(`Downloading payslip for ${month}...`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="salary-summary">
      <div className="page-header">
        <h2>Salary Summary</h2>
        <p>View your salary breakdown and payment history</p>
      </div>

      <div className="current-salary-section">
        <div className="salary-header">
          <h3>💰 Current Month Salary - {currentMonth}</h3>
          <div className="net-salary-highlight">
            <span className="net-label">Net Salary</span>
            <span className="net-amount">₹{currentCalculation.netSalary.toLocaleString()}</span>
          </div>
        </div>

        <div className="salary-breakdown">
          <div className="breakdown-section earnings">
            <h4>📈 Earnings</h4>
            <div className="breakdown-items">
              <div className="breakdown-item">
                <span className="item-label">Basic Salary</span>
                <span className="item-amount">₹{salaryData.basicSalary.toLocaleString()}</span>
              </div>
              
              <div className="allowances-group">
                <h5>Allowances</h5>
                {Object.entries(salaryData.allowances).map(([key, value]) => (
                  <div key={key} className="breakdown-item allowance">
                    <span className="item-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    <span className="item-amount">₹{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="breakdown-item">
                <span className="item-label">Overtime Pay</span>
                <span className="item-amount">₹{salaryData.overtime.toLocaleString()}</span>
              </div>
              
              <div className="breakdown-item">
                <span className="item-label">Bonus</span>
                <span className="item-amount">₹{salaryData.bonus.toLocaleString()}</span>
              </div>
              
              <div className="breakdown-item total">
                <span className="item-label">Gross Salary</span>
                <span className="item-amount">₹{currentCalculation.grossSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="breakdown-section deductions">
            <h4>📉 Deductions</h4>
            <div className="breakdown-items">
              {Object.entries(salaryData.deductions).map(([key, value]) => (
                <div key={key} className="breakdown-item deduction">
                  <span className="item-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <span className="item-amount">-₹{value.toLocaleString()}</span>
                </div>
              ))}
              
              <div className="breakdown-item total">
                <span className="item-label">Total Deductions</span>
                <span className="item-amount">-₹{currentCalculation.totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="salary-actions">
          <button className="action-btn primary">📄 Download Current Payslip</button>
          <button className="action-btn secondary">📊 View Tax Statement</button>
          <button className="action-btn secondary">📋 Salary Certificate</button>
        </div>
      </div>

      <div className="salary-history-section">
        <div className="history-header">
          <h3>📊 Salary History</h3>
          <div className="history-stats">
            <div className="stat">
              <span className="stat-label">YTD Gross</span>
              <span className="stat-value">₹{(currentCalculation.grossSalary * 9).toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">YTD Net</span>
              <span className="stat-value">₹{(currentCalculation.netSalary * 9).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="payslips-table">
          <div className="table-header">
            <div className="header-cell">Month</div>
            <div className="header-cell">Basic Salary</div>
            <div className="header-cell">Allowances</div>
            <div className="header-cell">Deductions</div>
            <div className="header-cell">Net Salary</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Actions</div>
          </div>
          
          {payslips.map((payslip, index) => (
            <div key={index} className="table-row">
              <div className="table-cell month">{payslip.month}</div>
              <div className="table-cell">₹{payslip.basicSalary.toLocaleString()}</div>
              <div className="table-cell allowances">₹{payslip.totalAllowances.toLocaleString()}</div>
              <div className="table-cell deductions">-₹{payslip.totalDeductions.toLocaleString()}</div>
              <div className="table-cell net-salary">₹{payslip.netSalary.toLocaleString()}</div>
              <div className="table-cell">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(payslip.status) }}
                >
                  {payslip.status.toUpperCase()}
                </span>
              </div>
              <div className="table-cell">
                <button 
                  className="download-btn"
                  onClick={() => downloadPayslip(payslip.month)}
                >
                  📥 Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="salary-insights">
        <h3>💡 Salary Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Monthly Growth</h4>
              <p>Your salary increased by 8% compared to last quarter</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">💰</div>
            <div className="insight-content">
              <h4>Bonus Eligible</h4>
              <p>You're eligible for performance bonus this month</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">📋</div>
            <div className="insight-content">
              <h4>Tax Savings</h4>
              <p>Consider investing in ELSS for tax benefits</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Payment Date</h4>
              <p>Next salary will be credited on 30th September</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
