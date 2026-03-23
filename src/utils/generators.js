import { rarities, itemNames, elements } from './constants';

const itemElementPool = [elements.FIRE, elements.WATER, elements.NATURE, elements.NEUTRAL, elements.NEUTRAL];

export const generateItem = (level, type, worldLevel = 1) => {
    const scale = Math.pow(1.5, Math.max(0, worldLevel - 1));
    const roll = Math.random();
    let cumulative = 0;
    let selectedRarity = rarities[0];
    for (const r of rarities) {
        cumulative += r.prob;
        if (roll <= cumulative) { selectedRarity = r; break; }
    }

    const name = `${itemNames[type][Math.floor(Math.random() * itemNames[type].length)]} ${selectedRarity.name}`;
    const baseVal = Math.floor((level * 2 + Math.floor(Math.random() * 3)) * scale);
    const cost = Math.floor((level * 15 * scale + baseVal * 5) * selectedRarity.mult);
    const element = itemElementPool[Math.floor(Math.random() * itemElementPool.length)];

    const item = { id: Math.random().toString(), name, type, rarity: selectedRarity, level, cost, element, str: 0, def: 0, mag: 0, mpBonus: 0, hpBonus: 0, evadeBonus: 0, critBonus: 0 };
    
    if (type === 'melee') item.str = Math.floor(baseVal * selectedRarity.mult) + 1;
    if (type === 'magic') {
        item.mag = Math.floor(baseVal * selectedRarity.mult) + 1;
        item.mpBonus = Math.floor(baseVal * 3 * selectedRarity.mult);
    }
    if (type === 'armor') {
        item.def = Math.floor(baseVal * 0.8 * selectedRarity.mult) + 1;
        item.mpBonus = Math.floor(baseVal * 1.5 * selectedRarity.mult);
    }
    if (type === 'ring') {
        const ringFocus = Math.random();
        if (ringFocus < 0.33) item.hpBonus = Math.floor(baseVal * 5 * selectedRarity.mult);
        else if (ringFocus < 0.66) item.evadeBonus = Math.floor(baseVal * 1.5 * selectedRarity.mult);
        else item.critBonus = Math.floor(baseVal * 1.5 * selectedRarity.mult);
    }
    return item;
};

const archetypes = [
    { strMod: 0.8, defMod: 0.7, hpMod: 0.8, icon: 'Ghost', ai: 'thief' },
    { strMod: 1.1, defMod: 0.7, hpMod: 0.8, icon: 'Eye', ai: 'aggressive' },
    { strMod: 1.5, defMod: 0.8, hpMod: 1.1, icon: 'Flame', ai: 'normal' },
    { strMod: 1.8, defMod: 0.6, hpMod: 0.9, icon: 'Wand', ai: 'poisoner' },
    { strMod: 0.9, defMod: 1.2, hpMod: 0.9, icon: 'Skull', ai: 'normal' },
    { strMod: 1.8, defMod: 1.2, hpMod: 1.5, icon: 'ShieldAlert', ai: 'heavy' },
];

export const generateEnemy = (level, region, worldLevel = 1, isNight = false) => {
    const isBossEncounter = Math.random() < 0.08 && level >= 3;
    const scale = Math.pow(1.5, Math.max(0, worldLevel - 1));
    
    if (isBossEncounter && region) {
        const boss = region.boss;
        return {
            id: Math.random().toString(),
            name: boss.name, level, isBoss: true, icon: 'Crown', ai: 'boss_heavy',
            element: boss.element,
            hp: Math.floor((40 + (level * 15)) * boss.hpMult * scale),
            maxHp: Math.floor((40 + (level * 15)) * boss.hpMult * scale),
            str: Math.floor((8 + (level * 4)) * boss.strMult * scale),
            def: Math.floor((2 + (level * 2)) * 1.3 * scale),
            goldReward: Math.floor((10 + Math.random() * 15 + (level * 5)) * 8 * scale * (isNight ? 1.5 : 1)),
            xpReward: Math.floor((20 + (level * 15)) * 5 * scale * (isNight ? 1.5 : 1)),
            stunTurns: 0,
            statuses: []
        };
    }

    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    const monsterNames = region ? region.monsters : ['שד אפל', 'גריפון זועם', 'נמר צל'];
    const monsterName = monsterNames[Math.floor(Math.random() * monsterNames.length)];
    const monsterElement = region ? region.element : elements.NEUTRAL;

    return {
        id: Math.random().toString(),
        name: isNight ? `[לילה] ${monsterName}` : monsterName, level, isBoss: false, icon: archetype.icon, ai: archetype.ai,
        element: monsterElement,
        hp: Math.floor((40 + (level * 15)) * archetype.hpMod * scale * (isNight ? 1.5 : 1)),
        maxHp: Math.floor((40 + (level * 15)) * archetype.hpMod * scale * (isNight ? 1.5 : 1)),
        str: Math.floor((8 + (level * 4)) * archetype.strMod * scale * (isNight ? 1.5 : 1)),
        def: Math.floor((2 + (level * 2)) * archetype.defMod * scale * (isNight ? 1.2 : 1)),
        goldReward: Math.floor((10 + Math.random() * 15 + (level * 5)) * scale * (isNight ? 1.5 : 1)),
        xpReward: Math.floor((20 + (level * 15)) * scale * (isNight ? 1.5 : 1)),
        stunTurns: 0,
        statuses: []
    };
};

