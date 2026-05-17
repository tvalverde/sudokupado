import { useCallback, useEffect, useRef } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

export const clearSavedGame = async (): Promise<void> => {
	const { activePlayerId } = useGameStore.getState();
	const playerId = activePlayerId ?? 0;
	try {
		await db.transaction('rw', db.gameState, async () => {
			await db.gameState.where('playerId').equals(playerId).delete();
		});
	} catch (err) {
		console.error('Failed to clean zombie state:', err);
	}
};

export const useAutoSave = () => {
	const lastSavedStateRef = useRef<string>('');

	const saveGame = useCallback(async (force = false) => {
		const currentState = useGameStore.getState();
		const { activePlayerId, activeScreen } = currentState;

		if (!force && activeScreen !== 'game') return;

		const playerId = activePlayerId ?? 0;

		const isWon = currentState.lastGameResult !== null;
		const isLost =
			currentState.maxMistakes > 0 && currentState.mistakes >= currentState.maxMistakes;
		const isCleared = currentState.solution[0]?.[0] === 0;

		if (isWon || isLost || isCleared) {
			await clearSavedGame();
			return;
		}

		const stateSnapshot = JSON.stringify({
			grid: currentState.grid,
			notes: currentState.notes,
			timeElapsed: currentState.timeElapsed,
			mistakes: currentState.mistakes,
			hintsUsed: currentState.hintsUsed,
			isPaused: currentState.isPaused,
		});

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

	useEffect(() => {
		const interval = setInterval(() => {
			saveGame();
		}, 3000);

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				saveGame();
			}
		};
		const handleBeforeUnload = () => {
			saveGame();
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		document.addEventListener('visibilitychange', handleVisibilityChange);

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
