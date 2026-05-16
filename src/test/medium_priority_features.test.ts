import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Medium Priority Features - Regression & New Requirements', () => {
	it('Puntuación Asintótica: should never reach 0 due to time and use 1200 as decay factor', () => {
		const { calculateScore } = {
			calculateScore: (difficulty: string, time: number, mistakes: number, hints: number) => {
				const baseScores: any = { beginner: 2000, intermediate: 4000, expert: 6000, master: 8000 };
				const base = baseScores[difficulty] || 2000;
				const timeMultiplier = 1200 / (1200 + time);
				let score = base * timeMultiplier;
				score -= mistakes * 200;
				if (hints > 0) score = score * 0.9 ** hints;
				return Math.max(0, Math.floor(score));
			},
		};

		// 20 minutes (1200s) should halve the score
		expect(calculateScore('beginner', 1200, 0, 0)).toBe(1000);
		// 1 hour (3600s)
		expect(calculateScore('beginner', 3600, 0, 0)).toBe(500);
		// 10 hours
		expect(calculateScore('beginner', 36000, 0, 0)).toBeGreaterThan(0);
		expect(calculateScore('beginner', 36000, 0, 0)).toBe(Math.floor(2000 * (1200 / 37200)));
	});

	it('Penalización por Pistas: should increment hintsUsed immediately on useHint', async () => {
		const store = useGameStore.getState();

		// Setup a valid puzzle for hints to work
		act(() => {
			store.initGame(
				[
					[0, 2, 3, 4, 5, 6, 7, 8, 9],
					[4, 5, 6, 7, 8, 9, 1, 2, 3],
					[7, 8, 9, 1, 2, 3, 4, 5, 6],
					[2, 3, 4, 5, 6, 7, 8, 9, 1],
					[5, 6, 7, 8, 9, 1, 2, 3, 4],
					[8, 9, 1, 2, 3, 4, 5, 6, 7],
					[3, 4, 5, 6, 7, 8, 9, 1, 2],
					[6, 7, 8, 9, 1, 2, 3, 4, 5],
					[9, 1, 2, 3, 4, 5, 6, 7, 8],
				],
				[
					[1, 2, 3, 4, 5, 6, 7, 8, 9],
					[4, 5, 6, 7, 8, 9, 1, 2, 3],
					[7, 8, 9, 1, 2, 3, 4, 5, 6],
					[2, 3, 4, 5, 6, 7, 8, 9, 1],
					[5, 6, 7, 8, 9, 1, 2, 3, 4],
					[8, 9, 1, 2, 3, 4, 5, 6, 7],
					[3, 4, 5, 6, 7, 8, 9, 1, 2],
					[6, 7, 8, 9, 1, 2, 3, 4, 5],
					[9, 1, 2, 3, 4, 5, 6, 7, 8],
				],
				'beginner',
			);
		});

		expect(useGameStore.getState().hintsUsed).toBe(0);

		act(() => {
			useGameStore.getState().useHint();
		});

		// Should increment immediately even before applyHint
		expect(useGameStore.getState().hintsUsed).toBe(1);
		expect(useGameStore.getState().currentHint).not.toBeNull();

		act(() => {
			useGameStore.getState().clearHint();
		});

		// Should STAY incremented even if cleared
		expect(useGameStore.getState().hintsUsed).toBe(1);
	});

	it('Error UX: should show error in grid and clear it on next input', async () => {
		const store = useGameStore.getState();

		act(() => {
			store.initGame(
				Array(9)
					.fill(0)
					.map(() => Array(9).fill(0)),
				Array(9)
					.fill(1)
					.map(() => Array(9).fill(1)),
				'beginner',
			);
		});

		// 1. Input wrong number at 0,0
		act(() => {
			useGameStore.getState().setCellValue(0, 0, 5); // Correct is 1
		});

		expect(useGameStore.getState().grid[0][0]).toBe(5);
		expect(useGameStore.getState().mistakes).toBe(1);

		// 2. Input another number (can be correct or incorrect) at 1,1
		act(() => {
			useGameStore.getState().setCellValue(1, 1, 1); // Correct is 1
		});

		// Previous error at 0,0 should be cleared
		expect(useGameStore.getState().grid[0][0]).toBe(0);
		expect(useGameStore.getState().grid[1][1]).toBe(1);
	});

	it('Error UX: should clear error when toggling a note', async () => {
		const store = useGameStore.getState();

		act(() => {
			store.initGame(
				Array(9)
					.fill(0)
					.map(() => Array(9).fill(0)),
				Array(9)
					.fill(1)
					.map(() => Array(9).fill(1)),
				'beginner',
			);
		});

		act(() => {
			useGameStore.getState().setCellValue(0, 0, 5); // Error
		});
		expect(useGameStore.getState().grid[0][0]).toBe(5);

		act(() => {
			useGameStore.getState().toggleNote(1, 1, 1);
		});

		expect(useGameStore.getState().grid[0][0]).toBe(0);
	});
});
