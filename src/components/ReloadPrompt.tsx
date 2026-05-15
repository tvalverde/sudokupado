import { useRegisterSW } from 'virtual:pwa-register/react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
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
		onRegisterError(error: any) {
			console.log('SW registration error', error);
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
					className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-container"
				>
					<div className="bg-primary-text text-white p-5 rounded-xl shadow-2xl flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 border border-white/10">
						<div className="flex flex-col gap-1 flex-1 text-center sm:text-left w-full">
							<span className="font-hanken text-xs font-black uppercase tracking-widest-premium">
								{offlineReady ? t('pwa.ready') : t('pwa.new_version')}
							</span>
							<p className="font-sans text-[11px] opacity-80 leading-snug">
								{offlineReady ? t('pwa.ready_msg') : t('pwa.new_version_msg')}
							</p>
						</div>
						<div className="flex gap-2 shrink-0 w-full sm:w-auto">
							{needRefresh && (
								<button
									type="button"
									onClick={() => updateServiceWorker(true)}
									className="bg-white text-primary-text px-5 py-2.5 rounded-full font-hanken text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 flex-1 sm:flex-none shadow-sm active:scale-95 transition-transform"
								>
									<RefreshCw className="w-3.5 h-3.5" />
									{t('pwa.update')}
								</button>
							)}
							<button
								type="button"
								onClick={() => close()}
								className="px-4 py-2.5 font-hanken text-[10px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 flex-1 sm:flex-none"
							>
								{t('pwa.close')}
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default ReloadPrompt;
