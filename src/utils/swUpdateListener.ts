import { captureLayoutSnapshot, PRE_RELOAD_SNAPSHOT_KEY } from './debugSnapshot';

export const installSWUpdateListener = (): void => {
	const sw = navigator.serviceWorker;
	if (!sw) return;

	const hadController = sw.controller !== null;
	let refreshing = false;

	sw.addEventListener('controllerchange', () => {
		if (!hadController || refreshing) return;
		refreshing = true;
		try {
			const snapshot = captureLayoutSnapshot('pre-controllerchange-reload');
			localStorage.setItem(PRE_RELOAD_SNAPSHOT_KEY, JSON.stringify(snapshot));
		} catch {
			// localStorage may be unavailable (quota, private mode); ignore.
		}
		window.location.reload();
	});
};
