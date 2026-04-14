import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fileService } from '../services/file.service';
import { sharingService } from '../services/sharing.service';
import { Upload, Search, Download, Trash2, ArrowLeft, Share2, Users } from 'lucide-react';
import '../styles/FileBrowser.css';

const FileBrowser = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [fileToShare, setFileToShare] = useState(null);
    const [shareEmail, setShareEmail] = useState('');
    const [sharePermission, setSharePermission] = useState('view');
    const [sharingFile, setSharingFile] = useState(false);
    
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadFiles();
    }, [selectedCategory]);

    const loadFiles = async () => {
        try {
            const params = selectedCategory ? { category: selectedCategory } : {};
            const response = await fileService.getFiles(params);
            setFiles(response.data.files);
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            await fileService.uploadFile(file, (progress) => {
                setUploadProgress(progress);
            });

            await loadFiles();
            setUploadProgress(0);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(error.response?.data?.message || 'Error uploading file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDownload = async (file) => {
        try {
            await fileService.downloadFile(file.id, file.name);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const handleDelete = async (fileId) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await fileService.deleteFile(fileId);
            setFiles(files.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleOpenShare = (file) => {
        setFileToShare(file);
        setShareEmail('');
        setSharePermission('view');
        setShareModalOpen(true);
    };

    const handleShareSubmit = async (e) => {
        e.preventDefault();
        if (!shareEmail) return;

        setSharingFile(true);
        try {
            await sharingService.shareFile(fileToShare.id, shareEmail, sharePermission);
            alert('File shared successfully!');
            setShareModalOpen(false);
        } catch (error) {
            console.error('Error sharing file:', error);
            alert(error.response?.data?.message || 'Error sharing file');
        } finally {
            setSharingFile(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadFiles();
            return;
        }

        try {
            const response = await fileService.searchFiles(searchQuery, { category: selectedCategory });
            setFiles(response.data.results);
        } catch (error) {
            console.error('Error searching files:', error);
        }
    };

    const categories = ['All', 'Documents', 'Images', 'Videos', 'Audio', 'Code', 'Archives', 'Other'];

    const filteredFiles = files;

    return (
        <div className="file-browser-container">
            {/* Header */}
            <header className="file-browser-header">
                <div className="header-content">
                    <button onClick={() => navigate('/dashboard')} className="btn btn-ghost">
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <div className="logo-section">
                        <span>NexusVault</span>
                    </div>

                    <div className="flex" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/shared-files')} className="btn btn-ghost" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} />
                            Shared Files
                        </button>
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            <main className="file-browser-main">
                {/* Search and Upload Bar */}
                <div className="toolbar animate-fadeIn">
                    <div className="search-section">
                        <div className="search-bar">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-primary"
                        disabled={uploading}
                    >
                        <Upload size={16} />
                        {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                    </button>
                </div>

                {/* Upload Progress */}
                {uploading && (
                    <div className="upload-progress animate-fadeIn">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <span>{uploadProgress}%</span>
                    </div>
                )}

                {/* Category Filter */}
                <div className="category-filter animate-fadeIn">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                            className={`filter-btn ${(cat === 'All' && !selectedCategory) || selectedCategory === cat ? 'active' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Files Grid */}
                {loading ? (
                    <div className="flex items-center justify-center" style={{ padding: '3rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : filteredFiles.length > 0 ? (
                    <div className="files-grid animate-fadeIn">
                        {filteredFiles.map(file => {
                            return (
                                <div key={file.id} className="file-card">
                                    <div className="file-details">
                                        <h3 className="file-name" title={file.name}>{file.name}</h3>
                                        <div className="file-meta">
                                            <span className="file-size">{file.sizeFormatted}</span>
                                            <span className={`category-badge ${file.category.toLowerCase()}`}>
                                                {file.category}
                                            </span>
                                        </div>
                                        <div className="file-tags">
                                            {file.tags && file.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="tag">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="file-actions">
                                        <button
                                            onClick={() => handleDownload(file)}
                                            className="action-btn"
                                            title="Download"
                                        >
                                            <Download size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenShare(file)}
                                            className="action-btn"
                                            title="Share"
                                        >
                                            <Share2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="action-btn delete"
                                            title="Delete"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <div className="file-footer">
                                        <span className="upload-date">
                                            {new Date(file.uploadedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state animate-fadeIn">
                        <h2>No files yet</h2>
                        <p>Upload your first file to get started</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-primary"
                        >
                            <Upload size={16} />
                            Upload File
                        </button>
                    </div>
                )}
                
                {/* Share Modal */}
                {shareModalOpen && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                        <div className="modal-content" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '450px', maxWidth: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#333' }}>Share: <span style={{fontWeight:'normal', color:'#666'}}>{fileToShare?.name}</span></h2>
                            <form onSubmit={handleShareSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                <div>
                                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#444'}}>Target User Email</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={shareEmail} 
                                        onChange={(e) => setShareEmail(e.target.value)}
                                        style={{width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem'}}
                                        placeholder="Enter the user's email address"
                                    />
                                </div>
                                <div>
                                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#444'}}>Permission Level</label>
                                    <select 
                                        value={sharePermission} 
                                        onChange={(e) => setSharePermission(e.target.value)}
                                        style={{width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', backgroundColor: 'white'}}
                                    >
                                        <option value="view">View Only</option>
                                        <option value="edit">Can Edit</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem'}}>
                                    <button type="button" onClick={() => setShareModalOpen(false)} className="btn btn-ghost" disabled={sharingFile} style={{padding: '0.5rem 1rem'}}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={sharingFile} style={{padding: '0.5rem 1.5rem'}}>
                                        {sharingFile ? 'Sharing...' : 'Share File'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FileBrowser;
