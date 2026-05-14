import { useEffect } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

export const useAutoSave = () => {
	const state = useGameStore();
	const {
		activePlayerId,
		grid,
		initialGrid,
		solution,
		notes,
		timeElapsed,
		mistakes,
		hintsUsed,
		isPaused,
		activeScreen,
		selectedDifficulty,
	} = state;

	useEffect(() => {
		// Only auto-save if we are in the game screen and have an active player
		if (activeScreen !== 'game' || !activePlayerId) return;

		const saveGame = async () => {
			try {
				const existing = await db.gameState.where('playerId').equals(activePlayerId).first();

				const data = {
					playerId: activePlayerId,
					grid,
					initialGrid,
					solution, // We need to store this to resume validation
					notes,
					timeElapsed,
					mistakes,
					hintsUsed,
					isPaused,
					difficulty: selectedDifficulty,
				};

				if (existing) {
					await db.gameState.update(existing.id!, data);
				} else {
					await db.gameState.add(data);
				}
			} catch (error) {
				console.error('Auto-save failed:', error);
			}
		};

		// Use a small timeout or just save on every relevant state change
		// Since IndexedDB is async and this is a Sudoku game (low freq changes), it's fine
		saveGame();
	}, [
		activePlayerId,
		grid,
		notes,
		timeElapsed,
		mistakes,
		hintsUsed,
		isPaused,
		activeScreen,
		selectedDifficulty,
		initialGrid,
		solution,
	]);
};
