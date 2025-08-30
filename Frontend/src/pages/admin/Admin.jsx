import React, { useState } from 'react';
import Navbar from "./navbar";
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import TeacherManagement from './components/TeacherManagement';
import BatchManagement from './components/BatchManagement';
import FeesManagement from './components/FeesManagement';
import UploadResources from './components/UploadResources';
import ReportsAnalytics from './components/ReportsAnalytics';
import Approval from './components/Approval';
import Settings from './components/Settings';
import './Admin.css';

export default function Admin() {
  const [currentView, setCurrentView] = useState('dashboard');

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Handle logout logic here
      alert('Logging out...');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentManagement />;
      case 'teachers':
        return <TeacherManagement />;
      case 'batches':
        return <BatchManagement />;
      case 'fees':
        return <FeesManagement />;
      case 'resources':
        return <UploadResources />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'approval':
        return <Approval />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-layout">
      <Navbar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        onLogout={handleLogout}
      />
      <main className="admin-main">
        {renderCurrentView()}
      </main>
    </div>
  );
}
