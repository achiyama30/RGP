import { rarities, itemNames } from './constants';

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

    const item = { id: Math.random().toString(), name, type, rarity: selectedRarity, level, cost, str: 0, def: 0, mag: 0, mpBonus: 0, hpBonus: 0, evadeBonus: 0, critBonus: 0 };
    
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

export const generateEnemy = (level) => {
    const enemies = [
        { name: 'גובלין שודד', strMod: 0.8, defMod: 0.7, hpMod: 0.8, emoji: '👺', minLevel: 1, ai: 'thief' },
        { name: 'זאב רעב', strMod: 1.1, defMod: 0.7, hpMod: 0.8, emoji: '🐺', minLevel: 1, ai: 'aggressive' },
        { name: 'שד אש', strMod: 1.5, defMod: 0.8, hpMod: 1.1, emoji: '🔥', minLevel: 2, ai: 'normal' },
        { name: 'קוסם אפל', strMod: 1.8, defMod: 0.6, hpMod: 0.9, emoji: '🧙‍♂️', minLevel: 3, ai: 'poisoner' },
        { name: 'שלד לוחם', strMod: 0.9, defMod: 1.2, hpMod: 0.9, emoji: '💀', minLevel: 3, ai: 'normal' },
        { name: 'מינוטאור אכזרי', strMod: 1.8, defMod: 1.2, hpMod: 1.5, emoji: '🐂', minLevel: 5, ai: 'heavy' },
    ];
    const bosses = [
        { name: 'מלך הגובלינים', strMod: 1.5, defMod: 1.2, hpMod: 1.8, emoji: '👑', minLevel: 3, ai: 'boss_heavy' },
        { name: 'דרקון עתיק', strMod: 1.8, defMod: 1.4, hpMod: 2.0, emoji: '🐉', minLevel: 8, ai: 'boss_heavy' }, 
    ];

    const isBossEncounter = Math.random() < 0.10 && level >= 3;
    let available = isBossEncounter ? bosses.filter(b => b.minLevel <= level) : enemies.filter(e => e.minLevel <= level);
    if (available.length === 0) available = enemies.filter(e => e.minLevel === 1);
    
    let type = available[Math.floor(Math.random() * available.length)];
    const isBoss = isBossEncounter;
    
    return {
        id: Math.random().toString(),
        name: `${type.name}`, level, isBoss, emoji: type.emoji, ai: type.ai,
        hp: Math.floor((40 + (level * 15)) * type.hpMod * (isBoss ? 2 : 1)),
        maxHp: Math.floor((40 + (level * 15)) * type.hpMod * (isBoss ? 2 : 1)),
        str: Math.floor((8 + (level * 4)) * type.strMod),
        def: Math.floor((2 + (level * 2)) * type.defMod),
        goldReward: Math.floor((10 + Math.random() * 15 + (level * 5)) * (isBoss ? 5 : 1)),
        xpReward: Math.floor((20 + (level * 15)) * (isBoss ? 4 : 1)),
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
