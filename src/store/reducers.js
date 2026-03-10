import { rarities, regions } from '../utils/constants';
import { getShopInventory, generateItem, generateEnemy } from '../utils/generators';
import { addLog, createFloatingText, getElementalMultiplier } from '../utils/helpers';

export const initialState = {
    phase: 'home',
    currentRegionIndex: 0,
    highestRegionUnlocked: 0,
    player: {
        level: 1, xp: 0, gold: 100, potions: 3,
        hp: 150, baseMaxHp: 150,
        mp: 80, baseMaxMp: 80,
        str: 8, def: 3, mag: 8,
        meleeWeapon: { name: 'חרב ברזל', level: 1, type: 'melee', str: 6, element: 'רגיל', rarity: rarities[1], cost: 20 },
        magicWeapon: { name: 'שרביט עץ', level: 1, type: 'magic', mag: 2, mpBonus: 10, element: 'רגיל', rarity: rarities[1], cost: 20 },
        armor: { name: 'שריון עור מחוזק', level: 1, type: 'armor', def: 4, rarity: rarities[1], cost: 20 },
        ring1: null,
        ring2: null,
        isDefending: false, specialCooldown: 0, slamCooldown: 0, burstCooldown: 0, stunTurns: 0, statuses: []
    },
    enemy: null,
    log: [],
    floatingTexts: [], 
    lootData: null, 
    shopInventory: getShopInventory(1),
    turn: 'player',
    enemyAttacking: false,
    lastHitCrit: false,
    pendingRing: null,
    pendingRingAction: null
};

