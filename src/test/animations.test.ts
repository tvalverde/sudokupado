import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('SudokuBoard Animations', () => {
	beforeEach(() => {
		const store = useGameStore.getState();
		const initial = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
		const solution = Array(9)
			.fill(null)
			.map(() => Array(9).fill(1));
		act(() => {
			store.initGame(initial, solution, 'beginner');
		});
	});

	it('should trigger animation state when a row is completed correctly', () => {
		const store = useGameStore.getState();

		// Fill 8 out of 9 cells in row 0 with correct value (1)
		act(() => {
			for (let c = 0; c < 8; c++) {
				store.setCellValue(0, c, 1);
			}
		});

		// Animation state should be empty
		expect(useGameStore.getState().activeAnimations.rows).toHaveLength(0);

		// Complete the row
		act(() => {
			store.setCellValue(0, 8, 1);
		});

		// Row 0 should be in activeAnimations
		expect(useGameStore.getState().activeAnimations.rows).toContain(0);
	});

	it('should clear animation state after 1 second', async () => {
		vi.useFakeTimers();
		const store = useGameStore.getState();

		// Complete a row naturally
		act(() => {
			// Fill row 0
			for (let c = 0; c < 9; c++) {
				store.setCellValue(0, c, 1);
			}
		});

		expect(useGameStore.getState().activeAnimations.rows).toContain(0);

		// Advance time
		act(() => {
			vi.advanceTimersByTime(1100);
		});

		expect(useGameStore.getState().activeAnimations.rows).toHaveLength(0);
		vi.useRealTimers();
	});
});
