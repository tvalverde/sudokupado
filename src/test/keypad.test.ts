import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Regression: Keypad Completed Status', () => {
	beforeEach(() => {
		localStorage.clear();
		useGameStore.getState().clearSavedGame();
	});

	it('should mark a number as completed when it appears 9 times correctly', () => {
		const { initGame, isNumberCompleted } = useGameStore.getState();

		// Create a mock grid where '1' is completed
		const initial = Array(9)
			.fill(0)
			.map(() => Array(9).fill(0));
		const solution = Array(9)
			.fill(0)
			.map(() => Array(9).fill(1)); // All 1s for simplicity

		initGame(initial, solution, 'beginner');

		const { setCellValue } = useGameStore.getState();

		// Fill 8 cells correctly
		for (let i = 0; i < 8; i++) {
			setCellValue(i, 0, 1);
		}

		expect(useGameStore.getState().isNumberCompleted(1)).toBe(false);

		// Fill the 9th cell correctly
		setCellValue(8, 0, 1);

		expect(useGameStore.getState().isNumberCompleted(1)).toBe(true);
	});

	it('should NOT mark a number as completed if some entries are incorrect', () => {
		const { initGame, setCellValue } = useGameStore.getState();
		const initial = Array(9)
			.fill(0)
			.map(() => Array(9).fill(0));
		// Solution has 1s only in first row, 2s elsewhere
		const solution = Array(9)
			.fill(0)
			.map((_, r) => Array(9).fill(r === 0 ? 1 : 2));

		initGame(initial, solution, 'beginner');

		// Put nine '1's but only one is correct (at 0,0)
		for (let i = 0; i < 9; i++) {
			setCellValue(i, 0, 1);
		}

		// Although there are nine '1's on grid, only 1 matches the solution
		expect(useGameStore.getState().isNumberCompleted(1)).toBe(false);
	});
});
