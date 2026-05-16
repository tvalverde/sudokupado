import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const OrientationOverlay: React.FC = () => {
	const { t } = useGameStore();
	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		const checkOrientation = () => {
			// Check if width > height and it's likely a mobile device (or just enforce it everywhere for PWA feel)
			setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
		};

		window.addEventListener('resize', checkOrientation);
		checkOrientation();

		return () => window.removeEventListener('resize', checkOrientation);
	}, []);

	return (
		<AnimatePresence>
			{isLandscape && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-10 text-center"
				>
					<motion.div
						animate={{ rotate: [0, 90, 0] }}
						transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
						className="mb-8"
					>
						<Smartphone className="w-20 h-20 text-primary-text" />
					</motion.div>

					<h2 className="font-hanken text-2xl font-extrabold text-primary-text uppercase tracking-widest-premium mb-4">
						{t('orientation.title')}
					</h2>

					<p className="font-sans text-secondary text-sm leading-relaxed max-w-xs">
						{t('orientation.message')}
					</p>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default OrientationOverlay;
