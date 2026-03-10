import React from 'react';
import { Heart, Shield, Sword, Droplet, Target, Activity, Zap } from 'lucide-react';

const ItemCard = ({ item, isEquipped, onAction, actionText, actionButtonClass, disabled }) => {
    if (!item) return (
        <div className="p-4 border border-dashed border-slate-700 bg-slate-800/30 rounded-xl text-center text-slate-500">
            אין פריט מצויד
        </div>
    );

    const isEpicOrLegendary = item.rarity.name === 'epic' || item.rarity.name === 'legendary';
    const isLegendary = item.rarity.name === 'legendary';

    return (
        <div className={`p-4 rounded-xl border ${item.rarity.style} flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${isLegendary ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''}`}>
            
            {/* Shimmer effect for epic/legendary items */}
            {isEpicOrLegendary && (
                <div className="absolute inset-0 bg-white/10 animate-shimmer mix-blend-overlay pointer-events-none"></div>
            )}

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-bold ${item.rarity.colorClass} drop-shadow-sm`}>{item.name}</h4>
                    <span className="text-xs bg-black/50 px-2 py-1 rounded text-slate-300 backdrop-blur-sm border border-slate-700/50">רמה {item.level}</span>
                </div>
                
                <div className="text-sm space-y-1 mt-3">
                    {item.str > 0 && <div className="flex gap-2 text-rose-300"><Sword size={16}/> +{item.str} התקפה</div>}
                    {item.mag > 0 && <div className="flex gap-2 text-blue-300"><Zap size={16}/> +{item.mag} קסם</div>}
                    {item.def > 0 && <div className="flex gap-2 text-slate-300"><Shield size={16}/> +{item.def} הגנה</div>}
                    {item.hpBonus > 0 && <div className="flex gap-2 text-green-300"><Heart size={16}/> +{item.hpBonus} חיים</div>}
                    {item.mpBonus > 0 && <div className="flex gap-2 text-blue-400"><Droplet size={16}/> +{item.mpBonus} מאנה</div>}
                    {item.critBonus > 0 && <div className="flex gap-2 text-yellow-300"><Target size={16}/> +{item.critBonus}% קריט</div>}
                    {item.evadeBonus > 0 && <div className="flex gap-2 text-teal-300"><Activity size={16}/> +{item.evadeBonus}% התחמקות</div>}
                </div>
            </div>

            <div className="mt-4">
                {isEquipped ? (
                    <div className="w-full text-center py-2 bg-emerald-900/40 text-emerald-400 rounded-lg text-sm border border-emerald-800 font-medium">
                        מצויד כרגע
                    </div>
                ) : actionText && onAction ? (
                    <button 
                        onClick={() => onAction(item.type, item)}
                        disabled={disabled}
                        className={`w-full py-2 rounded-lg font-bold text-sm transition-colors flex justify-center items-center gap-2 ${actionButtonClass || 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'}`}
                    >
                        {actionText}
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default ItemCard;
