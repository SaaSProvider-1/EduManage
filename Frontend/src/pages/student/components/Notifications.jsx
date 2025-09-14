import React, { useState } from 'react';
import { Bell, Settings, CheckCircle, Calendar, DollarSign, Trash2, ChevronDown } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const [filterType, setFilterType] = useState('All Notifications');

  const stats = [
    {
      title: 'Total Notifications',
      value: '7',
      subtitle: 'All time',
      icon: Bell,
      color: 'blue'
    },
    {
      title: 'Unread',
      value: '3',
      subtitle: 'Need attention',
      icon: Bell,
      color: 'orange'
    },
    {
      title: 'High Priority',
      value: '1',
      subtitle: 'Urgent items',
      icon: Bell,
      color: 'red'
    },
    {
      title: 'This Week',
      value: '0',
      subtitle: 'Recent notifications',
      icon: Calendar,
      color: 'green'
    }
  ];

  const notifications = [
    {
      id: 1,
      title: 'Exam Schedule Updated',
      message: 'Your Mathematics final exam has been rescheduled to December 20th, 2024 at 10:00 AM.',
      category: 'Academic',
      date: '11/8/2024',
      priority: 'high',
      isRead: false,
      icon: Calendar,
      type: 'exam'
    },
    {
      id: 2,
      title: 'Assignment Submitted Successfully',
      message: 'Your Physics assignment \'Wave Motion Analysis\' has been submitted and is under review.',
      category: 'Academic',
      date: '11/8/2024',
      priority: 'medium',
      isRead: false,
      icon: CheckCircle,
      type: 'assignment'
    },
    {
      id: 3,
      title: 'Fee Payment Reminder',
      message: 'Your December 2024 tuition fee of $1,200 is due in 3 days. Please make the payment to avoid late charges.',
      category: 'Financial',
      date: '11/8/2024',
      priority: 'high',
      isRead: false,
      icon: DollarSign,
      type: 'payment'
    },
    {
      id: 4,
      title: 'Assignment Graded',
      message: 'Your Chemistry lab report has been graded. Score: 85/100. View detailed feedback.',
      category: 'Academic',
      date: '11/7/2024',
      priority: 'medium',
      isRead: true,
      icon: CheckCircle,
      type: 'grade'
    },
    {
      id: 5,
      title: 'Class Schedule Change',
      message: 'Tomorrow\'s Physics lecture has been moved from Room 301 to Room 205.',
      category: 'Academic',
      date: '11/6/2024',
      priority: 'medium',
      isRead: true,
      icon: Calendar,
      type: 'schedule'
    },
    {
      id: 6,
      title: 'Library Book Due Soon',
      message: 'Your borrowed book "Advanced Calculus" is due for return in 2 days.',
      category: 'Library',
      date: '11/5/2024',
      priority: 'low',
      isRead: true,
      icon: Bell,
      type: 'reminder'
    },
    {
      id: 7,
      title: 'Fee Payment Confirmed',
      message: 'Your November 2024 tuition fee payment of $1,200 has been received and processed.',
      category: 'Financial',
      date: '11/1/2024',
      priority: 'low',
      isRead: true,
      icon: DollarSign,
      type: 'payment'
    }
  ];

  const filterOptions = ['All Notifications', 'Academic', 'Financial', 'Library', 'High Priority', 'Unread'];

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { class: 'low', text: 'low' },
      medium: { class: 'medium', text: 'medium' },
      high: { class: 'high', text: 'high' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <span className={`priority-badge ${config.class}`}>{config.text}</span>;
  };

  const getNotificationIcon = (notification) => {
    const iconProps = { size: 20, className: `notification-icon ${notification.type}` };
    return <notification.icon {...iconProps} />;
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filterType) {
      case 'Academic':
      case 'Financial':
      case 'Library':
        return notification.category === filterType;
      case 'High Priority':
        return notification.priority === 'high';
      case 'Unread':
        return !notification.isRead;
      default:
        return true;
    }
  });

  const handleMarkAsRead = (notificationId) => {
    alert(`Marking notification ${notificationId} as read...`);
  };

  const handleDeleteNotification = (notificationId) => {
    alert(`Deleting notification ${notificationId}...`);
  };

  const handleMarkAllAsRead = () => {
    alert('Marking all notifications as read...');
  };

  const handleSettings = () => {
    alert('Opening notification settings...');
  };

  return (
    <div className="notifications">
      <div className="notify-page-header">
        <div className="notify-header-content">
          <h1>Notifications</h1>
          <p>Stay updated with important announcements</p>
        </div>
        <div className="notify-header-actions">
          <div className="filter-container">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              {filterOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="select-icon" size={16} />
          </div>
          <button className="settings-button" onClick={handleSettings}>
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="notify-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`notify-stat-card ${stat.color}`}>
            <div className="notify-stat-header">
              <span className="notify-stat-title">{stat.title}</span>
              <stat.icon className="notify-stat-icon" size={20} />
            </div>
            <div className="notify-stat-value-section">
              <h3 className="notify-stat-number">{stat.value}</h3>
              <p className="notify-stat-subtitle">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications Section */}
      <div className="notifications-section">
        <div className="notify-section-header">
          <h2>Recent Notifications</h2>
          <button className="mark-all-read" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div key={notification.id} className={`notification-card ${!notification.isRead ? 'unread' : ''}`}>
              <div className="notification-content">
                <div className="notification-header">
                  <div className="notification-title-section">
                    {getNotificationIcon(notification)}
                    <div className="title-and-indicator">
                      <h3 className="notification-title">{notification.title}</h3>
                      {!notification.isRead && <div className="unread-indicator"></div>}
                    </div>
                  </div>
                  <div className="notification-badges">
                    {getPriorityBadge(notification.priority)}
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="notification-message">
                  <p>{notification.message}</p>
                </div>

                <div className="notification-meta">
                  <div className="meta-info">
                    <span className="category">{notification.category}</span>
                    <span className="date">{notification.date}</span>
                  </div>
                  {!notification.isRead && (
                    <button 
                      className="mark-read-button"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="no-notifications">
            <Bell size={48} className="no-notifications-icon" />
            <h3>No notifications found</h3>
            <p>Try adjusting your filter or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
