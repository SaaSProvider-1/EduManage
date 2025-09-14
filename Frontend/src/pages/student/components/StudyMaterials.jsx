import React, { useState } from 'react';
import { Search, Filter, Download, BookOpen, FileText, Video, Play } from 'lucide-react';
import './StudyMaterials.css';

const StudyMaterials = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Types');

  const stats = [
    {
      title: 'Total Materials',
      value: '8',
      subtitle: 'Resources available',
      icon: BookOpen,
      color: 'blue'
    },
    {
      title: 'Total Downloads',
      value: '531',
      subtitle: 'By all students',
      icon: Download,
      color: 'green'
    },
    {
      title: 'Recent Uploads',
      value: '3',
      subtitle: 'This week',
      icon: FileText,
      color: 'orange'
    },
    {
      title: 'Subjects',
      value: '5',
      subtitle: 'Active subjects',
      icon: BookOpen,
      color: 'teal'
    }
  ];

  const materials = [
    {
      id: 1,
      title: 'Advanced Calculus - Chapter 5',
      subject: 'Mathematics',
      type: 'PDF',
      category: 'Lecture Notes',
      size: '2.5 MB',
      downloads: 45,
      uploadDate: '2024-11-01',
      description: 'Comprehensive notes on integration techniques and applications'
    },
    {
      id: 2,
      title: 'Quantum Physics Laboratory Manual',
      subject: 'Physics',
      type: 'PDF',
      category: 'Lab Manual',
      size: '8.2 MB',
      downloads: 32,
      uploadDate: '2024-10-28',
      description: 'Complete lab manual with experiments and procedures'
    },
    {
      id: 3,
      title: 'Organic Chemistry Reactions Video',
      subject: 'Chemistry',
      type: 'Video',
      category: 'Video Lecture',
      size: '145 MB',
      downloads: 78,
      uploadDate: '2024-10-25',
      description: 'Detailed explanation of organic reaction mechanisms'
    },
    {
      id: 4,
      title: 'Data Structures and Algorithms',
      subject: 'Computer Science',
      type: 'PDF',
      category: 'Reference Book',
      size: '5.1 MB',
      downloads: 156,
      uploadDate: '2024-10-22',
      description: 'Complete reference for data structures and algorithmic concepts'
    },
    {
      id: 5,
      title: 'Shakespeare\'s Hamlet Analysis',
      subject: 'English',
      type: 'PDF',
      category: 'Study Guide',
      size: '1.8 MB',
      downloads: 23,
      uploadDate: '2024-10-20',
      description: 'In-depth literary analysis and character study'
    },
    {
      id: 6,
      title: 'Linear Algebra Practice Problems',
      subject: 'Mathematics',
      type: 'PDF',
      category: 'Practice Set',
      size: '3.2 MB',
      downloads: 67,
      uploadDate: '2024-10-18',
      description: 'Comprehensive practice problems with solutions'
    }
  ];

  const filterTypes = ['All Types', 'PDF', 'Video', 'Audio', 'Image'];

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText size={16} className="type-icon pdf" />;
      case 'video':
        return <Video size={16} className="type-icon video" />;
      case 'audio':
        return <Play size={16} className="type-icon audio" />;
      default:
        return <FileText size={16} className="type-icon" />;
    }
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      'Lecture Notes': 'blue',
      'Lab Manual': 'red',
      'Video Lecture': 'green',
      'Reference Book': 'teal',
      'Study Guide': 'purple',
      'Practice Set': 'orange'
    };

    const color = categoryColors[category] || 'gray';
    return <span className={`category-badge ${color}`}>{category}</span>;
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'All Types' || material.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleDownload = (material) => {
    alert(`Downloading ${material.title}...`);
  };

  return (
    <div className="study-materials">
      <div className="pdf-page-header">
        <div className="pdf-header-content">
          <h1>Study Materials</h1>
          <p>Access your course materials and resources</p>
        </div>
        <div className="header-actions">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-container">
            <Filter className="filter-icon" size={16} />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="filter-select"
            >
              {filterTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="pdf-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`pdf-stat-card ${stat.color}`}>
            <div className="pdf-stat-header">
              <span className="pdf-stat-title">{stat.title}</span>
              <stat.icon className="pdf-stat-icon" size={20} />
            </div>
            <div className="pdf-stat-value-section">
              <h3 className="pdf-stat-number">{stat.value}</h3>
              <p className="pdf-stat-subtitle">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Materials Grid */}
      <div className="materials-section">
        <div className="materials-grid">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="material-card">
              <div className="material-header">
                <div className="material-type">
                  {getTypeIcon(material.type)}
                  <span className="type-text">{material.type}</span>
                </div>
                {getCategoryBadge(material.category)}
              </div>
              
              <div className="material-content">
                <h3 className="material-title">{material.title}</h3>
                <p className="material-subject">{material.subject}</p>
                
                <div className="material-details">
                  <div className="detail-item">
                    <span className="detail-label">Size:</span>
                    <span className="detail-value">{material.size}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Downloads:</span>
                    <span className="detail-value">{material.downloads}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Uploaded:</span>
                    <span className="detail-value">{material.uploadDate}</span>
                  </div>
                </div>
              </div>

              <button 
                className="download-button"
                onClick={() => handleDownload(material)}
              >
                <Download size={16} />
                Download
              </button>
            </div>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="no-results">
            <FileText size={48} className="no-results-icon" />
            <h3>No materials found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
