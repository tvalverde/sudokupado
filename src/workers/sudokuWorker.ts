/**
 * Advanced Sudoku Logic Engine - Web Worker
 * Implements logical solving techniques to classify difficulty.
 */

export interface SudokuResult {
	initialGrid: number[][];
	solution: number[][];
	difficulty: string;
}

class SudokuEngine {
	private emptyBoard(): number[][] {
		return Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
	}

	private isValid(grid: number[][], row: number, col: number, num: number): boolean {
		for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
		for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
		const startRow = row - (row % 3),
			startCol = col - (col % 3);
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (grid[i + startRow][j + startCol] === num) return false;
			}
		}
		return true;
	}

	public solve(grid: number[][]): boolean {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (grid[row][col] === 0) {
					const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
					for (const num of nums) {
						if (this.isValid(grid, row, col, num)) {
							grid[row][col] = num;
							if (this.solve(grid)) return true;
							grid[row][col] = 0;
						}
					}
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Count solutions to ensure uniqueness.
	 */
	public countSolutions(grid: number[][], count = 0): number {
		if (count > 1) return count;

		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (grid[row][col] === 0) {
					for (let num = 1; num <= 9; num++) {
						if (this.isValid(grid, row, col, num)) {
							grid[row][col] = num;
							count = this.countSolutions(grid, count);
							grid[row][col] = 0;
						}
					}
					return count;
				}
			}
		}
		return count + 1;
	}

	/**
	 * Logical Solver to classify difficulty.
	 * Simple implementation: checks how many cells can be filled by 'Naked Singles' only.
	 */
	public analyzeDifficulty(grid: number[][]): 'beginner' | 'intermediate' | 'expert' | 'master' {
		const tempGrid = grid.map((row) => [...row]);
		let filledByLogic = 0;
		let changed = true;

		while (changed) {
			changed = false;
			for (let r = 0; r < 9; r++) {
				for (let c = 0; c < 9; c++) {
					if (tempGrid[r][c] === 0) {
						const candidates = [];
						for (let n = 1; n <= 9; n++) {
							if (this.isValid(tempGrid, r, c, n)) candidates.push(n);
						}
						if (candidates.length === 1) {
							tempGrid[r][c] = candidates[0];
							filledByLogic++;
							changed = true;
						}
					}
				}
			}
		}

		const totalEmpty = grid.flat().filter((v) => v === 0).length;
		const ratio = filledByLogic / totalEmpty;

		if (ratio > 0.8) return 'beginner';
		if (ratio > 0.5) return 'intermediate';
		if (ratio > 0.2) return 'expert';
		return 'master';
	}

	public generateFullBoard(): number[][] {
		const grid = this.emptyBoard();
		this.solve(grid);
		return grid;
	}

	public pokeHoles(fullGrid: number[][], targetDifficulty: string): number[][] {
		const grid = fullGrid.map((row) => [...row]);
		let targetEmptyCells: number;

		switch (targetDifficulty) {
			case 'beginner':
				targetEmptyCells = 35;
				break;
			case 'intermediate':
				targetEmptyCells = 45;
				break;
			case 'expert':
				targetEmptyCells = 54;
				break;
			case 'master':
				targetEmptyCells = 60;
				break;
			default:
				targetEmptyCells = 35;
		}

		const shuffledPositions = [];
		for (let i = 0; i < 81; i++) shuffledPositions.push(i);
		shuffledPositions.sort(() => Math.random() - 0.5);

		let removed = 0;
		for (const pos of shuffledPositions) {
			if (removed >= targetEmptyCells) break;

			const r = Math.floor(pos / 9);
			const c = pos % 9;

			if (grid[r][c] !== 0) {
				const backup = grid[r][c];
				grid[r][c] = 0;

				// Ensure uniqueness
				if (this.countSolutions(grid.map((row) => [...row])) === 1) {
					removed++;
				} else {
					grid[r][c] = backup;
				}
			}
		}

		return grid;
	}
}

export const engine = new SudokuEngine();

// The Web Worker logic
if (typeof self !== 'undefined' && self.onmessage !== undefined) {
	self.onmessage = (e: MessageEvent) => {
		const { type, difficulty } = e.data;

		if (type === 'GENERATE') {
			const solution = engine.generateFullBoard();
			const initialGrid = engine.pokeHoles(solution, difficulty);
			const actualDifficulty = engine.analyzeDifficulty(initialGrid);

			self.postMessage({
				type: 'GENERATED',
				payload: { initialGrid, solution, difficulty: actualDifficulty },
			});
		}
	};
}
