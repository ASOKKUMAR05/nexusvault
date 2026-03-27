import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fileService } from '../services/file.service';
import { Upload, Search, Download, Trash2, ArrowLeft } from 'lucide-react';
import '../styles/FileBrowser.css';

const FileBrowser = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
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

                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
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
            </main>
        </div>
    );
};

export default FileBrowser;
