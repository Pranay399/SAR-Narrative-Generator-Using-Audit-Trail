'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ReportCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    color?: 'blue' | 'emerald' | 'amber' | 'zinc';
    delay?: number;
}

export default function ReportCard({
    title,
    value,
    description,
    icon,
    trend,
    color = 'blue',
    delay = 0,
}: ReportCardProps) {
    const colorStyles = {
        blue: {
            bg: 'bg-[#d8e2ff]',
            text: 'text-[#0058bc]',
            light: 'bg-[#0058bc]/5',
        },
        emerald: {
            bg: 'bg-emerald-100',
            text: 'text-emerald-700',
            light: 'bg-emerald-500/5',
        },
        amber: {
            bg: 'bg-amber-100',
            text: 'text-amber-700',
            light: 'bg-amber-500/5',
        },
        zinc: {
            bg: 'bg-[#f6f3f5]',
            text: 'text-[#1b1b1d]',
            light: 'bg-zinc-500/5',
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-6 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(27,27,29,0.03)] border border-[#c1c6d7]/10"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl ${colorStyles[color].bg} flex items-center justify-center ${colorStyles[color].text}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        <span className="material-symbols-outlined text-[14px]">
                            {trend.isPositive ? 'trending_up' : 'trending_down'}
                        </span>
                        {trend.value}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#414755] mb-1">{title}</h3>
                <p className="text-2xl font-extrabold tracking-tighter text-[#1b1b1d]">{value}</p>
                {description && <p className="text-xs text-[#414755]/60 mt-2 leading-relaxed">{description}</p>}
            </div>
        </motion.div>
    );
}
