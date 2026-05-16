import { useCallback, useEffect, useRef } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

export const useAutoSave = () => {
	const lastSavedStateRef = useRef<string>('');

	const saveGame = useCallback(async (force = false) => {
		// Use getState() to avoid subscribing to state changes and causing re-renders
		const currentState = useGameStore.getState();
		const { activePlayerId, activeScreen } = currentState;

		// We allow guest (activePlayerId === null) to be saved using ID 0
		if (!force && activeScreen !== 'game') return;

		const playerId = activePlayerId ?? 0;

		// Session Integrity: Don't save if the game is already resolved or cleared
		const isWon = currentState.lastGameResult !== null;
		const isLost =
			currentState.maxMistakes > 0 && currentState.mistakes >= currentState.maxMistakes;
		const isCleared = currentState.solution[0]?.[0] === 0;

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
			await db.transaction('rw', db.gameState, async () => {
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
			});

			lastSavedStateRef.current = stateSnapshot;
		} catch (error) {
			console.error('Auto-save failed:', error);
		}
	}, []);

	// Main auto-save lifecycle
	useEffect(() => {
		// Periodic throttle: attempt to save every 3 seconds
		const interval = setInterval(() => {
			saveGame();
		}, 3000);

		// Handle abrupt browser closures and mobile suspension
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				saveGame(true);
			}
		};
		const handleBeforeUnload = () => {
			saveGame(true);
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Subscription to capture critical screen/pause changes WITHOUT causing re-renders
		const unsubscribe = useGameStore.subscribe((state, prevState) => {
			const hasLeftGame = prevState.activeScreen === 'game' && state.activeScreen !== 'game';
			const hasPaused = !prevState.isPaused && state.isPaused;

			if (hasPaused || hasLeftGame) {
				saveGame(true);
			}
		});

		return () => {
			clearInterval(interval);
			window.removeEventListener('beforeunload', handleBeforeUnload);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			unsubscribe();
		};
	}, [saveGame]);
};
