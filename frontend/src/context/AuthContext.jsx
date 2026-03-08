import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import demoApi from '../services/demoApi';

const AuthContext = createContext(null);

function getActiveApi() {
    return localStorage.getItem('bt_demo_mode') ? demoApi : api;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(!!localStorage.getItem('bt_demo_mode'));

    useEffect(() => {
        if (isDemo) {
            demoApi.getMe().then(u => setUser(u)).finally(() => setLoading(false));
            return;
        }
        const token = api.getToken();
        if (token) {
            api.getMe()
                .then(userData => setUser(userData))
                .catch(() => { api.setToken(null); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isDemo]);

    const login = async (email, password) => {
        const data = await api.login({ email, password });
        api.setToken(data.access_token);
        setUser(data.user);
        return data;
    };

    const register = async (name, email, password) => {
        const data = await api.register({ name, email, password });
        api.setToken(data.access_token);
        setUser(data.user);
        return data;
    };

    const enterDemo = () => {
        localStorage.setItem('bt_demo_mode', 'true');
        setIsDemo(true);
    };

    const logout = () => {
        api.setToken(null);
        localStorage.removeItem('bt_demo_mode');
        setIsDemo(false);
        setUser(null);
    };

    const activeApi = isDemo ? demoApi : api;

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, enterDemo, isDemo, activeApi }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
