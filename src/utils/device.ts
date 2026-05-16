export const isIOS = (): boolean =>
	typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

export const isStandalone = (): boolean =>
	(typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
	(typeof navigator !== 'undefined' && (navigator as { standalone?: boolean }).standalone === true);
