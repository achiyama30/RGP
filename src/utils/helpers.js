export const addLog = (text, type = 'info') => ({ 
    text, 
    type, 
    id: Math.random().toString() 
});

export const createFloatingText = (text, type, target, elemMult = 1) => ({
    id: Math.random().toString(),
    text, 
    type, 
    target, // target: 'player' | 'enemy'
    elemMult // 2 = advantage (huge yellow), 0.5 = disadvantage (small gray), 1 = normal
});

// Elemental triangle: Fire > Nature > Water > Fire
// +50% damage for strong matchup, -50% for weak matchup
export const getElementalMultiplier = (attackerElement, defenderElement) => {
    if (!attackerElement || !defenderElement) return 1;
    const strong = {
        'אש': 'טבע',
        'טבע': 'מים',
        'מים': 'אש',
    };
    const weak = {
        'אש': 'מים',
        'טבע': 'אש',
        'מים': 'טבע',
    };
    if (strong[attackerElement] === defenderElement) return 2.0;
    if (weak[attackerElement] === defenderElement) return 0.5;
    return 1;
};

