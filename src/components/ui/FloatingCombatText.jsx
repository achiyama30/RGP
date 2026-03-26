import React, { useEffect } from 'react';

const FloatingCombatText = ({ text, type, elemMult = 1, onAnimationEnd }) => {
    // Base color classes by type
    const baseClasses = {
        damage: 'text-rose-600 font-bold font-cinzel drop-shadow-[0_2px_10px_rgba(225,29,72,0.9)] opacity-90',
        heal: 'text-emerald-500 font-bold font-cinzel text-3xl drop-shadow-[0_2px_10px_rgba(52,211,153,0.9)] opacity-90',
        mana: 'text-blue-500 font-bold font-cinzel text-2xl drop-shadow-[0_2px_10px_rgba(96,165,250,0.9)] opacity-90',
        crit: 'text-amber-500 font-black font-cinzel text-5xl animate-float-up-crit drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]',
    };

    // Elemental override for damage type only
    let elemClass = 'text-3xl';
    let elemStyle = {};
    if (type === 'damage' || type === 'crit') {
        if (elemMult >= 2) {
            elemClass = 'text-5xl font-black';
            elemStyle = { color: '#fbbf24', textShadow: '0 0 25px rgba(251,191,36,0.9), 0 0 50px rgba(239,68,68,0.6)' };
        } else if (elemMult <= 0.5) {
            elemClass = 'text-xl font-medium opacity-60';
            elemStyle = { color: '#94a3b8', textShadow: 'none' };
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => onAnimationEnd(), 1500);
        return () => clearTimeout(timer);
    }, [onAnimationEnd]);

    return (
        <div 
            className={`absolute ${type !== 'crit' ? 'animate-float-damage' : ''} ${baseClasses[type] || baseClasses.damage} ${elemClass} z-50`} 
            style={elemStyle}
            dir="ltr"
        >
            {text}
        </div>
    );
};

export default FloatingCombatText;
