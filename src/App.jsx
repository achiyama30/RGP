import React, { useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import ProgressBar from './components/ui/ProgressBar';
import FloatingCombatText from './components/ui/FloatingCombatText';
import ItemCard from './components/ui/ItemCard';
import { 
  Heart, Shield, Sword, Sparkles, Droplet, Skull, AlertTriangle,
  Coins, Map, Store, Zap, Target, ArrowDown, ArrowUp, Gem, 
  Activity, Info, X, ChevronRight, HelpCircle, Backpack,
  Volume2, VolumeX
} from 'lucide-react';
import { audioSystem } from './utils/audio';

const App = () => {
    const [state, dispatch] = useGameState();
    const [isMuted, setIsMuted] = React.useState(audioSystem.muted);
    const { phase, player: p, enemy: ne, log, floatingTexts, lootData, shopInventory, eventData, pendingRing } = state;

    const playerTotalStr = p.str + (p.meleeWeapon?.str || 0);
    const playerTotalMag = p.mag + (p.magicWeapon?.mag || 0);
    const playerTotalDef = p.def + (p.armor?.def || 0);
    const playerTotalMaxMp = p.baseMaxMp + (p.magicWeapon?.mpBonus || 0) + (p.armor?.mpBonus || 0);
    const playerTotalMaxHp = p.baseMaxHp + (p.ring1?.hpBonus || 0) + (p.ring2?.hpBonus || 0);

    // AI logic trigger
    useEffect(() => {
        if (phase === 'battle' && state.turn === 'enemy' && ne && ne.hp > 0 && !state.enemyAttacking) {
            const timer1 = setTimeout(() => {
                dispatch({ type: 'ENEMY_ANIM_START' });
                const timer2 = setTimeout(() => {
                    dispatch({ type: 'ENEMY_TURN' });
                }, 400); // Wait for attack animation to finish
                return () => clearTimeout(timer2);
            }, 800); // Delay before enemy attacks
            return () => clearTimeout(timer1);
        }
    }, [phase, state.turn, ne, state.enemyAttacking, dispatch]);

    // Handle generic button clicks for UI sound
    const playClick = () => audioSystem.sfxUIClick();

    const handleAction = (actionType) => {
        if (actionType === 'attack') audioSystem.sfxAttackMelee();
        if (actionType === 'magic') audioSystem.sfxAttackMagic();
        if (actionType === 'heavy') audioSystem.sfxAttackHeavy();
        if (actionType === 'defend') playClick();
        dispatch({ type: 'PLAYER_ACTION', payload: { actionType } });
    };

    const toggleMute = () => {
        setIsMuted(audioSystem.toggleMute());
    };

    // Render Home Phase
    if (phase === 'home') {
        return (
            <div className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-slate-950 p-6 flex flex-col pt-12">
                <div className="text-center mb-8 relative">
                    <button 
                        onClick={toggleMute} 
                        className="absolute right-0 top-0 text-slate-500 hover:text-slate-300 p-2 rounded-full bg-slate-900 border border-slate-800 transition-colors"
                        title={isMuted ? "הפעל סאונד" : "השתק סאונד"}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className="text-emerald-500" />}
                    </button>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 drop-shadow-lg mb-2">RPG Quest</h1>
                    <p className="text-slate-400 font-medium">הרפתקה אינסופית ממתינה לך</p>
                </div>

                <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 mb-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-900/50 border-2 border-slate-800">
                                ר{p.level}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-100">הלוחם</h2>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <Coins size={12} className="text-yellow-400" /> {p.gold} זהב
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <ProgressBar current={p.hp} max={playerTotalMaxHp} colorClass="bg-gradient-to-r from-rose-600 to-rose-400" label="חיים" />
                        <ProgressBar current={p.mp} max={playerTotalMaxMp} colorClass="bg-gradient-to-r from-blue-600 to-blue-400" label="מאנה" />
                        <ProgressBar current={p.xp} max={p.level * 50} colorClass="bg-gradient-to-r from-emerald-600 to-emerald-400" label="ניסיון" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5 text-sm font-medium relative z-10 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <div className="flex flex-col items-center justify-center text-rose-300">
                            <Sword size={20} className="mb-1 opacity-80" />
                            <span>{playerTotalStr} התקפה</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-blue-300">
                            <Zap size={20} className="mb-1 opacity-80" />
                            <span>{playerTotalMag} קסם</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-slate-300 border-r border-slate-800">
                            <Shield size={20} className="mb-1 opacity-80" />
                            <span>{playerTotalDef} הגנה</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto mb-8">
                    <button onClick={() => { playClick(); dispatch({ type: 'EXPLORE' }); }} className="relative overflow-hidden group bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-bold py-5 px-6 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-95 border border-indigo-500/50 flex flex-col items-center justify-center gap-2">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <Map size={28} className="relative z-10" />
                        <span className="relative z-10 text-lg">צא להרפתקה</span>
                    </button>
                    
                    <button onClick={() => { playClick(); dispatch({ type: 'GO_SHOP' }); }} className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-200 py-3 px-4 rounded-2xl border border-slate-700 shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center gap-2">
                        <Store size={24} className="text-emerald-400" />
                        <span>חנות מקומית</span>
                    </button>
                </div>

                {/* Equipment Preview (Simple) */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs opacity-80">
                   <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                       <span className="text-slate-400">נשק:</span>
                       <span className={p.meleeWeapon?.rarity.colorClass || 'text-slate-500'}>{p.meleeWeapon?.name || 'אין פריט'}</span>
                   </div>
                   <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                       <span className="text-slate-400">שריון:</span>
                       <span className={p.armor?.rarity.colorClass || 'text-slate-500'}>{p.armor?.name || 'אין פריט'}</span>
                   </div>
                </div>

                <div className="text-center mt-6">
                     <button onClick={() => dispatch({ type: 'RESET_GAME' })} className="text-slate-600 text-xs hover:text-rose-400 transition-colors">
                        אפס שמירה ותתחיל מחדש
                    </button>
                </div>
            </div>
        );
    }

    // Render Event Phase
    if (phase === 'event') {
        const isBad = eventData.type === 'trap' || eventData.type === 'death';
        return (
            <div className="max-w-md mx-auto min-h-screen bg-slate-950 p-6 flex flex-col justify-center items-center text-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-2xl ${isBad ? 'bg-rose-950/50 shadow-rose-900/50' : 'bg-emerald-950/50 shadow-emerald-900/50'}`}>
                    {eventData.icon === 'skull' && <Skull size={64} className="text-rose-500" />}
                    {eventData.icon === 'alert' && <AlertTriangle size={64} className="text-orange-500" />}
                    {eventData.icon === 'gem' && <Gem size={64} className="text-emerald-400" />}
                </div>
                
                <h2 className={`text-3xl font-black mb-4 ${isBad ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {eventData.title}
                </h2>
                
                <p className="text-slate-300 text-lg mb-8 leading-relaxed px-4">
                    {eventData.desc}
                </p>

                {eventData.type === 'treasure' && (
                    <div className="flex items-center justify-center gap-3 text-3xl font-black text-yellow-400 mb-10 bg-yellow-900/20 py-4 px-8 rounded-2xl border-2 border-yellow-600/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <Coins size={36} className="animate-pulse" />
                        +{eventData.gold} זהב
                    </div>
                )}

                <button 
                    onClick={() => { playClick(); dispatch({ type: 'CLOSE_EVENT' }); }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-12 rounded-xl transition-colors border border-slate-700 w-full max-w-xs"
                >
                    המשך
                </button>

                {floatingTexts.map(t => (
                    <FloatingCombatText key={t.id} text={t.text} type={t.type} onAnimationEnd={() => dispatch({ type: 'REMOVE_FLOATING_TEXT', payload: { id: t.id } })} />
                ))}
            </div>
        );
    }

    // Render Shop Phase
    if (phase === 'shop') {
        return (
            <div className="max-w-md mx-auto min-h-screen bg-slate-950 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-100">
                        <Store className="text-emerald-400" /> חנות ציוד
                    </h2>
                    <div className="bg-slate-900 px-4 py-2 rounded-full flex items-center gap-2 border border-yellow-900/30">
                        <Coins className="text-yellow-400" size={18} />
                        <span className="font-bold text-yellow-100">{p.gold}</span>
                    </div>
                </div>

                {/* Potions */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-900/30 p-2 rounded-lg text-rose-400">
                            <Heart size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-200">שיקוי ריפוי</div>
                            <div className="text-xs text-slate-400">מרפא 40% חיים</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-slate-300">יש לך: {p.potions}</div>
                        <button 
                            onClick={() => dispatch({ type: 'BUY_ITEM', payload: { type: 'potion', item: { cost: 15 } } })}
                            disabled={p.gold < 15}
                            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${p.gold >= 15 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                        >
                            15 <Coins size={14} />
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3 text-slate-400 border-b border-slate-800 pb-2">הציוד הנוכחי שלך:</h3>
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x" dir="rtl">
                        <div className="w-44 flex-shrink-0 snap-center"><ItemCard item={p.meleeWeapon} isEquipped={true} /></div>
                        <div className="w-44 flex-shrink-0 snap-center"><ItemCard item={p.magicWeapon} isEquipped={true} /></div>
                        <div className="w-44 flex-shrink-0 snap-center"><ItemCard item={p.armor} isEquipped={true} /></div>
                        {p.ring1 && <div className="w-44 flex-shrink-0 snap-center"><ItemCard item={p.ring1} isEquipped={true} /></div>}
                        {p.ring2 && <div className="w-44 flex-shrink-0 snap-center"><ItemCard item={p.ring2} isEquipped={true} /></div>}
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-4 text-slate-400 border-b border-slate-800 pb-2">ציוד למכירה לרמתך ({p.level}):</h3>
                
                <div className="grid grid-cols-2 gap-4 overflow-y-auto hide-scrollbar pb-24" style={{maxHeight: 'calc(100vh - 250px)'}}>
                    {Object.entries(shopInventory).map(([type, item]) => item && (
                        <ItemCard 
                            key={type} 
                            item={item} 
                            onAction={(t, i) => dispatch({ type: 'BUY_ITEM', payload: { type: t, item: i } })}
                            actionText={<>{item.cost} <Coins size={14}/></>}
                            disabled={p.gold < item.cost}
                            actionButtonClass={p.gold >= item.cost ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'}
                        />
                    ))}
                    {!Object.values(shopInventory).some(i => i) && (
                        <div className="col-span-2 text-center text-slate-500 py-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                            קנית הכל! ציוד חדש יגיע כשתעלה רמה.
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                    <button 
                        onClick={() => dispatch({ type: 'LEAVE_SHOP' })}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-700 transition-colors shadow-lg"
                    >
                        חזור לעיר
                    </button>
                </div>
            </div>
        );
    }

    // Render Loot Phase
    if (phase === 'loot' && lootData) {
        return (
            <div className="max-w-md mx-auto min-h-screen bg-slate-950 p-6 flex flex-col justify-center">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto bg-yellow-900/30 rounded-full flex items-center justify-center mb-4 border-2 border-yellow-500/50 relative">
                        <div className="absolute inset-0 bg-yellow-400 animate-pulse rounded-full opacity-20 blur-md"></div>
                        <Sparkles size={32} className="text-yellow-400 relative z-10" />
                    </div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                        מצאת שלל!
                    </h2>
                </div>

                <div className="mb-8">
                    <ItemCard item={lootData} />
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={() => { audioSystem.sfxEquip(); dispatch({ type: 'EQUIP_LOOT' }); }}
                        className="w-full relative overflow-hidden group bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-bold py-4 rounded-xl border border-emerald-500/50 shadow-lg"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative z-10 flex justify-center items-center gap-2">
                            הצטייד והמשך <ChevronRight size={18} />
                        </span>
                    </button>
                    
                    <button 
                        onClick={() => { audioSystem.sfxGold(); dispatch({ type: 'LEAVE_LOOT' }); }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-4 rounded-xl border border-slate-700 transition-colors flex justify-center items-center gap-2"
                    >
                        <Coins size={18} className="text-yellow-500" />
                        מכור עבור {Math.floor(lootData.cost * 0.3)} זהב
                    </button>
                </div>
            </div>
        );
    }

    // Render Ring Replace Phase
    if (phase === 'ring_replace' && pendingRing) {
        return (
            <div className="max-w-md mx-auto min-h-screen bg-slate-950 p-6 flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-center mb-2 text-slate-100">אין מקום פנוי לטבעות</h2>
                <p className="text-slate-400 text-center mb-8">בחר איזו טבעת להחליף ב-{pendingRing.name}:</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col gap-2">
                        <div className="text-sm font-bold text-slate-500 text-center">טבעת 1</div>
                        <ItemCard 
                            item={p.ring1} 
                            onAction={() => dispatch({ type: 'CONFIRM_REPLACE_RING', payload: { slot: 1 } })}
                            actionText="החלף"
                            actionButtonClass="bg-rose-600 hover:bg-rose-500 text-white"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="text-sm font-bold text-slate-500 text-center">טבעת 2</div>
                        <ItemCard 
                            item={p.ring2} 
                            onAction={() => dispatch({ type: 'CONFIRM_REPLACE_RING', payload: { slot: 2 } })}
                            actionText="החלף"
                            actionButtonClass="bg-rose-600 hover:bg-rose-500 text-white"
                        />
                    </div>
                </div>

                <div className="mt-auto">
                    <ItemCard item={pendingRing} />
                </div>

                <button 
                    onClick={() => dispatch({ type: 'CANCEL_REPLACE_RING' })}
                    className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-700"
                >
                    בטל (הטבעת תימכר)
                </button>
            </div>
        );
    }

    // Render Battle Phase
    if (phase === 'battle') {
        const isPlayerTurn = state.turn === 'player';
        
        // Compute if player recently took damage to shake screen
        const hasTakenDamage = state.enemyAttacking && state.turn === 'enemy';

        return (
            <div className={`max-w-md mx-auto min-h-screen bg-slate-950 flex flex-col relative overflow-hidden ${hasTakenDamage ? 'animate-intense-shake' : ''}`}>
                {/* Background visual elements */}
                <div className={`absolute inset-0 pointer-events-none transition-colors duration-200 ${hasTakenDamage ? 'bg-red-900/30 animate-flash-red' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0'}`}></div>
                {state.lastHitCrit && <div className="absolute inset-0 bg-yellow-900/10 pointer-events-none z-0"></div>}

                {/* Floating Texts container relative positioning area */}
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex justify-center items-center">
                    {floatingTexts.map(t => (
                        <FloatingCombatText key={t.id} text={t.text} type={t.type} onAnimationEnd={() => dispatch({ type: 'REMOVE_FLOATING_TEXT', payload: { id: t.id } })} />
                    ))}
                </div>

                {/* Enemy Area (Top half) */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 border-b border-slate-800/50 bg-black/20">
                    {ne && (
                        <div className={`text-center transition-all w-full max-w-xs mx-auto ${state.enemyAttacking ? 'animate-enemy-attack' : ''} ${state.turn === 'player' && !isPlayerTurn ? 'animate-shake' : ''}`}>
                            <div className="flex justify-center mb-4">
                                <div className="text-8xl filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] bg-slate-900/50 p-6 rounded-full border border-slate-700/50 relative group">
                                    <div className="absolute -inset-2 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-1000"></div>
                                    <span className="relative z-10 inline-block group-hover:scale-110 transition-transform duration-300">{ne.emoji}</span>
                                    {ne.isBoss && <div className="absolute -top-4 -right-4 bg-rose-600 text-xs px-2 py-1 rounded-full text-white font-bold border border-rose-400 rotate-12 shadow-lg">בוס!</div>}
                                    {ne.stunTurns > 0 && <div className="absolute top-0 -left-4 animate-spin text-2xl filter drop-shadow-md">💫</div>}
                                </div>
                            </div>
                            
                            <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-2xl shadow-2xl relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-3 py-1 rounded-full border border-slate-600 font-medium text-slate-300 whitespace-nowrap">
                                    {ne.name} • רמה {ne.level}
                                </div>
                                <div className="mt-2">
                                    <ProgressBar current={ne.hp} max={ne.maxHp} colorClass="bg-rose-500" label="חיים" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Player Area (Middle) */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 font-bold border border-slate-700">ר{p.level}</div>
                       <div className="flex-1">
                           <ProgressBar current={p.hp} max={playerTotalMaxHp} colorClass="bg-emerald-500" label="חיים" />
                           <ProgressBar current={p.mp} max={playerTotalMaxMp} colorClass="bg-blue-500" label="מאנה" />
                       </div>
                    </div>

                    {/* Combat Actions */}
                    <div className="grid grid-cols-4 gap-2">
                        <button 
                            onClick={() => handleAction('attack')}
                            disabled={!isPlayerTurn}
                            className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${isPlayerTurn ? 'bg-rose-950/40 border-rose-800 hover:bg-rose-900/60 hover:border-rose-600 text-rose-300 shadow-inner' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'}`}
                        >
                            <Sword size={22} className="mb-1" />
                            <span className="text-[10px] font-bold">התקפה</span>
                        </button>
                        
                        <button 
                            onClick={() => handleAction('magic')}
                            disabled={!isPlayerTurn || p.mp < 15}
                            className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${!isPlayerTurn ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50' : p.mp >= 15 ? 'bg-blue-950/40 border-blue-800 hover:bg-blue-900/60 hover:border-blue-600 text-blue-300 shadow-inner' : 'bg-slate-900 border-slate-800 text-slate-500 opacity-50'}`}
                        >
                            <Zap size={22} className="mb-1" />
                            <span className="text-[10px] font-bold">קסם (15)</span>
                        </button>

                        <button 
                            onClick={() => handleAction('heavy')}
                            disabled={!isPlayerTurn || p.specialCooldown > 0}
                            className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all relative overflow-hidden ${!isPlayerTurn ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50' : p.specialCooldown === 0 ? 'bg-orange-950/40 border-orange-800 hover:bg-orange-900/60 hover:border-orange-600 text-orange-400 shadow-inner' : 'bg-slate-900 border-slate-800 text-slate-500 opacity-50'}`}
                        >
                            {p.specialCooldown > 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xl font-black">{p.specialCooldown}</div>}
                            <Target size={22} className="mb-1" />
                            <span className="text-[10px] font-bold">מחץ</span>
                        </button>

                        <button 
                            onClick={() => handleAction('defend')}
                            disabled={!isPlayerTurn}
                            className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${isPlayerTurn ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500 text-slate-300 shadow-inner' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'}`}
                        >
                            <Shield size={22} className="mb-1" />
                            <span className="text-[10px] font-bold">הגנה</span>
                        </button>
                    </div>

                    <div className="mt-3">
                        <button 
                            onClick={() => { audioSystem.sfxHeal(); dispatch({ type: 'HEAL_IN_BATTLE' }); }}
                            disabled={!isPlayerTurn || p.potions <= 0 || p.hp >= playerTotalMaxHp}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold text-sm ${(!isPlayerTurn || p.potions <= 0 || p.hp >= playerTotalMaxHp) ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50' : 'bg-emerald-950/50 border-emerald-800 hover:bg-emerald-900/60 hover:border-emerald-600 text-emerald-400 shadow-inner'}`}
                        >
                            <Heart size={18} className={p.potions > 0 && p.hp < playerTotalMaxHp ? 'animate-pulse' : ''} />
                            שתה שיקוי (נותרו: {p.potions})
                        </button>
                    </div>
                </div>

                {/* Combat Log (Bottom) */}
                <div className="h-44 bg-slate-950 border-t border-slate-800/80 p-3 overflow-y-auto hide-scrollbar z-20 scroll-smooth relative pointer-events-auto">
                    {/* Tiny gradient to indicate scroll */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none sticky z-10"></div>
                    <div className="space-y-2 flex flex-col-reverse">
                        {log.map((entry) => {
                            let bgClass = "bg-slate-900/50 border-slate-800/50 text-slate-300";
                            let icon = <Info size={14} className="text-slate-400 flex-shrink-0" />;

                            if (entry.type === 'attack') {
                                bgClass = "bg-rose-950/20 border-rose-900/30 text-rose-200";
                                icon = <Sword size={14} className="text-rose-400 flex-shrink-0" />;
                            } else if (entry.type === 'magic') {
                                bgClass = "bg-blue-950/20 border-blue-900/30 text-blue-200";
                                icon = <Zap size={14} className="text-blue-400 flex-shrink-0" />;
                            } else if (entry.type === 'danger') {
                                bgClass = "bg-red-950/30 border-red-900/50 text-red-200 font-medium";
                                icon = <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />;
                            } else if (entry.type === 'success') {
                                bgClass = "bg-emerald-950/30 border-emerald-900/50 text-emerald-200";
                                icon = <Sparkles size={14} className="text-emerald-400 flex-shrink-0" />;
                            } else if (entry.type === 'warning') {
                                bgClass = "bg-yellow-950/20 border-yellow-900/30 text-yellow-200";
                                icon = <Target size={14} className="text-yellow-500 flex-shrink-0" />;
                            }

                            return (
                                <div key={entry.id} className={`p-2 rounded-lg border text-sm flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${bgClass}`} dir="rtl">
                                    <div className="mt-0.5">{icon}</div>
                                    <span className="leading-snug">{entry.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default App;
