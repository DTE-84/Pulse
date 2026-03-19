import { createContext, useContext, useState } from 'react';
export const AuthContext = createContext(null);
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        }
        catch {
            return null;
        }
    });
    const [token, setToken] = useState(localStorage.getItem('token'));
    const login = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };
    const updateUser = (partial) => {
        setUser(prev => {
            if (!prev)
                return null;
            const updated = { ...prev, ...partial };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };
    return (<AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            updateUser,
            isAuthenticated: !!token
        }}>
      {children}
    </AuthContext.Provider>);
};
