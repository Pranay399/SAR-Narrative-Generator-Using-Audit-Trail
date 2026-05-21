'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const DEMO_CREDENTIALS = {
    Analyst: { email: 'analyst@fintrace.com', password: 'Analyst123!' },
    Compliance: { email: 'compliance@fintrace.com', password: 'Compliance123!' },
    Admin: { email: 'admin@fintrace.com', password: 'Admin123!' }
};

export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<'Analyst' | 'Compliance' | 'Admin'>('Analyst');
    const [email, setEmail] = useState('analyst@fintrace.com');
    const [password, setPassword] = useState('Analyst123!');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRoleChange = (r: 'Analyst' | 'Compliance' | 'Admin') => {
        setRole(r);
        setEmail(DEMO_CREDENTIALS[r].email);
        setPassword(DEMO_CREDENTIALS[r].password);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);
            const res = await fetch(`${API_BASE}/api/v1/auth/token`, { 
                method: 'POST', 
                body: formData 
            });
            if (!res.ok) throw new Error('Invalid credentials');
            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            // Full page navigation to dashboard to let the AuthProvider correctly initialize the session on mount
            window.location.href = '/dashboard';
        } catch {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-grow flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden bg-[#fcf8fb]">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-40">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#d8e2ff] rounded-full mix-blend-multiply filter blur-3xl" />
                <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-[#e3e2e7] rounded-full mix-blend-multiply filter blur-3xl" />
            </div>

            {/* Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12 text-center relative z-10"
            >
                <h1 className="text-2xl font-extrabold tracking-tighter text-[#1b1b1d] mb-2 uppercase">
                    Digital Architect
                </h1>
                <p className="text-[#414755] text-sm tracking-wide font-medium opacity-60">
                    FINANCIAL NARRATIVE ENGINE
                </p>
            </motion.header>

            {/* Main Form Section */}
            <motion.section 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-panel editorial-shadow rounded-xl w-full max-w-[440px] p-10 relative z-10 border border-[#c1c6d7]/20"
            >
                <div className="mb-10">
                    <label className="block text-xs font-bold text-[#414755] mb-4 tracking-widest uppercase text-center">
                        Select Environment
                    </label>
                    <div className="flex p-1 bg-[#f6f3f5] rounded-lg gap-1 relative z-0">
                        {(['Analyst', 'Compliance', 'Admin'] as const).map((r) => {
                            const isActive = role === r;
                            return (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => handleRoleChange(r)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors duration-300 relative z-10 ${isActive ? 'text-[#1b1b1d]' : 'text-[#414755] hover:text-[#1b1b1d]'}`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-env-tab"
                                            className="absolute inset-0 bg-white rounded-md shadow-sm z-[-1]"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    {r}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#1b1b1d] ml-1" htmlFor="email">
                            Work Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@institution.com"
                            required
                            className="w-full bg-[#f6f3f5] border-none rounded-lg px-4 py-3.5 text-[#1b1b1d] placeholder-[#c1c6d7] focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20 focus:bg-white transition-all duration-300 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="block text-sm font-semibold text-[#1b1b1d]" htmlFor="password">
                                Password
                            </label>
                            <a href="#" className="text-xs font-medium text-[#0058bc] hover:opacity-80 transition-opacity">
                                Forgot?
                            </a>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full bg-[#f6f3f5] border-none rounded-lg px-4 py-3.5 text-[#1b1b1d] placeholder-[#c1c6d7] focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20 focus:bg-white transition-all duration-300 text-sm"
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.p 
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="text-xs text-red-600 font-medium"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full milled-button text-white font-bold py-4 rounded-lg shadow-lg active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                            {!loading && (
                                <span className="material-symbols-outlined text-lg">
                                    arrow_forward
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-sm text-[#414755]">
                        New to the platform?{' '}
                        <a href="#" className="text-[#0058bc] font-bold hover:underline decoration-2 underline-offset-4 ml-1">
                            Request Access
                        </a>
                    </p>
                </div>

                <div className="mt-10 pt-8 border-t border-[#c1c6d7]/10 flex justify-center items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e2dfe1] rounded-full">
                        <span className="material-symbols-outlined text-[14px] text-[#636264]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified_user
                        </span>
                        <span className="text-[10px] font-bold text-[#636264] uppercase tracking-widest">
                            Bank-Grade Security
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e3e2e7] rounded-full">
                        <span className="material-symbols-outlined text-[14px] text-[#46464b]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            key
                        </span>
                        <span className="text-[10px] font-bold text-[#46464b] uppercase tracking-widest">
                            2FA Enabled
                        </span>
                    </div>
                </div>
            </motion.section>

            {/* Feature Showcase Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 px-4 pb-40 border-t border-[#c1c6d7]/20 pt-8 w-full opacity-0 md:opacity-100"
            >
                {[
                    { icon: 'description', title: 'SAR Generation', desc: 'Automated high-fidelity narrative construction based on verified data.' },
                    { icon: 'monitoring', title: 'Predictive Analysis', desc: 'Early detection patterns mapped against global compliance standards.' },
                    { icon: 'history_edu', title: 'Audit Trails', desc: 'Full immutability for regulatory transparency and security compliance.' },
                ].map((item) => (
                    <div key={item.title} className="text-center space-y-2">
                        <span className="material-symbols-outlined text-[#414755]/40">{item.icon}</span>
                        <h3 className="text-xs font-bold text-[#414755] tracking-widest uppercase">{item.title}</h3>
                        <p className="text-[11px] text-[#414755]/60 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </motion.div>

            {/* Footer */}
            <footer className="fixed bottom-0 w-full flex justify-center items-center gap-8 py-8 px-8 bg-transparent">
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                    {['Privacy Policy', 'Terms of Service', 'Security Compliance'].map((link) => (
                        <a key={link} className="text-xs font-sans text-[#414755] uppercase tracking-widest hover:text-[#007AFF] transition-colors duration-300 cursor-pointer" href="#">{link}</a>
                    ))}
                </div>
                <div className="absolute bottom-4 text-[10px] text-[#414755]/40 font-medium">© {new Date().getFullYear()} Digital Architect. All rights reserved.</div>
            </footer>
        </main>
    );
}
