import { useCallback, useEffect, useRef } from 'react';
import type { Difficulty } from '../types';
import type { HintResult } from '../workers/sudokuWorker';

export const useSudokuWorker = () => {
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		// Vite handles workers with ?worker suffix or new Worker(new URL(...))
		workerRef.current = new Worker(new URL('../workers/sudokuWorker.ts', import.meta.url), {
			type: 'module',
		});

		return () => {
			workerRef.current?.terminate();
		};
	}, []);

	const generatePuzzle = useCallback(
		(difficulty: Difficulty): Promise<{ initialGrid: number[][]; solution: number[][] }> => {
			return new Promise((resolve) => {
				if (!workerRef.current) return;

				const handleMessage = (e: MessageEvent) => {
					if (e.data.type === 'GENERATED') {
						workerRef.current?.removeEventListener('message', handleMessage);
						resolve(e.data.payload);
					}
				};

				workerRef.current.addEventListener('message', handleMessage);
				workerRef.current.postMessage({ type: 'GENERATE', difficulty });
			});
		},
		[],
	);

	const getHint = useCallback((grid: number[][], solution: number[][]): Promise<HintResult> => {
		return new Promise((resolve) => {
			if (!workerRef.current) return;

			const handleMessage = (e: MessageEvent) => {
				if (e.data.type === 'HINT_GENERATED') {
					workerRef.current?.removeEventListener('message', handleMessage);
					resolve(e.data.payload);
				}
			};

			workerRef.current.addEventListener('message', handleMessage);
			workerRef.current.postMessage({ type: 'GET_HINT', grid, solution });
		});
	}, []);

	return { generatePuzzle, getHint };
};
