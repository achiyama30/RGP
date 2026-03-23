import React from 'react';
import { Heart, Shield, Sword, Droplet, Target, Activity, Zap } from 'lucide-react';

const ItemCard = ({ item, isEquipped, onAction, actionText, actionButtonClass, disabled }) => {
    if (!item) return (
        <div className="p-4 border border-dashed border-slate-700 bg-slate-800/30 rounded-xl text-center text-slate-500">
            אין פריט מצויד
        </div>
    );

    const isEpicOrLegendary = item.rarity?.name === 'epic' || item.rarity?.name === 'legendary';
    const isLegendary = item.rarity?.name === 'legendary';

    return (
        <div className={`p-4 rounded-md border-t-2 border-b border-r border-l border-white/5 ${item.rarity?.style || 'border-t-slate-700 bg-slate-950/70 border-x-transparent border-b-transparent'} flex flex-col justify-between h-full relative overflow-hidden transition-all duration-500 hover:shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md ${isLegendary ? 'shadow-[0_0_15px_rgba(245,158,11,0.15)] border-t-amber-500' : ''}`}>
            
            {/* Shimmer effect for epic/legendary items */}
            {isEpicOrLegendary && (
                <div className="absolute inset-0 bg-white/5 animate-shimmer mix-blend-overlay pointer-events-none"></div>
            )}

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4 gap-2 border-b border-white/5 pb-2">
                    <h4 className={`font-semibold font-cinzel text-lg ${item.rarity?.colorClass || 'text-slate-500'} drop-shadow-sm`}>{item.name}</h4>
                    <span className="text-[10px] whitespace-nowrap bg-black/60 px-2 py-1 rounded-sm text-slate-400 font-outfit tracking-wider uppercase border border-white/10 shadow-inner">רמה {item.level}</span>
                </div>
                
                <div className="text-[13px] font-medium space-y-1 mt-3">
                    {item.str > 0 && <div className="flex items-center gap-1.5 text-rose-300"><Sword size={14} className="opacity-80"/> <span className="text-white drop-shadow-sm">+{item.str}</span> התקפה</div>}
                    {item.mag > 0 && <div className="flex items-center gap-1.5 text-blue-300"><Zap size={14} className="opacity-80"/> <span className="text-white drop-shadow-sm">+{item.mag}</span> קסם</div>}
                    {item.def > 0 && <div className="flex items-center gap-1.5 text-slate-300"><Shield size={14} className="opacity-80"/> <span className="text-white drop-shadow-sm">+{item.def}</span> הגנה</div>}
                    {item.hpBonus > 0 && <div className="flex items-center gap-1.5 text-emerald-300"><Heart size={14} className="opacity-80"/> <span className="text-white drop-shadow-sm">+{item.hpBonus}</span> חיים</div>}
                    {item.mpBonus > 0 && <div className="flex items-center gap-1.5 text-indigo-300"><Droplet size={14} className="opacity-80"/> <span className="text-white drop-shadow-sm">+{item.mpBonus}</span> מאנה</div>}
                    {item.critBonus > 0 && <div className="flex items-center gap-1.5 text-amber-300"><Target size={14} className="opacity-80"/> <span className="text-white drop-shadow-sm">+{item.critBonus}%</span> קריט</div>}
                    {item.evadeBonus > 0 && <div className="flex items-center gap-1.5 text-teal-300"><Activity size={14} className="opacity-80"/> <span className="text-white drop-shadow-sm">+{item.evadeBonus}%</span> התחמקות</div>}
                </div>
            </div>

            <div className="mt-5 border-t border-white/5 pt-3">
                {isEquipped ? (
                    <div className="w-full text-center py-2 bg-emerald-950/30 text-emerald-500 rounded text-xs border border-emerald-900/50 tracking-wide uppercase">
                        מצויד
                    </div>
                ) : actionText && onAction ? (
                    <button 
                        onClick={() => onAction(item.type, item)}
                        disabled={disabled}
                        className={`w-full py-2.5 rounded text-xs tracking-wider transition-all focus:outline-none flex justify-center items-center gap-2 shadow-sm active:scale-95 ${actionButtonClass || 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50 disabled:grayscale'}`}
                    >
                        {actionText}
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default ItemCard;
