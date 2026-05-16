import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { ArrowLeft, Timer } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import type { Difficulty } from '../types';

const TrophiesScreen: React.FC = () => {
	const { setScreen, t } = useGameStore();
	const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');

	const history = useLiveQuery(async () => {
		const results = await db.history.toArray();
		const players = await db.players.toArray();
		const playerMap = new Map(players.map((p) => [p.id, p.name]));

		return results
			.map((entry) => ({
				...entry,
				playerName: playerMap.get(entry.playerId) || 'Player',
			}))
			.filter((entry) => filterDifficulty === 'all' || entry.difficulty === filterDifficulty)
			.sort((a, b) => b.date - a.date);
	}, [filterDifficulty]);

	const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString(undefined, {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: 20 }}
			className="flex flex-col h-full bg-white"
		>
			{/* Header */}
			<header className="sticky top-0 w-full z-50 bg-white border-b border-border flex justify-between items-center h-16 px-5">
				<button
					onClick={() => setScreen('main')}
					className="p-2 -ml-2 hover:bg-subtle-bg rounded-full transition-colors text-primary-text"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
				<h1 className="font-hanken text-lg font-bold text-primary-text tracking-widest-premium uppercase">
					{t('trophies.title')}
				</h1>
				<div className="w-10"></div>
			</header>

			{/* Difficulty Filters */}
			<div className="sticky top-16 z-40 bg-white py-2 border-b border-border overflow-hidden">
				<div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-2">
					<button
						onClick={() => setFilterDifficulty('all')}
						className={`whitespace-nowrap px-4 py-2 rounded-full font-hanken text-[10px] font-bold tracking-wider uppercase border transition-colors ${
							filterDifficulty === 'all'
								? 'bg-primary-text text-white border-transparent'
								: 'bg-white text-primary-text border-border hover:bg-subtle-bg'
						}`}
					>
						{t('trophies.all')}
					</button>
					{difficulties.map((diff) => (
						<button
							key={diff}
							onClick={() => setFilterDifficulty(diff)}
							className={`whitespace-nowrap px-4 py-2 rounded-full font-hanken text-[10px] font-bold tracking-wider uppercase border transition-colors ${
								filterDifficulty === diff
									? 'bg-primary-text text-white border-transparent'
									: 'bg-white text-primary-text border-border hover:bg-subtle-bg'
							}`}
						>
							{t(`main_menu.difficulties.${diff}`)}
						</button>
					))}
				</div>
			</div>

			{/* History List */}
			<section className="flex-1 bg-subtle-bg px-5 py-4 flex flex-col gap-4 overflow-y-auto pb-24">
				{!history || history.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-secondary">
						<span className="font-hanken text-sm font-bold uppercase tracking-widest-premium">
							{t('trophies.no_victories')}
						</span>
						<p className="font-sans text-xs mt-2">{t('trophies.win_message')}</p>
					</div>
				) : (
					history.map((entry) => (
						<article
							key={entry.id}
							className="bg-white border border-border rounded-DEFAULT p-4 flex flex-col gap-2 shadow-sm"
						>
							<div className="flex justify-between items-start border-b border-border pb-2">
								<span className="font-sans text-sm font-bold text-primary-text">
									{entry.playerName}
								</span>
								<span className="font-sans text-xs text-secondary">{formatDate(entry.date)}</span>
							</div>
							<div className="flex justify-between items-end pt-1">
								<div className="flex items-center gap-1 text-secondary">
									<Timer className="w-4 h-4" />
									<span className="font-sans text-sm">
										{t('game.time')}: {formatTime(entry.timeElapsed)}
									</span>
								</div>
								<div className="flex flex-col items-end">
									<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider leading-none mb-1">
										{t(`main_menu.difficulties.${entry.difficulty}`)}
									</span>
									<span className="font-hanken text-2xl font-bold text-primary-text leading-none">
										{entry.score} <span className="text-xs">{t('trophies.pts')}</span>
									</span>
								</div>
							</div>
						</article>
					))
				)}
			</section>
		</motion.div>
	);
};

export default TrophiesScreen;
