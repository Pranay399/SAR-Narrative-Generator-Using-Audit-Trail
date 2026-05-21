'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

// Role → nav link definitions
const roleNavLinks: Record<string, { href: string; label: string; icon: string }[]> = {
    'Analyst': [
        { href: '/dashboard',    label: 'Dashboard',    icon: 'grid_view' },
        { href: '/reports',      label: 'Reports',      icon: 'bar_chart' },
        { href: '/audit',        label: 'Audit Trail',  icon: 'history_edu' },
        { href: '/bi-dashboard', label: 'BI Dashboard', icon: 'analytics' },
    ],
    'Compliance Officer': [
        { href: '/dashboard', label: 'Dashboard',   icon: 'grid_view' },
        { href: '/reports',   label: 'Reports',     icon: 'bar_chart' },
        { href: '/upload',    label: 'Admin Panel', icon: 'upload_file' },
    ],
    'System Admin': [
        { href: '/dashboard',    label: 'Dashboard',       icon: 'grid_view' },
        { href: '/reports',      label: 'Reports',         icon: 'bar_chart' },
        { href: '/audit',        label: 'Audit Trail',     icon: 'history_edu' },
        { href: '/upload',       label: 'Admin Panel',     icon: 'upload_file' },
        { href: '/users',        label: 'User Management', icon: 'manage_accounts' },
    ],
};

const roleBadgeStyles: Record<string, string> = {
    'Analyst':           'bg-blue-50 text-[#0058bc]',
    'Compliance Officer':'bg-amber-50 text-amber-700',
    'System Admin':      'bg-purple-50 text-purple-700',
};

export default function NavBar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const role = user?.role ?? 'Analyst';
    const navLinks = roleNavLinks[role] ?? roleNavLinks['Analyst'];
    const badgeClass = roleBadgeStyles[role] ?? 'bg-blue-50 text-[#0058bc]';

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-[#c1c6d7]/10">
            <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-2xl mx-auto font-sans antialiased tracking-tight text-sm font-medium">
                {/* Brand */}
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-xl font-bold tracking-tighter text-zinc-900 group flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#0058bc] flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-lg">account_balance</span>
                        </div>
                        Digital Architect
                    </Link>

                    {/* Dynamic Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname.startsWith(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative px-3.5 py-2 transition-colors duration-300 flex items-center gap-1.5 rounded-lg ${
                                        isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-[#0058bc]/5 rounded-lg z-0"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="material-symbols-outlined text-[16px] relative z-10" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                                        {link.icon}
                                    </span>
                                    <span className="relative z-10 text-[13px]">{link.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-underline"
                                            className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#0058bc] z-10"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Search + User */}
                <div className="flex items-center gap-4">
                    <div className="relative hidden lg:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#414755] text-sm">search</span>
                        <input
                            className="bg-[#f6f3f5] border-none rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20 w-52 transition-all"
                            placeholder="Search cases..."
                            type="text"
                        />
                    </div>

                    {/* User Pill + Dropdown */}
                    <div className="relative flex items-center gap-3 pl-4 border-l border-[#c1c6d7]/20">
                        <div className="text-right hidden sm:block">
                            <p className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${badgeClass}`}>
                                {role}
                            </p>
                            <p className="text-xs font-semibold text-[#1b1b1d] mt-0.5 truncate max-w-[120px]">
                                {user?.username ?? '—'}
                            </p>
                        </div>

                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowUserMenu((v) => !v)}
                                className="w-9 h-9 rounded-full bg-[#d8e2ff] flex items-center justify-center ring-2 ring-[#0058bc]/10 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[#0058bc] text-sm">person</span>
                            </motion.button>

                            <AnimatePresence>
                                {showUserMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-[0_20px_50px_rgba(27,27,29,0.12)] border border-[#c1c6d7]/20 overflow-hidden z-50"
                                    >
                                        <div className="p-4 border-b border-[#c1c6d7]/10">
                                            <p className="text-xs font-bold text-[#1b1b1d] truncate">{user?.username}</p>
                                            <p className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full w-fit ${badgeClass}`}>{role}</p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => { setShowUserMenu(false); logout(); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-xs font-bold"
                                            >
                                                <span className="material-symbols-outlined text-sm">logout</span>
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
