export const SAVE_KEY = 'rpg_quest_save_v2';

export const rarities = [
    { name: 'חלוד', mult: 0.7, prob: 0.35, colorClass: 'text-slate-500', style: 'border-slate-700 bg-slate-900/50' },
    { name: 'פשוט', mult: 1.0, prob: 0.40, colorClass: 'text-slate-200', style: 'border-slate-500 bg-slate-800/50' },
    { name: 'טוב', mult: 1.4, prob: 0.15, colorClass: 'text-emerald-400', style: 'border-emerald-500 bg-emerald-950/30' },
    { name: 'מצוין', mult: 2.0, prob: 0.08, colorClass: 'text-purple-400', style: 'border-purple-500 bg-purple-950/30' },
    { name: 'אגדי', mult: 3.0, prob: 0.02, colorClass: 'text-orange-400 font-black', style: 'border-orange-500 bg-orange-950/40 animate-pulse' }
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
        id: 'tundra',
        name: 'פסגת הקרח',
        element: elements.WATER,
        minLevel: 12,
        boss: { name: 'לורד הקרחון', hpMult: 5, strMult: 2.5, magMult: 2.5, element: elements.WATER },
        monsters: ['זאב שלג', 'לוחם כפור', 'גולם קרח', 'רוח סערה', 'ממותה גוויה']
    }
];
