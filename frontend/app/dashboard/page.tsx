'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Case {
    id: number;
    case_reference: string;
    customer_id: string;
    status: string;
    created_at: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string; icon: string }> = {
    Pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending', icon: 'pending_actions' },
    Processing: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Processing', icon: 'cached' },
    Generated: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Generated', icon: 'fact_check' },
    Reviewed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Reviewed', icon: 'task_alt' },
};

export default function DashboardPage() {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch(`${API_BASE}/api/v1/cases/`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => { setCases(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const pending = cases.filter((c) => c.status === 'Pending' || c.status === 'Processing').length;
    const generated = cases.filter((c) => c.status === 'Generated').length;
    const reviewed = cases.filter((c) => c.status === 'Reviewed').length;

    const { user } = useAuth();
    const isAnalyst = user?.role === 'Analyst';

    return (
        <AuthGuard>
        <div className="min-h-screen flex flex-col bg-[#fcf8fb]">
            <NavBar />
            <main className="pt-24 pb-12 px-6 max-w-screen-2xl mx-auto flex-1">
                {/* Hero Header */}
                <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1b1b1d] leading-none">Narrative Oversight</h1>
                        <p className="text-[#414755] text-lg max-w-xl font-medium opacity-80">
                            Precision-driven suspicious activity report generation for institutional compliance.
                        </p>
                    </div>
                    {isAnalyst ? (
                        <Link href="/bi-dashboard" className="milled-button text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-[#0058bc]/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-fit">
                            <span className="material-symbols-outlined">analytics</span>
                            Open BI Dashboard
                        </Link>
                    ) : (
                        <Link href="/upload" className="milled-button text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-[#0058bc]/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-fit">
                            <span className="material-symbols-outlined">cloud_upload</span>
                            Upload Suspicious Case
                        </Link>
                    )}
                </section>

                {/* Bento Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
                    <div className="md:col-span-8 bg-[#f6f3f5] p-8 rounded-[2rem] flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-[#414755] mb-6">Aggregate Workflow</h2>
                            <div className="flex gap-12">
                                <div>
                                    <p className="text-5xl font-extrabold text-[#1b1b1d] tracking-tighter">{cases.length}</p>
                                    <p className="text-xs font-semibold text-[#414755] mt-1">Total Suspicious Cases</p>
                                </div>
                                <div className="h-12 w-px bg-[#c1c6d7]/30 self-center" />
                                <div>
                                    <p className="text-5xl font-extrabold text-[#0058bc] tracking-tighter">{generated + reviewed}</p>
                                    <p className="text-xs font-semibold text-[#414755] mt-1">Generated SARs</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-tl from-[#0058bc]/5 to-transparent" />
                        <div className="mt-12 flex gap-4 overflow-x-auto pb-2">
                            {[
                                { label: `Pending (${pending})`, dot: 'bg-amber-500' },
                                { label: `Generated (${generated})`, dot: 'bg-blue-500' },
                                { label: `Reviewed (${reviewed})`, dot: 'bg-emerald-500' },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm whitespace-nowrap">
                                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                    <span className="text-xs font-bold text-[#414755]">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-4">
                        <div className="bg-[#e4e2e4] p-6 rounded-[2rem] h-full flex flex-col justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#414755]">Intelligence Tools</h3>
                            <div className="space-y-3 mt-6">
                                {[
                                    { icon: 'description', label: 'Audit Trail', href: '/audit' },
                                    { icon: 'bar_chart', label: 'Compliance Reports', href: '/reports' },
                                ].map((item) => (
                                    <Link key={item.label} href={item.href} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl hover:bg-white transition-all group">
                                        <div className="flex items-center gap-4">
                                            <span className="material-symbols-outlined text-[#0058bc]">{item.icon}</span>
                                            <span className="font-bold text-[#1b1b1d]">{item.label}</span>
                                        </div>
                                        <span className="material-symbols-outlined text-[#414755] group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Case Cards Grid + Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-extrabold tracking-tight text-[#1b1b1d]">Recent Cases</h2>
                        </div>
                        {loading ? (
                            <p className="text-[#414755] text-sm">Loading cases...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cases.slice(0, 4).map((c) => {
                                    const cfg = statusConfig[c.status] || statusConfig.Pending;
                                    return (
                                        <div key={c.id} className="bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(27,27,29,0.03)] hover:shadow-[0_20px_50px_rgba(27,27,29,0.08)] transition-all group border border-transparent hover:border-[#0058bc]/5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-amber-600">{cfg.icon}</span>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full ${cfg.bg} ${cfg.text} text-[10px] font-bold uppercase tracking-wider`}>{cfg.label}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-[#1b1b1d] mb-1 group-hover:text-[#0058bc] transition-colors">{c.case_reference}</h4>
                                            <p className="text-xs font-semibold text-[#414755]/60 mb-4">Customer: {c.customer_id}</p>
                                            <div className="mt-6 pt-6 border-t border-[#c1c6d7]/10 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-[#414755] uppercase tracking-widest">
                                                    {new Date(c.created_at).toLocaleDateString()}
                                                </span>
                                                <Link href={`/cases/${c.id}`} className="text-[#0058bc] font-bold text-sm hover:underline">
                                                    {c.status === 'Generated' || c.status === 'Reviewed' ? 'View SAR' : 'View Case'}
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!isAnalyst && (
                                    <Link href="/upload" className="bg-[#f0edef] border-2 border-dashed border-[#c1c6d7]/20 p-6 rounded-3xl flex flex-col items-center justify-center text-center group cursor-pointer hover:border-[#0058bc]/40 transition-all">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-[#0058bc]">add</span>
                                        </div>
                                        <p className="font-bold text-[#1b1b1d]">Initiate New Investigation</p>
                                        <p className="text-xs text-[#414755] font-medium mt-1">Manual entry or bulk import</p>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Activity Feed */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24">
                            <h2 className="text-2xl font-extrabold tracking-tight text-[#1b1b1d] mb-8">System Activity</h2>
                            <div className="bg-[#f6f3f5] p-8 rounded-[2rem] space-y-8">
                                {[
                                    { icon: 'history_edu', color: 'bg-[#0058bc]/10 text-[#0058bc]', title: 'Narrative Generated', desc: 'AI successfully drafted a new SAR case.', time: '12 mins ago' },
                                    { icon: 'verified', color: 'bg-emerald-500/10 text-emerald-600', title: 'Submission Successful', desc: 'Case reviewed and marked complete.', time: '2 hours ago' },
                                    { icon: 'person', color: 'bg-[#1b1b1d]/5 text-[#414755]', title: 'Compliance Audit', desc: 'Lead Compliance Officer reviewed logs.', time: 'Yesterday' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 relative">
                                        {i < 2 && <div className="absolute top-10 left-5 w-px h-12 bg-[#c1c6d7]/30" />}
                                        <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center z-10 relative`}>
                                            <span className="material-symbols-outlined text-sm">{item.icon}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-[#1b1b1d]">{item.title}</p>
                                            <p className="text-xs text-[#414755] font-medium">{item.desc}</p>
                                            <p className="text-[10px] font-bold text-[#414755]/50 uppercase">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <Link href="/audit" className="w-full py-4 bg-white/50 rounded-2xl text-xs font-bold uppercase tracking-widest text-[#414755] hover:bg-white hover:shadow-sm transition-all mt-4 flex justify-center">
                                    View Full History
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
        </AuthGuard>
    );
}
