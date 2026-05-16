import { useCallback, useEffect, useRef } from 'react';
import type { Difficulty } from '../types';
import type { HintResult } from '../workers/sudokuWorker';

export const useSudokuWorker = () => {
	const workerRef = useRef<Worker | null>(null);
	const messageIdRef = useRef(0);
	const resolversRef = useRef(new Map<number, (data: any) => void>());

	useEffect(() => {
		// Vite handles workers with ?worker suffix or new Worker(new URL(...))
		workerRef.current = new Worker(new URL('../workers/sudokuWorker.ts', import.meta.url), {
			type: 'module',
		});

		const handleMessage = (e: MessageEvent) => {
			const { id, payload } = e.data;
			const resolve = resolversRef.current.get(id);
			if (resolve) {
				resolve(payload);
				resolversRef.current.delete(id);
			}
		};

		const handleError = (e: ErrorEvent) => {
			console.error('Sudoku Worker Error:', e);
			for (const [id, resolve] of resolversRef.current) {
				resolve(new Error('Worker crashed'));
				resolversRef.current.delete(id);
			}
		};

		workerRef.current.addEventListener('message', handleMessage);
		workerRef.current.addEventListener('error', handleError);

		return () => {
			for (const [id, resolve] of resolversRef.current) {
				resolve(new Error('Worker terminated'));
				resolversRef.current.delete(id);
			}
			workerRef.current?.terminate();
		};
	}, []);

	const generatePuzzle = useCallback(
		(difficulty: Difficulty): Promise<{ initialGrid: number[][]; solution: number[][] }> => {
			return new Promise((resolve) => {
				if (!workerRef.current) return;

				const id = ++messageIdRef.current;
				resolversRef.current.set(id, resolve);
				workerRef.current.postMessage({ id, type: 'GENERATE', difficulty });
			});
		},
		[],
	);

	const getHint = useCallback((grid: number[][], solution: number[][]): Promise<HintResult> => {
		return new Promise((resolve) => {
			if (!workerRef.current) return;

			const id = ++messageIdRef.current;
			resolversRef.current.set(id, resolve);
			workerRef.current.postMessage({ id, type: 'GET_HINT', grid, solution });
		});
	}, []);

	return { generatePuzzle, getHint };
};
