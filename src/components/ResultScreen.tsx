import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Home, Play, Trophy, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import Button from './Button';
import InstallModal from './InstallModal';

const ResultScreen: React.FC = () => {
	const { lastGameResult, setScreen, activePlayerId, deferredPrompt, t } = useGameStore();
	const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

	const topScores = useLiveQuery(async () => {
		if (!lastGameResult) return [];
		return await db.history
			.where('difficulty')
			.equals(lastGameResult.difficulty)
			.reverse()
			.sortBy('score')
			.then((results) => results.slice(0, 5));
	}, [lastGameResult]);

	const historyCount = useLiveQuery(
		() => (activePlayerId ? db.history.where('playerId').equals(activePlayerId).count() : 0),
		[activePlayerId],
	);

	const activePlayer = useLiveQuery(
		() => (activePlayerId ? db.players.get(activePlayerId) : undefined),
		[activePlayerId],
	);

	useEffect(() => {
		if (historyCount === 1 && deferredPrompt) {
			setIsInstallModalOpen(true);
		}
	}, [historyCount, deferredPrompt]);

	if (!lastGameResult) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8 text-center">
				<p className="text-secondary font-hanken mb-4 uppercase tracking-widest-premium">
					No game result found
				</p>
				<Button onClick={() => setScreen('main')}>Return Home</Button>
			</div>
		);
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 1.1 }}
			className="flex flex-col h-full bg-white overflow-hidden"
		>
			{/* Header Section */}
			<header className="flex flex-col items-center justify-center pt-12 pb-8 px-5 shrink-0">
				<div className="bg-subtle-bg p-6 rounded-full mb-4">
					<Trophy className="w-16 h-16 text-primary-text" />
				</div>
				<h1 className="font-hanken text-3xl font-extrabold text-primary-text text-center mb-2 tracking-widest-premium uppercase">
					{t('result.victory')}
				</h1>
				<p className="font-hanken text-xs font-bold text-secondary text-center uppercase tracking-wider">
					{t('result.difficulty')} {t(`main_menu.difficulties.${lastGameResult.difficulty}`)}
				</p>
			</header>

			{/* Main Content Area */}
			<main className="flex-1 overflow-y-auto px-5 pb-40 flex flex-col gap-6">
				{/* Score Summary Card */}
				<section className="bg-white border border-border rounded-DEFAULT p-6 flex flex-col items-center justify-center gap-4 shadow-sm">
					<div className="flex flex-col items-center gap-1">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('result.time')}
						</span>
						<span className="font-hanken text-2xl font-bold text-primary-text">
							{formatTime(lastGameResult.timeElapsed)}
						</span>
					</div>
					<div className="w-full h-px bg-border"></div>
					<div className="flex flex-col items-center gap-1">
						<span className="font-hanken text-4xl font-extrabold text-primary-text">
							{lastGameResult.score}
						</span>
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('result.points')}
						</span>
					</div>
				</section>

				{/* Leaderboard */}
				<section className="flex flex-col gap-4">
					<h2 className="font-hanken text-lg font-bold text-primary-text text-center uppercase tracking-widest-premium">
						{t('result.top_5')} {t(`main_menu.difficulties.${lastGameResult.difficulty}`)}
					</h2>
					<div className="flex flex-col border border-border rounded bg-white overflow-hidden shadow-sm">
						{topScores?.map((entry, index) => (
							<div
								key={entry.id}
								className={`flex items-center justify-between p-4 border-b border-border last:border-0 ${
									entry.score === lastGameResult.score &&
									entry.timeElapsed === lastGameResult.timeElapsed
										? 'bg-subtle-bg'
										: ''
								}`}
							>
								<div className="flex items-center gap-4">
									<span className="font-hanken text-lg font-bold text-secondary w-6 text-center">
										{index + 1}
									</span>
									<div className="flex items-center gap-2">
										<User className="w-4 h-4 text-secondary" />
										<span
											className={`font-sans text-base ${entry.score === lastGameResult.score ? 'font-bold text-primary-text' : 'text-secondary'}`}
										>
											{entry.playerId === activePlayerId ? activePlayer?.name : 'Player'}
										</span>
									</div>
								</div>
								<span className="font-hanken text-lg font-bold text-primary-text">
									{entry.score}
								</span>
							</div>
						))}
					</div>
				</section>
			</main>

			{/* Fixed Action Area */}
			<footer className="absolute bottom-0 w-full bg-white border-t border-border p-5 flex flex-col gap-3 z-50">
				<Button
					variant="primary"
					size="lg"
					className="w-full gap-2"
					onClick={() => setScreen('game')}
				>
					<Play className="w-5 h-5 fill-current" />
					{t('result.new_game')}
				</Button>
				<Button
					variant="secondary"
					size="lg"
					className="w-full gap-2"
					onClick={() => setScreen('main')}
				>
					<Home className="w-5 h-5" />
					{t('result.return_home')}
				</Button>
			</footer>

			<InstallModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
		</motion.div>
	);
};

export default ResultScreen;
