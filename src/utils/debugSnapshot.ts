export const TRACKED_RECT_IDS = [
	'layout-outer',
	'layout-inner',
	'bottom-nav',
	'main-menu-root',
	'play-button-area',
] as const;

export type TrackedRectId = (typeof TRACKED_RECT_IDS)[number];

export interface RectSnapshot {
	bounding: {
		top: number;
		left: number;
		right: number;
		bottom: number;
		width: number;
		height: number;
	};
	computed: {
		position: string;
		display: string;
		overflow: string;
		transform: string;
		bottom: string;
		paddingBottom: string;
		height: string;
	};
}

export interface ViewportSnapshot {
	innerWidth: number;
	innerHeight: number;
	devicePixelRatio: number;
	visualViewport: {
		width: number;
		height: number;
		offsetTop: number;
		pageTop: number;
		scale: number;
	} | null;
	documentElement: {
		clientWidth: number;
		clientHeight: number;
	};
}

export interface LayoutSnapshot {
	label: string;
	timestamp: number;
	viewport: ViewportSnapshot;
	safeAreaInsets: {
		sat: string;
		sar: string;
		sab: string;
		sal: string;
	};
	rects: Record<TrackedRectId, RectSnapshot | null>;
	serviceWorker: {
		controllerScriptURL: string | null;
	};
	documentVisibilityState: DocumentVisibilityState;
}

const readCssVar = (name: string): string => {
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value === '' ? '0px' : value;
};

const captureRect = (id: TrackedRectId): RectSnapshot | null => {
	const el = document.getElementById(id);
	if (!el) return null;

	const rect = el.getBoundingClientRect();
	const computed = getComputedStyle(el);

	return {
		bounding: {
			top: rect.top,
			left: rect.left,
			right: rect.right,
			bottom: rect.bottom,
			width: rect.width,
			height: rect.height,
		},
		computed: {
			position: computed.position,
			display: computed.display,
			overflow: computed.overflow,
			transform: computed.transform,
			bottom: computed.bottom,
			paddingBottom: computed.paddingBottom,
			height: computed.height,
		},
	};
};

const captureViewport = (): ViewportSnapshot => {
	const vv = typeof window.visualViewport !== 'undefined' ? window.visualViewport : null;
	return {
		innerWidth: window.innerWidth,
		innerHeight: window.innerHeight,
		devicePixelRatio: window.devicePixelRatio,
		visualViewport: vv
			? {
					width: vv.width,
					height: vv.height,
					offsetTop: vv.offsetTop,
					pageTop: vv.pageTop,
					scale: vv.scale,
				}
			: null,
		documentElement: {
			clientWidth: document.documentElement.clientWidth,
			clientHeight: document.documentElement.clientHeight,
		},
	};
};

export const captureLayoutSnapshot = (label: string): LayoutSnapshot => {
	const rects = {} as Record<TrackedRectId, RectSnapshot | null>;
	for (const id of TRACKED_RECT_IDS) {
		rects[id] = captureRect(id);
	}

	return {
		label,
		timestamp: Date.now(),
		viewport: captureViewport(),
		safeAreaInsets: {
			sat: readCssVar('--sat'),
			sar: readCssVar('--sar'),
			sab: readCssVar('--sab'),
			sal: readCssVar('--sal'),
		},
		rects,
		serviceWorker: {
			controllerScriptURL:
				typeof navigator !== 'undefined' && navigator.serviceWorker?.controller
					? navigator.serviceWorker.controller.scriptURL
					: null,
		},
		documentVisibilityState: document.visibilityState,
	};
};

export const PRE_RELOAD_SNAPSHOT_KEY = 'debug-snapshot-pre-reload';
