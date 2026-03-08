import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function getActiveApi() {
    return api;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = api.getToken();
        if (token) {
            api.getMe()
                .then(userData => setUser(userData))
                .catch(() => { api.setToken(null); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

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

    const logout = () => {
        api.setToken(null);
        setUser(null);
    };

    const activeApi = api;

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, activeApi }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
