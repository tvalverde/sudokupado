import { useCallback, useEffect, useRef } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

export const useAutoSave = () => {
	const state = useGameStore();
	const lastSavedStateRef = useRef<string>('');
	const stateRef = useRef(state);
	const lastScreenRef = useRef(state.activeScreen);

	// Sync the latest state to a ref to avoid stale closures in the interval
	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	const saveGame = useCallback(async (force = false) => {
		const currentState = stateRef.current;
		const { activePlayerId, activeScreen } = currentState;

		// We allow guest (activePlayerId === null) to be saved using ID 0
		if (!force && activeScreen !== 'game') return;

		const playerId = activePlayerId ?? 0;

		// Session Integrity: Don't save if the game is already resolved or cleared
		const isWon = currentState.lastGameResult !== null;
		const isLost =
			currentState.maxMistakes > 0 && currentState.mistakes >= currentState.maxMistakes;
		const isCleared = currentState.solution[0]?.[0] === 0; // initGame sets solution to emptyGrid on clear

		if (isWon || isLost || isCleared) {
			db.gameState
				.where('playerId')
				.equals(playerId)
				.delete()
				.catch((err) => console.error('Failed to clean zombie state:', err));
			return;
		}

		// Create a snapshot of the current state to detect changes
		const stateSnapshot = JSON.stringify({
			grid: currentState.grid,
			notes: currentState.notes,
			timeElapsed: currentState.timeElapsed,
			mistakes: currentState.mistakes,
			hintsUsed: currentState.hintsUsed,
			isPaused: currentState.isPaused,
		});

		// Skip if nothing changed and we are not forcing the save
		if (!force && stateSnapshot === lastSavedStateRef.current) return;

		try {
			const existing = await db.gameState.where('playerId').equals(playerId).first();

			const data = {
				playerId: playerId,
				grid: currentState.grid,
				initialGrid: currentState.initialGrid,
				solution: currentState.solution,
				notes: currentState.notes,
				timeElapsed: currentState.timeElapsed,
				mistakes: currentState.mistakes,
				hintsUsed: currentState.hintsUsed,
				isPaused: currentState.isPaused,
				difficulty: currentState.selectedDifficulty,
			};

			if (existing) {
				await db.gameState.update(existing.id!, data);
			} else {
				await db.gameState.add(data);
			}

			lastSavedStateRef.current = stateSnapshot;
		} catch (error) {
			console.error('Auto-save failed:', error);
		}
	}, []);

	// Periodic throttle: attempt to save every 3 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			saveGame();
		}, 3000);

		return () => clearInterval(interval);
	}, [saveGame]);

	// Immediate save on critical events to ensure no data loss
	useEffect(() => {
		const wasInGame = lastScreenRef.current === 'game';
		const hasLeftGame = wasInGame && state.activeScreen !== 'game';

		if (state.isPaused || hasLeftGame) {
			saveGame(true);
		}

		lastScreenRef.current = state.activeScreen;
	}, [state.isPaused, state.activeScreen, saveGame]);
};
