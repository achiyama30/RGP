import React, { useEffect } from 'react';

const FloatingCombatText = ({ text, type, onAnimationEnd }) => {
    const colorClasses = {
        damage: 'text-rose-600 font-bold font-cinzel text-3xl drop-shadow-[0_2px_10px_rgba(225,29,72,0.9)] opacity-90',
        heal: 'text-emerald-500 font-bold font-cinzel text-3xl drop-shadow-[0_2px_10px_rgba(52,211,153,0.9)] opacity-90',
        mana: 'text-blue-500 font-bold font-cinzel text-2xl drop-shadow-[0_2px_10px_rgba(96,165,250,0.9)] opacity-90',
        crit: 'text-amber-500 font-black font-cinzel text-5xl animate-float-up-crit drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]',
    };

    useEffect(() => {
        const timer = setTimeout(() => onAnimationEnd(), 1500);
        return () => clearTimeout(timer);
    }, [onAnimationEnd]);

    return (
        <div className={`absolute ${type !== 'crit' ? 'animate-float-damage' : ''} ${colorClasses[type] || colorClasses.damage} z-50`} dir="ltr">
            {text}
        </div>
    );
};

export default FloatingCombatText;