export const gameReducer = (state, action) => {
    const p = state.player;
    const playerTotalStr = p.str + (p.meleeWeapon?.str || 0);
    const playerTotalMag = p.mag + (p.magicWeapon?.mag || 0);
    const playerTotalDef = p.def + (p.armor?.def || 0);
    const playerTotalMaxMp = p.baseMaxMp + (p.magicWeapon?.mpBonus || 0) + (p.armor?.mpBonus || 0);
    const playerTotalMaxHp = p.baseMaxHp + (p.ring1?.hpBonus || 0) + (p.ring2?.hpBonus || 0);
    const playerEvadeChance = Math.min(0.4, 0.10 + (((p.ring1?.evadeBonus || 0) + (p.ring2?.evadeBonus || 0)) * 0.01));
    const playerCritChance = Math.min(0.5, 0.10 + (((p.ring1?.critBonus || 0) + (p.ring2?.critBonus || 0)) * 0.01));

    const checkLevelUp = (np) => {
        let xpNeeded = np.level * 50;
        let leveledUp = false;
        while (np.xp >= xpNeeded) {
            np.level += 1;
            np.xp -= xpNeeded;
            np.baseMaxHp += 20;
            np.hp = np.baseMaxHp + (np.ring1?.hpBonus || 0) + (np.ring2?.hpBonus || 0);
            np.baseMaxMp += 10;
            np.str += 2; np.def += 1; np.mag += 2;
            xpNeeded = np.level * 50;
            leveledUp = true;
        }
        np.mp = np.baseMaxMp + (np.magicWeapon?.mpBonus || 0) + (np.armor?.mpBonus || 0);
        return { player: np, leveledUp };
    };

    const applyDeathPenalty = (np) => {
        const prevRegionIndex = Math.max(0, state.currentRegionIndex - 1);
        return {
            player: { ...np, gold: 0, hp: np.baseMaxHp, mp: np.baseMaxMp, statuses: [], isDefending: false },
            currentRegionIndex: prevRegionIndex,
            highestRegionUnlocked: Math.max(0, state.highestRegionUnlocked - 1),
        };
    };

    switch (action.type) {
        case 'RESET_GAME': {
            return { ...initialState };
        }
        
        case 'REMOVE_FLOATING_TEXT': {
            return { ...state, floatingTexts: state.floatingTexts.filter(t => t.id !== action.payload.id) };
        }

        case 'SELECT_REGION': {
            const idx = action.payload.index;
            if (idx > state.highestRegionUnlocked) return state;
            return { ...state, currentRegionIndex: idx };
        }

        case 'EXPLORE': {
            const region = regions[state.currentRegionIndex];
            const roll = Math.random();
            if (roll < 0.60) {
                const newEnemy = generateEnemy(p.level, region);
                return { 
                    ...state, phase: 'battle', turn: 'player', enemy: newEnemy,
                    log: [addLog(newEnemy.isBoss ? `🚨 נקלעת לקרב בוס מול ${newEnemy.name} (רמה ${newEnemy.level})!` : `⚔️ הותקפת על ידי ${newEnemy.name} (רמה ${newEnemy.level})!`, newEnemy.isBoss ? 'danger' : 'warning')],
                    player: { ...p, isDefending: false, stunTurns: 0, slamCooldown: Math.max(0, p.slamCooldown - 1), burstCooldown: Math.max(0, p.burstCooldown - 1), statuses: [] } 
                };
            } 
            // --- Merchant event ---
            else if (roll < 0.67) {
                return {
                    ...state, phase: 'event',
                    eventData: { type: 'merchant', title: 'סוחר נודד!', desc: 'פגשת סוחר מסתורי בדרך. הוא מציע לך תיבה אטומה תמורת 50 זהב. מה בפנים? אין לדעת...', icon: 'gem' }
                };
            }
            // --- Injured traveler event ---
            else if (roll < 0.72 && p.potions > 0) {
                return {
                    ...state, phase: 'event',
                    eventData: { type: 'traveler', title: 'נווד פצוע!', desc: 'מצאת נווד פצוע מוטל בצד הדרך. הוא מבקש שיקוי ריפוי. תעזור לו?', icon: 'alert' }
                };
            }
            else if (roll < 0.87) {
                if (Math.random() < 0.3) { 
                    const types = ['melee', 'magic', 'armor', 'ring'];
                    const loot = generateItem(p.level + 1, types[Math.floor(Math.random() * types.length)]);
                    return { ...state, phase: 'loot', lootData: loot };
                } else {
                    const goldFound = Math.floor(15 + Math.random() * 25 * p.level);
                    return {
                        ...state, phase: 'event',
                        eventData: { type: 'treasure', title: 'אוצר נסתר!', desc: 'מצאת תיבה עתיקה בצידי הדרך, חצי קבורה באדמה. פתחת אותה וגילית שהיא מלאה במטבעות זהב נוצצים!', gold: goldFound, icon: 'gem' },
                        player: { ...p, gold: p.gold + goldFound }
                    };
                }
            } 
            else {
                const damage = Math.max(1, Math.floor(playerTotalMaxHp * (0.10 + Math.random() * 0.15)));
                let np = { ...p, hp: Math.max(0, p.hp - damage) };
                if (np.hp <= 0) {
                    const death = applyDeathPenalty(np);
                    const regionName = regions[death.currentRegionIndex]?.name || 'יער';
                    return {
                        ...state, phase: 'event',
                        eventData: { type: 'death', title: 'מלכודת קטלנית!', desc: `המלכודת הרגה אותך... איבדת את כל הזהב שלך ועברת לאחור ל${regionName}.`, icon: 'skull' },
                        player: death.player,
                        currentRegionIndex: death.currentRegionIndex,
                        highestRegionUnlocked: death.highestRegionUnlocked,
                        shopInventory: getShopInventory(death.player.level)
                    };
                } else {
                    return {
                        ...state, phase: 'event',
                        eventData: { type: 'trap', title: 'מלכודת!', desc: `נפלת למלכודת קוצים וספגת ${damage} נזק!`, damage: damage, icon: 'alert' },
                        player: np, floatingTexts: [...state.floatingTexts, createFloatingText(`-${damage}`, 'damage', 'player')]
                    };
                }
            }
        }

        case 'EVENT_MERCHANT_BUY': {
            if (p.gold < 50) return state;
            const lootTypes = ['melee', 'magic', 'armor', 'ring'];
            const surprise = generateItem(p.level + 1, lootTypes[Math.floor(Math.random() * lootTypes.length)]);
            return { ...state, phase: 'loot', lootData: surprise, player: { ...p, gold: p.gold - 50 }, eventData: null };
        }

        case 'EVENT_HELP_TRAVELER': {
            if (p.potions <= 0) return state;
            const xpReward = p.level * 15;
            let np = { ...p, potions: p.potions - 1, xp: p.xp + xpReward };
            const { player: finalPlayer, leveledUp } = checkLevelUp(np);
            return {
                ...state, phase: 'event',
                eventData: { type: 'treasure', title: 'לב טוב מתוגמל!', desc: `הנווד קיבל את השיקוי ובתמורה לחש עליך ברכה. קיבלת ${xpReward} XP${leveledUp ? ' ועלית רמה!' : '!'}`, gold: 0, icon: 'gem' },
                player: finalPlayer
            };
        }
        
        case 'CLOSE_EVENT': return { ...state, phase: 'home', eventData: null };
        case 'GO_SHOP': return { ...state, phase: 'shop', log: [addLog('🛍️ נכנסת לחנות המקומית.', 'info')] };
        case 'LEAVE_SHOP': 
        case 'LEAVE_LOOT': return { ...state, phase: 'home', lootData: null };
        
        case 'BUY_ITEM': {
            const { type, item } = action.payload;
            if (p.gold >= item.cost) {
                if (type === 'potion') {
                    return { ...state, player: { ...p, gold: p.gold - item.cost, potions: p.potions + 1 } }; 
                }
                if (type === 'ring') {
                    if (!p.ring1) {
                        const newPlayer = { ...p, gold: p.gold - item.cost, ring1: item };
                        newPlayer.hp = Math.min(newPlayer.baseMaxHp + item.hpBonus + (newPlayer.ring2?.hpBonus || 0), newPlayer.hp + item.hpBonus);
                        return { ...state, player: newPlayer, shopInventory: { ...state.shopInventory, [type]: null } };
                    } else if (!p.ring2) {
                        const newPlayer = { ...p, gold: p.gold - item.cost, ring2: item };
                        newPlayer.hp = Math.min(newPlayer.baseMaxHp + (newPlayer.ring1?.hpBonus || 0) + item.hpBonus, newPlayer.hp + item.hpBonus);
                        return { ...state, player: newPlayer, shopInventory: { ...state.shopInventory, [type]: null } };
                    } else {
                        return { ...state, phase: 'ring_replace', pendingRing: item, pendingRingAction: 'buy' };
                    }
                }

                let oldItem = null;
                if (type === 'melee') oldItem = p.meleeWeapon;
                if (type === 'magic') oldItem = p.magicWeapon;
                if (type === 'armor') oldItem = p.armor;

                let refund = oldItem ? Math.floor(oldItem.cost * 0.3) : 0;
                const newPlayer = { ...p, gold: p.gold - item.cost + refund };
                
                let newLogs = [];
                if (refund > 0) newLogs.push(addLog(`💰 מכרת את ${oldItem.name} הישן וקיבלת ${refund} זהב בחזרה!`, 'success'));

                if (type === 'melee') newPlayer.meleeWeapon = item;
                if (type === 'magic') newPlayer.magicWeapon = item;
                if (type === 'armor') newPlayer.armor = item;

                return { ...state, player: newPlayer, shopInventory: { ...state.shopInventory, [type]: null }, log: [...newLogs, ...state.log].slice(0, 8) };
            }
            return state;
        }

        case 'EQUIP_LOOT': {
            const item = state.lootData;
            if (item.type === 'ring') {
                if (!p.ring1) {
                    const newPlayer = { ...p, ring1: item };
                    newPlayer.hp = Math.min(newPlayer.baseMaxHp + item.hpBonus + (newPlayer.ring2?.hpBonus || 0), newPlayer.hp + item.hpBonus);
                    return { ...state, player: newPlayer, phase: 'home', lootData: null };
                } else if (!p.ring2) {
                    const newPlayer = { ...p, ring2: item };
                    newPlayer.hp = Math.min(newPlayer.baseMaxHp + (newPlayer.ring1?.hpBonus || 0) + item.hpBonus, newPlayer.hp + item.hpBonus);
                    return { ...state, player: newPlayer, phase: 'home', lootData: null };
                } else {
                    return { ...state, phase: 'ring_replace', pendingRing: item, pendingRingAction: 'loot' };
                }
            }

            let oldItem = null;
            if (item.type === 'melee') oldItem = p.meleeWeapon;
            if (item.type === 'magic') oldItem = p.magicWeapon;
            if (item.type === 'armor') oldItem = p.armor;

            let refund = oldItem ? Math.floor(oldItem.cost * 0.3) : 0;
            const newPlayer = { ...p, gold: p.gold + refund };
            
            if (item.type === 'melee') newPlayer.meleeWeapon = item;
            if (item.type === 'magic') newPlayer.magicWeapon = item;
            if (item.type === 'armor') newPlayer.armor = item;

            return { ...state, player: newPlayer, phase: 'home', lootData: null };
        }

        case 'CONFIRM_REPLACE_RING': {
            const { slot } = action.payload; 
            const item = state.pendingRing;
            let newPlayer = { ...p };
            let oldItem = slot === 1 ? p.ring1 : p.ring2;
            let refund = oldItem ? Math.floor(oldItem.cost * 0.3) : 0;
            let newLogs = [];

            if (state.pendingRingAction === 'buy') {
                newPlayer.gold = p.gold - item.cost + refund;
                if (refund > 0) newLogs.push(addLog(`💰 מכרת את ${oldItem.name} הישן וקיבלת ${refund} זהב בחזרה!`, 'success'));
                state.shopInventory.ring = null;
            } else {
                newPlayer.gold = p.gold + refund;
            }

            if (slot === 1) newPlayer.ring1 = item;
            if (slot === 2) newPlayer.ring2 = item;
            
            const newMaxHp = newPlayer.baseMaxHp + (newPlayer.ring1?.hpBonus || 0) + (newPlayer.ring2?.hpBonus || 0);
            newPlayer.hp = Math.min(newMaxHp, newPlayer.hp + item.hpBonus);

            return { 
                ...state, 
                player: newPlayer, 
                phase: state.pendingRingAction === 'buy' ? 'shop' : 'home',
                pendingRing: null, pendingRingAction: null, lootData: null,
                log: [...newLogs, ...state.log].slice(0, 8)
            };
        }

        case 'CANCEL_REPLACE_RING': {
            return {
                ...state, phase: state.pendingRingAction === 'buy' ? 'shop' : 'loot',
                pendingRing: null, pendingRingAction: null
            };
        }

        case 'HEAL_POTION': { 
            if (p.potions > 0 && p.hp < playerTotalMaxHp) {
                const healAmount = Math.floor(playerTotalMaxHp * 0.4);
                return { ...state, player: { ...p, potions: p.potions - 1, hp: Math.min(playerTotalMaxHp, p.hp + healAmount) }};
            }
            return state;
        }
        
        case 'HEAL_IN_BATTLE': {
            if (state.turn !== 'player' || p.potions <= 0 || p.hp >= playerTotalMaxHp) return state;
            const healAmount = Math.floor(playerTotalMaxHp * 0.4);
            const np = { ...p, potions: p.potions - 1, hp: Math.min(playerTotalMaxHp, p.hp + healAmount) };
            const newFloating = createFloatingText(`+${healAmount}`, 'heal', 'player');
            return { ...state, player: np, turn: 'enemy', floatingTexts: [...state.floatingTexts, newFloating], log: [addLog(`🧪 שתית שיקוי וריפאת ${healAmount} חיים!`, 'success'), ...state.log].slice(0, 8) };
        }

        case 'PLAYER_ACTION': {
            if (state.turn !== 'player') return state;
            const { actionType } = action.payload;
            const ne = state.enemy;
            let np = { ...p, isDefending: false };
            let newNe = { ...ne };
            let newLogs = [];
            let newFloatingTexts = [...state.floatingTexts];
            let isCrit = false;

            if (np.statuses && np.statuses.length > 0) {
                np.statuses.forEach(status => {
                    if (status.type === 'poison') {
                        np.hp -= status.dmg;
                        newLogs.unshift(addLog(`🤢 נזק רעל! ספגת ${status.dmg} נזק.`, 'danger'));
                        newFloatingTexts.push(createFloatingText(`-${status.dmg}`, 'damage', 'player'));
                        status.turns--;
                    }
                });
                np.statuses = np.statuses.filter(s => s.turns > 0);
            }

            if (np.slamCooldown > 0) np.slamCooldown--;
            if (np.burstCooldown > 0) np.burstCooldown--;

            if (actionType === 'attack') {
                if (Math.random() < 0.1) {
                    newLogs.unshift(addLog(`💨 פספוס! המתקפה שלך החטיאה.`, 'warning'));
                } else {
                    isCrit = Math.random() < playerCritChance;
                    const elemMult = getElementalMultiplier(p.meleeWeapon?.element, newNe.element);
                    let dmg = Math.max(1, Math.floor(playerTotalStr * (0.8 + Math.random() * 0.4) * elemMult) - newNe.def);
                    if (isCrit) dmg *= 2;
                    newNe.hp -= dmg;
                    const elemText = elemMult > 1 ? ' 🔥 יעיל במיוחד!' : (elemMult < 1 ? ' 💧 לא יעיל...' : '');
                    newLogs.unshift(addLog(isCrit ? `💥 מכה קריטית! ${dmg} נזק אדיר!${elemText}` : `🗡️ תקפת וגרמת ${dmg} נזק!${elemText}`, isCrit ? 'warning' : 'attack'));
                    newFloatingTexts.push(createFloatingText(`-${dmg}`, isCrit ? 'crit' : 'damage', 'enemy'));
                }
            } else if (actionType === 'magic') {
                const cost = 15;
                if (np.mp >= cost) {
                    np.mp -= cost;
                    newFloatingTexts.push(createFloatingText(`-${cost}`, 'mana', 'player')); 
                    if (Math.random() < 0.05) {
                        newLogs.unshift(addLog(`💨 הקסם שלך החטיא!`, 'warning'));
                    } else {
                        isCrit = Math.random() < (playerCritChance + 0.05);
                        const elemMult = getElementalMultiplier(p.magicWeapon?.element, newNe.element);
                        let dmg = Math.max(1, Math.floor(playerTotalMag * 1.8 * (0.8 + Math.random() * 0.4) * elemMult) - Math.floor(newNe.def * 0.4));
                        if (isCrit) dmg *= 2;
                        newNe.hp -= dmg;
                        const elemText = elemMult > 1 ? ' 🔥 יעיל במיוחד!' : (elemMult < 1 ? ' 💧 לא יעיל...' : '');
                        newLogs.unshift(addLog(isCrit ? `🔥 קסם קריטי!! ${dmg} נזק קסום!${elemText}` : `✨ כישוף! גרמת ${dmg} נזק קסם.${elemText}`, isCrit ? 'warning' : 'magic'));
                        newFloatingTexts.push(createFloatingText(`-${dmg}`, isCrit ? 'crit' : 'damage', 'enemy'));
                    }
                } else {
                    newLogs.unshift(addLog('❌ אין מספיק MP לקסם!', 'danger'));
                    return { ...state, log: [...newLogs, ...state.log].slice(0, 8) };
                }
            } else if (actionType === 'slam') {
                // Heavy physical skill with cooldown 4
                if (np.slamCooldown > 0) return state;
                np.slamCooldown = 4;
                if (Math.random() < 0.2) {
                    newLogs.unshift(addLog(`💨 מכת המחץ שלך החטיאה לחלוטין.`, 'warning'));
                } else {
                    isCrit = Math.random() < playerCritChance;
                    let dmg = Math.max(1, Math.floor(playerTotalStr * 2.5) - newNe.def);
                    if (isCrit) dmg = Math.floor(dmg * 1.5);
                    newNe.hp -= dmg;
                    newNe.stunTurns = 1;
                    newLogs.unshift(addLog(`💥 מחץ! גרמת ${dmg} נזק והממת את האויב!`, 'attack'));
                    newFloatingTexts.push(createFloatingText(`-${dmg}`, isCrit ? 'crit' : 'damage', 'enemy'));
                }
            } else if (actionType === 'burst') {
                // Magic burst skill with cooldown 3
                const cost = 30;
                if (np.burstCooldown > 0 || np.mp < cost) {
                    if (np.mp < cost) newLogs.unshift(addLog('❌ אין מספיק MP לפרץ!', 'danger'));
                    return { ...state, log: [...newLogs, ...state.log].slice(0, 8) };
                }
                np.burstCooldown = 3;
                np.mp -= cost;
                newFloatingTexts.push(createFloatingText(`-${cost}`, 'mana', 'player'));
                isCrit = Math.random() < (playerCritChance + 0.1);
                const elemMult = getElementalMultiplier(p.magicWeapon?.element, newNe.element);
                let dmg = Math.max(1, Math.floor(playerTotalMag * 3.5 * elemMult) - Math.floor(newNe.def * 0.3));
                if (isCrit) dmg = Math.floor(dmg * 1.8);
                newNe.hp -= dmg;
                const elemText = elemMult > 1 ? ' 🔥 יעיל במיוחד!' : (elemMult < 1 ? ' 💧 לא יעיל...' : '');
                newLogs.unshift(addLog(`💫 פרץ מאנה!!${isCrit ? ' קריטי!' : ''} ${dmg} נזק קסם!${elemText}`, 'magic'));
                newFloatingTexts.push(createFloatingText(`-${dmg}`, isCrit ? 'crit' : 'damage', 'enemy'));
            } else if (actionType === 'defend') {
                np.isDefending = true;
                const mpGained = Math.min(playerTotalMaxMp - np.mp, 10);
                np.mp += mpGained;
                newLogs.unshift(addLog('🛡️ מגננה! ההגנה שלך הוכפלה ושחזרת 10 MP.', 'success'));
                if (mpGained > 0) newFloatingTexts.push(createFloatingText(`+${mpGained}`, 'mana', 'player'));
            }

            if (newNe.hp <= 0) {
                np.xp += newNe.xpReward;
                np.gold += newNe.goldReward;
                newLogs.unshift(addLog(`🏆 ניצחון! קיבלת ${newNe.xpReward} XP ו-${newNe.goldReward} זהב.`, 'success'));
                
                const { player: finalPlayer, leveledUp } = checkLevelUp(np);
                if (leveledUp) newLogs.unshift(addLog(`🎉 עלית לרמה ${finalPlayer.level}!`, 'success'));
                
                const newShopInventory = getShopInventory(finalPlayer.level);

                // Boss victory: unlock next region
                let newHighest = state.highestRegionUnlocked;
                let eventData = null;
                if (newNe.isBoss) {
                    const nextIdx = state.currentRegionIndex + 1;
                    if (nextIdx < regions.length && nextIdx > newHighest) {
                        newHighest = nextIdx;
                        eventData = {
                            type: 'boss_win',
                            title: `🏆 ניצחת את הבוס!`,
                            desc: `ניצחת את ${newNe.name}! האזור "${regions[nextIdx]?.name}" נפתח לחקירה!`,
                            icon: 'gem'
                        };
                    }
                }

                let nextPhase = eventData ? 'event' : 'home';
                let loot = null;
                if (!eventData && (Math.random() < 0.4 || newNe.isBoss)) {
                    const types = ['melee', 'magic', 'armor', 'ring'];
                    loot = generateItem(finalPlayer.level + (newNe.isBoss ? 2 : 0), types[Math.floor(Math.random() * types.length)]);
                    nextPhase = 'loot';
                }
                return { ...state, lastHitCrit: isCrit, phase: nextPhase, turn: 'player', floatingTexts: newFloatingTexts, player: finalPlayer, enemy: null, lootData: loot, shopInventory: newShopInventory, highestRegionUnlocked: newHighest, eventData, log: [...newLogs, ...state.log].slice(0, 8) };
            }

            return { ...state, player: np, enemy: newNe, turn: 'enemy', floatingTexts: newFloatingTexts, lastHitCrit: isCrit, log: [...newLogs, ...state.log].slice(0, 8) };
        }

        case 'ENEMY_TURN': {
            let np = { ...p };
            let ne = { ...state.enemy };
            let newLogs = [];
            let newFloatingTexts = [...state.floatingTexts];

            if (ne.stunTurns > 0) {
                ne.stunTurns--;
                newLogs.unshift(addLog(`💫 ${ne.name} המום ומדלג על תור!`, 'warning'));
            } else {
                let actionTaken = 'attack';
                
                if (ne.ai === 'thief' && Math.random() < 0.25 && np.gold > 0) {
                    actionTaken = 'steal';
                } else if (ne.ai === 'poisoner' && Math.random() < 0.3) {
                    actionTaken = 'poison';
                }

                if (actionTaken === 'steal') {
                    const stolen = Math.floor(np.gold * (0.05 + Math.random() * 0.1));
                    if (stolen > 0) {
                        np.gold -= stolen;
                        newLogs.unshift(addLog(`👺 ${ne.name} גנב לך ${stolen} זהב!`, 'danger'));
                    } else actionTaken = 'attack'; 
                }
                else if (actionTaken === 'poison') {
                    if (!np.statuses) np.statuses = [];
                    np.statuses.push({ type: 'poison', turns: 3, dmg: Math.floor(ne.level * 2) });
                    newLogs.unshift(addLog(`☠️ ${ne.name} הטיל עליך קללת רעל!`, 'danger'));
                }
                else {
                    if (Math.random() < playerEvadeChance) { 
                        newLogs.unshift(addLog(`💨 התחמקות! זזת בזמן והאויב החטיא.`, 'success'));
                    } else {
                        const effectiveDef = np.isDefending ? playerTotalDef * 2 : playerTotalDef;
                        // Enemy elemental damage
                        const elemMult = getElementalMultiplier(ne.element, 'רגיל'); // player has neutral base defense
                        let dmg = Math.max(1, Math.floor(ne.str * (0.8 + Math.random() * 0.4) * elemMult) - effectiveDef);
                        
                        if (ne.isBoss && Math.random() < 0.3) {
                            dmg = Math.floor(dmg * 1.5);
                            newLogs.unshift(addLog(`☠️ מתקפה קטלנית של ${ne.name}! ספגת ${dmg} נזק!`, 'danger'));
                        } else {
                            newLogs.unshift(addLog(`🩸 ${ne.name} תקף אותך וגרם ל-${dmg} נזק.`, 'danger'));
                        }
                        np.hp -= dmg;
                        newFloatingTexts.push(createFloatingText(`-${dmg}`, 'damage', 'player'));
                    }
                }
            }

            if (np.hp <= 0) {
                newLogs.unshift(addLog('💀 הובסת בקרב... איבדת את כל הזהב ועברת אזור אחד אחורה!', 'danger'));
                const death = applyDeathPenalty(np);
                const regionName = regions[death.currentRegionIndex]?.name || 'יער';
                const newShopInventory = getShopInventory(death.player.level);
                return {
                    ...state, phase: 'event', turn: 'player', enemy: null, enemyAttacking: false,
                    player: death.player,
                    currentRegionIndex: death.currentRegionIndex,
                    highestRegionUnlocked: death.highestRegionUnlocked,
                    shopInventory: newShopInventory,
                    floatingTexts: newFloatingTexts,
                    eventData: { type: 'death', title: '💀 הובסת!', desc: `נפלת בקרב... איבדת את כל הזהב שלך ועברת לאחור ל${regionName}. נאבק בבוס כדי לחזור!`, icon: 'skull' },
                    log: [...newLogs, ...state.log].slice(0, 8)
                };
            }

            return { ...state, player: np, enemy: ne, turn: 'player', floatingTexts: newFloatingTexts, enemyAttacking: false, log: [...newLogs, ...state.log].slice(0, 8) };
        }
        
        case 'ENEMY_ANIM_START':
            return { ...state, enemyAttacking: true };
            
        default: return state;
    }
};
