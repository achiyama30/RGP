import React from 'react';

const ProgressBar = ({ current, max, colorClass, label }) => {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    return (
        <div className="w-full bg-slate-950 rounded-sm h-5 relative overflow-hidden border border-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] mb-3">
            <div className={`h-full transition-all duration-500 ease-out opacity-90 ${colorClass}`} style={{ width: `${percent}%` }}></div>
            <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-none"></div>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-outfit uppercase text-slate-300 tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,1)] mix-blend-lighten">
                {label} <span className="mx-1 opacity-50">•</span> {Math.floor(current)}/{max}
            </span>
        </div>
    );
};

export default ProgressBar;
