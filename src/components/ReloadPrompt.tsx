import { useRegisterSW } from 'virtual:pwa-register/react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

function ReloadPrompt() {
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
					className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-40px)] max-w-container"
				>
					<div className="bg-primary-text text-white p-4 rounded-lg shadow-2xl flex items-center justify-between gap-4 border border-white/10">
						<div className="flex flex-col gap-0.5">
							<span className="font-hanken text-xs font-bold uppercase tracking-widest-premium">
								{offlineReady ? 'App Ready Offline' : 'New Version Available'}
							</span>
							<p className="font-sans text-[11px] opacity-80">
								{offlineReady
									? 'Sudokupado is ready to be played without internet.'
									: 'A new update is available for a better experience.'}
							</p>
						</div>
						<div className="flex gap-2">
							{needRefresh && (
								<button
									onClick={() => updateServiceWorker(true)}
									className="bg-white text-primary-text px-4 py-2 rounded-full font-hanken text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
								>
									<RefreshCw className="w-3 h-3" />
									Update
								</button>
							)}
							<button
								onClick={() => close()}
								className="px-3 py-2 font-hanken text-[10px] font-bold uppercase tracking-wider opacity-60 hover:opacity-100"
							>
								Close
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default ReloadPrompt;
