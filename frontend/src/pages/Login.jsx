import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const { login, register, enterDemo } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(name, email, password);
            } else {
                await login(email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-orb login-bg-orb-1" />
            <div className="login-bg-orb login-bg-orb-2" />

            <div className="login-container">
                <div className="login-header">
                    <span className="login-logo">💰</span>
                    <h1>Budget Tracker</h1>
                    <p>Take control of your finances</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form card-accent" id="auth-form">
                    <div className="login-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${!isRegister ? 'active' : ''}`}
                            onClick={() => { setIsRegister(false); setError(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${isRegister ? 'active' : ''}`}
                            onClick={() => { setIsRegister(true); setError(''); }}
                        >
                            Sign Up
                        </button>
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="Your name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <div className="form-error">⚠️ {error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                        id="auth-submit"
                    >
                        {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
                    </button>

                    <div className="demo-divider">
                        <span>or</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary btn-full"
                        onClick={enterDemo}
                        id="demo-btn"
                    >
                        🚀 Try Demo (No MongoDB needed)
                    </button>
                </form>
            </div>
        </div>
    );
}
