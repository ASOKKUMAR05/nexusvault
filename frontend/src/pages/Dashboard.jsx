import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fileService } from '../services/file.service';
import {
    Cloud, LogOut, Upload, Folder, HardDrive, TrendingUp,
    Search, Copy, Zap, FileText, Image, Video, Music, Archive, Code
} from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await fileService.getStorageStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const categoryIcons = {
        Documents: FileText,
        Images: Image,
        Videos: Video,
        Audio: Music,
        Archives: Archive,
        Code: Code,
        Spreadsheets: FileText,
        Presentations: FileText,
        Other: Folder
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header glass">
                <div className="header-content">
                    <div className="header-left">
                        <div className="logo-section">
                            <Cloud size={32} className="logo-icon" />
                            <span className="gradient-text">NexusVault</span>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="user-info">
                            <div className="user-avatar gradient-primary">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-details">
                                <span className="user-name">{user?.name}</span>
                                <span className="user-email">{user?.email}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-ghost">
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main container">
                <div className="welcome-section animate-fadeIn">
                    <h1>Welcome back, {user?.name}! 👋</h1>
                    <p>Manage your files with AI-powered organization</p>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions animate-fadeIn">
                    <button onClick={() => navigate('/files')} className="action-card glass">
                        <Upload size={24} />
                        <span>Upload Files</span>
                    </button>
                    <button onClick={() => navigate('/files')} className="action-card glass">
                        <Search size={24} />
                        <span>Search Files</span>
                    </button>
                    <button onClick={() => navigate('/files')} className="action-card glass">
                        <Copy size={24} />
                        <span>Find Duplicates</span>
                    </button>
                    <button onClick={() => navigate('/files')} className="action-card glass">
                        <Zap size={24} />
                        <span>AI Insights</span>
                    </button>
                </div>

                {/* Storage Overview */}
                <div className="storage-section card animate-fadeIn">
                    <h2>
                        <HardDrive size={24} />
                        Storage Overview
                    </h2>

                    <div className="storage-stats">
                        <div className="storage-bar-container">
                            <div className="storage-bar">
                                <div
                                    className="storage-fill gradient-primary"
                                    style={{ width: `${stats?.storage?.percentage || 0}%` }}
                                ></div>
                            </div>
                            <div className="storage-info">
                                <span className="storage-used">{stats?.storage?.usedFormatted || '0 Bytes'}</span>
                                <span className="storage-total">of {stats?.storage?.quotaFormatted || '5 GB'} used</span>
                            </div>
                        </div>

                        <div className="storage-percentage">
                            <span className="percentage-value">{Math.round(stats?.storage?.percentage || 0)}%</span>
                            <span className="percentage-label">Used</span>
                        </div>
                    </div>
                </div>

                {/* File Categories */}
                <div className="categories-section animate-fadeIn">
                    <h2>
                        <Folder size={24} />
                        File Categories
                    </h2>

                    <div className="categories-grid">
                        {stats?.categoryStats && Object.entries(stats.categoryStats).map(([category, data]) => {
                            const Icon = categoryIcons[category] || Folder;
                            return (
                                <div key={category} className="category-card glass">
                                    <div className="category-header">
                                        <Icon size={32} />
                                        <h3>{category}</h3>
                                    </div>
                                    <div className="category-stats">
                                        <div className="stat">
                                            <span className="stat-value">{data.count}</span>
                                            <span className="stat-label">Files</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{(data.size / (1024 * 1024)).toFixed(1)}</span>
                                            <span className="stat-label">MB</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Files */}
                <div className="recent-section card animate-fadeIn">
                    <h2>
                        <TrendingUp size={24} />
                        Recent Uploads
                    </h2>

                    {stats?.recentUploads && stats.recentUploads.length > 0 ? (
                        <div className="recent-files">
                            {stats.recentUploads.map((file, index) => {
                                const Icon = categoryIcons[file.category] || Folder;
                                return (
                                    <div key={file.id} className="file-item">
                                        <Icon size={20} />
                                        <div className="file-info">
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-meta">{file.size} • {new Date(file.uploadedAt).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`category-badge ${file.category.toLowerCase()}`}>{file.category}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="empty-state">No files uploaded yet. Start uploading to see them here!</p>
                    )}

                    <button onClick={() => navigate('/files')} className="btn btn-primary w-full" style={{ marginTop: 'var(--space-md)' }}>
                        View All Files
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
