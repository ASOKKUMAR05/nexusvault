import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sharingService } from '../services/sharing.service';
import { fileService } from '../services/file.service';
import { ArrowLeft, Download, Trash2, Shield, User } from 'lucide-react';
import '../styles/FileBrowser.css';

const SharedFiles = () => {
    const [sharedWithMe, setSharedWithMe] = useState([]);
    const [sharedByMe, setSharedByMe] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('with-me'); // 'with-me' or 'by-me'
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadSharedFiles();
    }, []);

    const loadSharedFiles = async () => {
        setLoading(true);
        try {
            const [withMeRes, byMeRes] = await Promise.all([
                sharingService.getSharedWithMe(),
                sharingService.getSharedByMe()
            ]);
            setSharedWithMe(withMeRes.shares || []);
            setSharedByMe(byMeRes.shares || []);
        } catch (error) {
            console.error('Error loading shared files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileObj) => {
        try {
            await fileService.downloadFile(fileObj._id, fileObj.originalName);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const handleRevokeShare = async (shareId) => {
        if (!confirm('Are you sure you want to revoke access to this file?')) return;
        try {
            await sharingService.revokeShare(shareId);
            setSharedByMe(sharedByMe.filter(s => s.id !== shareId));
        } catch (error) {
            console.error('Error revoking share:', error);
            alert('Failed to revoke share');
        }
    };

    return (
        <div className="file-browser-container">
            <header className="file-browser-header">
                <div className="header-content">
                    <button onClick={() => navigate('/files')} className="btn btn-ghost">
                        <ArrowLeft size={16} />
                        Back to Files
                    </button>

                    <div className="logo-section">
                        <span>Shared Files</span>
                    </div>

                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            <main className="file-browser-main">
                <div className="category-filter animate-fadeIn">
                    <button
                        onClick={() => setActiveTab('with-me')}
                        className={`filter-btn ${activeTab === 'with-me' ? 'active' : ''}`}
                    >
                        Shared with me
                    </button>
                    <button
                        onClick={() => setActiveTab('by-me')}
                        className={`filter-btn ${activeTab === 'by-me' ? 'active' : ''}`}
                    >
                        Shared by me
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center" style={{ padding: '3rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : activeTab === 'with-me' ? (
                    sharedWithMe.length > 0 ? (
                        <div className="files-grid animate-fadeIn">
                            {sharedWithMe.map(share => (
                                <div key={share.id} className="file-card">
                                    <div className="file-details">
                                        <h3 className="file-name" title={share.file.originalName}>{share.file.originalName}</h3>
                                        <div className="file-meta" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
                                            <User size={12} />
                                            <span style={{ fontSize: '0.85rem' }}>From: {share.owner.email}</span>
                                        </div>
                                    </div>

                                    <div className="file-actions">
                                        <button onClick={() => handleDownload(share.file)} className="action-btn" title="Download">
                                            <Download size={15} />
                                        </button>
                                    </div>
                                    <div className="file-footer">
                                        <span className="upload-date">Shared: {new Date(share.sharedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state animate-fadeIn">
                            <h2>No files shared with you</h2>
                            <p>Files others share with you will appear here.</p>
                        </div>
                    )
                ) : (
                    sharedByMe.length > 0 ? (
                        <div className="files-grid animate-fadeIn">
                            {sharedByMe.map(share => (
                                <div key={share.id} className="file-card">
                                    <div className="file-details">
                                        <h3 className="file-name" title={share.file.originalName}>{share.file.originalName}</h3>
                                        <div className="file-meta" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
                                            <User size={12} />
                                            <span style={{ fontSize: '0.85rem' }}>To: {share.sharedWith.email}</span>
                                        </div>
                                    </div>

                                    <div className="file-actions">
                                        <button onClick={() => handleRevokeShare(share.id)} className="action-btn delete" title="Revoke Access">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                    <div className="file-footer">
                                        <span className="upload-date">Shared: {new Date(share.sharedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state animate-fadeIn">
                            <h2>No files shared by you</h2>
                            <p>Share files from your File Browser to see them here.</p>
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

export default SharedFiles;
