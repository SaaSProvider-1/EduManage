import React, { useState } from 'react';
import './Settings.css';

export default function Settings() {
  const [settings, setSettings] = useState({
    instituteName: 'EduManage Coaching Center',
    instituteEmail: 'admin@edumanage.com',
    institutePhone: '+91 9876543200',
    address: '123 Education Street, Learning City, 560001',
    sessionDuration: '6', // months
    maxBatchSize: '30',
    feeReminders: true,
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    darkMode: false,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    academicYear: '2025-26',
    gradePassingMarks: '40'
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      // Reset to default values
      alert('Settings reset to default values');
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>Settings</h2>
        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={handleReset}>Reset to Default</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          🏢 General
        </button>
        <button 
          className={`tab ${activeTab === 'academic' ? 'active' : ''}`}
          onClick={() => setActiveTab('academic')}
        >
          🎓 Academic
        </button>
        <button 
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
        </button>
        <button 
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          ⚙️ System
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-section">
            <h3>Institute Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Institute Name</label>
                <input
                  type="text"
                  value={settings.instituteName}
                  onChange={(e) => handleInputChange('instituteName', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={settings.instituteEmail}
                  onChange={(e) => handleInputChange('instituteEmail', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={settings.institutePhone}
                  onChange={(e) => handleInputChange('institutePhone', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="settings-section">
            <h3>Academic Settings</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Academic Year</label>
                <select
                  value={settings.academicYear}
                  onChange={(e) => handleInputChange('academicYear', e.target.value)}
                  className="form-select"
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>
              <div className="form-group">
                <label>Default Session Duration (months)</label>
                <select
                  value={settings.sessionDuration}
                  onChange={(e) => handleInputChange('sessionDuration', e.target.value)}
                  className="form-select"
                >
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>
              <div className="form-group">
                <label>Maximum Batch Size</label>
                <input
                  type="number"
                  value={settings.maxBatchSize}
                  onChange={(e) => handleInputChange('maxBatchSize', e.target.value)}
                  className="form-input"
                  min="10"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Grade Passing Marks (%)</label>
                <input
                  type="number"
                  value={settings.gradePassingMarks}
                  onChange={(e) => handleInputChange('gradePassingMarks', e.target.value)}
                  className="form-input"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h3>Notification Preferences</h3>
            <div className="toggle-group">
              <div className="toggle-item">
                <div className="toggle-info">
                  <h4>Fee Reminders</h4>
                  <p>Send automatic reminders for pending fee payments</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.feeReminders}
                    onChange={(e) => handleInputChange('feeReminders', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-item">
                <div className="toggle-info">
                  <h4>Email Notifications</h4>
                  <p>Receive important updates via email</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-item">
                <div className="toggle-info">
                  <h4>SMS Notifications</h4>
                  <p>Send SMS alerts for important events</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="settings-section">
            <h3>System Preferences</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="form-select"
                >
                  <option value="INR">₹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="form-select"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>

            <div className="toggle-group">
              <div className="toggle-item">
                <div className="toggle-info">
                  <h4>Automatic Backup</h4>
                  <p>Enable daily automatic backup of all data</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoBackup}
                    onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-item">
                <div className="toggle-info">
                  <h4>Dark Mode</h4>
                  <p>Switch to dark theme for better night viewing</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => handleInputChange('darkMode', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="danger-zone">
              <h4>🚨 Danger Zone</h4>
              <p>These actions cannot be undone. Please be careful.</p>
              <div className="danger-actions">
                <button className="btn btn-danger">Reset All Data</button>
                <button className="btn btn-danger">Delete Institute</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
