import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, Lock, Mail, User, Sparkles } from 'lucide-react';
import '../styles/Auth.css';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-blob blob-1"></div>
                <div className="auth-blob blob-2"></div>
                <div className="auth-blob blob-3"></div>
            </div>

            <div className="auth-content animate-fadeIn">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Cloud size={48} className="logo-icon" />
                        <Sparkles size={20} className="sparkle" />
                    </div>
                    <h1 className="gradient-text">NexusVault</h1>
                    <p>Your Intelligent Cloud Storage</p>
                </div>

                <div className="auth-card glass">
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to access your files</p>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">
                                <Mail size={18} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <Lock size={18} />
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="input"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/register" className="auth-link">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
