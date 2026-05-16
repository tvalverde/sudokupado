import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eraser, Lightbulb, Pause, Pencil, Play, RotateCcw, Trophy } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import SudokuBoard from './SudokuBoard';

const GameScreen: React.FC = () => {
	const {
		setScreen,
		selectedDifficulty,
		timeElapsed,
		mistakes,
		isPaused,
		setPaused,
		incrementTime,
		isNoteMode,
		setNoteMode,
		hintsUsed,
		useHint,
		selectedCell,
		setSelectedCell,
		setCellValue,
		toggleNote,
		activePlayerId,
		setLastGameResult,
		t,
		lastGameResult,
		isNumberCompleted,
		restartGame,
		showDialog,
		eraseCell,
		maxMistakes,
		clearSavedGame,
	} = useGameStore();

	const wakeLockRef = useRef<WakeLockSentinel | null>(null);
	const isVictory = !!lastGameResult;

	// Native APIs: Wake Lock & Fullscreen & Back Button
	useEffect(() => {
		const requestWakeLock = async () => {
			try {
				if ('wakeLock' in navigator) {
					wakeLockRef.current = await navigator.wakeLock.request('screen');
				}
			} catch (err) {
				const error = err as Error;
				console.error(`${error.name}, ${error.message}`);
			}
		};

		const enterFullscreen = async () => {
			try {
				if (document.documentElement.requestFullscreen) {
					await document.documentElement.requestFullscreen();
				}
			} catch (_err) {}
		};

		requestWakeLock();
		enterFullscreen();

		const handlePopState = (e: PopStateEvent) => {
			e.preventDefault();
			setPaused(true);
			window.history.pushState(null, '', window.location.pathname);
		};

		window.history.pushState(null, '', window.location.pathname);
		window.addEventListener('popstate', handlePopState);

		return () => {
			wakeLockRef.current?.release();
			if (document.fullscreenElement) {
				document.exitFullscreen().catch(() => {});
			}
			window.removeEventListener('popstate', handlePopState);
		};
	}, [setPaused]);

	// Timer logic
	useEffect(() => {
		const timer = setInterval(() => {
			if (!isPaused && !isVictory) incrementTime();
		}, 1000);
		return () => clearInterval(timer);
	}, [isPaused, incrementTime, isVictory]);

	const calculateScore = useCallback(() => {
		const baseScores = { beginner: 2000, intermediate: 4000, expert: 6000, master: 8000 };
		const base = baseScores[selectedDifficulty] || 2000;

		let hintPenalty = 0;
		if (selectedDifficulty === 'beginner') {
			hintPenalty = hintsUsed > 0 ? (hintsUsed - 1) * 100 : 0;
		} else {
			const costs = { intermediate: 200, expert: 400, master: 600 };
			hintPenalty = hintsUsed * (costs[selectedDifficulty as keyof typeof costs] || 200);
		}

		const score = base - timeElapsed - mistakes * 200 - hintPenalty;
		return Math.max(0, score);
	}, [selectedDifficulty, hintsUsed, timeElapsed, mistakes]);

	const handleNumberInput = useCallback(
		async (num: number) => {
			if (isPaused || isVictory || !selectedCell) return;
			const { r, c } = selectedCell;

			if (isNoteMode) {
				toggleNote(r, c, num);
			} else {
				const { isCorrect, isFinished } = setCellValue(r, c, num);

				if (!isCorrect) {
					if (navigator.vibrate) navigator.vibrate(200);

					if (mistakes + 1 >= maxMistakes) {
						setPaused(true);
						showDialog({
							title: t('game.game_over_title'),
							message: t('game.game_over_msg'),
							type: 'danger',
							confirmText: t('game.game_over_restart'),
							cancelText: t('game.game_over_home'),
							onConfirm: restartGame,
							onCancel: async () => {
								const playerId = activePlayerId ?? 0;
								const existing = await db.gameState.where('playerId').equals(playerId).first();
								if (existing?.id) await db.gameState.delete(existing.id);

								clearSavedGame();
								setScreen('main');
							},
						});
						return;
					}
				}

				if (isFinished) {
					const finalScore = calculateScore();
					const result = {
						score: finalScore,
						timeElapsed,
						difficulty: selectedDifficulty,
						mistakes,
					};

					if (activePlayerId) {
						await db.history.add({
							playerId: activePlayerId,
							difficulty: selectedDifficulty,
							score: finalScore,
							timeElapsed,
							date: Date.now(),
						});
					}

					const playerId = activePlayerId ?? 0;
					const existing = await db.gameState.where('playerId').equals(playerId).first();
					if (existing?.id) await db.gameState.delete(existing.id);

					setLastGameResult(result);

					setTimeout(() => {
						setScreen('result');
					}, 3000);
				}
			}
		},
		[
			isPaused,
			isVictory,
			selectedCell,
			isNoteMode,
			toggleNote,
			setCellValue,
			calculateScore,
			timeElapsed,
			selectedDifficulty,
			mistakes,
			activePlayerId,
			setLastGameResult,
			setScreen,
			maxMistakes,
			clearSavedGame,
			setPaused,
			showDialog,
			restartGame,
			t,
		],
	);

	// Keyboard Navigation and Shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isPaused || isVictory) return;

			// Arrow Navigation
			if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
				e.preventDefault();
				if (!selectedCell) {
					setSelectedCell(4, 4);
					return;
				}

				let { r, c } = selectedCell;
				if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
				if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
				if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
				if (e.key === 'ArrowRight') c = Math.min(8, c + 1);

				if (r !== selectedCell.r || c !== selectedCell.c) {
					setSelectedCell(r, c);
				}
				return;
			}

			// Number Input (1-9)
			if (/^[1-9]$/.test(e.key)) {
				e.preventDefault();
				handleNumberInput(Number.parseInt(e.key, 10));
				return;
			}

			// Toggle Note Mode (N or Space)
			if (e.key.toLowerCase() === 'n' || e.key === ' ') {
				e.preventDefault();
				setNoteMode(!isNoteMode);
				return;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [
		isPaused,
		isVictory,
		selectedCell,
		isNoteMode,
		setSelectedCell,
		setNoteMode,
		handleNumberInput,
	]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	const handleRestartClick = () => {
		showDialog({
			title: 'Restart Puzzle',
			message: 'Are you sure you want to clear your progress and start this puzzle over?',
			onConfirm: restartGame,
			confirmText: 'RESTART',
			cancelText: 'CONTINUE PLAYING',
			type: 'info',
		});
	};

	const handleErase = () => {
		if (selectedCell) {
			eraseCell(selectedCell.r, selectedCell.c);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			className="flex flex-col h-full bg-white relative"
		>
			{/* Dramatic Victory Animation */}
			<AnimatePresence>
				{isVictory && (
					<motion.div
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
					>
						<motion.div
							animate={{
								rotateY: [0, 360],
								scale: [1, 1.2, 1],
							}}
							transition={{ duration: 1.5, repeat: Infinity }}
							className="bg-white/80 backdrop-blur-md p-10 rounded-full border-4 border-green-500 shadow-2xl"
						>
							<Trophy className="w-24 h-24 text-green-600" />
						</motion.div>
						<motion.h2
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.5 }}
							className="font-hanken text-5xl font-black text-green-700 mt-8 tracking-widest-premium"
						>
							{t('game.victory')}
						</motion.h2>
					</motion.div>
				)}
			</AnimatePresence>

			{/* TopAppBar */}
			<header className="w-full border-b border-border bg-white flex justify-between items-center px-5 h-16 z-10">
				<button
					type="button"
					onClick={() => setScreen('main')}
					className="p-2 hover:bg-subtle-bg rounded-full transition-colors text-secondary"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
				<h1 className="font-hanken text-xl font-extrabold tracking-widest-premium text-primary-text uppercase">
					SUDOKUPADO
				</h1>
				<button
					type="button"
					onClick={() => setPaused(!isPaused)}
					className="p-2 hover:bg-subtle-bg rounded-full transition-colors text-secondary"
				>
					{isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
				</button>
			</header>

			{/* Main Game Container */}
			<main
				className={`flex-1 flex flex-col px-5 pt-4 pb-24 overflow-y-auto transition-opacity duration-1000 ${isVictory ? 'opacity-30' : 'opacity-100'}`}
			>
				{/* Status Bar */}
				<div className="flex justify-between items-center bg-subtle-bg rounded-full px-4 py-2 mb-6 border border-border">
					<div className="flex flex-col items-start">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('game.time')}
						</span>
						<span className="font-hanken text-lg font-bold text-primary-text">
							{formatTime(timeElapsed)}
						</span>
					</div>
					<div className="flex flex-col items-center">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('game.level')}
						</span>
						<span className="font-hanken text-lg font-bold text-error uppercase">
							{t(`main_menu.difficulties.${selectedDifficulty}`)}
						</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('game.mistakes')}
						</span>
						<span className="font-hanken text-lg font-bold text-primary-text">{mistakes}/3</span>
					</div>
				</div>

				{/* Sudoku Grid */}
				<div className="relative">
					<SudokuBoard />
					{isPaused && !isVictory && (
						<button
							type="button"
							onClick={() => setPaused(false)}
							className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center cursor-pointer"
						>
							<Play className="w-16 h-16 text-primary-text mb-4" />
							<span className="font-hanken text-xl font-bold uppercase tracking-widest-premium">
								{t('game.paused')}
							</span>
							<p className="text-secondary text-sm mt-2">{t('game.resume')}</p>
						</button>
					)}
				</div>

				{/* Action Bar */}
				<div
					className={`grid grid-cols-4 gap-2 mb-6 transition-opacity ${isVictory ? 'pointer-events-none opacity-20' : ''}`}
				>
					<button
						type="button"
						onClick={handleErase}
						className="flex flex-col items-center justify-center py-3 bg-white border border-border rounded-xl text-primary-text hover:bg-subtle-bg transition-all active:scale-95"
					>
						<Eraser className="w-5 h-5 mb-1" />
						<span className="font-hanken text-[10px] font-bold tracking-wider uppercase">
							{t('game.erase')}
						</span>
					</button>
					<button
						type="button"
						onClick={() => setNoteMode(!isNoteMode)}
						className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95 ${
							isNoteMode
								? 'bg-primary-text text-white shadow-md'
								: 'bg-white border border-border text-primary-text hover:bg-subtle-bg'
						}`}
					>
						<Pencil className={`w-5 h-5 mb-1 ${isNoteMode ? 'fill-current' : ''}`} />
						<span className="font-hanken text-[10px] font-bold tracking-wider uppercase">
							{t('game.notes')}
						</span>
					</button>
					<button
						type="button"
						onClick={useHint}
						disabled={hintsUsed >= 3}
						className="flex flex-col items-center justify-center py-3 bg-white border border-border rounded-xl text-primary-text hover:bg-subtle-bg disabled:opacity-30 transition-all active:scale-95"
					>
						<Lightbulb className="w-5 h-5 mb-1" />
						<span className="font-hanken text-[10px] font-bold tracking-wider uppercase">
							{t('game.hint')} ({hintsUsed}/3)
						</span>
					</button>
					<button
						type="button"
						onClick={handleRestartClick}
						className="flex flex-col items-center justify-center py-3 bg-white border border-border rounded-xl text-primary-text hover:bg-subtle-bg transition-all active:scale-95"
					>
						<RotateCcw className="w-5 h-5 mb-1" />
						<span className="font-hanken text-[10px] font-bold tracking-wider uppercase">
							{t('game.restart')}
						</span>
					</button>
				</div>

				{/* Keypad */}
				<div
					className={`mt-auto transition-opacity ${isVictory ? 'pointer-events-none opacity-20' : ''}`}
				>
					<div className="grid grid-cols-5 gap-2 mb-2">
						{[1, 2, 3, 4, 5].map((num) => {
							const completed = isNumberCompleted(num);
							return (
								<button
									type="button"
									key={num}
									disabled={completed}
									onClick={() => handleNumberInput(num)}
									className={`border rounded-2xl h-14 flex items-center justify-center font-hanken text-2xl font-bold transition-all shadow-sm active:scale-95 ${
										completed
											? 'bg-transparent border-transparent text-slate-300 opacity-20'
											: 'bg-white border-border text-primary-text hover:bg-subtle-bg active:bg-border'
									}`}
								>
									{num}
								</button>
							);
						})}
					</div>
					<div className="grid grid-cols-4 gap-2 px-4">
						{[6, 7, 8, 9].map((num) => {
							const completed = isNumberCompleted(num);
							return (
								<button
									type="button"
									key={num}
									disabled={completed}
									onClick={() => handleNumberInput(num)}
									className={`border rounded-2xl h-14 flex items-center justify-center font-hanken text-2xl font-bold transition-all shadow-sm active:scale-95 ${
										completed
											? 'bg-transparent border-transparent text-slate-300 opacity-20'
											: 'bg-white border-border text-primary-text hover:bg-subtle-bg active:bg-border'
									}`}
								>
									{num}
								</button>
							);
						})}
					</div>
				</div>
			</main>
		</motion.div>
	);
};

export default GameScreen;
