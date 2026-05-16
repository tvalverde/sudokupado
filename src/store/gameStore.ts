import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { db } from '../db/database';
import type { Difficulty, GameState, ScreenType } from '../types';
import { translations } from '../utils/translations';
import { engine, type HintResult } from '../workers/sudokuWorker';

export interface GameResult {
	score: number;
	timeElapsed: number;
	difficulty: Difficulty;
	mistakes: number;
}

export type Language = 'en' | 'es';

interface DialogState {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
	confirmText?: string;
	cancelText?: string;
	type?: 'danger' | 'info';
}

interface GameStore {
	// Navigation & UI State
	activeScreen: ScreenType;
	activePlayerId: number | null;
	selectedDifficulty: Difficulty;
	allowNotes: boolean;
	maxMistakes: number;
	lastGameResult: GameResult | null;
	language: Language;
	dialog: DialogState;

	// Actions
	setScreen: (screen: ScreenType) => void;
	setActivePlayer: (playerId: number | null) => Promise<void>;
	setDifficulty: (difficulty: Difficulty) => void;
	setAllowNotes: (allow: boolean) => void;
	setMaxMistakes: (max: number) => void;
	setLastGameResult: (result: GameResult | null) => void;
	setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
	setLanguage: (lang: Language) => void;
	t: (path: string) => string;
	showDialog: (config: Omit<DialogState, 'isOpen'>) => void;
	closeDialog: () => void;

	// Game Play State
	grid: number[][];
	initialGrid: number[][];
	solution: number[][];
	notes: number[][][];
	mistakes: number;
	hintsUsed: number;
	timeElapsed: number;
	isPaused: boolean;
	selectedCell: { r: number; c: number } | null;
	isNoteMode: boolean;
	deferredPrompt: BeforeInstallPromptEvent | null;
	currentHint: HintResult | null;
	activeAnimations: {
		rows: number[];
		cols: number[];
		blocks: number[];
	};

	// Game Play Actions
	initGame: (initial: number[][], solution: number[][], difficulty: Difficulty) => void;
	resumeGame: (savedState: GameState) => void;
	restartGame: () => void;
	clearSavedGame: () => void;
	setCellValue: (r: number, c: number, val: number) => { isCorrect: boolean; isFinished: boolean };
	toggleNote: (r: number, c: number, val: number) => void;
	setSelectedCell: (r: number, c: number | null) => void;
	setNoteMode: (isNoteMode: boolean) => void;
	incrementTime: () => void;
	setPaused: (paused: boolean) => void;
	isNumberCompleted: (num: number) => boolean;
	useHint: () => void;
	clearHint: () => void;
	applyHint: () => void;
	eraseCell: (r: number, c: number) => void;
}

const emptyGrid = () =>
	Array(9)
		.fill(null)
		.map(() => Array(9).fill(0));
const emptyNotes = () =>
	Array(9)
		.fill(null)
		.map(() =>
			Array(9)
				.fill(null)
				.map(() => []),
		);

const getInitialLanguage = (): Language => {
	if (typeof navigator === 'undefined') return 'en';
	const browserLang = navigator.language.split('-')[0];
	return browserLang === 'es' ? 'es' : 'en';
};

const DEFAULT_PREFS = {
	selectedDifficulty: 'beginner' as Difficulty,
	allowNotes: true,
	maxMistakes: 3,
};

