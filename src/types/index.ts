export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'master';

export type ScreenType = 'main' | 'game' | 'trophies' | 'result' | 'rules';

export interface Player {
	id?: number;
	name: string;
	createdAt: number;
	isDeleted: number; // 0 for false, 1 for true (Better for IndexedDB indexing)
}

export interface Preferences {
	id?: number;
	playerId: number;
	difficulty: Difficulty;
	allowNotes: boolean;
	maxMistakes: number;
}

export interface HistoryEntry {
	id?: number;
	playerId: number;
	difficulty: Difficulty;
	score: number;
	timeElapsed: number; // In seconds
	mistakes: number;
	date: number; // Timestamp
}

export interface GameState {
	id?: number;
	playerId: number;
	grid: number[][]; // Current state of the 9x9 board
	initialGrid: number[][]; // Initial puzzle state (immutable)
	solution: number[][]; // Full solution
	notes: number[][][]; // 3D array for 9x9 cells with 1-9 possible notes
	timeElapsed: number;
	mistakes: number;
	hintsUsed: number;
	isPaused: boolean;
	difficulty: Difficulty;
}

export interface SudokuGrid {
	initial: number[][];
	solution: number[][];
}
