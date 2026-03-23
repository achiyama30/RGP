import React, { useState, useEffect, useRef } from 'react';
import { Hammer } from 'lucide-react';

const MiningGame = ({ onResult, usesLeft, audioSystem }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [sweetSpot, setSweetSpot] = useState(50);
    const [cursorPos, setCursorPos] = useState(0);
    const [resultMsg, setResultMsg] = useState('');
    
    const requestRef = useRef();
    const posRef = useRef(0);
    const dirRef = useRef(1); // 1 = right, -1 = left
    const speed = 1.2; // roughly takes 1.5s to cross

    const startGame = () => {
        if (usesLeft <= 0) return;
        audioSystem.sfxUIClick();
        setSweetSpot(20 + Math.random() * 60); // 20% to 80%
        setResultMsg('');
        setIsPlaying(true);
        posRef.current = 0;
        dirRef.current = 1;
        
        const animate = () => {
            posRef.current += dirRef.current * speed;
            if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1; }
            if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
            setCursorPos(posRef.current);
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
    };

    const stopGame = () => {
        if (!isPlaying) return;
        cancelAnimationFrame(requestRef.current);
        setIsPlaying(false);
        
        const dist = Math.abs(posRef.current - sweetSpot);
        
        let mineral = null;
        let amount = 0;
        let msg = '';
        
        if (dist < 4) { // Perfect (< 4%)
            audioSystem.sfxCrit();
            const roll = Math.random();
            if (roll < 0.1) { mineral = 'mithril'; amount = 1; }
            else if (roll < 0.4) { mineral = 'goldOre'; amount = 1; }
            else { mineral = 'iron'; amount = 2; }
            msg = 'מכה מושלמת!';
        } else if (dist < 12) { // Good (< 12%)
            audioSystem.sfxAttack();
            if (Math.random() < 0.3) { mineral = 'iron'; amount = 1; }
            else { mineral = 'copper'; amount = 2; }
            msg = 'מכה טובה!';
        } else if (dist < 20) { // Okay (< 20%)
            audioSystem.sfxUIClick();
            mineral = 'copper'; amount = 1;
            msg = 'מכה חלשה.';
        } else { // Miss
            audioSystem.sfxError();
            msg = 'פספסת את הגיד החוצב!';
        }
        
        setResultMsg(msg);
        onResult({ mineralId: mineral, amount });
    };

    useEffect(() => {
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <div className="bg-slate-950/80 backdrop-blur-md shadow-xl border border-slate-800 rounded-xl p-5 flex flex-col items-center">
            <h3 className="text-xl font-bold font-cinzel text-orange-400 drop-shadow-sm mb-2 flex items-center gap-2 tracking-wide"><Hammer className="text-orange-500 opacity-80"/> מכרה האבנים</h3>
            <p className="text-xs text-slate-500 mb-5 tracking-wider font-outfit uppercase">נותרו ניסיונות: {usesLeft}/3</p>
            
            <div className="relative w-full h-10 bg-[#04060A] rounded-sm overflow-hidden border border-slate-800 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] mb-5">
                {/* Sweet Spot */}
                {isPlaying && (
                    <div 
                        className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-600/60 via-emerald-400 to-emerald-600/60 shadow-[0_0_15px_rgba(52,211,153,0.6)] border-x border-emerald-300/50"
                        style={{ left: `${sweetSpot - 4}%`, width: '8%' }}
                    ></div>
                )}
                {/* Good Spot */}
                {isPlaying && (
                    <div 
                        className="absolute top-0 bottom-0 bg-amber-600/30 border-x border-amber-500/20"
                        style={{ left: `${sweetSpot - 12}%`, width: '24%' }}
                    ></div>
                )}
                {/* Cursor */}
                {isPlaying && (
                    <div 
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white,0_0_20px_white]"
                        style={{ left: `${cursorPos}%`, transform: 'translateX(-50%)' }}
                    ></div>
                )}
            </div>

            <div className="h-6 mb-5 text-sm font-bold font-outfit tracking-wide text-amber-500 drop-shadow-sm">{resultMsg}</div>

            {!isPlaying ? (
                <button 
                    onClick={startGame} 
                    disabled={usesLeft <= 0}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${usesLeft > 0 ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                >
                    {usesLeft > 0 ? 'התחל חציבה' : 'אין כוח לחצוב כרגע'}
                </button>
            ) : (
                <button 
                    onClick={stopGame} 
                    className="w-full py-3 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg transform active:scale-95 transition-all"
                >
                    הך! (לחץ)
                </button>
            )}
        </div>
    );
};

export default MiningGame;
