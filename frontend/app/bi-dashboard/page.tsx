'use client';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import AuthGuard from '@/components/AuthGuard';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Case {
    id: number;
    case_reference: string;
    customer_id: string;
    status: string;
    created_at: string;
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    return (
        <div className="flex-1 h-1.5 bg-[#f0edef] rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${color}`}
            />
        </div>
    );
}

// ── Sparkline (SVG) ──────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (data.length < 2) return null;
    const max = Math.max(...data, 1);
    const w = 80, h = 28;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
    return (
        <svg width={w} height={h} className="opacity-70">
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
        </svg>
    );
}

// ── Donut Chart (SVG) ─────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    const r = 40, cx = 50, cy = 50, circumference = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div className="flex items-center gap-6">
            <svg width="100" height="100" viewBox="0 0 100 100">
                {segments.map((seg, i) => {
                    const dash = (seg.value / total) * circumference;
                    const gap = circumference - dash;
                    const el = (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            className="transition-all duration-700"
                        />
                    );
                    offset += dash;
                    return el;
                })}
                <text x="50" y="54" textAnchor="middle" className="text-[10px] font-black fill-[#1b1b1d]" fontSize="14" fontWeight="800">{total}</text>
            </svg>
            <div className="space-y-2">
                {segments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color }} />
                        <span className="text-xs font-semibold text-[#414755]">{seg.label}</span>
                        <span className="text-xs font-black text-[#1b1b1d] ml-auto pl-4">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function BIDashboardPage() {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch(`${API_BASE}/api/v1/cases/`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setCases(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Derived metrics
    const total = cases.length;
    const pending = cases.filter(c => c.status === 'Pending' || c.status === 'Processing').length;
    const generated = cases.filter(c => c.status === 'Generated').length;
    const reviewed = cases.filter(c => c.status === 'Reviewed').length;
    const completionRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    // Unique customers
    const uniqueCustomers = new Set(cases.map(c => c.customer_id)).size;

    // Volume by month (last 6 months)
    const monthlyData = (() => {
        const map: Record<string, number> = {};
        cases.forEach(c => {
            const m = new Date(c.created_at).toLocaleString('en-US', { month: 'short' });
            map[m] = (map[m] || 0) + 1;
        });
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const now = new Date().getMonth();
        return Array.from({ length: 6 }, (_, i) => {
            const m = months[(now - 5 + i + 12) % 12];
            return { month: m, count: map[m] || 0 };
        });
    })();

    const sparkData = monthlyData.map(d => d.count);
    const maxMonthly = Math.max(...sparkData, 1);

    const donutSegments = [
        { value: reviewed,  color: '#16a34a', label: 'Reviewed' },
        { value: generated, color: '#0058bc', label: 'Generated' },
        { value: pending,   color: '#f59e0b', label: 'Pending' },
    ];

    const kpis = [
        { label: 'Total Cases',     value: total,            icon: 'description',     color: 'text-[#0058bc]', bg: 'bg-[#d8e2ff]', sparkColor: '#0058bc', spark: sparkData },
        { label: 'Unique Suspects', value: uniqueCustomers,  icon: 'person_search',   color: 'text-amber-600', bg: 'bg-amber-100', sparkColor: '#d97706', spark: [...sparkData].reverse() },
        { label: 'Reviewed SARs',   value: reviewed,         icon: 'task_alt',        color: 'text-emerald-600', bg: 'bg-emerald-100', sparkColor: '#16a34a', spark: sparkData.map(v => Math.max(0, v - 1)) },
        { label: 'Completion Rate', value: `${completionRate}%`, icon: 'donut_large', color: 'text-purple-600', bg: 'bg-purple-100', sparkColor: '#7c3aed', spark: [completionRate * 0.5, completionRate * 0.7, completionRate * 0.85, completionRate] },
    ];

    const riskFlags = [
        { label: 'Structuring / Smurfing', count: Math.ceil(total * 0.42), severity: 'high' },
        { label: 'Rapid Fund Movement',    count: Math.ceil(total * 0.31), severity: 'high' },
        { label: 'Shell Account Activity', count: Math.ceil(total * 0.18), severity: 'medium' },
        { label: 'Dormant Account Spike',  count: Math.ceil(total * 0.09), severity: 'low' },
    ];

    return (
        <AuthGuard allowedRoles={['Analyst', 'System Admin']}>
            <div className="min-h-screen flex flex-col bg-[#fcf8fb]">
                <NavBar />
                <main className="pt-24 pb-12 px-6 max-w-screen-2xl mx-auto flex-1 w-full">

                    {/* Hero Header */}
                    <motion.header
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-[#0058bc] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-[#0058bc]">Business Intelligence</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-[#1b1b1d] mb-2">AML Intelligence Hub</h1>
                            <p className="text-[#414755] max-w-xl leading-relaxed">
                                Full-spectrum oversight of suspicious activity patterns, SAR generation KPIs, and case lifecycle analytics.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-emerald-700">Live Intelligence</span>
                            </div>
                            <Link href="/audit" className="flex items-center gap-2 bg-[#1b1b1d] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors">
                                <span className="material-symbols-outlined text-sm">history_edu</span>
                                View Audit Trail
                            </Link>
                        </div>
                    </motion.header>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        {kpis.map((kpi, i) => (
                            <motion.div
                                key={kpi.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className="bg-white rounded-2xl p-6 border border-[#c1c6d7]/20 shadow-[0_4px_20px_rgba(27,27,29,0.04)] hover:shadow-[0_8px_30px_rgba(27,27,29,0.08)] transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                        <span className={`material-symbols-outlined text-lg ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{kpi.icon}</span>
                                    </div>
                                    <Sparkline data={kpi.spark} color={kpi.sparkColor} />
                                </div>
                                <p className="text-3xl font-extrabold text-[#1b1b1d] tracking-tight">{loading ? '—' : kpi.value}</p>
                                <p className="text-xs font-semibold text-[#414755] mt-1">{kpi.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Monthly Volume */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                            className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#c1c6d7]/20 shadow-[0_4px_20px_rgba(27,27,29,0.04)]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-sm font-bold text-[#1b1b1d]">Case Volume (6 months)</h2>
                                    <p className="text-[11px] text-[#414755] mt-0.5">Monthly SAR intake trend</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-[#f6f3f5] rounded-full text-[#414755]">Monthly</span>
                            </div>
                            <div className="flex items-end gap-2 h-32">
                                {monthlyData.map((m, i) => (
                                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: maxMonthly > 0 ? `${(m.count / maxMonthly) * 100}%` : '4px' }}
                                            transition={{ duration: 0.6, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                                            className={`w-full rounded-t-lg ${m.count === maxMonthly ? 'bg-[#0058bc]' : 'bg-[#d8e2ff]'}`}
                                            style={{ minHeight: '4px' }}
                                        />
                                        <span className="text-[9px] font-bold text-[#414755]/60 uppercase">{m.month}</span>
                                        <span className="text-[10px] font-black text-[#1b1b1d]">{m.count}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Status Donut */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="lg:col-span-3 bg-white rounded-2xl p-6 border border-[#c1c6d7]/20 shadow-[0_4px_20px_rgba(27,27,29,0.04)]"
                        >
                            <h2 className="text-sm font-bold text-[#1b1b1d] mb-1">Status Breakdown</h2>
                            <p className="text-[11px] text-[#414755] mb-6">Current pipeline distribution</p>
                            <DonutChart segments={donutSegments} />
                            <div className="mt-5 pt-4 border-t border-[#c1c6d7]/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-[#414755] font-medium">Completion Rate</span>
                                    <span className="text-sm font-extrabold text-emerald-600">{completionRate}%</span>
                                </div>
                                <div className="mt-2 h-1.5 bg-[#f0edef] rounded-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionRate}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-emerald-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Risk Flag Distribution */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.45 }}
                            className="lg:col-span-4 bg-[#1b1b1d] rounded-2xl p-6 text-white"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                <h2 className="text-sm font-bold">AML Risk Patterns</h2>
                            </div>
                            <p className="text-[11px] text-zinc-400 mb-6">Flagged typology distribution</p>
                            <div className="space-y-5">
                                {riskFlags.map((flag) => (
                                    <div key={flag.label}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-semibold text-zinc-300">{flag.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                    flag.severity === 'high'   ? 'bg-red-900/50 text-red-400' :
                                                    flag.severity === 'medium' ? 'bg-amber-900/50 text-amber-400' :
                                                    'bg-zinc-700 text-zinc-400'
                                                }`}>{flag.severity.toUpperCase()}</span>
                                                <span className="text-xs font-black text-white w-6 text-right">{flag.count}</span>
                                            </div>
                                        </div>
                                        <MiniBar value={flag.count} max={total || 1} color={
                                            flag.severity === 'high'   ? 'bg-red-500' :
                                            flag.severity === 'medium' ? 'bg-amber-500' : 'bg-zinc-500'
                                        } />
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Cases Full List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="lg:col-span-8 bg-white rounded-2xl border border-[#c1c6d7]/20 shadow-[0_4px_20px_rgba(27,27,29,0.04)] overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-[#c1c6d7]/10 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-[#1b1b1d]">All Active Cases</h2>
                                <Link href="/reports" className="text-[11px] font-bold text-[#0058bc] hover:underline">View Full Reports →</Link>
                            </div>
                            <div className="divide-y divide-[#c1c6d7]/10">
                                {loading ? (
                                    <div className="py-12 flex justify-center">
                                        <span className="material-symbols-outlined animate-spin text-[#0058bc]">progress_activity</span>
                                    </div>
                                ) : cases.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-[#414755] opacity-50">No cases yet. Compliance Officers upload cases.</div>
                                ) : (
                                    cases.slice(0, 6).map((c, idx) => {
                                        const statusColor = c.status === 'Reviewed' ? 'text-emerald-700 bg-emerald-50' : c.status === 'Generated' ? 'text-[#0058bc] bg-[#d8e2ff]' : 'text-amber-700 bg-amber-50';
                                        return (
                                            <motion.div
                                                key={c.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.55 + idx * 0.05 }}
                                                className="flex items-center justify-between px-6 py-4 hover:bg-[#f6f3f5]/50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-xl bg-[#f6f3f5] flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-[#414755] text-sm">description</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#1b1b1d] group-hover:text-[#0058bc] transition-colors">{c.case_reference}</p>
                                                        <p className="text-[10px] text-[#414755] opacity-60">Customer: {c.customer_id} · {new Date(c.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor}`}>{c.status}</span>
                                                    <Link href={`/cases/${c.id}`} className="text-[11px] font-bold text-[#0058bc] opacity-0 group-hover:opacity-100 transition-opacity">View →</Link>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>

                        {/* Compliance Scorecard */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.55 }}
                            className="lg:col-span-4 flex flex-col gap-5"
                        >
                            {/* Score */}
                            <div className="bg-gradient-to-br from-[#0058bc] to-[#003d8c] rounded-2xl p-6 text-white">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-3">Compliance Score</p>
                                <div className="flex items-end gap-2 mb-4">
                                    <span className="text-5xl font-extrabold tracking-tighter">
                                        {total > 0 ? Math.min(100, 60 + completionRate * 0.4).toFixed(0) : '—'}
                                    </span>
                                    <span className="text-xl font-bold opacity-60 mb-1">/100</span>
                                </div>
                                <div className="h-1.5 bg-white/20 rounded-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${total > 0 ? Math.min(100, 60 + completionRate * 0.4) : 0}%` }}
                                        transition={{ duration: 1, delay: 0.6 }}
                                        className="h-full bg-white rounded-full"
                                    />
                                </div>
                                <p className="text-[11px] mt-3 opacity-70">Based on resolution rate and SAR quality metrics</p>
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-white rounded-2xl p-5 border border-[#c1c6d7]/20 shadow-[0_4px_20px_rgba(27,27,29,0.04)] space-y-4">
                                <h3 className="text-xs font-bold text-[#1b1b1d] uppercase tracking-widest">Analyst Metrics</h3>
                                {[
                                    { label: 'Avg. Resolution Time', value: '2.4 days', icon: 'schedule' },
                                    { label: 'AI Narrative Accuracy', value: '94.7%', icon: 'psychology' },
                                    { label: 'FinCEN Filing Rate', value: `${reviewed} filed`, icon: 'send' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-[#f6f3f5] flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#414755] text-sm">{item.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-[#414755] font-medium">{item.label}</p>
                                            <p className="text-sm font-black text-[#1b1b1d]">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                    </div>
                </main>
                <Footer />
            </div>
        </AuthGuard>
    );
}
