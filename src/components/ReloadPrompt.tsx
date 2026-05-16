import { useRegisterSW } from 'virtual:pwa-register/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RefreshCw } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

function ReloadPrompt() {
	const { t } = useGameStore();
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r: ServiceWorkerRegistration | undefined) {
			console.log(`SW Registered: ${r}`);
		},
		onRegisterError(error: unknown) {
			console.error('SW registration error', error);
		},
	});

	const close = () => {
		setOfflineReady(false);
		setNeedRefresh(false);
	};

	return (
		<AnimatePresence>
			{(offlineReady || needRefresh) && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					className="absolute bottom-20 left-4 right-4 z-[100] mx-auto max-w-[400px]"
				>
					<div className="bg-primary-text text-white p-4 rounded-2xl shadow-2xl flex flex-col items-center justify-between gap-4 border border-white/10 overflow-hidden">
						<div className="flex flex-col gap-1 flex-1 text-center w-full">
							<span className="font-hanken text-xs font-black uppercase tracking-widest-premium">
								{offlineReady ? t('pwa.ready') : t('pwa.new_version')}
							</span>
							<p className="font-sans text-[10px] opacity-80 leading-tight">
								{offlineReady ? t('pwa.ready_msg') : t('pwa.new_version_msg')}
							</p>
						</div>
						<div className="flex gap-2 shrink-0 w-full">
							{needRefresh ? (
								<button
									type="button"
									onClick={() => updateServiceWorker(true)}
									className="bg-white text-primary-text px-4 py-2 rounded-full font-hanken text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 flex-1 shadow-sm active:scale-95 transition-transform"
								>
									<RefreshCw className="w-3 h-3" />
									{t('pwa.update')}
								</button>
							) : (
								<button
									type="button"
									onClick={() => close()}
									className="bg-white text-primary-text px-4 py-2 rounded-full font-hanken text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 flex-1 shadow-sm active:scale-95 transition-transform"
								>
									<Check className="w-3 h-3" />
									{t('pwa.close').toUpperCase()}
								</button>
							)}
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default ReloadPrompt;
