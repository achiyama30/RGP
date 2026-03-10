import { rarities, itemNames, elements } from './constants';

const itemElementPool = [elements.FIRE, elements.WATER, elements.NATURE, elements.NEUTRAL, elements.NEUTRAL];

export const generateItem = (level, type) => {
    const roll = Math.random();
    let cumulative = 0;
    let selectedRarity = rarities[0];
    for (const r of rarities) {
        cumulative += r.prob;
        if (roll <= cumulative) { selectedRarity = r; break; }
    }

    const name = `${itemNames[type][Math.floor(Math.random() * itemNames[type].length)]} ${selectedRarity.name}`;
    const baseVal = level * 2 + Math.floor(Math.random() * 3);
    const cost = Math.floor((level * 15 + baseVal * 5) * selectedRarity.mult);
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
    { strMod: 0.8, defMod: 0.7, hpMod: 0.8, emoji: '👺', ai: 'thief' },
    { strMod: 1.1, defMod: 0.7, hpMod: 0.8, emoji: '🐺', ai: 'aggressive' },
    { strMod: 1.5, defMod: 0.8, hpMod: 1.1, emoji: '🔥', ai: 'normal' },
    { strMod: 1.8, defMod: 0.6, hpMod: 0.9, emoji: '🧙‍♂️', ai: 'poisoner' },
    { strMod: 0.9, defMod: 1.2, hpMod: 0.9, emoji: '💀', ai: 'normal' },
    { strMod: 1.8, defMod: 1.2, hpMod: 1.5, emoji: '🐂', ai: 'heavy' },
];

export const generateEnemy = (level, region) => {
    const isBossEncounter = Math.random() < 0.08 && level >= 3;
    
    if (isBossEncounter && region) {
        const boss = region.boss;
        return {
            id: Math.random().toString(),
            name: boss.name, level, isBoss: true, emoji: '👑', ai: 'boss_heavy',
            element: boss.element,
            hp: Math.floor((40 + (level * 15)) * boss.hpMult),
            maxHp: Math.floor((40 + (level * 15)) * boss.hpMult),
            str: Math.floor((8 + (level * 4)) * boss.strMult),
            def: Math.floor((2 + (level * 2)) * 1.3),
            goldReward: Math.floor((10 + Math.random() * 15 + (level * 5)) * 8),
            xpReward: Math.floor((20 + (level * 15)) * 5),
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
        name: monsterName, level, isBoss: false, emoji: archetype.emoji, ai: archetype.ai,
        element: monsterElement,
        hp: Math.floor((40 + (level * 15)) * archetype.hpMod),
        maxHp: Math.floor((40 + (level * 15)) * archetype.hpMod),
        str: Math.floor((8 + (level * 4)) * archetype.strMod),
        def: Math.floor((2 + (level * 2)) * archetype.defMod),
        goldReward: Math.floor(10 + Math.random() * 15 + (level * 5)),
        xpReward: Math.floor(20 + (level * 15)),
        stunTurns: 0,
        statuses: []
    };
};

export const getShopInventory = (level) => ({ 
    melee: generateItem(level, 'melee'), 
    magic: generateItem(level, 'magic'), 
    armor: generateItem(level, 'armor'),
    ring: generateItem(level, 'ring')
});

