'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function UploadPage() {
    const router = useRouter();
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ case_reference: string; case_id: number } | null>(null);
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    // Engine states
    const [currentStep, setCurrentStep] = useState(0);
    const [stepLogs, setStepLogs] = useState<string[]>([]);

    const activeSteps = [
        { title: 'Ingestion pipeline initialized', desc: 'Pre-processing raw CSV/JSON case data.' },
        { title: 'Local AML feature engineering', desc: 'Running Pandas engine to check for Smurfing and Rapid Movements.' },
        { title: 'Retrieving Guidelines (RAG)', desc: 'Searching ChromaDB Vector Store for compliance standards.' },
        { title: 'Registering local MLflow metrics', desc: 'Logging performance features locally.' },
        { title: 'Generating LLM Narrative', desc: 'Orchestrating primary Ollama llama3.1 engine.' }
    ];

    // Handle Upload File and run the pipeline
    const uploadFile = async (file: File) => {
        setUploading(true);
        setError('');
        setResult(null);
        setCurrentStep(0);
        setStepLogs([]);

        // Start step animators
        const totalSteps = activeSteps.length;
        let step = 0;
        const interval = setInterval(() => {
            if (step < totalSteps - 1) {
                step += 1;
                setCurrentStep(step);
            }
        }, 1200);

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/v1/upload/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Upload failed');
            }
            const data = await res.json();
            
            // Wait for final step
            clearInterval(interval);
            setCurrentStep(totalSteps);
            setResult(data);
        } catch (e: unknown) {
            clearInterval(interval);
            setError(e instanceof Error ? e.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
    };

    return (
        <AuthGuard allowedRoles={['Compliance Officer', 'System Admin']}>
        <div className="min-h-screen flex flex-col bg-[#fcf8fb]">
            <NavBar />
            <main className="pt-24 pb-12 px-6 max-w-screen-2xl mx-auto flex-1 w-full">
                <motion.header 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#1b1b1d] mb-2">Systems Management</h1>
                    <p className="text-[#414755] max-w-2xl leading-relaxed">Oversee case ingestion, manage institutional permissions, and monitor backend health metrics on our Local Hybrid processing engine.</p>
                </motion.header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT: Upload + Health */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="lg:col-span-8 space-y-8"
                    >
                        {/* Upload Ingest Zone or Live Step Tracer */}
                        {!uploading && !result && (
                            <section
                                className={`bg-white rounded-2xl p-10 shadow-[0_20px_50px_rgba(27,27,29,0.03)] border-2 border-dashed transition-all duration-500 cursor-pointer ${
                                    dragging 
                                        ? 'border-[#0058bc] bg-[#d8e2ff]/10 scale-[1.01]'
                                        : 'border-[#c1c6d7]/30 hover:border-[#0058bc]/40'
                                }`}
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                            >
                                <div className="flex flex-col items-center justify-center text-center space-y-6">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 ${dragging ? 'scale-125' : ''} bg-[#d8e2ff] text-[#0058bc]`}>
                                        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'wght' 300" }}>
                                            cloud_upload
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-[#1b1b1d] mb-2">
                                            Ingest New Case Data
                                        </h2>
                                        <p className="text-[#414755] text-sm max-w-sm mx-auto">
                                            Drag and drop your suspicious transactions CSV or JSON to trigger the automated local features pipeline.
                                        </p>
                                    </div>
                                    <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            Select Case File
                                        </Button>
                                        <Button variant="secondary">Template Guide</Button>
                                    </div>
                                    <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                                </div>
                            </section>
                        )}

                        {/* Telemetry Step Tracker (Uploading) */}
                        {uploading && (
                            <section className="bg-white rounded-2xl p-8 shadow-[0_20px_50px_rgba(27,27,29,0.03)] border border-zinc-100">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-[#0058bc]">
                                            Pipeline Running: LOCAL HYBRID ENGINE
                                        </span>
                                        <h3 className="text-xl font-bold text-zinc-900 mt-2">Automated Compliance Extraction</h3>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                                        Processing case features...
                                    </div>
                                </div>

                                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#c1c6d7]/30">
                                    {activeSteps.map((step, idx) => {
                                        const isDone = currentStep > idx;
                                        const isActive = currentStep === idx;
                                        return (
                                            <motion.div 
                                                key={step.title}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-start gap-4 relative z-10"
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                                    isDone 
                                                        ? 'bg-emerald-500 text-white' 
                                                        : isActive 
                                                            ? 'bg-[#0058bc] text-white ring-4 ring-blue-100'
                                                            : 'bg-zinc-100 text-zinc-400'
                                                }`}>
                                                    {isDone ? (
                                                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold text-sm leading-none mb-1 ${isActive ? 'text-zinc-900 font-extrabold' : isDone ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                        {step.title}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">{step.desc}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Result / Success Panel */}
                        {result && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-start"
                            >
                                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <p className="font-extrabold text-lg text-emerald-900">Case Created & Analyzed Successfully!</p>
                                        <p className="text-xs text-emerald-800 font-mono mt-1">Reference Key: {result.case_reference}</p>
                                    </div>
                                    <p className="text-sm text-emerald-700 leading-relaxed">
                                        The AML compliance features were processed by our local high-performance hybrid aggregation engine. The narrative report was successfully generated using Llama 3.1 LLM parameters.
                                    </p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <button 
                                            onClick={() => router.push(`/cases/${result.case_id}`)} 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                        >
                                            View Report Dashboard
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                        <button 
                                            onClick={() => { setResult(null); setCurrentStep(0); }} 
                                            className="text-xs font-semibold text-emerald-800 hover:underline"
                                        >
                                            Process Another Case
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 text-sm font-medium flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-600 text-xl">error</span>
                                {error}
                            </div>
                        )}

                        {/* System Health Bento */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#f6f3f5] rounded-2xl p-6 flex flex-col justify-between h-64 border border-[#c1c6d7]/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#414755] mb-1">Processing Speed</h3>
                                        <p className="text-2xl font-extrabold tracking-tighter text-[#1b1b1d]">
                                            1.2s 
                                            <span className="text-xs font-medium text-emerald-600 tracking-normal ml-1">
                                                avg/page
                                            </span>
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#0058bc]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                                </div>
                                <div className="flex items-end gap-1.5 h-24">
                                    {[40, 60, 30, 80, 55, 90, 45].map((h, i) => (
                                        <div key={i} className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-[#0058bc]' : 'bg-[#0058bc]/20'}`} style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#f6f3f5] rounded-2xl p-6 flex flex-col justify-between h-64 border border-[#c1c6d7]/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#414755] mb-1">AI Ingestion Hub</h3>
                                        <p className="text-2xl font-extrabold tracking-tighter text-[#1b1b1d]">
                                            Hybrid Llama
                                            <span className="text-xs font-medium text-[#414755] tracking-normal ml-1">Engine</span>
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#0058bc]">verified</span>
                                </div>
                                <div className="relative flex items-center justify-center">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle className="text-zinc-200" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="6" />
                                        <circle className="text-[#0058bc]" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="15" strokeWidth="6" />
                                    </svg>
                                    <span className="absolute text-[10px] font-extrabold uppercase text-zinc-900 tracking-wider">Active</span>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-[#414755] uppercase tracking-tighter">
                                    <span>Pandas Engine</span>
                                    <span>MLflow Core</span>
                                </div>
                            </div>
                        </section>
                    </motion.div>

                    {/* RIGHT: Admin permissions */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-4 space-y-8"
                    >
                        {/* Standard Admin Permissions */}
                        <section className="bg-[#f6f3f5] rounded-2xl p-8 border border-[#c1c6d7]/10">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold tracking-tight text-[#1b1b1d] mb-2">Security Override</h2>
                                <p className="text-sm text-[#414755]">Manage compliance user roles and isolation protocols.</p>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#414755]">Role Permissions</h3>
                                    {[
                                        { icon: 'analytics', label: 'Analyst', sub: 'Standard access' },
                                        { icon: 'policy', label: 'Compliance Officer', sub: 'Full review power' },
                                        { icon: 'security', label: 'System Admin', sub: 'Root configuration', highlight: true },
                                    ].map((role) => (
                                        <div key={role.label} className={`bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-[#c1c6d7]/10 ${role.highlight ? 'ring-2 ring-[#0058bc]/20' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.highlight ? 'bg-[#d8e2ff]' : 'bg-[#e2dfe1]'}`}>
                                                    <span className={`material-symbols-outlined ${role.highlight ? 'text-[#0058bc]' : 'text-[#5f5e60]'}`}>{role.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#1b1b1d]">{role.label}</p>
                                                    <p className="text-[10px] text-[#414755]">{role.sub}</p>
                                                </div>
                                            </div>
                                            <motion.button 
                                                whileTap={{ scale: 0.9 }}
                                                className="w-12 h-6 bg-[#0058bc] rounded-full relative transition-colors duration-300"
                                            >
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                            </motion.button>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-[#c1c6d7]/30 space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#414755]">Global Overrides</h3>
                                    <button className="w-full text-left p-4 rounded-xl hover:bg-[#e4e2e4] transition-colors flex items-center justify-between group">
                                        <span className="text-sm font-medium">Export Compliance Audit</span>
                                        <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                                    </button>
                                    <button className="w-full text-left p-4 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-between group">
                                        <span className="text-sm font-medium">Clear Engine Cache</span>
                                        <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-all">refresh</span>
                                    </button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
        </AuthGuard>
    );
}
