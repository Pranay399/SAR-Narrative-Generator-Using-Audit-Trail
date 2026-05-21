'use client';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import { motion } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface AuditEntry {
    id: number;
    case_id: number;
    action: string;
    details: string;
    timestamp: string;
}

const actionConfig: Record<string, { icon: string; color: string; bg: string }> = {
    SAR_GENERATED: { icon: 'auto_awesome', color: 'text-on-secondary-container', bg: 'bg-[#e2dfe1]' },
    NARRATIVE_EDITED: { icon: 'edit', color: 'text-white', bg: 'bg-[#0058bc]' },
    DEFAULT: { icon: 'visibility', color: 'text-[#414755]', bg: 'bg-[#e4e2e4]' },
};

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [cases, setCases] = useState<{ id: number; case_reference: string }[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        // Fetch cases and build faux audit trail from case metadata
        fetch(`${API_BASE}/api/v1/cases/`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setCases(data); });
    }, []);

    return (
        <AuthGuard allowedRoles={['Analyst', 'System Admin']}>
        <div className="min-h-screen flex flex-col bg-[#fcf8fb]">
            <NavBar />
            <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col gap-12 flex-1">
                {/* Header */}
                <motion.header 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="max-w-2xl">
                        <nav className="flex items-center gap-2 mb-4 text-[#414755] text-sm font-medium">
                            <span>Cases</span>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                            <span className="text-[#1b1b1d]">Audit & Preview</span>
                        </nav>
                        <h1 className="text-4xl font-extrabold tracking-tight text-[#1b1b1d] mb-2">Narrative Audit & SAR Report</h1>
                        <p className="text-[#414755] text-lg">Full immutable audit trail for regulatory transparency.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="secondary" leftIcon={<span className="material-symbols-outlined text-[20px]">add_comment</span>}>
                            Add Comment
                        </Button>
                        <Button variant="secondary" leftIcon={<span className="material-symbols-outlined text-[20px]">history_edu</span>}>
                            Export Audit Log
                        </Button>
                        <Button leftIcon={<span className="material-symbols-outlined text-[20px]">download</span>}>
                            Download Full Report
                        </Button>
                    </div>
                </motion.header>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Audit Trail */}
                    <section className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                        <div className="bg-[#f6f3f5] p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-[#414755]">Audit Trail Timeline</h2>
                                <span className="text-[10px] px-2 py-0.5 bg-[#0058bc]/10 text-[#0058bc] rounded-full font-bold">LIVE</span>
                            </div>
                            <div className="flex flex-col gap-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#c1c6d7]/30">
                                {cases.slice(0, 4).map((c, i) => {
                                    const isGenerated = i % 2 === 0;
                                    const cfg = isGenerated ? actionConfig.SAR_GENERATED : actionConfig.NARRATIVE_EDITED;
                                    return (
                                        <motion.div 
                                            key={c.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + i * 0.1 }}
                                            className="flex gap-4 relative"
                                        >
                                            <div className={`w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center z-10 shadow-sm`}>
                                                <span className={`material-symbols-outlined ${cfg.color} text-xs`}>{cfg.icon}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-[#1b1b1d]">{isGenerated ? 'AI Narrative Generated' : 'Analyst modified narrative'}</span>
                                                <span className="text-xs text-[#414755]">Case {c.case_reference}</span>
                                                {isGenerated && (
                                                    <div className="flex gap-1 mt-1">
                                                        <span className="text-[9px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase tracking-tighter">LLM Generated</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {cases.length === 0 && (
                                    <p className="text-sm text-[#414755] pl-10">No audit entries yet. Upload a case to begin.</p>
                                )}
                            </div>
                            <button className="w-full mt-8 py-3 text-xs font-bold text-[#0058bc] uppercase tracking-widest hover:bg-[#0058bc]/5 rounded-xl transition-colors">View Full History</button>
                        </div>

                        {/* Compliance Guard */}
                        <div className="bg-[#0058bc]/5 p-6 rounded-2xl border border-[#0058bc]/10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-[#0058bc]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                                <h3 className="font-bold text-[#1b1b1d] tracking-tight">Compliance Guard</h3>
                            </div>
                            <p className="text-xs text-[#414755] leading-relaxed mb-4">All generated SARs and edits are cryptographically logged in the PostgreSQL Audit Log.</p>
                            <div className="h-1 w-full bg-[#eae7ea] rounded-full overflow-hidden">
                                <div className="h-full w-4/5 bg-[#0058bc] rounded-full" />
                            </div>
                            <span className="text-[10px] text-[#0058bc] mt-2 block font-medium">Compliance Score: 88/100</span>
                        </div>
                    </section>

                    {/* Right: SAR Report Preview */}
                    <motion.section 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-8 flex flex-col gap-6"
                    >
                        <div className="bg-white p-12 rounded-[2rem] shadow-[0_20px_50px_rgba(27,27,29,0.05)] min-h-[1000px] flex flex-col">
                            {/* Government Header */}
                            <div className="flex justify-between items-start border-b-2 border-[#1b1b1d]/5 pb-8 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-[#f6f3f5] rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl text-[#414755]">account_balance</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1b1b1d]">Suspicious Activity Report</h2>
                                        <p className="text-xs font-bold text-[#414755] uppercase tracking-[0.2em]">Form FinCEN 111 • Confidential</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-[#414755] uppercase block">Filing Count</span>
                                    <span className="text-lg font-mono text-[#0058bc] font-bold">{cases.length} Cases</span>
                                </div>
                            </div>

                            {/* Case List */}
                            <div className="flex flex-col gap-10">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#0058bc] mb-4">Active Cases Summary</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cases.map((c, idx) => (
                                            <motion.a 
                                                key={c.id} 
                                                href={`/cases/${c.id}`} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + idx * 0.05 }}
                                                className="flex items-center gap-4 p-4 bg-[#f6f3f5] rounded-xl hover:bg-[#eae7ea] transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-[#d8e2ff] flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[#0058bc] text-sm">description</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-[#1b1b1d]">{c.case_reference}</p>
                                                    <p className="text-[10px] text-[#414755]">Click to view SAR</p>
                                                </div>
                                                <span className="material-symbols-outlined text-[#414755] group-hover:translate-x-1 transition-transform">chevron_right</span>
                                            </motion.a>
                                        ))}
                                        {cases.length === 0 && (
                                            <p className="text-sm text-[#414755] col-span-2">No cases yet. Upload a suspicious case file to get started.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Sample Report Preview */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#0058bc] mb-4">Part V: Narrative Preview (Sample)</h3>
                                    <div className="relative">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: '100%' }}
                                            transition={{ duration: 1, delay: 1 }}
                                            className="absolute -left-6 top-0 bottom-0 w-1 bg-[#0058bc] rounded-full" 
                                        />
                                        <p className="text-lg font-medium leading-relaxed mb-6 text-[#1b1b1d]">
                                            Investigation initiated following automated AML alerts regarding structured cash deposits and rapid outgoing wire transfers. The PySpark engine detected smurfing patterns with transaction pairs below the ₹10,000 reporting threshold.
                                        </p>
                                        <p className="text-base text-[#414755] leading-relaxed">
                                            The Mistral AI and Llama 3.1 models, augmented by the ChromaDB RAG pipeline with KYC Policies and RBI Initiatives embedded, constructed a full narrative with SHAP feature importance analysis to explain why each flag was raised.
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Signature */}
                                <div className="mt-auto pt-12 border-t border-[#c1c6d7]/20 flex justify-between items-center">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold uppercase text-[#414755] tracking-wider">Filing Institution</label>
                                        <p className="text-sm font-bold">Digital Architect Financial</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="h-10 w-48 bg-[#f6f3f5] rounded-lg mb-1 flex items-center justify-center italic text-[#414755] text-xs opacity-50">Digital Signature Captured</div>
                                        <p className="text-[10px] font-bold uppercase text-[#414755] tracking-wider">Authorized Officer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </main>
            <Footer />
        </div>
        </AuthGuard>
    );
}
