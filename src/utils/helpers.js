export const addLog = (text, type = 'info') => ({ 
    text, 
    type, 
    id: Math.random().toString() 
});

export const createFloatingText = (text, type, target) => ({
    id: Math.random().toString(),
    text, 
    type, 
    target // target: 'player' | 'enemy'
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
    if (strong[attackerElement] === defenderElement) return 1.5;
    if (weak[attackerElement] === defenderElement) return 0.5;
    return 1;
};

