'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import ReportCard from '@/components/ReportCard';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Case {
    id: number;
    case_reference: string;
    customer_id: string;
    status: string;
    created_at: string;
}

export default function ReportsPage() {
    const router = useRouter();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${API_BASE}/api/v1/cases/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setCases(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.case_reference.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'All' || c.status === filter;
        return matchesSearch && matchesFilter;
    });

    const metrics = [
        { title: 'Total SARs', value: cases.length, icon: 'description', color: 'blue' as const, trend: { value: '+12%', isPositive: true } },
        { title: 'Pending Review', value: cases.filter(c => c.status === 'Generated' || c.status === 'Processing').length, icon: 'pending_actions', color: 'amber' as const, trend: { value: 'High Priority', isPositive: false } }, // Amber color mapped in ReportCard
        { title: 'Reviewed', value: cases.filter(c => c.status === 'Reviewed').length, icon: 'verified_user', color: 'emerald' as const, trend: { value: '+5%', isPositive: true } },
        { title: 'Efficiency', value: '99.4%', icon: 'bolt', color: 'zinc' as const, description: 'LLM precision score' }
    ];

    const downloadReport = async (id: number, ref: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/v1/cases/${id}/download`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${ref}_report.txt`; a.click();
    };

    return (
        <AuthGuard>
        <div className="min-h-screen flex flex-col bg-[#fcf8fb]">
            <NavBar />
            <main className="pt-24 pb-20 px-6 max-w-screen-2xl mx-auto flex-1 w-full">
                {/* Header Section */}
                <motion.header 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="max-w-2xl">
                        <nav className="flex items-center gap-2 mb-4 text-[#414755] text-sm font-medium">
                            <span className="opacity-60">Dashboard</span>
                            <span className="material-symbols-outlined text-sm opacity-40">chevron_right</span>
                            <span className="text-[#1b1b1d]">Strategic Reports</span>
                        </nav>
                        <h1 className="text-4xl font-extrabold tracking-tight text-[#1b1b1d] mb-2">Institutional SAR Inventory</h1>
                        <p className="text-[#414755] text-lg leading-relaxed opacity-80">Centralized oversight for managing, auditing, and exporting high-fidelity AI-constructed suspicious activity narratives.</p>
                    </div>
                </motion.header>

                {/* Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {metrics.map((m, idx) => (
                        <ReportCard 
                            key={m.title} 
                            {...m} 
                            delay={idx * 0.1}
                            icon={<span className="material-symbols-outlined">{m.icon}</span>}
                        />
                    ))}
                </div>

                {/* Main Content Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white rounded-[2rem] shadow-[0_30px_60px_rgba(27,27,29,0.04)] border border-[#c1c6d7]/10 overflow-hidden"
                >
                    {/* Controls Bar */}
                    <div className="p-8 border-b border-[#c1c6d7]/10 flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#414755]/40">search</span>
                            <input 
                                type="text"
                                placeholder="Search by case reference..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#f6f3f5] border-none rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20 transition-all placeholder-[#414755]/30"
                            />
                        </div>
                        <div className="flex bg-[#f6f3f5] p-1 rounded-xl gap-1 w-full md:w-auto overflow-x-auto">
                            {['All', 'Generated', 'Reviewed', 'Pending'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-white text-[#1b1b1d] shadow-sm' : 'text-[#414755] hover:bg-white/50'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[#fcf8fb]/50 border-b border-[#c1c6d7]/10">
                                    <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/40">Case Reference</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/40">Filing Date</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/40">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-[#414755]/40">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#c1c6d7]/10">
                                <AnimatePresence mode="popLayout">
                                    {filteredCases.map((c, idx) => (
                                        <motion.tr 
                                            key={c.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                                            className="hover:bg-[#f6f3f5]/30 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[#d8e2ff] flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-[#0058bc] text-lg">description</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#1b1b1d] group-hover:text-[#0058bc] transition-colors">{c.case_reference}</p>
                                                        <p className="text-[10px] text-[#414755] font-mono opacity-50 uppercase tracking-tighter">ID: Ft-{c.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm text-[#414755]">{new Date(c.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${c.status === 'Reviewed' ? 'bg-emerald-600' : c.status === 'Generated' ? 'bg-[#0058bc]' : 'bg-amber-500'}`} />
                                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${c.status === 'Reviewed' ? 'text-emerald-700' : c.status === 'Generated' ? 'text-[#0058bc]' : 'text-amber-700'}`}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="secondary" size="sm" onClick={() => router.push(`/cases/${c.id}`)}>View</Button>
                                                    <Button variant="secondary" size="sm" onClick={() => downloadReport(c.id, c.case_reference)}>
                                                        <span className="material-symbols-outlined text-lg">download</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {!loading && filteredCases.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="text-[#414755]/30 flex flex-col items-center gap-4">
                                                <span className="material-symbols-outlined text-6xl opacity-20">search_off</span>
                                                <p className="font-bold text-lg">No reports found matching your criteria</p>
                                                <button onClick={() => { setSearch(''); setFilter('All'); }} className="text-[#0058bc] font-bold underline hover:opacity-80 transition-opacity">Clear all filters</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {loading && (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-[#414755]">
                             <span className="material-symbols-outlined animate-spin text-[#0058bc]">progress_activity</span>
                             <p className="font-bold text-sm uppercase tracking-widest opacity-60">Synchronizing Vault Reports...</p>
                        </div>
                    )}
                </motion.div>
            </main>
            <Footer />
        </div>
        </AuthGuard>
    );
}
