import React, { useState } from 'react';
import { Search, Plus, MessageCircle, CheckCircle, Clock, HelpCircle } from 'lucide-react';
import './DoubtRequests.css';

const DoubtRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    {
      title: 'Total Doubts',
      value: '5',
      subtitle: 'All time',
      icon: MessageCircle,
      color: 'blue'
    },
    {
      title: 'Resolved',
      value: '2',
      subtitle: 'Successfully answered',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'In Progress',
      value: '2',
      subtitle: 'Being reviewed',
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Pending',
      value: '1',
      subtitle: 'Awaiting assignment',
      icon: HelpCircle,
      color: 'blue'
    }
  ];

  const doubts = [
    {
      id: 1,
      title: 'Quantum Mechanics - Wave-Particle Duality',
      subject: 'Physics',
      category: 'Concept Clarification',
      submitted: '2024-11-05',
      priority: 'medium',
      status: 'resolved',
      description: 'I\'m having trouble understanding how photons can behave as both waves and particles. Can you help explain this concept with examples?',
      assignedTo: 'Prof. Anderson',
      resolvedOn: '2024-11-06'
    },
    {
      id: 2,
      title: 'Calculus Integration by Parts',
      subject: 'Mathematics',
      category: 'Problem Solving',
      submitted: '2024-11-07',
      priority: 'high',
      status: 'in-progress',
      description: 'I\'m struggling with integration by parts, especially when to use which function as u and which as dv. Need help with practice problems.',
      assignedTo: 'Prof. Johnson',
      resolvedOn: null
    },
    {
      id: 3,
      title: 'Organic Chemistry Nomenclature',
      subject: 'Chemistry',
      category: 'Concept Clarification',
      submitted: '2024-11-08',
      priority: 'medium',
      status: 'pending',
      description: 'Having difficulty with IUPAC nomenclature for complex organic compounds. Need clarification on priority rules.',
      assignedTo: null,
      resolvedOn: null
    }
  ];

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { class: 'low', text: 'low' },
      medium: { class: 'medium', text: 'medium' },
      high: { class: 'high', text: 'high' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <span className={`priority-badge ${config.class}`}>{config.text}</span>;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      resolved: { class: 'resolved', text: 'resolved' },
      'in-progress': { class: 'in-progress', text: 'in-progress' },
      pending: { class: 'pending', text: 'pending' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} className="status-icon resolved" />;
      case 'in-progress':
        return <Clock size={16} className="status-icon in-progress" />;
      case 'pending':
        return <HelpCircle size={16} className="status-icon pending" />;
      default:
        return <HelpCircle size={16} className="status-icon" />;
    }
  };

  const filteredDoubts = doubts.filter(doubt => 
    doubt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doubt.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doubt.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewDoubt = () => {
    alert('Opening new doubt form...');
  };

  const handleViewSolution = (doubt) => {
    if (doubt.status === 'resolved') {
      alert(`Viewing solution for: ${doubt.title}`);
    }
  };

  const handleFollowUp = (doubt) => {
    if (doubt.status === 'in-progress') {
      alert(`Following up on: ${doubt.title}`);
    }
  };

  return (
    <div className="doubt-requests">
      <div className="doubt-page-header">
        <div className="doubt-header-content">
          <h1>Doubt Requests</h1>
          <p>Get help with your academic questions</p>
        </div>
        <div className="doubt-header-actions">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search doubts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="new-doubt-button" onClick={handleNewDoubt}>
            <Plus size={16} />
            New Doubt
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="doubt-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`doubt-stat-card ${stat.color}`}>
            <div className="doubt-stat-header">
              <span className="doubt-stat-title">{stat.title}</span>
              <stat.icon className="doubt-stat-icon" size={20} />
            </div>
            <div className="doubt-stat-value-section">
              <h3 className="doubt-stat-number">{stat.value}</h3>
              <p className="doubt-stat-subtitle">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Doubts List */}
      <div className="doubts-section">
        <div className="doubts-list">
          {filteredDoubts.map((doubt) => (
            <div key={doubt.id} className="doubt-card">
              <div className="doubt-header">
                <div className="doubt-title-section">
                  {getStatusIcon(doubt.status)}
                  <h3 className="doubt-title">{doubt.title}</h3>
                </div>
                <div className="doubt-badges">
                  {getPriorityBadge(doubt.priority)}
                  {getStatusBadge(doubt.status)}
                </div>
              </div>

              <div className="doubt-meta">
                <div className="meta-item">
                  <span className="meta-label">Subject:</span>
                  <span className="meta-value">{doubt.subject}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Category:</span>
                  <span className="meta-value">{doubt.category}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Submitted:</span>
                  <span className="meta-value">{doubt.submitted}</span>
                </div>
              </div>

              <div className="doubt-description">
                <p>{doubt.description}</p>
              </div>

              <div className="doubt-footer">
                <div className="assignment-info">
                  {doubt.assignedTo && (
                    <span className="assigned-to">Assigned to: {doubt.assignedTo}</span>
                  )}
                  {doubt.resolvedOn && (
                    <span className="resolved-on">Resolved on: {doubt.resolvedOn}</span>
                  )}
                </div>
                <div className="doubt-actions">
                  {doubt.status === 'resolved' && (
                    <button 
                      className="action-button primary"
                      onClick={() => handleViewSolution(doubt)}
                    >
                      View Solution
                    </button>
                  )}
                  {doubt.status === 'in-progress' && (
                    <button 
                      className="action-button secondary"
                      onClick={() => handleFollowUp(doubt)}
                    >
                      Follow Up
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDoubts.length === 0 && (
          <div className="no-results">
            <MessageCircle size={48} className="no-results-icon" />
            <h3>No doubts found</h3>
            <p>Try adjusting your search criteria or submit a new doubt</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoubtRequests;
