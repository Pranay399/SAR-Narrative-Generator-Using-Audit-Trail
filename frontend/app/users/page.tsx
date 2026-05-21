'use client';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import AuthGuard from '@/components/AuthGuard';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface User {
    id: number;
    username: string;
    role: string;
    is_active: boolean;
}

const ROLES = ['Analyst', 'Compliance Officer', 'System Admin'];

const roleBadge: Record<string, string> = {
    'Analyst':           'bg-blue-50 text-[#0058bc] border-blue-100',
    'Compliance Officer':'bg-amber-50 text-amber-700 border-amber-100',
    'System Admin':      'bg-purple-50 text-purple-700 border-purple-100',
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // New user form
    const [showForm, setShowForm] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('Analyst');
    const [creating, setCreating] = useState(false);

    const token = () => localStorage.getItem('token') ?? '';

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/users/`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await res.json();
            if (Array.isArray(data)) setUsers(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const notify = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3500);
    };

    const changeRole = async (userId: number, role: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch(`${API_BASE}/api/v1/users/${userId}/role`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            if (!res.ok) throw new Error((await res.json()).detail);
            await fetchUsers();
            notify(`Role updated to "${role}" successfully.`, 'success');
        } catch (e: unknown) {
            notify(e instanceof Error ? e.message : 'Failed to update role', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const toggleActive = async (userId: number) => {
        setActionLoading(userId);
        try {
            const res = await fetch(`${API_BASE}/api/v1/users/${userId}/toggle-active`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token()}` },
            });
            if (!res.ok) throw new Error((await res.json()).detail);
            await fetchUsers();
            notify('Account status updated.', 'success');
        } catch (e: unknown) {
            notify(e instanceof Error ? e.message : 'Failed to update status', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/users/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
            });
            if (!res.ok) throw new Error((await res.json()).detail);
            setNewUsername(''); setNewPassword(''); setNewRole('Analyst'); setShowForm(false);
            await fetchUsers();
            notify(`User "${newUsername}" created successfully.`, 'success');
        } catch (e: unknown) {
            notify(e instanceof Error ? e.message : 'Failed to create user', 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <AuthGuard allowedRoles={['System Admin']}>
            <div className="min-h-screen flex flex-col bg-[#fcf8fb]">
                <NavBar />
                <main className="pt-24 pb-12 px-6 max-w-screen-xl mx-auto flex-1 w-full">
                    {/* Header */}
                    <motion.header
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>manage_accounts</span>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">System Admin</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-[#1b1b1d] mb-2">User Management</h1>
                            <p className="text-[#414755] leading-relaxed">Manage all platform users, assign roles, and control account access.</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowForm((v) => !v)}
                            className="flex items-center gap-2 bg-[#0058bc] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#0058bc]/20 hover:bg-blue-700 transition-colors w-fit"
                        >
                            <span className="material-symbols-outlined text-sm">person_add</span>
                            {showForm ? 'Cancel' : 'Add New User'}
                        </motion.button>
                    </motion.header>

                    {/* Notification Toast */}
                    <AnimatePresence>
                        {notification && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium ${
                                    notification.type === 'success'
                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                        : 'bg-red-50 border border-red-200 text-red-800'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {notification.type === 'success' ? 'check_circle' : 'error'}
                                </span>
                                {notification.message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Add User Form */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-8 overflow-hidden"
                            >
                                <form onSubmit={createUser} className="bg-white rounded-2xl p-8 border border-[#c1c6d7]/20 shadow-[0_8px_30px_rgba(27,27,29,0.04)]">
                                    <h2 className="text-lg font-bold text-[#1b1b1d] mb-6">Create New User</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#414755] mb-2">Username</label>
                                            <input
                                                required
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                placeholder="user@institution.com"
                                                className="w-full bg-[#f6f3f5] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#414755] mb-2">Password</label>
                                            <input
                                                required
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-[#f6f3f5] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#414755] mb-2">Role</label>
                                            <select
                                                value={newRole}
                                                onChange={(e) => setNewRole(e.target.value)}
                                                className="w-full bg-[#f6f3f5] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20"
                                            >
                                                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            className="bg-[#0058bc] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {creating ? 'Creating...' : 'Create User'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Users Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white rounded-2xl border border-[#c1c6d7]/20 shadow-[0_8px_30px_rgba(27,27,29,0.03)] overflow-hidden"
                    >
                        <div className="px-8 py-6 border-b border-[#c1c6d7]/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[#1b1b1d]">Registered Users</h2>
                            <span className="text-xs font-bold text-[#414755] bg-[#f6f3f5] px-3 py-1.5 rounded-full">
                                {users.length} Users
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-20 flex items-center justify-center gap-3 text-[#414755]">
                                <span className="material-symbols-outlined animate-spin text-[#0058bc]">progress_activity</span>
                                <p className="text-sm font-bold uppercase tracking-widest opacity-60">Loading users...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#c1c6d7]/10 bg-[#fcf8fb]/50">
                                            <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/50">User</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/50">Current Role</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/50">Status</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/50">Change Role</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/50">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#c1c6d7]/10">
                                        {users.map((user, idx) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="hover:bg-[#f6f3f5]/30 transition-colors"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[#d8e2ff] flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-[#0058bc] text-sm">person</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#1b1b1d]">{user.username}</p>
                                                            <p className="text-[10px] text-[#414755] opacity-60">ID: {user.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full border ${roleBadge[user.role] ?? 'bg-zinc-50 text-zinc-600 border-zinc-100'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                                        <span className={`text-xs font-bold ${user.is_active ? 'text-emerald-700' : 'text-zinc-400'}`}>
                                                            {user.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => changeRole(user.id, e.target.value)}
                                                        disabled={actionLoading === user.id}
                                                        className="bg-[#f6f3f5] border-none rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => toggleActive(user.id)}
                                                        disabled={actionLoading === user.id}
                                                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 ${
                                                            user.is_active
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        }`}
                                                    >
                                                        {actionLoading === user.id ? '...' : user.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </main>
                <Footer />
            </div>
        </AuthGuard>
    );
}
