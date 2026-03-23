import { rarities, regions, campUpgrades, MINERALS, FISH_TYPES, ALCHEMY_RECIPES } from '../utils/constants';
import { getShopInventory, generateItem, generateEnemy, upgradeItem, getUpgradeCost, generateQuests } from '../utils/generators';
import { addLog, createFloatingText, getElementalMultiplier } from '../utils/helpers';

export const initialState = {
    worldLevel: 1,
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
    camp: {
        tentLevel: 1,
        blacksmithLevel: 1,
        stash: []
    },
    resources: { copper: 0, iron: 0, goldOre: 0, mithril: 0 },
    fish: [],
    craftedPotions: [],
    activeBuffs: [],
    miniGameUses: { mining: 3, fishing: 3 },
    timeSystem: {
        isDay: true,
        nextCycleTime: Date.now() + 5 * 60 * 60 * 1000
    },
    quests: {
        nextResetTime: Date.now() + 5 * 60 * 60 * 1000,
        active: generateQuests(1)
    },
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
    let playerTotalStr = p.str + (p.meleeWeapon?.str || 0);
    let playerTotalMag = p.mag + (p.magicWeapon?.mag || 0);
    let playerTotalDef = p.def + (p.armor?.def || 0);
    let playerTotalMaxMp = p.baseMaxMp + (p.magicWeapon?.mpBonus || 0) + (p.armor?.mpBonus || 0);
    let playerTotalMaxHp = p.baseMaxHp + (p.ring1?.hpBonus || 0) + (p.ring2?.hpBonus || 0);
    let playerEvadeChance = Math.min(0.4, 0.10 + (((p.ring1?.evadeBonus || 0) + (p.ring2?.evadeBonus || 0)) * 0.01));
    let playerCritChance = Math.min(0.5, 0.10 + (((p.ring1?.critBonus || 0) + (p.ring2?.critBonus || 0)) * 0.01));

    // Apply active temporary buffs
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
            const freshInitialState = JSON.parse(JSON.stringify(initialState));
            return {
                ...freshInitialState,
                timeSystem: {
                    isDay: true,
                    nextCycleTime: Date.now() + 5 * 60 * 60 * 1000
                },
                quests: {
                    nextResetTime: Date.now() + 5 * 60 * 60 * 1000,
                    active: generateQuests(1)
                },
                shopInventory: getShopInventory(1)
            };
        }
        
        case 'CHECK_TIME': {
            const now = Date.now();
            let newState = { ...state };
            let timeChanged = false;
            let questsChanged = false;

            if (now >= state.timeSystem.nextCycleTime) {
                const newIsDay = !state.timeSystem.isDay;
                newState.timeSystem = {
                    isDay: newIsDay,
                    nextCycleTime: now + (newIsDay ? 5 : 3) * 60 * 60 * 1000
                };
                newState.log = [addLog(newIsDay ? '🌅 השמש חזרה לזרוח... היום מתחיל.' : '🌙 הלילה ירד... המפלצות עכשיו חזקות יותר!', 'warning'), ...newState.log].slice(0, 8);
                timeChanged = true;
            }

            if (now >= state.quests.nextResetTime) {
                newState.quests = {
                    nextResetTime: now + 5 * 60 * 60 * 1000,
                    active: generateQuests(p.level)
                };
                newState.log = [addLog('📜 לוח המשימות עודכן במשימות חדשות!', 'info'), ...newState.log].slice(0, 8);
                questsChanged = true;
            }
            
            return (timeChanged || questsChanged) ? newState : state;
        }

        case 'SLEEP_CAMP': {
            if (state.phase !== 'camp' || state.timeSystem.isDay) return state;
            return {
                ...state,
                player: { ...p, hp: playerTotalMaxHp },
                timeSystem: {
                    ...state.timeSystem,
                    nextCycleTime: Date.now() + 10 * 1000
                },
                log: [addLog('🛏️ ישנת באוהל. חידשת כוחות, והלילה עומד להסתיים...', 'success'), ...state.log].slice(0, 8)
            };
        }

        case 'CLAIM_QUEST': {
            const { questId } = action.payload;
            const questIndex = state.quests.active.findIndex(q => q.id === questId);
            if (questIndex === -1) return state;
            const quest = state.quests.active[questIndex];
            
            if (quest.completed && !quest.claimed) {
                const newActive = [...state.quests.active];
                newActive[questIndex] = { ...quest, claimed: true };
                
                const extraGold = Math.floor(50 + Math.random() * 50 * p.level);
                const types = ['melee', 'magic', 'armor', 'ring'];
                const rewardItem = generateItem(p.level + 1, types[Math.floor(Math.random() * types.length)], state.worldLevel);
                
                return {
                    ...state,
                    quests: { ...state.quests, active: newActive },
                    player: { ...p, gold: p.gold + extraGold },
                    phase: 'loot',
                    lootData: rewardItem,
                    destination: state.phase, // Return naturally
                    eventData: null,
                    log: [addLog(`🎁 השלמת משימה! קיבלת ${extraGold} זהב וקופסת שלל!`, 'success'), ...state.log].slice(0, 8)
                };
            }
            return state;
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
                const newEnemy = generateEnemy(p.level, region, state.worldLevel, !state.timeSystem.isDay);
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
                    const loot = generateItem(p.level + 1, types[Math.floor(Math.random() * types.length)], state.worldLevel);
                    return { ...state, phase: 'loot', lootData: loot };
                } else {
                    const goldFound = Math.floor((15 + Math.random() * 25 * p.level) * Math.pow(1.5, Math.max(0, (state.worldLevel || 1) - 1)));
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
                        shopInventory: getShopInventory(death.player.level, state.worldLevel)
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
            const surprise = generateItem(p.level + 1, lootTypes[Math.floor(Math.random() * lootTypes.length)], state.worldLevel);
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
        
        case 'GO_CAMP': {
            if (state.phase !== 'home') return state;
            const roll = Math.random();
            if (roll < 0.2) {
                // 20% chance to be attacked on the way to camp
                const region = regions[state.currentRegionIndex];
                const newEnemy = generateEnemy(p.level, region, state.worldLevel, !state.timeSystem.isDay);
                return { 
                    ...state, phase: 'battle', turn: 'player', enemy: newEnemy, destination: 'camp',
                    log: [addLog(`🐺 הותקפת בדרך למחנה על ידי ${newEnemy.name}!`, 'danger')],
                    player: { ...p, isDefending: false, stunTurns: 0, slamCooldown: Math.max(0, p.slamCooldown - 1), burstCooldown: Math.max(0, p.burstCooldown - 1), statuses: [] } 
                };
            }
            return { ...state, phase: 'camp', log: [addLog('🏕️ הגעת למחנה הראשי במלואו.', 'info')] };
        }

        case 'LEAVE_CAMP': {
            if (state.phase !== 'camp') return state;
            const roll = Math.random();
            if (roll < 0.2) {
                // 20% chance to be attacked on the way back from camp
                const region = regions[state.currentRegionIndex];
                const newEnemy = generateEnemy(p.level, region, state.worldLevel, !state.timeSystem.isDay);
                return { 
                    ...state, phase: 'battle', turn: 'player', enemy: newEnemy, destination: 'home',
                    log: [addLog(`🐺 הותקפת בדרך חזרה להרפתקה על ידי ${newEnemy.name}!`, 'danger')],
                    player: { ...p, isDefending: false, stunTurns: 0, slamCooldown: Math.max(0, p.slamCooldown - 1), burstCooldown: Math.max(0, p.burstCooldown - 1), statuses: [] } 
                };
            }
            // Reset mini-game uses on leaving camp
            return { ...state, phase: 'home', miniGameUses: { mining: 3, fishing: 3 }, log: [addLog('⚔️ חזרת להרפתקה!', 'info')] };
        }

        case 'UPGRADE_TENT': {
            const currentLevel = state.camp.tentLevel;
            const nextUpgrade = campUpgrades.tent.find(t => t.level === currentLevel + 1);
            if (nextUpgrade && p.gold >= nextUpgrade.cost) {
                return {
                    ...state,
                    player: { ...p, gold: p.gold - nextUpgrade.cost },
                    camp: { ...state.camp, tentLevel: currentLevel + 1 },
                    log: [addLog('🏕️ שדרגת את אוהל המרפא בהצלחה!', 'success'), ...state.log].slice(0, 8)
                };
            }
            return state;
        }

        case 'UPGRADE_BLACKSMITH': {
            const currentLevel = state.camp.blacksmithLevel;
            const nextUpgrade = campUpgrades.blacksmith.find(b => b.level === currentLevel + 1);
            if (nextUpgrade && p.gold >= nextUpgrade.cost) {
                return {
                    ...state,
                    player: { ...p, gold: p.gold - nextUpgrade.cost },
                    camp: { ...state.camp, blacksmithLevel: currentLevel + 1 },
                    log: [addLog('⚒️ שדרגת את שולחן הנפח בהצלחה!', 'success'), ...state.log].slice(0, 8)
                };
            }
            return state;
        }

        case 'STASH_ITEM': {
            const { type, from } = action.payload; // from: 'loot', 'shop', 'equipped'
            let itemToStash = null;
            let newPlayer = { ...p };
            let newPhase = state.phase;
            let newLootData = state.lootData;
            
            if (from === 'loot') {
                itemToStash = state.lootData;
                newLootData = null;
                newPhase = 'home';
                newPlayer.gold += 5; // A tiny token for storing instead of leaving
            } else if (from === 'equipped') {
                if (type === 'melee') { itemToStash = p.meleeWeapon; newPlayer.meleeWeapon = null; }
                if (type === 'magic') { itemToStash = p.magicWeapon; newPlayer.magicWeapon = null; }
                if (type === 'armor') { itemToStash = p.armor; newPlayer.armor = null; }
                if (type === 'ring1') { itemToStash = p.ring1; newPlayer.ring1 = null; }
                if (type === 'ring2') { itemToStash = p.ring2; newPlayer.ring2 = null; }
                // Re-calculate HP bounds if ring was unequipped
                newPlayer.hp = Math.min(newPlayer.hp, newPlayer.baseMaxHp + (newPlayer.ring1?.hpBonus || 0) + (newPlayer.ring2?.hpBonus || 0));
            }

            if (itemToStash) {
                return {
                    ...state,
                    player: newPlayer,
                    phase: newPhase,
                    lootData: newLootData,
                    camp: { ...state.camp, stash: [...state.camp.stash, itemToStash] },
                    log: [addLog(`📦 שלחת את ${itemToStash.name} לאחסון!`, 'info'), ...state.log].slice(0, 8)
                };
            }
            return state;
        }

        case 'EQUIP_FROM_STASH': {
            const { itemIndex } = action.payload;
            const item = state.camp.stash[itemIndex];
            if (!item) return state;

            let newPlayer = { ...p };
            let oldItem = null;
            let targetSlot = item.type;

            if (item.type === 'melee') { oldItem = p.meleeWeapon; newPlayer.meleeWeapon = item; }
            if (item.type === 'magic') { oldItem = p.magicWeapon; newPlayer.magicWeapon = item; }
            if (item.type === 'armor') { oldItem = p.armor; newPlayer.armor = item; }
            if (item.type === 'ring') {
                if (!p.ring1) { targetSlot = 'ring1'; newPlayer.ring1 = item; }
                else if (!p.ring2) { targetSlot = 'ring2'; newPlayer.ring2 = item; }
                else {
                    // Both ring slots full — show selection screen
                    return { 
                        ...state, 
                        phase: 'ring_replace', 
                        pendingRing: item, 
                        pendingRingAction: 'stash',
                        pendingStashIndex: itemIndex
                    };
                }
            }

            let newStash = [...state.camp.stash];
            newStash.splice(itemIndex, 1);
            if (oldItem) {
                newStash.push(oldItem);
            }

            // Fix HP bounds if rings changed
            const newMaxHp = newPlayer.baseMaxHp + (newPlayer.ring1?.hpBonus || 0) + (newPlayer.ring2?.hpBonus || 0);
            newPlayer.hp = Math.min(newMaxHp, newPlayer.hp + (item.type === 'ring' ? item.hpBonus : 0));

            return {
                ...state,
                player: newPlayer,
                camp: { ...state.camp, stash: newStash },
                log: [addLog(`📦 הצטיידת ב-${item.name} מהאחסון!`, 'success'), ...state.log].slice(0, 8)
            };
        }

        case 'SELL_FROM_STASH': {
            const { itemIndex } = action.payload;
            const item = state.camp.stash[itemIndex];
            if (!item) return state;
            let refund = Math.floor(item.cost * 0.3);
            let newStash = [...state.camp.stash];
            newStash.splice(itemIndex, 1);
            return {
                ...state,
                player: { ...p, gold: p.gold + refund },
                camp: { ...state.camp, stash: newStash },
                log: [addLog(`💰 מכרת את ${item.name} תמורת ${refund} זהב.`, 'success'), ...state.log].slice(0, 8)
            };
        }

        case 'UPGRADE_ITEM': {
            const { type } = action.payload; // 'melee', 'magic', 'armor', 'ring1', 'ring2'
            let item = null;
            if (type === 'melee') item = p.meleeWeapon;
            if (type === 'magic') item = p.magicWeapon;
            if (type === 'armor') item = p.armor;
            if (type === 'ring1') item = p.ring1;
            if (type === 'ring2') item = p.ring2;
            
            if (!item) return state;

            const bsStats = campUpgrades.blacksmith.find(b => b.level === state.camp.blacksmithLevel) || campUpgrades.blacksmith[0];
            const cost = getUpgradeCost(item, bsStats.discount);

            if (p.gold >= cost) {
                const upgraded = upgradeItem(item);
                let newPlayer = { ...p, gold: p.gold - cost };
                if (type === 'melee') newPlayer.meleeWeapon = upgraded;
                if (type === 'magic') newPlayer.magicWeapon = upgraded;
                if (type === 'armor') newPlayer.armor = upgraded;
                if (type === 'ring1') {
                    newPlayer.ring1 = upgraded;
                    // Recalculate HP if the ring has an HP bonus
                    const hpDiff = (upgraded.hpBonus || 0) - (item.hpBonus || 0);
                    if (hpDiff > 0) newPlayer.hp = Math.min(newPlayer.baseMaxHp + (upgraded.hpBonus || 0) + (newPlayer.ring2?.hpBonus || 0), newPlayer.hp + hpDiff);
                }
                if (type === 'ring2') {
                    newPlayer.ring2 = upgraded;
                    const hpDiff = (upgraded.hpBonus || 0) - (item.hpBonus || 0);
                    if (hpDiff > 0) newPlayer.hp = Math.min(newPlayer.baseMaxHp + (newPlayer.ring1?.hpBonus || 0) + (upgraded.hpBonus || 0), newPlayer.hp + hpDiff);
                }

                return {
                    ...state,
                    player: newPlayer,
                    log: [addLog(`⚒️ שדרגת את ${item.name} בהצלחה!`, 'warning'), ...state.log].slice(0, 8)
                }
            }

            return state;
            return state;
        }

        // --- MINI-GAMES ACTIONS ---
        case 'MINE_RESULT': {
            const { mineralId, amount } = action.payload; // amount > 0 if hit, 0 if missed
            const uses = state.miniGameUses.mining;
            if (uses <= 0) return state;

            let logMsg = '⛏️ חצבת וקיבלת כלום.';
            let Type = 'info';
            let newResources = { ...state.resources };

            if (amount > 0 && MINERALS[mineralId]) {
                const min = MINERALS[mineralId];
                newResources[mineralId] = (newResources[mineralId] || 0) + amount;
                logMsg = `⛏️ מצאת ${amount} ${min.emoji} ${min.name}!`;
                Type = 'success';
            }

            return {
                ...state,
                resources: newResources,
                miniGameUses: { ...state.miniGameUses, mining: uses - 1 },
                log: [addLog(logMsg, Type), ...state.log].slice(0, 8)
            };
        }

        case 'FISH_RESULT': {
            const { success, fish } = action.payload;
            const uses = state.miniGameUses.fishing;
            if (uses <= 0) return state;

            let logMsg = '🎣 הדג ברח...';
            let Type = 'warning';
            let newFish = [...state.fish];

            if (success && fish) {
                newFish.push({ ...fish, uid: Math.random().toString() });
                logMsg = `🎣 נהדר! תפסת ${fish.emoji} ${fish.name}!`;
                Type = 'success';
            }

            return {
                ...state,
                fish: newFish,
                miniGameUses: { ...state.miniGameUses, fishing: uses - 1 },
                log: [addLog(logMsg, Type), ...state.log].slice(0, 8)
            };
        }

        case 'CRAFT_POTION': {
            const { recipe } = action.payload;
            let canCraft = true;
            for (const [res, qty] of Object.entries(recipe.cost)) {
                if ((state.resources[res] || 0) < qty) canCraft = false;
            }
            if (!canCraft) return state;

            let newResources = { ...state.resources };
            for (const [res, qty] of Object.entries(recipe.cost)) {
                newResources[res] -= qty;
            }

            const newPotion = { ...recipe, uid: Math.random().toString() };
            return {
                ...state,
                resources: newResources,
                craftedPotions: [...state.craftedPotions, newPotion],
                log: [addLog(`⚗️ רקחת ${recipe.emoji} ${recipe.name}!`, 'success'), ...state.log].slice(0, 8)
            };
        }

        case 'USE_FISH_BUFF': {
            const { idx } = action.payload;
            const targetFish = state.fish[idx];
            if (!targetFish) return state;

            let newFish = [...state.fish];
            newFish.splice(idx, 1);

            if (targetFish.buffType === 'hp') {
                const np = { ...p, hp: Math.min(playerTotalMaxHp, p.hp + targetFish.buffValue) };
                return {
                    ...state, fish: newFish, player: np,
                    log: [addLog(`🍽️ אכלת ${targetFish.emoji} ${targetFish.name} וריפאת ${targetFish.buffValue} חיים!`, 'success'), ...state.log].slice(0, 8)
                };
            }

            const newBuff = { ...targetFish, type: targetFish.buffType, value: targetFish.buffValue };
            return {
                ...state, fish: newFish, activeBuffs: [...state.activeBuffs, newBuff],
                log: [addLog(`🪄 קיבלת באף זמני מ-${targetFish.emoji} ${targetFish.name}!`, 'success'), ...state.log].slice(0, 8)
            };
        }

        case 'USE_CRAFTED_POTION': {
            const { idx } = action.payload;
            const potion = state.craftedPotions[idx];
            if (!potion) return state;

            let newPotions = [...state.craftedPotions];
            newPotions.splice(idx, 1);
            let np = { ...p };
            let newActiveBuffs = [...state.activeBuffs];
            let msg = `⚗️ שתית ${potion.emoji} ${potion.name}!`;

            if (potion.effect.type === 'heal') {
                const healAmt = Math.floor(playerTotalMaxHp * potion.effect.value);
                np.hp = Math.min(playerTotalMaxHp, np.hp + healAmt);
                msg = `⚗️ שתית ${potion.emoji} ${potion.name} וריפאת ${healAmt} חיים!`;
            } else if (potion.effect.type === 'mp') {
                np.mp = playerTotalMaxMp;
                msg = `⚗️ שתית ${potion.emoji} ${potion.name} והמאנה שלך חזרה במלואה!`;
            } else {
                newActiveBuffs.push({ ...potion, type: potion.effect.type, value: potion.effect.value, battlesLeft: potion.effect.battlesLeft });
            }

            return {
                ...state, craftedPotions: newPotions, player: np, activeBuffs: newActiveBuffs,
                turn: state.phase === 'battle' ? 'enemy' : state.turn, // If used in battle, pass turn to enemy
                log: [addLog(msg, 'success'), ...state.log].slice(0, 8)
            };
        }
        
        case 'CLOSE_EVENT': return { ...state, phase: 'home', eventData: null };
        case 'GO_SHOP': return { ...state, phase: 'shop', log: [addLog('🛍️ נכנסת לחנות המקומית.', 'info')] };
        case 'SET_PHASE': return { ...state, phase: action.payload };
        case 'LEAVE_SHOP': return { ...state, phase: 'home' };
        case 'LEAVE_LOOT': return { ...state, phase: state.destination || 'home', lootData: null, destination: null };
        
        case 'BUY_ITEM': {
            const { type, item } = action.payload;
            if (p.gold >= item.cost) {
                if (type === 'potion') {
                    let questsUpdated = false;
                    const upQuests = state.quests.active.map(q => {
                        if (q.type === 'collect_potions' && !q.completed) {
                            questsUpdated = true;
                            const newCurr = Math.min(q.target, q.current + 1);
                            return { ...q, current: newCurr, completed: newCurr >= q.target };
                        }
                        return q;
                    });
                    const newLog = questsUpdated ? [addLog(`📜 התקדמת במשימה!`, 'info'), ...state.log].slice(0, 8) : state.log;
                    return { ...state, player: { ...p, gold: p.gold - item.cost, potions: p.potions + 1 }, quests: { ...state.quests, active: upQuests }, log: newLog }; 
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
                    return { ...state, player: newPlayer, phase: state.destination || 'home', lootData: null, destination: null };
                } else if (!p.ring2) {
                    const newPlayer = { ...p, ring2: item };
                    newPlayer.hp = Math.min(newPlayer.baseMaxHp + (newPlayer.ring1?.hpBonus || 0) + item.hpBonus, newPlayer.hp + item.hpBonus);
                    return { ...state, player: newPlayer, phase: state.destination || 'home', lootData: null, destination: null };
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

            return { ...state, player: newPlayer, phase: state.destination || 'home', lootData: null, destination: null };
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
            } else if (state.pendingRingAction === 'stash') {
                // Remove new ring from stash, send old ring back to stash
                const newStash = [...state.camp.stash];
                newStash.splice(state.pendingStashIndex, 1);
                if (oldItem) newStash.push(oldItem);

                if (slot === 1) newPlayer.ring1 = item;
                if (slot === 2) newPlayer.ring2 = item;
                const newMaxHp2 = newPlayer.baseMaxHp + (newPlayer.ring1?.hpBonus || 0) + (newPlayer.ring2?.hpBonus || 0);
                newPlayer.hp = Math.min(newMaxHp2, newPlayer.hp + (item.hpBonus || 0));

                return {
                    ...state,
                    player: newPlayer,
                    camp: { ...state.camp, stash: newStash },
                    phase: 'camp',
                    pendingRing: null, pendingRingAction: null, pendingStashIndex: null,
                    log: [addLog(`💍 הצטיידת ב-${item.name}!`, 'success'), ...state.log].slice(0, 8)
                };
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
                pendingRing: null, pendingRingAction: null, pendingStashIndex: null, lootData: null,
                log: [...newLogs, ...state.log].slice(0, 8)
            };
        }

        case 'CANCEL_REPLACE_RING': {
            const returnPhase = state.pendingRingAction === 'buy' ? 'shop' 
                              : state.pendingRingAction === 'stash' ? 'camp' 
                              : 'loot';
            return {
                ...state, phase: returnPhase,
                pendingRing: null, pendingRingAction: null, pendingStashIndex: null
            };
        }

        case 'HEAL_POTION': { 
            if (p.potions > 0 && p.hp < playerTotalMaxHp) {
                const tentLevel = state.camp.tentLevel;
                const tentStats = campUpgrades.tent.find(t => t.level === tentLevel) || campUpgrades.tent[0];
                const healPercent = tentStats.healPercent;
                const healAmount = Math.floor(playerTotalMaxHp * healPercent);
                return { ...state, player: { ...p, potions: p.potions - 1, hp: Math.min(playerTotalMaxHp, p.hp + healAmount) }};
            }
            return state;
        }
        
        case 'HEAL_IN_BATTLE': {
            if (state.turn !== 'player' || p.potions <= 0 || p.hp >= playerTotalMaxHp) return state;
            const tentLevel = state.camp.tentLevel;
            const tentStats = campUpgrades.tent.find(t => t.level === tentLevel) || campUpgrades.tent[0];
            const healPercent = tentStats.healPercent;
            const healAmount = Math.floor(playerTotalMaxHp * healPercent);
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
                let questsUpdated = false;
                const updatedQuests = state.quests.active.map(q => {
                    if (!q.completed) {
                        if (q.type === 'kill_monsters' || (q.type === 'kill_boss' && newNe.isBoss)) {
                            questsUpdated = true;
                            const newCurr = Math.min(q.target, q.current + 1);
                            return { ...q, current: newCurr, completed: newCurr >= q.target };
                        }
                    }
                    return q;
                });
                if (questsUpdated) newLogs.unshift(addLog(`📜 התקדמת במשימה!`, 'info'));

                np.xp += newNe.xpReward;
                let goldEarned = newNe.goldReward;
                
                // If has gold buff octopus
                const goldBuff = state.activeBuffs.find(b => b.type === 'gold');
                if (goldBuff) goldEarned = Math.floor(goldEarned * (1 + goldBuff.value));
                np.gold += goldEarned;
                newLogs.unshift(addLog(`🏆 ניצחון! קיבלת ${newNe.xpReward} XP ו-${goldEarned} זהב.`, 'success'));

                let newActiveBuffs = state.activeBuffs.map(b => ({ ...b, battlesLeft: b.battlesLeft - 1 })).filter(b => b.battlesLeft > 0);
                
                const { player: finalPlayer, leveledUp } = checkLevelUp(np);
                if (leveledUp) newLogs.unshift(addLog(`🎉 עלית לרמה ${finalPlayer.level}!`, 'success'));
                
                // Boss victory: unlock next region
                let newHighest = state.highestRegionUnlocked;
                let eventData = null;
                let newWorldLevel = state.worldLevel || 1;
                let newCurrentRegionIndex = state.currentRegionIndex;
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
                    } else if (nextIdx >= regions.length && state.currentRegionIndex === regions.length - 1) {
                        newWorldLevel += 1;
                        newHighest = 0;
                        newCurrentRegionIndex = 0;
                        eventData = {
                            type: 'world_advance',
                            title: `🌍 עולם ${newWorldLevel}!`,
                            desc: `ניצחת את ${newNe.name} וסיימת את כל האזורים! העולם התחזק, המפלצות והשלל עכשיו עוצמתיים בהרבה!`,
                            icon: 'gem'
                        };
                    }
                }

                const newShopInventory = getShopInventory(finalPlayer.level, newWorldLevel);

                let nextPhase = state.destination || (eventData ? 'event' : 'home');
                const prevDest = state.destination;
                
                let loot = null;
                if (!eventData && (Math.random() < 0.4 || newNe.isBoss)) {
                    const types = ['melee', 'magic', 'armor', 'ring'];
                    loot = generateItem(finalPlayer.level + (newNe.isBoss ? 2 : 0), types[Math.floor(Math.random() * types.length)], newWorldLevel);
                    nextPhase = 'loot'; // Note: destination state needs to be cleared or preserved depending on implementation
                }
                
                // If we got loot, keep the destination flag alive so we route properly *after* loot phase. 
                // For now, let's keep it simple: if there's loot, we show it, but when 'LEAVE_LOOT' happens, we need to know where to go.
                // We'll update LEAVE_LOOT and EQUIP_LOOT below.
                
                return { ...state, quests: { ...state.quests, active: updatedQuests }, activeBuffs: newActiveBuffs, lastHitCrit: isCrit, phase: nextPhase, turn: 'player', floatingTexts: newFloatingTexts, player: finalPlayer, enemy: null, lootData: loot, shopInventory: newShopInventory, highestRegionUnlocked: newHighest, currentRegionIndex: newCurrentRegionIndex, worldLevel: newWorldLevel, eventData, destination: loot ? prevDest : null, log: [...newLogs, ...state.log].slice(0, 8) };
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
                const newShopInventory = getShopInventory(death.player.level, state.worldLevel);
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
