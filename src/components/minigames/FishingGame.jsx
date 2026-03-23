import React, { useState, useEffect, useRef } from 'react';
import { Waves, Fish } from 'lucide-react';

const FishingGame = ({ onResult, usesLeft, audioSystem, fishTypes, playerLevel = 1 }) => {
    const [phase, setPhase] = useState('idle'); // idle, waiting, bite, result
    const [resultMsg, setResultMsg] = useState('');
    
    const waitTimerRef = useRef(null);
    const biteTimerRef = useRef(null);

    const startFishing = () => {
        if (usesLeft <= 0) return;
        audioSystem.sfxUIClick();
        setResultMsg('');
        setPhase('waiting');
        
        // Random wait time between 2 and 5 seconds
        const waitTime = 2000 + Math.random() * 3000;
        
        waitTimerRef.current = setTimeout(() => {
            audioSystem.sfxAlert(); // Play a splash sound
            setPhase('bite');
            
            // Player has 1 second to click
            biteTimerRef.current = setTimeout(() => {
                setPhase('result');
                setResultMsg('הדג ברח! היית איטי מדי.');
                audioSystem.sfxError();
                onResult({ success: false });
            }, 1000);
            
        }, waitTime);
    };

    const pullRod = () => {
        if (phase === 'waiting') {
            // Clicked too early
            clearTimeout(waitTimerRef.current);
            setPhase('result');
            setResultMsg('משכת מוקדם מדי! הפחדת את הדגים.');
            audioSystem.sfxError();
            onResult({ success: false });
        } else if (phase === 'bite') {
            // Success!
            clearTimeout(biteTimerRef.current);
            setPhase('result');
            
            // Determine fish based on rarity and level
            const roll = Math.random();
            let caughtFish = null;
            let cumulative = 0;
            
            // Sort by rarity (rarest last)
            const sortedFish = [...fishTypes].sort((a, b) => b.rarity - a.rarity);
            
            for (const f of sortedFish) {
                // Slightly boost rare chances with player level
                const boost = (playerLevel * 0.005); 
                cumulative += (f.rarity + boost);
                if (roll <= cumulative) {
                    caughtFish = f;
                    break;
                }
            }
            if (!caughtFish) caughtFish = fishTypes[0]; // fallback
            
            setResultMsg(`תפסת ${caughtFish.name}! (${caughtFish.buffType})`);
            audioSystem.sfxGold(); // joyful sound
            onResult({ success: true, fish: caughtFish });
        }
    };

    useEffect(() => {
        return () => {
            clearTimeout(waitTimerRef.current);
            clearTimeout(biteTimerRef.current);
        };
    }, []);

    return (
        <div className="bg-slate-950/80 backdrop-blur-md shadow-xl border border-slate-800 rounded-xl p-5 flex flex-col items-center">
            <h3 className="text-xl font-bold font-cinzel text-blue-300 drop-shadow-sm mb-2 flex items-center gap-2 tracking-wide"><Waves className="text-blue-400 opacity-80"/> המזח הנסתר</h3>
            <p className="text-xs text-slate-500 mb-5 tracking-wider font-outfit uppercase">נותרו פתיונות: {usesLeft}/3</p>

            <div className="w-full h-28 bg-[#04060A] border border-blue-900/30 rounded-xl mb-6 relative overflow-hidden flex items-center justify-center shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)]">
                {phase === 'idle' && <Waves className="text-blue-800 opacity-30 animate-pulse" size={48} />}
                {phase === 'waiting' && <span className="text-blue-400 text-lg animate-pulse font-outfit tracking-wide">זרימה שקטה...</span>}
                {phase === 'bite' && (
                    <div className="absolute inset-0 bg-rose-950/40 flex items-center justify-center animate-pulse">
                        <span className="text-rose-400 text-3xl font-black font-cinzel shadow-rose-900 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)] tracking-widest">משוך!!</span>
                    </div>
                )}
                {phase === 'result' && <span className="text-base font-bold text-amber-500 font-outfit text-center px-4 tracking-wide">{resultMsg}</span>}
            </div>

            {phase === 'idle' || phase === 'result' ? (
                <button 
                    onClick={startFishing} 
                    disabled={usesLeft <= 0}
                    className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${usesLeft > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                >
                    <Fish size={18} /> {usesLeft > 0 ? 'השלך חכה' : 'נגמרו הפתיונות'}
                </button>
            ) : (
                <button 
                    onClick={pullRod} 
                    className="w-full py-3 rounded-lg font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transform active:scale-95 transition-all"
                >
                    משוך את החכה!
                </button>
            )}
        </div>
    );
};

export default FishingGame;
