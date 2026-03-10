import { useReducer, useEffect } from 'react';
import { gameReducer, initialState } from '../store/reducers';
import { SAVE_KEY } from '../utils/constants';

export const useGameState = () => {
    const initGameState = (initialState) => {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                // Migration: add new fields for saves that predate the region system
                if (parsed.currentRegionIndex === undefined) parsed.currentRegionIndex = 0;
                if (parsed.highestRegionUnlocked === undefined) parsed.highestRegionUnlocked = 0;
                if (parsed.player && parsed.player.slamCooldown === undefined) parsed.player.slamCooldown = 0;
                if (parsed.player && parsed.player.burstCooldown === undefined) parsed.player.burstCooldown = 0;
                if (parsed.player && parsed.player.specialCooldown !== undefined) delete parsed.player.specialCooldown;
                return parsed;
            }
        } catch (error) { 
            console.error("שגיאה בטעינת השמירה:", error); 
        }
        return initialState;
    };

    const [state, dispatch] = useReducer(gameReducer, initialState, initGameState);

    useEffect(() => {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }, [state]);

    return [state, dispatch];
};
