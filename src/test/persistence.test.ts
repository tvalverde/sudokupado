import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGameStore } from '../store/gameStore';

// Mock the database
vi.mock('../db/database', () => ({
	db: {
		transaction: vi.fn((_mode, _tables, callback) => callback()),
		gameState: {
			where: vi.fn().mockReturnThis(),
			equals: vi.fn().mockReturnThis(),
			delete: vi.fn().mockResolvedValue(undefined),
			first: vi.fn(),
			update: vi.fn(),
			add: vi.fn(),
		},
	},
}));

describe('useAutoSave persistence throttle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();

		const empty9x9 = () =>
			Array(9)
				.fill(null)
				.map(() => Array(9).fill(0));
		const full9x9 = () =>
			Array(9)
				.fill(null)
				.map(() => Array(9).fill(1));
		const emptyNotes = () =>
			Array(9)
				.fill(null)
				.map(() =>
					Array(9)
						.fill(null)
						.map(() => []),
				);

		// Default state for a running game
		useGameStore.setState({
			activePlayerId: 1,
			activeScreen: 'game',
			timeElapsed: 0,
			isPaused: false,
			grid: empty9x9(),
			notes: emptyNotes(),
			mistakes: 0,
			hintsUsed: 0,
			selectedDifficulty: 'beginner',
			initialGrid: full9x9(), // Non-empty to avoid isCleared
			solution: full9x9(), // Non-empty to avoid isCleared
		});

		// Mock db.gameState.first to return null (first save)
		(db.gameState as any).first.mockResolvedValue(null);
	});

	it('should NOT save immediately when time changes (throttle active)', async () => {
		renderHook(() => useAutoSave());

		// Update time twice (2 seconds)
		await act(async () => {
			useGameStore.setState({ timeElapsed: 1 });
		});
		await vi.advanceTimersByTimeAsync(1000);

		await act(async () => {
			useGameStore.setState({ timeElapsed: 2 });
		});
		await vi.advanceTimersByTimeAsync(1000);

		// Throttled interval is 3000ms, so it shouldn't have been called yet
		expect(db.gameState.add).not.toHaveBeenCalled();
	});

	it('should save after the 3-second interval if changes occurred', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			useGameStore.setState({ timeElapsed: 1 });
		});
		await vi.advanceTimersByTimeAsync(3000);

		// Now it should have triggered
		expect(db.gameState.where).toHaveBeenCalledWith('playerId');
		expect(db.gameState.add).toHaveBeenCalled();
	});

	it('should save IMMEDIATELY when the game is paused, bypassing throttle', async () => {
		renderHook(() => useAutoSave());

		// Change state and pause
		await act(async () => {
			useGameStore.setState({ timeElapsed: 1, isPaused: true });
		});

		expect(db.gameState.where).toHaveBeenCalledWith('playerId');
		expect(db.gameState.add).toHaveBeenCalled();
	});

	it('should save IMMEDIATELY when the screen changes from game, bypassing throttle', async () => {
		renderHook(() => useAutoSave());

		// Navigate away
		await act(async () => {
			useGameStore.setState({ activeScreen: 'main' });
		});

		expect(db.gameState.where).toHaveBeenCalledWith('playerId');
		expect(db.gameState.add).toHaveBeenCalled();
	});
});
