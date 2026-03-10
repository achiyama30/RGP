import React from 'react';

const ProgressBar = ({ current, max, colorClass, label }) => {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    return (
        <div className="w-full bg-slate-800 rounded-full h-5 relative overflow-hidden border border-slate-700 shadow-inner mb-2">
            <div className={`h-full transition-all duration-300 ease-out ${colorClass}`} style={{ width: `${percent}%` }}></div>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow-md">
                {label}: {current} / {max}
            </span>
        </div>
    );
};

export default ProgressBar;
