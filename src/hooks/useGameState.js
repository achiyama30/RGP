import { useReducer, useEffect } from 'react';
import { gameReducer, initialState } from '../store/reducers';
import { SAVE_KEY } from '../utils/constants';

export const useGameState = () => {
    const initGameState = (initialState) => {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (savedData) return JSON.parse(savedData);
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
