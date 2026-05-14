import { describe, expect, it } from 'vitest';
import { engine } from '../workers/sudokuWorker';

describe('SudokuEngine Advanced Logic', () => {
	it('should generate a valid full board', () => {
		const board = engine.generateFullBoard();

		// Check if all cells are filled
		expect(board.flat().every((v) => v !== 0)).toBe(true);

		// Check if each row is valid (contains 1-9)
		for (let r = 0; r < 9; r++) {
			const set = new Set(board[r]);
			expect(set.size).toBe(9);
		}
	});

	it('should count solutions correctly for a simple board', () => {
		// 9x9 board with 1 empty cell
		const board = engine.generateFullBoard();
		const _solution = board.map((r) => [...r]);
		const _originalVal = board[0][0];
		board[0][0] = 0;

		const count = engine.countSolutions(board);
		expect(count).toBe(1);
	});

	it('should ensure poked holes result in a unique solution', () => {
		const fullBoard = engine.generateFullBoard();
		const puzzle = engine.pokeHoles(fullBoard, 'beginner');

		const solutions = engine.countSolutions(puzzle);
		expect(solutions).toBe(1);
	});

	it('should classify an easy puzzle as beginner', () => {
		const fullBoard = engine.generateFullBoard();
		// Remove only 5 cells, should be very easy
		const puzzle = fullBoard.map((r) => [...r]);
		puzzle[0][0] = 0;
		puzzle[1][1] = 0;
		puzzle[2][2] = 0;
		puzzle[3][3] = 0;
		puzzle[4][4] = 0;

		const difficulty = engine.analyzeDifficulty(puzzle);
		expect(difficulty).toBe('beginner');
	});

	it('should generate boards of increasing difficulty', () => {
		const fullBoard = engine.generateFullBoard();

		const beginnerPuzzle = engine.pokeHoles(fullBoard, 'beginner');
		const expertPuzzle = engine.pokeHoles(fullBoard, 'expert');

		const beginnerEmpty = beginnerPuzzle.flat().filter((v) => v === 0).length;
		const expertEmpty = expertPuzzle.flat().filter((v) => v === 0).length;

		expect(expertEmpty).toBeGreaterThan(beginnerEmpty);
	});
});
