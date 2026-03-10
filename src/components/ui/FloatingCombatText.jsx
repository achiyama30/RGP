import React, { useEffect } from 'react';

const FloatingCombatText = ({ text, type, onAnimationEnd }) => {
    const colorClasses = {
        damage: 'text-rose-500 font-bold text-2xl',
        heal: 'text-emerald-400 font-bold text-2xl',
        mana: 'text-blue-400 font-bold text-xl',
        crit: 'text-yellow-400 font-black text-4xl animate-pulse',
    };

    useEffect(() => {
        const timer = setTimeout(() => onAnimationEnd(), 1500);
        return () => clearTimeout(timer);
    }, [onAnimationEnd]);

    return (
        <div className={`absolute animate-float-damage ${colorClasses[type] || colorClasses.damage} drop-shadow-lg z-50`} dir="ltr">
            {text}
        </div>
    );
};

export default FloatingCombatText;
