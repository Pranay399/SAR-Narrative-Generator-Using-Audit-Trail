'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];  // If not provided, any authenticated user is allowed
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            // Redirect unauthorized users back to their home
            router.replace('/dashboard');
        }
    }, [user, isLoading, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcf8fb]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-[#0058bc]/20 border-t-[#0058bc] rounded-full"
                />
            </div>
        );
    }

    if (!user) return null;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf8fb] gap-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-red-500">lock</span>
                </div>
                <h1 className="text-2xl font-extrabold text-[#1b1b1d]">Access Denied</h1>
                <p className="text-sm text-[#414755]">
                    Your role <strong>{user.role}</strong> does not have permission to view this page.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mt-2 bg-[#0058bc] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
