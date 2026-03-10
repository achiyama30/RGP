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
