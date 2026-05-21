'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Button from '@/components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Case {
    id: number;
    case_reference: string;
    status: string;
    generated_sar: string | null;
    raw_data: { features?: Record<string, number>[] } | null;
    created_at: string;
}

interface Explanation {
    explanation: string;
    feature_importance: Record<string, number>;
}

export default function CaseDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [narrative, setNarrative] = useState('');
    const [explanation, setExplanation] = useState<Explanation | null>(null);
    const [tab, setTab] = useState<'sar' | 'explanation'>('sar');
    const [saving, setSaving] = useState(false);
    const [loadingExplanation, setLoadingExplanation] = useState(false);
    const [error, setError] = useState('');

    const token = () => localStorage.getItem('token');

    useEffect(() => {
        fetch(`${API_BASE}/api/v1/cases/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
            .then((r) => r.json())
            .then((d) => { setCaseData(d); setNarrative(d.generated_sar || ''); });
    }, [id]);

    const saveNarrative = async () => {
        setSaving(true);
        await fetch(`${API_BASE}/api/v1/cases/${id}/narrative`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ narrative }),
        });
        setSaving(false);
    };

    const downloadReport = async () => {
        const res = await fetch(`${API_BASE}/api/v1/cases/${id}/download`, { headers: { Authorization: `Bearer ${token()}` } });
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${caseData?.case_reference}.txt`; a.click();
    };

    const loadExplanation = async () => {
        setLoadingExplanation(true); setTab('explanation');
        try {
            const res = await fetch(`${API_BASE}/api/v1/explanation/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
            const data = await res.json();
            setExplanation(data);
        } catch { setError('Could not load explanation.'); }
        finally { setLoadingExplanation(false); }
    };

    if (!caseData) {
        return (
            <AuthGuard allowedRoles={['Analyst', 'Compliance Officer', 'System Admin']}>
                <div className="flex items-center justify-center min-h-screen text-[#414755]">Loading case...</div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard allowedRoles={['Analyst', 'Compliance Officer', 'System Admin']}>
        <div className="min-h-screen bg-[#fcf8fb]">
            <NavBar />
            <aside className="h-screen w-20 hover:w-64 transition-all duration-500 fixed left-0 top-0 border-r border-zinc-200/50 bg-zinc-50 flex flex-col gap-4 p-4 z-40 group overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#0058bc] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="font-bold text-zinc-900 whitespace-nowrap">Narrative Engine</div>
                        <div className="text-[10px] text-zinc-400 font-mono">v1.0.0</div>
                    </div>
                </div>
                <nav className="flex flex-col gap-2">
                    {[
                        { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
                        { icon: 'history', label: 'History', href: '/audit', active: false },
                        { icon: 'description', label: 'Cases', href: '/dashboard', active: true },
                        { icon: 'settings', label: 'Settings', href: '#' },
                    ].map((item) => (
                        <a key={item.label} href={item.href} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${item.active ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-400 hover:bg-zinc-200/50'}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-opacity">{item.label}</span>
                        </a>
                    ))}
                </nav>
            </aside>

            <main className="ml-20 pt-16 min-h-screen flex flex-col">
                {/* Sub-Header */}
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="sticky top-16 z-30 flex flex-col md:flex-row items-start md:items-center justify-between px-12 py-8 bg-[#fcf8fb]/80 backdrop-blur-md gap-6"
                >
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#1b1b1d] flex items-center gap-3">
                            SAR Narrative Review
                            <span className="text-sm font-normal px-2 py-0.5 rounded bg-[#e2dfe1] text-[#636264]">{caseData.case_reference}</span>
                        </h1>
                        <p className="text-[#414755] text-sm mt-1">Status: <span className="font-semibold text-[#0058bc]">{caseData.status}</span></p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex p-1 bg-[#e4e2e4]/50 rounded-xl gap-1 mr-2">
                            {[
                                { id: 'sar', label: 'View SAR', icon: 'description' },
                                { id: 'explanation', label: 'Explanation', icon: 'auto_awesome' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => { t.id === 'explanation' ? loadExplanation() : setTab('sar'); }}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors z-10 ${tab === t.id ? 'text-[#1b1b1d]' : 'text-[#414755] hover:text-[#1b1b1d]'}`}
                                >
                                    {tab === t.id && (
                                        <motion.div
                                            layoutId="tab-pill"
                                            className="absolute inset-0 bg-white shadow-sm rounded-lg z-0"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="material-symbols-outlined text-[18px] relative z-10">{t.icon}</span>
                                    <span className="relative z-10">{t.label}</span>
                                </button>
                            ))}
                        </div>
                        <Button 
                            variant="secondary" 
                            onClick={saveNarrative} 
                            isLoading={saving}
                            leftIcon={<span className="material-symbols-outlined text-[20px]">save</span>}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                            onClick={downloadReport}
                            leftIcon={<span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>}
                        >
                            Download SAR
                        </Button>
                    </div>
                </motion.header>

                <div className="px-12 pb-20 grid grid-cols-12 gap-8 items-start">
                    {/* Left: Narrative Editor */}
                    <motion.section 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="col-span-12 lg:col-span-7 flex flex-col gap-6"
                    >
                        <AnimatePresence mode="wait">
                            {tab === 'sar' ? (
                                <motion.div 
                                    key="sar-tab"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white rounded-2xl shadow-sm p-10 min-h-[700px] flex flex-col"
                                >
                                    <div className="flex items-center justify-between mb-8 border-b border-[#c1c6d7]/10 pb-6">
                                        <div className="flex items-center gap-6">
                                            <span className="text-xs font-bold uppercase tracking-widest text-[#0058bc]">Narrative Body</span>
                                            <div className="h-4 w-px bg-[#c1c6d7]/30" />
                                            <div className="flex items-center gap-4 text-[#414755]">
                                                <button className="material-symbols-outlined hover:text-[#0058bc] transition-colors">format_bold</button>
                                                <button className="material-symbols-outlined hover:text-[#0058bc] transition-colors">format_italic</button>
                                                <button className="material-symbols-outlined hover:text-[#0058bc] transition-colors">list</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-[#414755]/60">
                                            <span className="material-symbols-outlined text-[14px]">history_edu</span>
                                            AI generated narrative
                                        </div>
                                    </div>
                                    {caseData.status === 'Processing' || caseData.status === 'Pending' ? (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-[#d8e2ff] flex items-center justify-center animate-pulse">
                                                <span className="material-symbols-outlined text-[#0058bc] text-2xl">auto_awesome</span>
                                            </div>
                                            <p className="font-bold text-[#1b1b1d]">Pipeline Running</p>
                                            <p className="text-sm text-[#414755] text-center max-w-xs">PySpark is processing your data and Llama 3.1 is generating the SAR narrative. Check back shortly.</p>
                                        </div>
                                    ) : (
                                        <textarea
                                            className="flex-grow w-full border-none focus:ring-0 text-lg leading-relaxed text-[#1b1b1d] placeholder-[#414755]/30 resize-none bg-transparent outline-none"
                                            placeholder="The narrative starts here..."
                                            value={narrative}
                                            onChange={(e) => setNarrative(e.target.value)}
                                        />
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="explanation-tab"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white rounded-2xl shadow-sm p-10 min-h-[700px] flex flex-col gap-6"
                                >
                                    <h3 className="text-lg font-bold text-[#1b1b1d] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#0058bc]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                        AI Explanation (Mistral)
                                    </h3>
                                    {loadingExplanation ? (
                                        <div className="flex items-center gap-3 text-[#414755]">
                                            <span className="material-symbols-outlined animate-spin text-[#0058bc]">progress_activity</span>
                                            Generating explanation via Mistral AI...
                                        </div>
                                    ) : explanation ? (
                                        <>
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-[#414755]">Feature Importance (SHAP-style)</h4>
                                                {Object.entries(explanation.feature_importance || {}).map(([key, val], idx) => (
                                                    <motion.div 
                                                        key={key}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                    >
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="font-semibold text-[#1b1b1d]">{key.replace(/_/g, ' ')}</span>
                                                            <span className="text-[#0058bc] font-bold">{val}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[#f6f3f5] rounded-full overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(val * 10, 100)}%` }}
                                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                                className="h-full bg-[#0058bc] rounded-full" 
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-[#f6f3f5] p-6 rounded-xl"
                                            >
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-[#414755] mb-3">AI Reasoning</h4>
                                                <p className="text-sm text-[#1b1b1d] leading-relaxed whitespace-pre-wrap">{explanation.explanation}</p>
                                            </motion.div>
                                        </>
                                    ) : error ? <p className="text-red-600 text-sm">{error}</p> : null}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.section>

                    {/* Right: Insights */}
                    <motion.section 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="col-span-12 lg:col-span-5 flex flex-col gap-6 sticky top-[280px]"
                    >
                        <div className="bg-[#f6f3f5] rounded-2xl p-6 border-l-4 border-[#0058bc]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-[#0058bc]/10 rounded-lg">
                                    <span className="material-symbols-outlined text-[#0058bc]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#1b1b1d]">AI Generation Insights</h3>
                            </div>
                            <p className="text-sm leading-relaxed text-[#414755]">
                                Narrative constructed by <span className="text-[#1b1b1d] font-semibold">Llama 3.1</span> via Ollama RAG pipeline using KYC/RBI guideline embeddings from ChromaDB.
                            </p>
                            <div className="p-4 bg-white rounded-xl mt-4">
                                <div className="flex items-center justify-between text-[11px] font-bold text-[#414755] uppercase tracking-tighter mb-2">
                                    <span>Status</span>
                                    <span className="text-[#0058bc]">{caseData.status}</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#f6f3f5] rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: caseData.status === 'Reviewed' ? '100%' : caseData.status === 'Generated' ? '75%' : '25%' }}
                                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                                        className="h-full bg-[#0058bc] rounded-full" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#f6f3f5] rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-[#1b1b1d]/5 rounded-lg">
                                    <span className="material-symbols-outlined text-[#414755]">list_alt</span>
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#1b1b1d]">Recommended Actions</h3>
                            </div>
                            {['Verify beneficial ownership against compliance registers.', 'Review all foreign transfer destination countries.', 'Verify transaction timestamps for rapid movement patterns.'].map((a, idx) => (
                                <motion.div 
                                    key={a}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                    className="flex items-start gap-3 mt-3"
                                >
                                    <span className="material-symbols-outlined text-[#0058bc] text-[18px]">check_circle</span>
                                    <span className="text-xs text-[#414755] leading-tight">{a}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                </div>
            </main>
        </div>
        </AuthGuard>
    );
}