export const getShopInventory = (level, worldLevel = 1) => ({ 
    melee: generateItem(level, 'melee', worldLevel), 
    magic: generateItem(level, 'magic', worldLevel), 
    armor: generateItem(level, 'armor', worldLevel),
    ring: generateItem(level, 'ring', worldLevel)
});

export const getUpgradeCost = (item, blacksmithDiscount) => {
    if (!item) return 0;
    const rarityIndex = rarities.findIndex(r => r.name === item.rarity.name);
    // Base cost depends on item level and current rarity
    const baseCost = Math.floor(item.cost * 0.8 * (rarityIndex + 1));
    return Math.max(10, Math.floor(baseCost * (1 - blacksmithDiscount)));
};

export const upgradeItem = (item) => {
    if (!item) return null;
    
    // Find current rarity and next rarity
    const currentRarityIndex = rarities.findIndex(r => r.name === item.rarity.name);
    const isMaxRarity = currentRarityIndex === rarities.length - 1;
    
    let newItem = { ...item, id: Math.random().toString() };
    
    if (!isMaxRarity) {
        // Upgrade Rarity
        newItem.rarity = rarities[currentRarityIndex + 1];
        // Strip out old rarity name and append new one
        const baseName = item.name.replace(` ${item.rarity.name}`, '');
        newItem.name = `${baseName} ${newItem.rarity.name}`;
    }
    
    // Boost stats (even if max rarity, it gets a small level bump equivalent)
    const statBoost = isMaxRarity ? 1.15 : (newItem.rarity.mult / item.rarity.mult);
    
    if (newItem.str > 0) newItem.str = Math.floor(newItem.str * statBoost) + 1;
    if (newItem.mag > 0) newItem.mag = Math.floor(newItem.mag * statBoost) + 1;
    if (newItem.def > 0) newItem.def = Math.floor(newItem.def * statBoost) + 1;
    if (newItem.mpBonus > 0) newItem.mpBonus = Math.floor(newItem.mpBonus * statBoost) + 1;
    if (newItem.hpBonus > 0) newItem.hpBonus = Math.floor(newItem.hpBonus * statBoost) + 5;
    if (newItem.evadeBonus > 0) newItem.evadeBonus = Math.floor(newItem.evadeBonus * statBoost) + 1;
    if (newItem.critBonus > 0) newItem.critBonus = Math.floor(newItem.critBonus * statBoost) + 1;
    
    // Increase the intrinsic cost value of the item so selling it yields more
    newItem.cost = Math.floor(newItem.cost * statBoost * 1.2);
    
    return newItem;
};

export const generateQuests = (playerLevel) => {
    const killTarget = 25 + Math.floor(Math.random() * 15) + Math.floor(playerLevel * 2);
    const potionTarget = 8 + Math.floor(Math.random() * 5);
    const bossTarget = 2 + Math.floor(playerLevel / 5); // Gets harder as you level up
    return [
        {
            id: Math.random().toString(),
            type: 'kill_monsters',
            title: `הרוג ${killTarget} מפלצות`,
            target: killTarget,
            current: 0,
            completed: false,
            claimed: false
        },
        {
            id: Math.random().toString(),
            type: 'collect_potions',
            title: `קנה ${potionTarget} שיקויים`,
            target: potionTarget,
            current: 0,
            completed: false,
            claimed: false
        },
        {
            id: Math.random().toString(),
            type: 'kill_boss',
            title: `הבס ${bossTarget} בוסים`,
            target: bossTarget,
            current: 0,
            completed: false,
            claimed: false
        }
    ];
};
