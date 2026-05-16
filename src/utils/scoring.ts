import type { Difficulty } from '../types';

/**
 * Calculates the Sudoku score using an asymptotic time decay and penalty multipliers.
 * Formula: score = (baseScore * (1200 / (1200 + timeElapsed))) - (mistakes * 200)
 * Then applies -10% per hint used.
 */
export const calculateScore = (
	difficulty: Difficulty,
	timeElapsed: number,
	mistakes: number,
	hintsUsed: number,
): number => {
	const baseScores = { beginner: 2000, intermediate: 4000, expert: 6000, master: 8000 };
	const base = baseScores[difficulty] || 2000;

	// Asymptotic time decay: score is halved every 20 minutes (1200s), never reaches 0.
	const timeMultiplier = 1200 / (1200 + timeElapsed);
	let score = base * timeMultiplier;

	// Fixed penalty for mistakes
	score -= mistakes * 200;

	// Exponential hint penalty: -10% per hint
	if (hintsUsed > 0) {
		score = score * 0.9 ** hintsUsed;
	}

	return Math.max(0, Math.floor(score));
};
