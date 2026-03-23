import { useReducer, useEffect } from 'react';
import { gameReducer, initialState } from '../store/reducers';
import { SAVE_KEY } from '../utils/constants';
import { generateQuests } from '../utils/generators';

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
                
                // Migration: add camp system for older saves
                if (parsed.camp === undefined) {
                    parsed.camp = {
                        tentLevel: 1,
                        blacksmithLevel: 1,
                        stash: []
                    };
                }
                
                // Migration: add time system and quests
                if (parsed.timeSystem === undefined) {
                    parsed.timeSystem = {
                        isDay: true,
                        nextCycleTime: Date.now() + 5 * 60 * 60 * 1000
                    };
                }
                
                if (parsed.quests === undefined) {
                    parsed.quests = {
                        nextResetTime: Date.now() + 5 * 60 * 60 * 1000,
                        active: generateQuests(parsed.player?.level || 1)
                    };
                } else if (parsed.quests.active?.[0] && !parsed.quests.active[0].title) {
                    // Migration: regenerate quests that are missing the new 'title' field
                    parsed.quests.active = generateQuests(parsed.player?.level || 1);
                }
                
                return parsed;
            }
        } catch (error) { 
            console.error("שגיאה בטעינת השמירה:", error); 
        }
        return JSON.parse(JSON.stringify(initialState));
    };

    const [state, dispatch] = useReducer(gameReducer, initialState, initGameState);

    useEffect(() => {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }, [state]);

    return [state, dispatch];
};
