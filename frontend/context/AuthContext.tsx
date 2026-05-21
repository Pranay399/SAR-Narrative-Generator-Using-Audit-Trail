'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface AuthUser {
    id: number;
    username: string;
    role: 'Analyst' | 'Compliance Officer' | 'System Admin';
    is_active: boolean;
}

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: validate existing token and fetch current user
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }
        fetch(`${API_BASE}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (!r.ok) throw new Error('Unauthorized');
                return r.json();
            })
            .then((data: AuthUser) => {
                setUser(data);
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (username: string, password: string) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch(`${API_BASE}/api/v1/auth/token`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Invalid credentials');
        }
        const data = await res.json();
        localStorage.setItem('token', data.access_token);

        // Fetch full profile
        const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const me: AuthUser = await meRes.json();
        setUser(me);

        // Role-based redirect
        if (me.role === 'System Admin') router.push('/users');
        else if (me.role === 'Analyst') router.push('/bi-dashboard');
        else router.push('/dashboard');  // Compliance Officer → their dashboard
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
