import React, { useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import ProgressBar from './components/ui/ProgressBar';
import FloatingCombatText from './components/ui/FloatingCombatText';
import ItemCard from './components/ui/ItemCard';
import MiningGame from './components/minigames/MiningGame';
import FishingGame from './components/minigames/FishingGame';
import { regions, campUpgrades, MINERALS, FISH_TYPES, ALCHEMY_RECIPES } from './utils/constants';
import { getUpgradeCost } from './utils/generators';
import { 
  Heart, Shield, Sword, Sparkles, Droplet, Skull, AlertTriangle,
  Coins, Map, Store, Zap, Target, ArrowDown, ArrowUp, Gem, 
  Activity, Info, X, ChevronRight, HelpCircle, Backpack,
  Volume2, VolumeX, Flame, ShoppingBag, Tent, Hammer, Box, ArrowRight,
  Sun, Moon, Scroll, Clock, Gift
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { audioSystem } from './utils/audio';

const RenderDynamicIcon = ({ name, size = 24, className = '' }) => {
    const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} />;
};

const App = () => {
    const [state, dispatch] = useGameState();
    const [isMuted, setIsMuted] = React.useState(audioSystem.muted);
    const { phase, player: p, enemy: ne, log, floatingTexts, lootData, shopInventory, eventData, pendingRing } = state;
    const currentRegion = regions[state.currentRegionIndex];
    const elementColors = { 'אש': 'text-orange-400 bg-orange-900/30 border-orange-700', 'מים': 'text-blue-400 bg-blue-900/30 border-blue-700', 'טבע': 'text-emerald-400 bg-emerald-900/30 border-emerald-700', 'רגיל': 'text-slate-400 bg-slate-800 border-slate-700' };

    let playerTotalStr = p.str + (p.meleeWeapon?.str || 0);
    let playerTotalMag = p.mag + (p.magicWeapon?.mag || 0);
    let playerTotalDef = p.def + (p.armor?.def || 0);
    let playerTotalMaxMp = p.baseMaxMp + (p.magicWeapon?.mpBonus || 0) + (p.armor?.mpBonus || 0);
    let playerTotalMaxHp = p.baseMaxHp + (p.ring1?.hpBonus || 0) + (p.ring2?.hpBonus || 0);

    if (state.activeBuffs) {
        state.activeBuffs.forEach(buff => {
            if (buff.type === 'str') playerTotalStr = Math.floor(playerTotalStr * (1 + buff.value));
            if (buff.type === 'def') playerTotalDef = Math.floor(playerTotalDef * (1 + buff.value));
            if (buff.type === 'all' || buff.type === 'allDmg') {
                playerTotalStr = Math.floor(playerTotalStr * (1 + buff.value));
                playerTotalMag = Math.floor(playerTotalMag * (1 + buff.value));
                playerTotalDef = Math.floor(playerTotalDef * (1 + buff.value));
            }
            if (buff.type === 'mithril_elixir') {
                playerTotalStr = Math.floor(playerTotalStr * (1 + buff.value));
                playerTotalDef = Math.floor(playerTotalDef * (1 + buff.value));
            }
        });
    }

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

    // Time & Quest Checker
    useEffect(() => {
        const interval = setInterval(() => {
            dispatch({ type: 'CHECK_TIME' });
        }, 5000);
        return () => clearInterval(interval);
    }, [dispatch]);

    // Handle generic button clicks for UI sound
    const playClick = () => audioSystem.sfxUIClick();

    const handleAction = (actionType) => {
        if (actionType === 'attack') audioSystem.sfxAttackMelee();
        if (actionType === 'magic') audioSystem.sfxAttackMagic();
        if (actionType === 'slam') audioSystem.sfxAttackHeavy();
        if (actionType === 'burst') audioSystem.sfxAttackMagic();
        if (actionType === 'defend') playClick();
        dispatch({ type: 'PLAYER_ACTION', payload: { actionType } });
    };

    const toggleMute = () => {
        setIsMuted(audioSystem.toggleMute());
    };

    const activeRegion = regions[state.currentRegionIndex] || regions[0];
    const bgRegionClass = `bg-region-${activeRegion.id}`;

    // Render Home Phase
    if (phase === 'home') {
        return (
            <div className={`w-full max-w-4xl mx-auto min-h-screen relative overflow-hidden ${bgRegionClass} p-6 md:p-10 flex flex-col pt-10 animate-in fade-in duration-500`} dir="rtl">
                
                {/* Ambient Background Glows - very subtle */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none animate-ambient-pulse"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-900/15 rounded-full blur-[120px] pointer-events-none animate-ambient-pulse" style={{ animationDelay: '2.5s' }}></div>

                <div className="text-center mb-12 relative z-10">
                    <button 
                        onClick={toggleMute} 
                        className="absolute right-0 top-0 text-slate-500 hover:text-slate-300 p-3 rounded-full glass-button transition-colors"
                        title={isMuted ? "הפעל סאונד" : "השתק סאונד"}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className="text-emerald-500" />}
                    </button>
                    <h1 className="text-4xl md:text-5xl font-semibold text-amber-400/90 mb-4 tracking-wide">RPG Quest</h1>
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-medium capitalize">
                        {state.timeSystem.isDay ? (
                            <span className="flex items-center gap-1 text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded-full text-xs border border-amber-700/30">
                                <Sun size={14} /> יום
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded-full text-xs border border-indigo-700/30">
                                <Moon size={14} /> לילה
                            </span>
                        )}
                        <span>•</span>
                        <span>הרפתקה אינסופית ממתינה לך</span>
                    </div>
                </div>

                <div className="glass-panel p-5 mb-6 relative overflow-hidden rounded-xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-900/15 rounded-full blur-3xl"></div>
                    
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-indigo-900/60 flex items-center justify-center text-2xl font-semibold text-indigo-200 border border-indigo-700/40">
                                {p.level}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-semibold text-slate-200 tracking-wide">הלוחם</h2>
                                    <span className="text-xs bg-indigo-950/60 text-indigo-300/80 px-2 py-0.5 rounded border border-indigo-800/40 font-medium">עולם {state.worldLevel || 1}</span>
                                </div>
                                <div className="text-sm font-medium text-amber-400/90 flex items-center gap-1.5 w-fit">
                                    <Coins size={13} /> {p.gold.toLocaleString()} זהב
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10 w-full md:w-5/6">
                        <ProgressBar current={p.hp} max={playerTotalMaxHp} colorClass="bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.4)]" label="חיים" />
                        <ProgressBar current={p.mp} max={playerTotalMaxMp} colorClass="bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.4)]" label="מאנה" />
                        <ProgressBar current={p.xp} max={p.level * 50} colorClass="bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(5,150,105,0.4)]" label="ניסיון" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5 text-sm font-medium relative z-10 border-t border-white/5 pt-4">
                        <div className="flex flex-col items-center justify-center text-rose-300/80 gap-1">
                            <Sword size={16} className="opacity-60" />
                            <span>{playerTotalStr} התקפה</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-blue-300/80 gap-1">
                            <Zap size={16} className="opacity-60" />
                            <span>{playerTotalMag} קסם</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                            <Shield size={16} className="opacity-60" />
                            <span>{playerTotalDef} הגנה</span>
                        </div>
                    </div>
                </div>

                {/* Active Buffs (Home View) */}
                {state.activeBuffs && state.activeBuffs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                        {state.activeBuffs.map((buff, i) => (
                            <div key={i} className="bg-indigo-900/60 text-indigo-200 px-3 py-1.5 rounded-full text-xs font-bold font-outfit border border-indigo-700/50 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                                <span className="flex items-center text-indigo-300 opacity-90"><RenderDynamicIcon name={buff.icon || 'Star'} size={14} /></span> 
                                <span className="tracking-wide text-indigo-100">{buff.name}</span>
                                <span className="opacity-60 ml-1 text-[10px] font-sans">({buff.battlesLeft} הקרבות)</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-4 gap-3 mb-6">
                    <button onClick={() => { playClick(); dispatch({ type: 'EXPLORE' }); }} className="col-span-2 relative overflow-hidden group glass-button border border-indigo-700/30 text-white font-semibold py-5 px-3 rounded-xl transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2">
                        <Map size={26} className="text-indigo-300/80" />
                        <span className="text-sm tracking-wide text-slate-200">זירת קרב</span>
                    </button>
                    
                    <button onClick={() => { playClick(); dispatch({ type: 'GO_SHOP' }); }} className="glass-button text-slate-300 py-4 px-3 rounded-xl group flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all">
                        <Store size={22} className="text-emerald-400/80" />
                        <span className="text-xs font-medium text-slate-400">חנות</span>
                    </button>
                    
                    <button onClick={() => { playClick(); dispatch({ type: 'GO_CAMP' }); }} className="glass-button text-slate-300 py-4 px-3 rounded-xl group flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all">
                        <Tent size={22} className="text-amber-400/80" />
                        <span className="text-xs font-medium text-slate-400">מחנה</span>
                    </button>

                    <button onClick={() => { playClick(); dispatch({ type: 'SET_PHASE', payload: 'quests' }); }} className="col-span-2 glass-button text-slate-300 py-3 px-3 rounded-xl group flex items-center justify-center gap-3 active:scale-[0.98] transition-all relative">
                        {state.quests.active.some(q => q.completed && !q.claimed) && (
                            <span className="absolute top-2 right-2 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                        )}
                        <Scroll size={18} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-300">משימות יומיות</span>
                    </button>
                </div>

                {/* World Map - Region Selector */}
                <div className="glass-panel p-4 rounded-xl mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-slate-400 text-sm font-medium tracking-wider uppercase flex items-center gap-2">
                            <Map size={14} className="text-slate-500" /> מפת העולם
                        </h3>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            רמת עולם {state.worldLevel || 1}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {regions.map((region, idx) => {
                            const unlocked = idx <= state.highestRegionUnlocked;
                            const isActive = idx === state.currentRegionIndex;
                            const elemCls = elementColors[region.element] || elementColors['רגיל'];
                            
                            return (
                                <button 
                                    key={region.id}
                                    onClick={() => { playClick(); dispatch({ type: 'SELECT_REGION', payload: { index: idx } }); }}
                                    disabled={!unlocked}
                                    className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-lg border transition-all overflow-hidden ${
                                        !unlocked ? 'bg-slate-950/50 border-slate-800/30 text-slate-600 opacity-40 cursor-not-allowed grayscale' :
                                        isActive ? `border ${elemCls} bg-white/[0.03] scale-[1.01] z-10` :
                                        'border-slate-800/50 text-slate-400 hover:border-slate-600/50 hover:bg-white/[0.02]'
                                    }`}
                                >
                                    {isActive && <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>}
                                    
                                    {!unlocked && <span className="text-2xl drop-shadow-md opacity-30 text-slate-700"><LucideIcons.Lock size={28} /></span>}
                                    {unlocked && <span className="text-slate-300 drop-shadow-lg transform transition-transform group-hover:scale-110 mb-1">{idx === 0 ? <LucideIcons.TreePine size={28} /> : idx === 1 ? <LucideIcons.MountainSnow size={28} /> : <LucideIcons.Snowflake size={28} />}</span>}
                                    
                                    <span className={`text-center leading-tight text-xs font-medium ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{region.name}</span>
                                    
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium tracking-wider ${elemCls}`}>{region.element}</span>
                                    
                                    {isActive && (
                                        <div className="absolute -top-1.5 -right-1.5">
                                            <span className="relative flex h-4 w-4">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                                            </span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

               {/* Equipment Preview (Simple) */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs opacity-80">
                   <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                       <span className="text-slate-400">נשק:</span>
                       <span className={p.meleeWeapon?.rarity?.colorClass || 'text-slate-500'}>{p.meleeWeapon?.name || 'אין פריט'}</span>
                   </div>
                   <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                       <span className="text-slate-400">שריון:</span>
                       <span className={p.armor?.rarity?.colorClass || 'text-slate-500'}>{p.armor?.name || 'אין פריט'}</span>
                   </div>
                </div>

                <div className="text-center mt-6">
                     <button onClick={() => { localStorage.removeItem('rpg_quest_save_v3'); dispatch({ type: 'RESET_GAME' }); }} className="text-slate-600 text-xs hover:text-rose-400 transition-colors">
                        אפס שמירה ותתחיל מחדש
                    </button>
                </div>
            </div>
        );
    }

    // Render Event Phase
    if (phase === 'event') {
        const isBad = eventData.type === 'trap' || eventData.type === 'death';
        const isMerchant = eventData.type === 'merchant';
        const isTraveler = eventData.type === 'traveler';
        return (
            <div className={`w-full max-w-2xl mx-auto min-h-screen ${bgRegionClass} p-6 flex flex-col justify-center items-center text-center`} dir="rtl">
                <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center mb-8 shadow-2xl ${isBad ? 'bg-rose-950/50 shadow-rose-900/50' : 'bg-emerald-950/50 shadow-emerald-900/50'}`}>
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

                {eventData.type === 'treasure' && eventData.gold > 0 && (
                    <div className="flex items-center justify-center gap-3 text-3xl font-black text-yellow-400 mb-10 bg-yellow-900/20 py-4 px-8 rounded-2xl border-2 border-yellow-600/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <Coins size={36} className="animate-pulse" />
                        +{eventData.gold} זהב
                    </div>
                )}

                {isMerchant && (
                    <div className="flex gap-3 mb-8 w-full max-w-xs">
                        <button 
                            onClick={() => { audioSystem.sfxGold(); dispatch({ type: 'EVENT_MERCHANT_BUY' }); }}
                            disabled={p.gold < 50}
                            className={`flex-1 py-4 rounded-xl font-bold border transition-all ${p.gold >= 50 ? 'bg-yellow-800/40 border-yellow-600 text-yellow-300 hover:bg-yellow-700/50' : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'}`}
                        >
                            <ShoppingBag size={18} className="mx-auto mb-1" />
                            קנה סוד (50 זהב)
                        </button>
                        <button 
                            onClick={() => { playClick(); dispatch({ type: 'CLOSE_EVENT' }); }}
                            className="flex-1 py-4 rounded-xl font-bold border bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        >
                            סרב
                        </button>
                    </div>
                )}

                {isTraveler && (
                    <div className="flex gap-3 mb-8 w-full max-w-xs">
                        <button 
                            onClick={() => { audioSystem.sfxHeal(); dispatch({ type: 'EVENT_HELP_TRAVELER' }); }}
                            disabled={p.potions <= 0}
                            className={`flex-1 py-4 rounded-xl font-bold border transition-all ${p.potions > 0 ? 'bg-emerald-900/40 border-emerald-700 text-emerald-300 hover:bg-emerald-800/50' : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'}`}
                        >
                            <Heart size={18} className="mx-auto mb-1" />
                            תן שיקוי ({p.potions})
                        </button>
                        <button 
                            onClick={() => { playClick(); dispatch({ type: 'CLOSE_EVENT' }); }}
                            className="flex-1 py-4 rounded-xl font-bold border bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                        >
                            התעלם
                        </button>
                    </div>
                )}

                {!isMerchant && !isTraveler && (
                    <button 
                        onClick={() => { playClick(); dispatch({ type: 'CLOSE_EVENT' }); }}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-12 rounded-xl transition-colors border border-slate-700 w-full max-w-xs"
                    >
                        המשך
                    </button>
                )}

                {floatingTexts.map(t => (
                    <FloatingCombatText key={t.id} text={t.text} type={t.type} elemMult={t.elemMult || 1} onAnimationEnd={() => dispatch({ type: 'REMOVE_FLOATING_TEXT', payload: { id: t.id } })} />
                ))}
            </div>
        );
    }

    // Render Shop Phase
    if (phase === 'shop') {
        return (
            <div className="w-full max-w-4xl mx-auto h-[100dvh] overflow-hidden bg-shop p-6 md:p-8 flex flex-col pt-12 animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h2 className="text-2xl font-semibold text-slate-200 flex items-center gap-2.5">
                        <Store className="text-emerald-400/80" size={22} /> חנות ציוד
                    </h2>
                    <div className="flex items-center gap-2 text-amber-400/90">
                        <Coins size={16} />
                        <span className="font-medium text-lg">{p.gold.toLocaleString()}</span>
                    </div>
                </div>

                {/* Potions */}
                <div className="glass-panel p-4 mb-6 flex justify-between items-center rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg text-rose-400/80 border border-rose-900/40">
                            <Heart size={20} />
                        </div>
                        <div>
                            <div className="font-medium text-slate-200">שיקוי ריפוי</div>
                            <div className="text-xs text-slate-500 mt-0.5">מרפא 40% חיים</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-400">יש לך: <span className="text-slate-200">{p.potions}</span></div>
                        <button 
                            onClick={() => { audioSystem.sfxGold(); dispatch({ type: 'BUY_ITEM', payload: { type: 'potion', item: { cost: 15 } } }); }}
                            disabled={p.gold < 15}
                            className={`px-4 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all active:scale-[0.98] ${p.gold >= 15 ? 'bg-emerald-800/60 hover:bg-emerald-700/60 text-emerald-200 border border-emerald-700/50' : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 grayscale'}`}
                        >
                            15 <Coins size={13} />
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-xs font-medium tracking-widest text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <Shield size={12} /> הציוד הנוכחי שלך
                    </h3>
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x relative" dir="rtl">
                        <div className="w-52 flex-shrink-0 snap-center"><ItemCard item={p.meleeWeapon} isEquipped={true} /></div>
                        <div className="w-52 flex-shrink-0 snap-center"><ItemCard item={p.magicWeapon} isEquipped={true} /></div>
                        <div className="w-52 flex-shrink-0 snap-center"><ItemCard item={p.armor} isEquipped={true} /></div>
                        {p.ring1 && <div className="w-52 flex-shrink-0 snap-center"><ItemCard item={p.ring1} isEquipped={true} /></div>}
                        {p.ring2 && <div className="w-52 flex-shrink-0 snap-center"><ItemCard item={p.ring2} isEquipped={true} /></div>}
                    </div>
                </div>

                <h3 className="text-xs font-medium tracking-widest text-slate-500 uppercase mb-3 relative z-10 flex items-center gap-2">
                    <Sparkles size={12} /> ציוד למכירה <span className="text-slate-600 normal-case tracking-normal">רמה {p.level}</span>:
                </h3>
                
                <div className="flex-1 min-h-0 relative z-10">
                    <div className="absolute inset-0 overflow-y-auto hide-scrollbar pb-32 pt-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                            {Object.entries(shopInventory).map(([type, item]) => item && (
                                <ItemCard 
                                    key={type} 
                                    item={item} 
                                    onAction={(t, i) => { audioSystem.sfxGold(); dispatch({ type: 'BUY_ITEM', payload: { type: t, item: i } }); }}
                                    actionText={<span className="font-outfit text-base flex items-center gap-1.5">{item.cost.toLocaleString()} <Coins size={16}/></span>}
                                    disabled={p.gold < item.cost}
                                    actionButtonClass={p.gold >= item.cost ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg border border-amber-500/50' : 'bg-slate-800/80 text-slate-500 border border-slate-700 grayscale'}
                                />
                            ))}
                        </div>
                        {!Object.values(shopInventory).some(i => i) && (
                            <div className="w-full text-center text-slate-400 py-12 glass-panel rounded-3xl mt-4 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3">
                                <Store size={48} className="text-slate-600 mb-2 opacity-50" />
                                <span className="font-outfit text-lg tracking-wide">קנית הכל!</span>
                                <span className="text-sm">ציוד חדש יגיע כשתעלה רמה.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-4 absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-20 pointer-events-none">
                    <button
                        onClick={() => { playClick(); dispatch({ type: 'LEAVE_SHOP' }); }}
                        className="w-full max-w-sm mx-auto block glass-button text-slate-400 font-medium py-3 rounded-xl border border-white/5 transition-all pointer-events-auto active:scale-[0.98]"
                    >
                        חזור
                    </button>
                </div>
            </div>
        );
    }

    // Render Camp Phase
    if (phase === 'camp') {
        const tentLvl = state.camp.tentLevel;
        const bsLvl = state.camp.blacksmithLevel;
        const nextTent = campUpgrades.tent.find(t => t.level === tentLvl + 1);
        const nextBs = campUpgrades.blacksmith.find(b => b.level === bsLvl + 1);
        const currentTent = campUpgrades.tent.find(t => t.level === tentLvl);
        const currentBs = campUpgrades.blacksmith.find(b => b.level === bsLvl);

        return (
            <div className="w-full max-w-4xl mx-auto h-[100dvh] overflow-hidden bg-camp p-5 md:p-8 flex flex-col pt-10 animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 className="text-2xl font-semibold text-slate-200 flex items-center gap-2.5">
                        <Tent className="text-amber-400/80" size={22} /> המחנה
                    </h2>
                    <div className="flex items-center gap-2 text-amber-400/90">
                        <Coins size={15} />
                        <span className="font-medium">{p.gold.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex-1 min-h-0 relative">
                    <div className="absolute inset-0 overflow-y-auto hide-scrollbar pb-32 space-y-4">
                        
                        {/* Tent */}
                        <div className="glass-panel border-dashed border-emerald-900/40 rounded-3xl p-5 relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-3 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 p-3 rounded-2xl text-emerald-400 border border-emerald-800/50 shadow-inner">
                                        <Heart size={28} className="drop-shadow-md group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-100 text-xl font-outfit tracking-wide flex items-center gap-2">אוהל מרפא <span className="bg-emerald-900/50 text-emerald-300 text-[11px] px-2 py-0.5 rounded-md border border-emerald-700/50">רמה {tentLvl}</span></div>
                                        <div className="text-xs font-medium text-emerald-400/80 mt-1">שיקויים מרפאים {Math.floor(currentTent.healPercent * 100)}% חיים</div>
                                    </div>
                                </div>
                                {nextTent ? (
                                    <button 
                                        onClick={() => { audioSystem.sfxGold(); dispatch({ type: 'UPGRADE_TENT' }); }}
                                        disabled={p.gold < nextTent.cost}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${p.gold >= nextTent.cost ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-500/50' : 'bg-slate-800 text-slate-500 border border-slate-700 grayscale'}`}
                                    >
                                        שדרג <ArrowUp size={16}/> <span className="font-outfit text-base">{nextTent.cost.toLocaleString()}</span> <Coins size={16} />
                                    </button>
                                ) : (
                                    <span className="text-xs font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-800/50 px-3 py-1.5 rounded-xl shadow-inner">רמה מקסימלית</span>
                                )}
                            </div>
                            {nextTent && <div className="text-xs text-slate-500 mt-2">שדרוג יעלה את הריפוי ל-<span className="text-emerald-400 font-bold">{Math.floor(nextTent.healPercent * 100)}%</span></div>}
                            
                            {/* Sleep Button (Only at night) */}
                            {!state.timeSystem.isDay && (
                                <button 
                                    onClick={() => { audioSystem.sfxHeal(); dispatch({ type: 'SLEEP_CAMP' }); }}
                                    className="w-full mt-5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 hover:from-indigo-900/70 hover:to-purple-900/70 text-indigo-300 font-bold font-outfit tracking-wide py-3.5 rounded-2xl border border-indigo-700/50 flex items-center justify-center gap-2 transition-all shadow-inner active:scale-95 group"
                                >
                                    <Moon size={20} className="group-hover:-rotate-12 transition-transform drop-shadow-md text-indigo-400" /> <span className="group-hover:text-white transition-colors">לישון עד הבוקר (מרפא הכל)</span>
                                </button>
                            )}
                        </div>

                        {/* Blacksmith */}
                        <div className="glass-panel border-dashed border-orange-900/40 rounded-3xl p-5 relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-5 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 p-3 rounded-2xl text-orange-400 border border-orange-800/50 shadow-inner">
                                        <Hammer size={28} className="drop-shadow-md group-hover:-rotate-12 transition-transform" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-100 text-xl font-outfit tracking-wide flex items-center gap-2">שולחן נפח <span className="bg-orange-900/50 text-orange-300 text-[11px] px-2 py-0.5 rounded-md border border-orange-700/50">רמה {bsLvl}</span></div>
                                        <div className="text-xs font-medium text-orange-400/80 mt-1">הוזלה של {Math.floor(currentBs.discount * 100)}% בשדרוג פריטים</div>
                                    </div>
                                </div>
                                {nextBs ? (
                                    <button 
                                        onClick={() => { audioSystem.sfxGold(); dispatch({ type: 'UPGRADE_BLACKSMITH' }); }}
                                        disabled={p.gold < nextBs.cost}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${p.gold >= nextBs.cost ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-500/50' : 'bg-slate-800 text-slate-500 border border-slate-700 grayscale'}`}
                                    >
                                        שדרג <ArrowUp size={16}/> <span className="font-outfit text-base">{nextBs.cost.toLocaleString()}</span> <Coins size={16} />
                                    </button>
                                ) : (
                                    <span className="text-xs font-bold text-orange-300 bg-orange-950/50 border border-orange-800/50 px-3 py-1.5 rounded-xl shadow-inner">רמה מקסימלית</span>
                                )}
                            </div>

                            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-inner">
                                <h4 className="text-sm font-bold font-outfit tracking-wide text-slate-400 mb-3 flex items-center gap-2"><Sparkles size={16} className="text-slate-500"/> שדרוג נשק, שריון וקמעות:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {['melee', 'magic', 'armor', 'ring1', 'ring2'].map(type => {
                                        let item = null;
                                        if (type === 'melee') item = p.meleeWeapon;
                                        if (type === 'magic') item = p.magicWeapon;
                                        if (type === 'armor') item = p.armor;
                                        if (type === 'ring1') item = p.ring1;
                                        if (type === 'ring2') item = p.ring2;
                                        if (!item) return null;
                                        
                                        const upgCost = getUpgradeCost(item, currentBs.discount);
                                        return (
                                            <div key={type} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2.5 text-center text-xs relative flex flex-col items-center shadow-sm">
                                                <div className="mb-3 w-full"><ItemCard item={item} hideAction={true} /></div>
                                                <button
                                                    onClick={() => { audioSystem.sfxEquip(); dispatch({ type: 'UPGRADE_ITEM', payload: { type } }); }}
                                                    disabled={p.gold < upgCost}
                                                    className={`w-full py-2.5 rounded-lg text-xs font-bold font-outfit tracking-wide mt-auto flex justify-center items-center gap-1.5 transition-all shadow-md active:scale-95 ${p.gold >= upgCost ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/50 text-indigo-300 hover:from-indigo-600/50 hover:to-purple-600/50 hover:text-white' : 'bg-slate-800/50 border border-slate-700/50 text-slate-500 grayscale'}`}
                                                >
                                                    לשדרג ({upgCost.toLocaleString()} <Coins size={12}/>)
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Stash */}
                        <div className="glass-panel border-dashed border-purple-900/40 rounded-3xl p-5 group relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-5 relative z-10">
                                <div className="bg-gradient-to-br from-purple-900/50 to-fuchsia-900/50 p-3 rounded-2xl text-purple-400 border border-purple-800/50 shadow-inner">
                                    <Box size={28} className="drop-shadow-md group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="font-bold text-slate-100 text-xl font-outfit tracking-wide flex items-center gap-2">תיבת אחסון <span className="bg-purple-900/50 text-purple-300 text-[12px] px-2 py-0.5 rounded-md border border-purple-700/50 font-sans">{state.camp.stash.length} מופקדים</span></div>
                            </div>
                            
                            {state.camp.stash.length === 0 ? (
                                <div className="text-center text-slate-400 py-8 border border-dashed border-white/10 rounded-2xl bg-black/20 text-sm backdrop-blur-md shadow-inner flex flex-col justify-center items-center gap-2 max-w-sm mx-auto">
                                   <Box size={32} className="text-slate-600 mb-1 opacity-50"/>
                                    התיבה ריקה.<br/>אפשר לאחסן כאן פריטים שמצאת בדרך במקום למכור אותם מיד.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                    {state.camp.stash.map((item, idx) => (
                                        <div key={idx} className="relative group/item">
                                            <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl scale-105 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none"></div>
                                            <ItemCard 
                                                item={item} 
                                                onAction={() => dispatch({ type: 'EQUIP_FROM_STASH', payload: { itemIndex: idx } })}
                                                actionText={<span className="font-outfit text-sm">הצטייד</span>}
                                                actionButtonClass="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md border border-emerald-500/50 active:scale-95 mb-3"
                                            />
                                            <button 
                                                onClick={() => { audioSystem.sfxGold(); dispatch({ type: 'SELL_FROM_STASH', payload: { itemIndex: idx } }); }}
                                                className="w-full mt-3 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-rose-300 font-bold font-outfit tracking-wide py-2.5 rounded-xl border border-slate-700/50 flex justify-center items-center gap-1.5 transition-all outline-none focus:ring-2 focus:ring-rose-500/50"
                                            >
                                                <span>מכור ({Math.floor(item.cost * 0.3).toLocaleString()})</span> <Coins size={12}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <div className="mt-auto pt-6 absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-20 pointer-events-none">
                    <button 
                        onClick={() => { playClick(); dispatch({ type: 'LEAVE_CAMP' }); }}
                        className="w-full max-w-sm mx-auto block glass-button hover:bg-indigo-900/40 text-indigo-100 hover:text-white font-bold font-outfit tracking-wide py-4 rounded-2xl border border-indigo-500/30 transition-all shadow-xl pointer-events-auto active:scale-95 flex justify-center items-center gap-2 group"
                    >
                        חזור להרפתקה <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    // Render Loot Phase
    if (phase === 'loot' && lootData) {
        return (
            <div className={`w-full max-w-2xl mx-auto min-h-screen ${bgRegionClass} p-6 flex flex-col justify-center animate-in zoom-in-95 duration-500`} dir="rtl">
                <div className="text-center mb-10 relative z-10">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-900/40 to-amber-900/40 rounded-[2rem] flex items-center justify-center mb-6 border border-yellow-500/30 relative shadow-[0_0_30px_rgba(245,158,11,0.2)] rotate-3">
                        <div className="absolute inset-0 bg-yellow-400 animate-pulse rounded-[2rem] opacity-20 blur-xl"></div>
                        <Sparkles size={40} className="text-yellow-400 relative z-10 drop-shadow-md" />
                    </div>
                    <h2 className="text-4xl font-black font-outfit text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-sm tracking-wide">
                        מצאת שלל!
                    </h2>
                </div>

                <div className="mb-10 relative z-10">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl -z-10 rounded-full"></div>
                    <ItemCard item={lootData} />
                </div>

                <div className="space-y-4 relative z-10">
                    <button 
                        onClick={() => { audioSystem.sfxEquip(); dispatch({ type: 'EQUIP_LOOT' }); }}
                        className="w-full max-w-md mx-auto relative overflow-hidden group bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold font-outfit tracking-wide py-4.5 rounded-2xl border border-emerald-500/50 shadow-lg active:scale-95 transition-all block"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative z-10 flex justify-center items-center gap-2 text-lg">
                            הצטייד והמשך <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <div className="flex gap-3 max-w-md mx-auto">
                        <button 
                            onClick={() => { playClick(); dispatch({ type: 'STASH_ITEM', payload: { from: 'loot', type: lootData.type } }); }}
                            className="flex-1 glass-button bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 font-bold font-outfit tracking-wide py-4 rounded-xl border border-purple-700/50 transition-all flex justify-center items-center gap-1.5 shadow-md active:scale-95"
                        >
                            <Box size={18} />
                            שלח לאחסון <span className="text-[10px] text-purple-400 border border-purple-800 bg-purple-950 px-1 rounded absolute top-1 left-1 opacity-80">(+5 <Coins size={8} className="inline text-yellow-500"/>)</span>
                        </button>
                        
                        <button 
                            onClick={() => { audioSystem.sfxGold(); dispatch({ type: 'LEAVE_LOOT' }); }}
                            className="flex-1 glass-button bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 font-bold font-outfit tracking-wide py-4 rounded-xl border border-slate-700/50 transition-all flex justify-center items-center gap-1.5 shadow-md active:scale-95"
                        >
                            <Coins size={18} className="text-yellow-500" />
                            מכור <span className="opacity-70 font-sans text-sm">({Math.floor(lootData.cost * 0.3)})</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render Ring Replace Phase
    if (phase === 'ring_replace' && pendingRing) {
        const isFromStash = state.pendingRingAction === 'stash';
        return (
            <div className={`w-full max-w-md mx-auto min-h-screen ${bgRegionClass} p-6 flex flex-col justify-center animate-in fade-in duration-300`} dir="rtl">
                <h2 className="text-3xl font-black font-outfit text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 drop-shadow-sm">בחר איזו טבעת להחליף</h2>
                <p className="text-slate-400 text-center mb-8 text-sm">איזו טבעת תרצה להחליף ב-<span className="font-bold text-slate-200">{pendingRing.name}</span>?</p>

                {/* New ring preview */}
                <div className="mb-8 border border-indigo-500/30 rounded-3xl p-4 bg-indigo-950/20 backdrop-blur-md relative shadow-[0_0_30px_rgba(79,70,229,0.15)] group">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-indigo-200 bg-indigo-900 border border-indigo-700 px-3 py-1 rounded-full shadow-md z-10 whitespace-nowrap">טבעת חדשה</div>
                    <ItemCard item={pendingRing} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex flex-col gap-3">
                        <div className="text-xs font-bold text-slate-400 bg-slate-900/50 border border-slate-800 py-1.5 rounded-lg text-center font-outfit tracking-wide">טבעת 1</div>
                        <ItemCard 
                            item={p.ring1} 
                            onAction={() => dispatch({ type: 'CONFIRM_REPLACE_RING', payload: { slot: 1 } })}
                            actionText={<span className="font-outfit tracking-wide">החלף בזו</span>}
                            actionButtonClass="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-md active:scale-95 border border-rose-500/50"
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="text-xs font-bold text-slate-400 bg-slate-900/50 border border-slate-800 py-1.5 rounded-lg text-center font-outfit tracking-wide">טבעת 2</div>
                        <ItemCard 
                            item={p.ring2} 
                            onAction={() => dispatch({ type: 'CONFIRM_REPLACE_RING', payload: { slot: 2 } })}
                            actionText={<span className="font-outfit tracking-wide">החלף בזו</span>}
                            actionButtonClass="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-md active:scale-95 border border-rose-500/50"
                        />
                    </div>
                </div>

                <button 
                    onClick={() => dispatch({ type: 'CANCEL_REPLACE_RING' })}
                    className="w-full glass-button hover:bg-slate-800 text-slate-300 font-bold font-outfit tracking-wide py-4.5 rounded-2xl border border-slate-700/50 transition-all shadow-xl active:scale-95"
                >
                    {isFromStash ? 'ביטול (חזור לאחסון)' : 'בטל (הטבעת תימכר)'}
                </button>
            </div>
        );
    }

    // Render Battle Phase
    if (phase === 'battle') {
        const isPlayerTurn = state.turn === 'player';
        
        // Compute if player recently took damage to shake screen
        const hasTakenDamage = state.enemyAttacking && state.turn === 'enemy';

        const MOB_IMAGES = {
            // General / Night
            'שד אפל': '/assets/bg/dark_demon.png',
            'גריפון זועם': '/assets/bg/griffon.png',
            'נמר צל': '/assets/bg/shadow_tiger.png',
            
            // Forest
            'זאב בלהות': '/assets/bg/dire_wolf.png',
            'גובלין סורר': '/assets/bg/goblin.png',
            'עכביש ענק': '/assets/bg/giant_spider.png',
            'שדון יער': '/assets/bg/forest_imp.png',
            'טרול מעמקים': '/assets/bg/deep_troll.png',
            'אלון עתיק מושחת': '/assets/bg/corrupted_oak.png', // Boss
            
            // Volcano
            'כלב אש': '/assets/bg/fire_hound.png',
            'גולם לבה': '/assets/bg/magma_golem.png',
            'לוחם אפר': '/assets/bg/ash_warrior.png',
            'סלמנדרה': '/assets/bg/salamander.png',
            'רוח אש מתפרצת': '/assets/bg/fire_spirit.png',
            'שדון האש הגדול': '/assets/bg/fire_demon_boss.png', // Boss
            
            // The Dark Lake
            'חייל טבוע': '/assets/bg/drowned_soldier.png',
            'שומרת האגם': '/assets/bg/lake_siren.png',
            'סרטן אימה': '/assets/bg/horror_crab.png',
            'ריר רעיל': '/assets/bg/toxic_ooze.png',
            'זוחל ממעמקים': '/assets/bg/deep_crawler.png',
            'לוויתן הצללים': '/assets/bg/shadow_leviathan.png' // Boss
        };
        const getMobImage = (name) => {
            if (!name) return null;
            const cleanName = name.replace('[לילה] ', '');
            return MOB_IMAGES[cleanName] || null;
        };

        return (
            <div className={`w-full max-w-4xl mx-auto min-h-screen ${bgRegionClass} flex flex-col relative overflow-hidden ${hasTakenDamage ? 'animate-intense-shake' : ''}`} dir="rtl">
                {/* Static background gradient - never changes, no flash */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(30,20,40,0.5),_transparent)] z-0"></div>
                {/* Damage Flash - independent overlay, fades in/out smoothly */}
                <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-150 ${hasTakenDamage ? 'opacity-100 bg-red-900/25' : 'opacity-0'}`}></div>
                {state.lastHitCrit && <div className="absolute inset-0 bg-yellow-900/10 pointer-events-none z-0 transition-opacity duration-300"></div>}

                {/* Floating Texts container relative positioning area */}
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex justify-center items-center">
                    {floatingTexts.map(t => (
                        <FloatingCombatText key={t.id} text={t.text} type={t.type} elemMult={t.elemMult || 1} onAnimationEnd={() => dispatch({ type: 'REMOVE_FLOATING_TEXT', payload: { id: t.id } })} />
                    ))}
                </div>

                {/* Active Buffs (Battle View) */}
                {state.activeBuffs && state.activeBuffs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 justify-center w-full max-w-sm mx-auto mt-4 relative z-10">
                        {state.activeBuffs.map((buff, i) => (
                            <div key={i} className="bg-indigo-950/80 text-indigo-200 px-3 py-1.5 rounded-full text-[11px] font-bold font-outfit border border-indigo-700/50 flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                                <span className="flex items-center text-indigo-400 opacity-90"><RenderDynamicIcon name={buff.icon || 'Star'} size={14} /></span> 
                                <span className="tracking-wide text-indigo-100">{buff.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Enemy Area (Top half) */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent">
                    {ne && (
                        <div className={`text-center transition-all w-full max-w-xs mx-auto ${state.enemyAttacking ? 'animate-enemy-attack' : ''} ${state.turn === 'player' && !isPlayerTurn ? 'animate-shake' : ''}`}>
                            <div className="flex justify-center mb-6">
                                <div className="text-9xl filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] relative group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-purple-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <span className="relative z-10 flex justify-center items-center group-hover:scale-105 transition-transform duration-500 text-slate-200 will-change-transform drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                                        {getMobImage(ne.name) ? (
                                            <>
                                                <img src={getMobImage(ne.name)} alt={ne.name} className="w-56 h-56 md:w-80 md:h-80 lg:w-[400px] lg:h-[400px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-10 relative transition-all duration-300" 
                                                     onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                                <div style={{ display: 'none' }}>
                                                    <RenderDynamicIcon name={ne.icon || 'Skull'} size={110} />
                                                </div>
                                            </>
                                        ) : (
                                            <RenderDynamicIcon name={ne.icon || 'Skull'} size={110} />
                                        )}
                                    </span>
                                    {ne.isBoss && <div className="absolute -top-6 -right-6 bg-gradient-to-br from-rose-900 to-rose-950 text-xs px-3 py-1.5 rounded-sm text-rose-300 font-bold font-cinzel tracking-wider border border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.4)] animate-pulse-slow">בוס נבחר</div>}
                                    {ne.stunTurns > 0 && <div className="absolute top-0 -left-6 max-w-none animate-spin filter drop-shadow-lg text-amber-500"><LucideIcons.Loader size={32} /></div>}
                                </div>
                            </div>
                            
                            <div className="glass-panel p-5 rounded-3xl relative mt-4">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-950 text-sm px-4 py-1.5 rounded-xl border border-slate-700 font-bold font-outfit text-slate-200 whitespace-nowrap shadow-lg flex items-center gap-2">
                                    <span className="text-amber-400">רמה {ne.level}</span> <span className="text-slate-600">|</span> {ne.name}
                                </div>
                                <div className="mt-4">
                                    <ProgressBar current={ne.hp} max={ne.maxHp} colorClass="bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.3)]" label="חיים" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Player Area (Middle) */}
                <div className="p-5 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-4 mb-5 max-w-md mx-auto">
                       <div className="w-14 h-14 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl flex items-center justify-center text-indigo-300 font-black font-outfit text-xl border-2 border-indigo-700/50 shadow-inner">ר{p.level}</div>
                       <div className="flex-1 space-y-3 mt-1.5">
                           <ProgressBar current={p.hp} max={playerTotalMaxHp} colorClass="bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" label="חיים" />
                           <ProgressBar current={p.mp} max={playerTotalMaxMp} colorClass="bg-gradient-to-r from-blue-500 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" label="מאנה" />
                       </div>
                    </div>

                    {/* Combat Actions - 2x2 grid + skills */}
                    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                        <button 
                            onClick={() => handleAction('attack')}
                            disabled={!isPlayerTurn}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${isPlayerTurn ? 'bg-rose-950/40 border-rose-800/50 hover:bg-rose-900/60 hover:border-rose-500 text-rose-300 shadow-inner hover:shadow-[0_0_15px_rgba(225,29,72,0.2)] active:scale-95' : 'bg-slate-900/50 border-slate-800/50 text-slate-600 opacity-50 grayscale'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Sword size={26} className="mb-2 drop-shadow-md group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold font-outfit tracking-wide">התקפה</span>
                        </button>
                        
                        <button 
                            onClick={() => handleAction('magic')}
                            disabled={!isPlayerTurn || p.mp < 15}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${!isPlayerTurn ? 'bg-slate-900/50 border-slate-800/50 text-slate-600 opacity-50 grayscale' : p.mp >= 15 ? 'bg-blue-950/40 border-blue-800/50 hover:bg-blue-900/60 hover:border-blue-500 text-blue-300 shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] active:scale-95' : 'bg-slate-900/50 border-slate-800/50 text-slate-500 opacity-50 grayscale'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Zap size={26} className="mb-2 drop-shadow-md group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold font-outfit tracking-wide">קסם <span className="opacity-70">(15)</span></span>
                        </button>

                        <button 
                            onClick={() => handleAction('slam')}
                            disabled={!isPlayerTurn || p.slamCooldown > 0}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${!isPlayerTurn ? 'bg-slate-900/50 border-slate-800/50 text-slate-600 opacity-50 grayscale' : p.slamCooldown === 0 ? 'bg-orange-950/40 border-orange-800/50 hover:bg-orange-900/60 hover:border-orange-500 text-orange-400 shadow-inner hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] active:scale-95' : 'bg-slate-900/50 border-slate-800/50 text-slate-600 opacity-60 grayscale'}`}
                        >
                            {p.slamCooldown > 0 && <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center text-3xl font-black font-outfit text-orange-500">{p.slamCooldown}</div>}
                            <Target size={26} className={`mb-2 drop-shadow-md ${p.slamCooldown === 0 ? 'group-hover:scale-110 transition-transform' : ''}`} />
                            <span className="text-xs font-bold font-outfit tracking-wide">מחץ</span>
                        </button>

                        <button 
                            onClick={() => handleAction('burst')}
                            disabled={!isPlayerTurn || p.burstCooldown > 0 || p.mp < 30}
                            className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${!isPlayerTurn || (p.burstCooldown > 0 || p.mp < 30) ? 'bg-slate-900/50 border-slate-800/50 text-slate-500 opacity-60 grayscale' : 'bg-purple-950/40 border-purple-800/50 hover:bg-purple-900/60 hover:border-purple-500 text-purple-300 shadow-inner hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95'}`}
                        >
                            {p.burstCooldown > 0 && <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center text-3xl font-black font-outfit text-purple-500">{p.burstCooldown}</div>}
                            <Sparkles size={26} className={`mb-2 drop-shadow-md ${p.burstCooldown === 0 ? 'group-hover:scale-110 transition-transform' : ''}`} />
                            <span className="text-xs font-bold font-outfit tracking-wide">פרץ <span className="opacity-70">(30)</span></span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3 max-w-md mx-auto">
                        <button 
                            onClick={() => handleAction('defend')}
                            disabled={!isPlayerTurn}
                            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all duration-300 group ${isPlayerTurn ? 'bg-slate-800/60 backdrop-blur-sm border-slate-700 hover:bg-slate-700/80 hover:border-slate-500 text-slate-300 shadow-inner active:scale-95' : 'bg-slate-900/50 border-slate-800/50 text-slate-600 opacity-50'}`}
                        >
                            <Shield size={22} className="group-hover:text-white transition-colors" />
                            <span className="text-sm font-bold font-outfit tracking-wide group-hover:text-white transition-colors">הגנה</span>
                        </button>

                        <button 
                            onClick={() => { audioSystem.sfxHeal(); dispatch({ type: 'HEAL_IN_BATTLE' }); }}
                            disabled={!isPlayerTurn || p.potions <= 0 || p.hp >= playerTotalMaxHp}
                            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all duration-300 font-bold text-sm tracking-wide group ${(!isPlayerTurn || p.potions <= 0 || p.hp >= playerTotalMaxHp) ? 'bg-slate-900/50 border-slate-800/50 text-slate-600 opacity-50 grayscale' : 'bg-emerald-950/50 backdrop-blur-sm border-emerald-800/60 hover:bg-emerald-900/60 hover:border-emerald-500 text-emerald-400 shadow-inner active:scale-95'}`}
                        >
                            <Heart size={20} className={p.potions > 0 && p.hp < playerTotalMaxHp ? 'animate-pulse drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : ''} />
                            <span className="font-outfit">שיקוי <span className="opacity-70">({p.potions})</span></span>
                        </button>
                    </div>

                    {/* Crafted Potions Quick-Use */}
                    {state.craftedPotions && state.craftedPotions.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-2 pb-1">
                            {state.craftedPotions.map((potion, i) => (
                                <button 
                                    key={potion.uid}
                                    onClick={() => { audioSystem.sfxEquip(); dispatch({ type: 'USE_CRAFTED_POTION', payload: { idx: i } }); }}
                                    disabled={!isPlayerTurn}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold font-outfit tracking-wide shadow-md ${isPlayerTurn ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/80 hover:text-indigo-200 hover:border-indigo-500 transition-colors' : 'bg-slate-900/80 border-slate-800/80 text-slate-600 opacity-60'}`}
                                >
                                    <RenderDynamicIcon name={potion.icon || 'FlaskConical'} size={14} className="opacity-80" /> <span className="mt-0.5">{potion.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                </div>

                {/* Combat Log (Bottom) */}
                <div className="h-44 bg-black/50 backdrop-blur-md border-t border-white/10 p-4 pt-5 overflow-y-auto hide-scrollbar z-20 scroll-smooth relative pointer-events-auto">
                    {/* Tiny gradient to indicate scroll */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none sticky z-10 -mt-2"></div>
                    <div className="space-y-2.5 flex flex-col-reverse max-w-lg mx-auto pb-4">
                        {log.map((entry) => {
                            let bgClass = "bg-slate-900/40 border-slate-800/40 text-slate-300 shadow-sm";
                            let icon = <Info size={16} className="text-slate-400 flex-shrink-0" />;

                            if (entry.type === 'attack') {
                                bgClass = "bg-rose-950/30 border-rose-900/40 text-rose-200 shadow-sm";
                                icon = <Sword size={16} className="text-rose-400 flex-shrink-0" />;
                            } else if (entry.type === 'magic') {
                                bgClass = "bg-blue-950/30 border-blue-900/40 text-blue-200 shadow-sm";
                                icon = <Zap size={16} className="text-blue-400 flex-shrink-0" />;
                            } else if (entry.type === 'danger') {
                                bgClass = "bg-red-950/40 border-red-900/60 text-red-100 font-bold shadow-md shadow-red-900/20";
                                icon = <AlertTriangle size={16} className="text-red-400 flex-shrink-0 animate-pulse" />;
                            } else if (entry.type === 'success') {
                                bgClass = "bg-emerald-950/40 border-emerald-900/60 text-emerald-100 font-bold shadow-md shadow-emerald-900/20";
                                icon = <Sparkles size={16} className="text-emerald-400 flex-shrink-0 animate-pulse" />;
                            } else if (entry.type === 'warning') {
                                bgClass = "bg-amber-950/30 border-amber-900/40 text-amber-200 font-medium shadow-sm";
                                icon = <Target size={16} className="text-amber-500 flex-shrink-0" />;
                            }

                            return (
                                <div key={entry.id} className={`p-3 rounded-2xl border text-[13px] flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-sm ${bgClass}`} dir="rtl">
                                    <div className="mt-0.5 opacity-80">{icon}</div>
                                    <span className="leading-snug tracking-wide">{entry.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Render Quests Phase
    if (phase === 'quests') {
        return (
            <div className="w-full max-w-2xl mx-auto min-h-screen bg-map p-6 md:p-8 flex flex-col pt-12 animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-10 relative z-10">
                    <h2 className="text-3xl font-black font-outfit tracking-wide flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-500 drop-shadow-sm">
                        <Scroll className="text-indigo-400 drop-shadow-md" size={32} /> משימות יומיות
                    </h2>
                    <button onClick={() => dispatch({ type: 'SET_PHASE', payload: 'home' })} className="glass-button bg-slate-900/50 p-3 rounded-full text-slate-400 hover:text-white transition-colors border border-white/5 hover:border-white/20">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar z-10 px-1 pb-10">
                    {state.quests.active.map((quest, index) => (
                        <div key={quest.id} className={`p-6 rounded-3xl border transition-all duration-500 relative overflow-hidden group animate-in slide-in-from-bottom-4`} style={{animationDelay: `${index * 100}ms`}}>
                            <div className={`absolute inset-0 opacity-20 ${
                                quest.claimed ? 'bg-slate-900/50' : 
                                quest.completed ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 
                                'bg-gradient-to-br from-indigo-500/10 to-transparent'
                            }`}></div>
                            
                            <div className={`relative z-10 flex flex-col h-full ${quest.claimed ? 'opacity-50 grayscale' : ''}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className={`text-xl font-bold font-outfit tracking-wide mb-1 ${quest.completed ? 'text-emerald-300' : 'text-slate-100'}`}>{quest.title}</h3>
                                        <div className="text-xs font-semibold text-indigo-300 bg-indigo-950/40 px-2 py-1 rounded w-fit border border-indigo-900/50 flex items-center gap-1"><Gift size={12}/> פרס: תיבת שלל + זהב</div>
                                    </div>
                                    {quest.completed && !quest.claimed && (
                                        <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                            <Sparkles className="text-emerald-400 animate-pulse" size={20} />
                                        </div>
                                    )}
                                </div>

                                <div className="mb-2">
                                    <ProgressBar 
                                        current={quest.current} 
                                        max={quest.target} 
                                        colorClass={quest.completed ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"} 
                                        label={<span className="font-outfit text-xs font-bold">{quest.current} / {quest.target}</span>} 
                                    />
                                </div>

                                {quest.completed && !quest.claimed && (
                                    <button 
                                        onClick={() => { audioSystem.sfxGold(); dispatch({ type: 'CLAIM_QUEST', payload: { questId: quest.id } }); }}
                                        className="w-full mt-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-outfit tracking-wider py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                                    >
                                        <Gem size={18} className="group-hover/btn:scale-125 transition-transform" /> אסוף פרס עכשיו!
                                    </button>
                                )}
                                
                                {quest.claimed && (
                                    <div className="mt-5 text-center text-slate-400 text-sm font-bold font-outfit border border-slate-700/50 py-3 rounded-xl bg-slate-900/50 flex items-center justify-center gap-2">
                                        הושלם <span className="text-emerald-500">✔</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-2 text-center glass-panel border border-white/5 p-4 py-5 rounded-3xl relative z-10 shadow-xl">
                    <p className="text-slate-400 text-sm leading-relaxed flex flex-col gap-1 items-center">
                        <Clock size={16} className="text-slate-500 mb-1" />
                        <span>המשימות מתאפסות כל 5 שעות.</span>
                        <span className="text-slate-500 text-xs mt-1 max-w-[250px]">השלם אותן כדי לזכות בציוד נדיר וזהב נוסף שיעזור לך להתקדם!</span>
                    </p>
                </div>
            </div>
        );
    }

    return null;
};

export default App;
