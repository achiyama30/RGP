export const SAVE_KEY = 'rpg_quest_save_v3';

export const rarities = [
    { name: 'חלוד', mult: 0.7, prob: 0.35, colorClass: 'text-slate-500', style: 'border-t-slate-700 bg-slate-950/70 border-x-transparent border-b-transparent' },
    { name: 'פשוט', mult: 1.0, prob: 0.40, colorClass: 'text-slate-300', style: 'border-t-slate-500 bg-slate-900/60 border-x-transparent border-b-transparent' },
    { name: 'טוב', mult: 1.4, prob: 0.15, colorClass: 'text-emerald-500', style: 'border-t-emerald-700 bg-emerald-950/20 border-x-transparent border-b-transparent' },
    { name: 'מצוין', mult: 2.0, prob: 0.08, colorClass: 'text-indigo-400', style: 'border-t-indigo-600 bg-indigo-950/20 border-x-transparent border-b-transparent' },
    { name: 'אגדי', mult: 3.0, prob: 0.02, colorClass: 'text-amber-500 font-bold tracking-wider', style: 'border-t-amber-500 bg-amber-950/30 shadow-[inset_0_10px_20px_rgba(245,158,11,0.05)] border-x-transparent border-b-transparent' }
];

export const itemNames = {
    melee: ['חרב ברזל', 'גרזן מלחמה', 'פטיש קרב', 'פגיון כפול', 'חרב ארוכה'],
    magic: ['שרביט עץ', 'מטה בדולח', 'ספר לחשים', 'כדור אש', 'מטה רונות'],
    armor: ['שריון עור', 'שריון שרשראות', 'שריון לוחות', 'גלימת מגן', 'שריון קשקשים'],
    ring: ['טבעת חיים', 'קמע זריזות', 'טבעת המלך', 'קמע עין-נץ', 'טבעת אודם']
};

export const elements = {
    FIRE: 'אש',
    WATER: 'מים',
    NATURE: 'טבע',
    NEUTRAL: 'רגיל'
};

export const regions = [
    {
        id: 'forest',
        name: 'יער לוחש',
        element: elements.NATURE,
        minLevel: 1,
        boss: { name: 'אלון עתיק מושחת', hpMult: 3, strMult: 1.5, magMult: 1.5, element: elements.NATURE },
        monsters: ['זאב בלהות', 'גובלין סורר', 'עכביש ענק', 'שדון יער', 'טרול מעמקים']
    },
    {
        id: 'volcano',
        name: 'מערות הלהבה',
        element: elements.FIRE,
        minLevel: 5,
        boss: { name: 'שדון האש הגדול', hpMult: 4, strMult: 2, magMult: 2, element: elements.FIRE },
        monsters: ['כלב אש', 'גולם לבה', 'לוחם אפר', 'סלמנדרה', 'רוח אש מתפרצת']
    },
    {
        id: 'dark_lake',
        name: 'האגם האפל',
        element: elements.WATER,
        minLevel: 12,
        boss: { name: 'לוויתן הצללים', hpMult: 5, strMult: 2.5, magMult: 2.5, element: elements.WATER },
        monsters: ['חייל טבוע', 'שומרת האגם', 'סרטן אימה', 'ריר רעיל', 'זוחל ממעמקים']
    }
];

export const campUpgrades = {
    tent: [
        { level: 1, cost: 0, healPercent: 0.4 },
        { level: 2, cost: 200, healPercent: 0.5 },
        { level: 3, cost: 800, healPercent: 0.65 },
        { level: 4, cost: 2500, healPercent: 0.8 },
        { level: 5, cost: 8000, healPercent: 1.0 },
    ],
    blacksmith: [
        { level: 1, cost: 0, discount: 0 },
        { level: 2, cost: 300, discount: 0.1 },
        { level: 3, cost: 1000, discount: 0.2 },
        { level: 4, cost: 3000, discount: 0.35 },
        { level: 5, cost: 10000, discount: 0.5 },
    ]
};

export const MINERALS = {
    copper:   { id: 'copper',  name: 'נחושת',  icon: 'Mountain', color: 'text-orange-400' },
    iron:     { id: 'iron',    name: 'ברזל',   icon: 'Cog', color: 'text-slate-300' },
    goldOre:  { id: 'goldOre', name: 'עפרת זהב', icon: 'Sparkles', color: 'text-yellow-400' },
    mithril:  { id: 'mithril', name: 'מיתריל', icon: 'Gem', color: 'text-cyan-400' }
};

export const FISH_TYPES = [
    { id: 'salmon',   name: 'סלמון',    icon: 'Fish', buffType: 'str',    buffValue: 0.25, battlesLeft: 2,  rarity: 0.35 },
    { id: 'trout',    name: 'פסטרייה',  icon: 'Fish', buffType: 'def',    buffValue: 0.35, battlesLeft: 1,  rarity: 0.30 },
    { id: 'bass',     name: 'בס',       icon: 'Fish', buffType: 'hp',     buffValue: 100,  battlesLeft: 1,  rarity: 0.20 },
    { id: 'octopus',  name: 'תמנון', icon: 'Waves', buffType: 'gold',   buffValue: 0.25, battlesLeft: 3,  rarity: 0.10 },
    { id: 'shark',    name: 'כריש',     icon: 'Anchor', buffType: 'allDmg', buffValue: 0.40, battlesLeft: 1,  rarity: 0.05 }
];

export const ALCHEMY_RECIPES = [
    {
        id: 'heal_strong',
        name: 'שיקוי ריפוי משופר',
        icon: 'Heart',
        desc: 'מרפא 80% מהחיים',
        cost: { copper: 2 },
        effect: { type: 'heal', value: 0.8 }
    },
    {
        id: 'str_brew',
        name: 'תמצית כוח',
        icon: 'Sword',
        desc: '+30% STR לכל הקרב',
        cost: { iron: 2 },
        effect: { type: 'str', value: 0.30, battlesLeft: 1 }
    },
    {
        id: 'def_brew',
        name: 'תמצית הגנה',
        icon: 'Shield',
        desc: '+30% DEF לכל הקרב',
        cost: { copper: 1, iron: 1 },
        effect: { type: 'def', value: 0.30, battlesLeft: 1 }
    },
    {
        id: 'mana_brew',
        name: 'תמצית מאנה',
        icon: 'Zap',
        desc: 'מחזיר MP מלא',
        cost: { iron: 1 },
        effect: { type: 'mp', value: 1.0 }
    },
    {
        id: 'power_brew',
        name: 'שיקוי עצמה',
        icon: 'FlaskConical',
        desc: '+50% כל הסטטים ל-3 תורות',
        cost: { goldOre: 1 },
        effect: { type: 'all', value: 0.50, battlesLeft: 3 }
    },
    {
        id: 'mithril_elixir',
        name: 'אליקסיר מיתריל',
        icon: 'Star',
        desc: 'מרפא הכל + +100% STR+DEF לכל הקרב',
        cost: { mithril: 1 },
        effect: { type: 'mithril_elixir', value: 1.0, battlesLeft: 999 }
    }
];

