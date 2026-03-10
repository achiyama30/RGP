import { rarities } from '../utils/constants';
import { getShopInventory, generateItem, generateEnemy } from '../utils/generators';
import { addLog, createFloatingText } from '../utils/helpers';

export const initialState = {
    phase: 'home',
    player: {
        level: 1, xp: 0, gold: 100, potions: 3,
        hp: 150, baseMaxHp: 150,
        mp: 80, baseMaxMp: 80,
        str: 8, def: 3, mag: 8,
        meleeWeapon: { name: 'חרב ברזל', level: 1, type: 'melee', str: 6, rarity: rarities[1], cost: 20 },
        magicWeapon: { name: 'שרביט עץ', level: 1, type: 'magic', mag: 2, mpBonus: 10, rarity: rarities[1], cost: 20 },
        armor: { name: 'שריון עור מחוזק', level: 1, type: 'armor', def: 4, rarity: rarities[1], cost: 20 },
        ring1: null,
        ring2: null,
        isDefending: false, specialCooldown: 0, stunTurns: 0, statuses: []
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

    switch (action.type) {
        case 'RESET_GAME': {
            return { ...initialState };
        }
        
        case 'REMOVE_FLOATING_TEXT': {
            return { ...state, floatingTexts: state.floatingTexts.filter(t => t.id !== action.payload.id) };
        }

        case 'EXPLORE': {
            const roll = Math.random();
            if (roll < 0.60) {
                const newEnemy = generateEnemy(p.level);
                return { 
                    ...state, phase: 'battle', turn: 'player', enemy: newEnemy,
                    log: [addLog(newEnemy.isBoss ? `🚨 נקלעת לקרב בוס מול ${newEnemy.name} (רמה ${newEnemy.level})!` : `⚔️ הותקפת על ידי ${newEnemy.name} (רמה ${newEnemy.level})!`, newEnemy.isBoss ? 'danger' : 'warning')],
                    player: { ...p, isDefending: false, stunTurns: 0, specialCooldown: 0, statuses: [] } 
                };
            } 
            else if (roll < 0.85) {
                if (Math.random() < 0.3) { 
                    const types = ['melee', 'magic', 'armor', 'ring'];
                    const loot = generateItem(p.level + 1, types[Math.floor(Math.random() * types.length)]);
                    return { ...state, phase: 'loot', lootData: loot };
                } else {
                    const goldFound = Math.floor(15 + Math.random() * 25 * p.level);
                    return {
                        ...state, phase: 'event',
                        eventData: { type: 'treasure', title: 'אוצר נסתר!', desc: 'מצאת תיבה עתיקה זרוקה בצידי הדרך. היא הכילה מטבעות זהב נוצצים!', gold: goldFound, icon: 'gem' },
                        player: { ...p, gold: p.gold + goldFound }
                    };
                }
            } 
            else {
                const damage = Math.max(1, Math.floor(playerTotalMaxHp * (0.10 + Math.random() * 0.15)));
                let np = { ...p, hp: Math.max(0, p.hp - damage) };
                if (np.hp <= 0) {
                    np.hp = playerTotalMaxHp; np.mp = playerTotalMaxMp; np.gold = Math.floor(np.gold / 2);
                    return {
                        ...state, phase: 'event',
                        eventData: { type: 'death', title: 'מלכודת קטלנית!', desc: `המלכודת הרגה אותך... חזרת לעיר ואיבדת חצי מהזהב.`, icon: 'skull' },
                        player: np, shopInventory: getShopInventory(np.level)
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
            let np = { ...p, isDefending: false };
            let ne = { ...state.enemy };
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

            if (np.specialCooldown > 0) np.specialCooldown--;

            if (actionType === 'attack') {
                if (Math.random() < 0.1) {
                    newLogs.unshift(addLog(`💨 פספוס! המתקפה שלך החטיאה.`, 'warning'));
                } else {
                    isCrit = Math.random() < playerCritChance;
                    let dmg = Math.max(1, Math.floor(playerTotalStr * (0.8 + Math.random() * 0.4)) - ne.def);
                    if (isCrit) dmg *= 2;
                    ne.hp -= dmg;
                    newLogs.unshift(addLog(isCrit ? `💥 מכה קריטית! ${dmg} נזק אדיר!` : `🗡️ תקפת וגרמת ${dmg} נזק!`, isCrit ? 'warning' : 'attack'));
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
                        let dmg = Math.max(1, Math.floor(playerTotalMag * 1.8 * (0.8 + Math.random() * 0.4)) - Math.floor(ne.def * 0.4));
                        if (isCrit) dmg *= 2;
                        ne.hp -= dmg;
                        newLogs.unshift(addLog(isCrit ? `🔥 קסם קריטי!! ${dmg} נזק קסום!` : `✨ כישוף! גרמת ${dmg} נזק קסם.`, isCrit ? 'warning' : 'magic'));
                        newFloatingTexts.push(createFloatingText(`-${dmg}`, isCrit ? 'crit' : 'damage', 'enemy'));
                    }
                } else {
                    newLogs.unshift(addLog('❌ אין מספיק MP לקסם!', 'danger'));
                    return { ...state, log: [...newLogs, ...state.log].slice(0, 8) };
                }
            } else if (actionType === 'heavy') {
                if (np.specialCooldown === 0) {
                    np.specialCooldown = 3;
                    if (Math.random() < 0.25) {
                        newLogs.unshift(addLog(`💨 מכת המחץ שלך החטיאה לחלוטין.`, 'warning'));
                    } else {
                        isCrit = Math.random() < playerCritChance;
                        let dmg = Math.max(1, Math.floor(playerTotalStr * 2.5) - ne.def);
                        if (isCrit) dmg = Math.floor(dmg * 1.5);
                        ne.hp -= dmg;
                        ne.stunTurns = 1;
                        newLogs.unshift(addLog(`💥 מכת מחץ! גרמת ${dmg} נזק והממת את האויב!`, 'attack'));
                        newFloatingTexts.push(createFloatingText(`-${dmg}`, isCrit ? 'crit' : 'damage', 'enemy'));
                    }
                }
            } else if (actionType === 'defend') {
                np.isDefending = true;
                const mpGained = Math.min(playerTotalMaxMp - np.mp, 10);
                np.mp += mpGained;
                newLogs.unshift(addLog('🛡️ מגננה! ההגנה שלך הוכפלה ושחזרת 10 MP.', 'success'));
                if (mpGained > 0) newFloatingTexts.push(createFloatingText(`+${mpGained}`, 'mana', 'player'));
            }

            if (ne.hp <= 0) {
                np.xp += ne.xpReward;
                np.gold += ne.goldReward;
                newLogs.unshift(addLog(`🏆 ניצחון! קיבלת ${ne.xpReward} XP ו-${ne.goldReward} זהב.`, 'success'));
                
                const { player: finalPlayer, leveledUp } = checkLevelUp(np);
                if (leveledUp) newLogs.unshift(addLog(`🎉 עלית לרמה ${finalPlayer.level}!`, 'success'));
                
                const newShopInventory = getShopInventory(finalPlayer.level);

                let nextPhase = 'home';
                let loot = null;
                if (Math.random() < 0.4 || ne.isBoss) {
                    const types = ['melee', 'magic', 'armor', 'ring'];
                    loot = generateItem(finalPlayer.level + (ne.isBoss ? 2 : 0), types[Math.floor(Math.random() * types.length)]);
                    nextPhase = 'loot';
                }
                return { ...state, lastHitCrit: isCrit, phase: nextPhase, turn: 'player', floatingTexts: newFloatingTexts, player: finalPlayer, enemy: null, lootData: loot, shopInventory: newShopInventory, log: [...newLogs, ...state.log].slice(0, 8) };
            }

            return { ...state, player: np, enemy: ne, turn: 'enemy', floatingTexts: newFloatingTexts, lastHitCrit: isCrit, log: [...newLogs, ...state.log].slice(0, 8) };
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
                        let dmg = Math.max(1, Math.floor(ne.str * (0.8 + Math.random() * 0.4)) - effectiveDef);
                        
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
                newLogs.unshift(addLog('💀 הובסת בקרב... חזרת לעיר עם חצי מהזהב.', 'danger'));
                np.hp = playerTotalMaxHp; np.mp = playerTotalMaxMp; np.gold = Math.floor(np.gold / 2);
                np.statuses = [];
                const newShopInventory = getShopInventory(np.level);
                return { ...state, phase: 'home', turn: 'player', player: np, enemy: null, enemyAttacking: false, shopInventory: newShopInventory, floatingTexts: newFloatingTexts, log: [...newLogs, ...state.log].slice(0, 8) };
            }

            return { ...state, player: np, enemy: ne, turn: 'player', floatingTexts: newFloatingTexts, enemyAttacking: false, log: [...newLogs, ...state.log].slice(0, 8) };
        }
        
        case 'ENEMY_ANIM_START':
            return { ...state, enemyAttacking: true };
            
        default: return state;
    }
};