export const useGameStore = create<GameStore>()(
	persist(
		(set, get) => ({
			activeScreen: 'main',
			activePlayerId: null,
			selectedDifficulty: DEFAULT_PREFS.selectedDifficulty,
			allowNotes: DEFAULT_PREFS.allowNotes,
			maxMistakes: DEFAULT_PREFS.maxMistakes,
			lastGameResult: null,
			language: getInitialLanguage(),
			dialog: {
				isOpen: false,
				title: '',
				message: '',
				onConfirm: () => {},
			},

			grid: emptyGrid(),
			initialGrid: emptyGrid(),
			solution: emptyGrid(),
			notes: emptyNotes(),
			mistakes: 0,
			hintsUsed: 0,
			timeElapsed: 0,
			isPaused: false,
			selectedCell: null,
			isNoteMode: false,
			deferredPrompt: null,
			currentHint: null,
			activeAnimations: { rows: [], cols: [], blocks: [] },

			setScreen: (screen) => set({ activeScreen: screen }),

			setActivePlayer: async (playerId) => {
				if (!playerId) {
					set({ activePlayerId: null, ...DEFAULT_PREFS });
					return;
				}

				const prefs = await db.preferences.where('playerId').equals(playerId).first();
				if (prefs) {
					set({
						activePlayerId: playerId,
						selectedDifficulty: prefs.difficulty,
						allowNotes: prefs.allowNotes,
						maxMistakes: prefs.maxMistakes,
					});
				} else {
					// It's a new player or first time session
					set({ activePlayerId: playerId, ...DEFAULT_PREFS });
					await db.preferences.add({
						playerId,
						difficulty: DEFAULT_PREFS.selectedDifficulty,
						allowNotes: DEFAULT_PREFS.allowNotes,
						maxMistakes: DEFAULT_PREFS.maxMistakes,
					});
				}
			},

			setDifficulty: (difficulty) => {
				set({ selectedDifficulty: difficulty });
				const { activePlayerId } = get();
				if (activePlayerId) {
					db.preferences.where('playerId').equals(activePlayerId).modify({ difficulty });
				}
			},

			setAllowNotes: (allowNotes) => {
				set({ allowNotes });
				const { activePlayerId } = get();
				if (activePlayerId) {
					db.preferences.where('playerId').equals(activePlayerId).modify({ allowNotes });
				}
			},

			setMaxMistakes: (maxMistakes) => {
				set({ maxMistakes });
				const { activePlayerId } = get();
				if (activePlayerId) {
					db.preferences.where('playerId').equals(activePlayerId).modify({ maxMistakes });
				}
			},

			setLastGameResult: (lastGameResult) => set({ lastGameResult }),
			setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
			setLanguage: (language) => set({ language }),

			showDialog: (config) => set({ dialog: { ...config, isOpen: true } }),
			closeDialog: () => set((state) => ({ dialog: { ...state.dialog, isOpen: false } })),

			t: (path: string): string => {
				const lang = get().language;
				const keys = path.split('.');
				let value: unknown = translations[lang];
				for (const key of keys) {
					if (typeof value === 'object' && value !== null && key in value) {
						value = (value as Record<string, unknown>)[key];
					} else {
						value = undefined;
						break;
					}
				}
				return typeof value === 'string' ? value : path;
			},

			initGame: (initial, solution, difficulty) =>
				set({
					grid: initial.map((row) => [...row]),
					initialGrid: initial.map((row) => [...row]),
					solution: solution.map((row) => [...row]),
					notes: emptyNotes(),
					mistakes: 0,
					hintsUsed: 0,
					timeElapsed: 0,
					isPaused: false,
					selectedCell: null,
					isNoteMode: false,
					selectedDifficulty: difficulty,
					activeScreen: 'game',
					lastGameResult: null,
				}),

			resumeGame: (saved) =>
				set({
					grid: saved.grid,
					initialGrid: saved.initialGrid,
					solution: saved.solution,
					notes: saved.notes,
					mistakes: saved.mistakes,
					hintsUsed: saved.hintsUsed,
					timeElapsed: saved.timeElapsed,
					isPaused: false,
					selectedDifficulty: saved.difficulty,
					selectedCell: null,
					isNoteMode: false,
					activeScreen: 'game',
					lastGameResult: null,
				}),

			restartGame: () => {
				const { initialGrid } = get();
				set({
					grid: initialGrid.map((row) => [...row]),
					notes: emptyNotes(),
					mistakes: 0,
					hintsUsed: 0,
					timeElapsed: 0,
					isPaused: false,
					selectedCell: null,
					isNoteMode: false,
					lastGameResult: null,
				});
			},

			clearSavedGame: () =>
				set({
					grid: emptyGrid(),
					initialGrid: emptyGrid(),
					solution: emptyGrid(),
					notes: emptyNotes(),
					mistakes: 0,
					hintsUsed: 0,
					timeElapsed: 0,
				}),

			setSelectedCell: (r, c) =>
				set({
					selectedCell: c === null ? null : { r, c },
				}),

			setNoteMode: (isNoteMode) => set({ isNoteMode }),

			setCellValue: (r, c, val) => {
				const state = get();
				if (state.grid[r][c] !== 0 && state.initialGrid[r][c] !== 0)
					return { isCorrect: true, isFinished: false };

				const isCorrect = state.solution[r][c] === val;

				if (isCorrect) {
					const newGrid = state.grid.map((row) => [...row]);
					newGrid[r][c] = val;

					const newNotes = state.notes.map((row) => row.map((cell) => [...cell]));
					for (let i = 0; i < 9; i++) {
						newNotes[r][i] = newNotes[r][i].filter((n) => n !== val);
						newNotes[i][c] = newNotes[i][c].filter((n) => n !== val);
					}
					const startR = r - (r % 3);
					const startC = c - (c % 3);
					for (let i = 0; i < 3; i++) {
						for (let j = 0; j < 3; j++) {
							newNotes[startR + i][startC + j] = newNotes[startR + i][startC + j].filter(
								(n) => n !== val,
							);
						}
					}

					const isFinished = newGrid.every((row, ri) =>
						row.every((cell, ci) => cell === state.solution[ri][ci]),
					);

					// Check for row/col/block completion animations
					const completedRows = [];
					const completedCols = [];
					const completedBlocks = [];

					if (newGrid[r].every((cell, ci) => cell === state.solution[r][ci])) {
						completedRows.push(r);
					}
					if (newGrid.every((row, ri) => row[c] === state.solution[ri][c])) {
						completedCols.push(c);
					}

					// Only check block completion for standard 9x9 grids
					if (newGrid.length === 9 && newGrid[0].length === 9) {
						const br = Math.floor(r / 3) * 3;
						const bc = Math.floor(c / 3) * 3;
						let blockComplete = true;
						for (let i = 0; i < 3; i++) {
							for (let j = 0; j < 3; j++) {
								if (newGrid[br + i][bc + j] !== state.solution[br + i][bc + j]) {
									blockComplete = false;
									break;
								}
							}
						}
						if (blockComplete) completedBlocks.push(Math.floor(r / 3) * 3 + Math.floor(c / 3));
					}

					const hasNewAnimation =
						completedRows.length > 0 || completedCols.length > 0 || completedBlocks.length > 0;

					set({
						grid: newGrid,
						notes: newNotes,
						activeAnimations: hasNewAnimation
							? { rows: completedRows, cols: completedCols, blocks: completedBlocks }
							: { rows: [], cols: [], blocks: [] },
					});

					if (hasNewAnimation) {
						setTimeout(() => {
							set({ activeAnimations: { rows: [], cols: [], blocks: [] } });
						}, 1000);
					}

					return { isCorrect: true, isFinished };
				} else {
					set({ mistakes: state.mistakes + 1 });
					return { isCorrect: false, isFinished: false };
				}
			},

			toggleNote: (r, c, val) => {
				const state = get();
				if (state.grid[r][c] !== 0) return;

				const newNotes = state.notes.map((row) => row.map((cell) => [...cell]));
				const cellNotes = newNotes[r][c];

				if (cellNotes.includes(val)) {
					newNotes[r][c] = cellNotes.filter((n) => n !== val);
				} else {
					newNotes[r][c] = [...cellNotes, val].sort();
				}

				set({ notes: newNotes });
			},

			incrementTime: () =>
				set((state) => ({
					timeElapsed: state.isPaused ? state.timeElapsed : state.timeElapsed + 1,
				})),

			setPaused: (isPaused) => set({ isPaused }),

			isNumberCompleted: (num: number) => {
				const { grid, solution } = get();
				let count = 0;
				for (let r = 0; r < 9; r++) {
					for (let c = 0; c < 9; c++) {
						if (grid[r][c] === num && grid[r][c] === solution[r][c]) {
							count++;
						}
					}
				}
				return count >= 9;
			},

			useHint: () => {
				const state = get();
				if (state.hintsUsed >= 3 || state.currentHint) return;

				const logicalHint = engine.getLogicalHint(state.grid, state.solution);
				if (logicalHint) {
					set({
						currentHint: logicalHint,
						selectedCell: { r: logicalHint.r, c: logicalHint.c },
					});
				}
			},

			clearHint: () => set({ currentHint: null }),

			applyHint: () => {
				const state = get();
				if (!state.currentHint) return;

				const { r, c, value } = state.currentHint;
				const newGrid = state.grid.map((row) => [...row]);
				newGrid[r][c] = value;

				set({
					grid: newGrid,
					hintsUsed: state.hintsUsed + 1,
					currentHint: null,
				});
			},

			eraseCell: (r, c) => {
				const state = get();
				// Solo borrar si la celda no es parte del puzzle inicial
				if (state.initialGrid[r][c] !== 0) return;

				const newGrid = state.grid.map((row) => [...row]);
				newGrid[r][c] = 0;

				set({ grid: newGrid });
			},
		}),
		{
			name: 'sudokupado-game-storage',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				activePlayerId: state.activePlayerId,
				language: state.language,
				selectedDifficulty: state.selectedDifficulty,
				allowNotes: state.allowNotes,
				maxMistakes: state.maxMistakes,
			}),
		},
	),
);
