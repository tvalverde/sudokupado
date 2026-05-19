import { useEffect, useMemo, useState } from 'react';
import {
	captureLayoutSnapshot,
	type LayoutSnapshot,
	PRE_RELOAD_SNAPSHOT_KEY,
} from '../utils/debugSnapshot';

const DEBUG_FLAG_KEY = 'debug';
const LIVE_INTERVAL_MS = 500;

const isDebugEnabled = (): boolean => {
	if (typeof window === 'undefined') return false;
	const params = new URLSearchParams(window.location.search);
	if (params.get('debug') === '1') {
		localStorage.setItem(DEBUG_FLAG_KEY, '1');
		return true;
	}
	return localStorage.getItem(DEBUG_FLAG_KEY) === '1';
};

const loadPreReloadSnapshot = (): LayoutSnapshot | null => {
	try {
		const raw = localStorage.getItem(PRE_RELOAD_SNAPSHOT_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as LayoutSnapshot;
	} catch {
		return null;
	}
};

const fmt = (n: number | string | undefined | null): string => {
	if (n === undefined || n === null) return '∅';
	if (typeof n === 'number') return `${Math.round(n * 10) / 10}`;
	return n;
};

interface KeyMetrics {
	winH: number | null;
	vvH: number | null;
	sab: string | null;
	innerH: number | null;
	innerBottom: number | null;
	navBottom: number | null;
	navHeight: number | null;
	playBottom: number | null;
}

const extractKeyMetrics = (s: LayoutSnapshot | null): KeyMetrics => {
	if (!s) {
		return {
			winH: null,
			vvH: null,
			sab: null,
			innerH: null,
			innerBottom: null,
			navBottom: null,
			navHeight: null,
			playBottom: null,
		};
	}
	const inner = s.rects['layout-inner'];
	const nav = s.rects['bottom-nav'];
	const play = s.rects['play-button-area'];
	return {
		winH: s.viewport.innerHeight,
		vvH: s.viewport.visualViewport?.height ?? null,
		sab: s.safeAreaInsets.sab,
		innerH: inner?.bounding.height ?? null,
		innerBottom: inner?.bounding.bottom ?? null,
		navBottom: nav?.bounding.bottom ?? null,
		navHeight: nav?.bounding.height ?? null,
		playBottom: play?.bounding.bottom ?? null,
	};
};

const Row: React.FC<{ label: string; value: string; warn?: boolean }> = ({
	label,
	value,
	warn,
}) => (
	<div className="flex justify-between gap-2">
		<span className="opacity-70">{label}</span>
		<span className={warn ? 'text-red-400 font-bold' : ''}>{value}</span>
	</div>
);

const Section: React.FC<{ title: string; snapshot: LayoutSnapshot | null }> = ({
	title,
	snapshot,
}) => {
	const m = extractKeyMetrics(snapshot);
	const navOutside = m.navBottom !== null && m.winH !== null && m.navBottom > m.winH + 0.5;
	const innerOverflow = m.innerBottom !== null && m.winH !== null && m.innerBottom > m.winH + 0.5;

	return (
		<div className="border-t border-green-700 pt-1 mt-1">
			<div className="font-bold text-green-300">
				{title} {snapshot ? `(${snapshot.label})` : '(none)'}
			</div>
			{!snapshot ? (
				<div className="opacity-50 italic">—</div>
			) : (
				<>
					<Row label="window.innerHeight" value={fmt(m.winH)} />
					<Row label="visualViewport.height" value={fmt(m.vvH)} />
					<Row label="--sab" value={fmt(m.sab)} />
					<Row label="inner.height" value={fmt(m.innerH)} />
					<Row label="inner.bottom" value={fmt(m.innerBottom)} warn={innerOverflow} />
					<Row label="nav.bottom" value={fmt(m.navBottom)} warn={navOutside} />
					<Row label="nav.height" value={fmt(m.navHeight)} />
					<Row label="play.bottom" value={fmt(m.playBottom)} />
				</>
			)}
		</div>
	);
};

const DebugOverlay: React.FC = () => {
	const [enabled] = useState<boolean>(() => isDebugEnabled());
	const [preReload] = useState<LayoutSnapshot | null>(() =>
		enabled ? loadPreReloadSnapshot() : null,
	);
	const [postMount, setPostMount] = useState<LayoutSnapshot | null>(null);
	const [live, setLive] = useState<LayoutSnapshot | null>(null);

	useEffect(() => {
		if (!enabled) return;

		// Capture in next frame so the DOM has painted at least once.
		const rafId = requestAnimationFrame(() => {
			setPostMount(captureLayoutSnapshot('post-mount'));
			setLive(captureLayoutSnapshot('live-initial'));
		});

		const intervalId = window.setInterval(() => {
			setLive(captureLayoutSnapshot('live'));
		}, LIVE_INTERVAL_MS);

		return () => {
			cancelAnimationFrame(rafId);
			window.clearInterval(intervalId);
		};
	}, [enabled]);

	const payloadJson = useMemo(
		() => JSON.stringify({ preReload, postMount, live }, null, 2),
		[preReload, postMount, live],
	);

	if (!enabled) return null;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(payloadJson);
		} catch {
			// Clipboard API may be unavailable on some Android contexts.
			window.prompt('Copy snapshot JSON manually:', payloadJson);
		}
	};

	const handleClearPre = () => {
		localStorage.removeItem(PRE_RELOAD_SNAPSHOT_KEY);
		window.location.reload();
	};

	const handleOff = () => {
		localStorage.removeItem(DEBUG_FLAG_KEY);
		localStorage.removeItem(PRE_RELOAD_SNAPSHOT_KEY);
		window.location.reload();
	};

	return (
		<div
			style={{
				position: 'fixed',
				top: 4,
				left: 4,
				zIndex: 9999,
				maxWidth: '70vw',
				maxHeight: '70vh',
				overflowY: 'auto',
				font: '10px/1.2 ui-monospace, monospace',
				background: 'rgba(0,0,0,0.85)',
				color: '#0f0',
				padding: 6,
				borderRadius: 4,
				border: '1px solid #0f0',
				pointerEvents: 'auto',
			}}
		>
			<div className="flex gap-1 mb-1">
				<button type="button" onClick={handleCopy} className="bg-green-700 px-1 rounded">
					copy
				</button>
				<button type="button" onClick={handleClearPre} className="bg-yellow-700 px-1 rounded">
					clear-pre
				</button>
				<button type="button" onClick={handleOff} className="bg-red-700 px-1 rounded">
					off
				</button>
			</div>
			<Section title="PRE-RELOAD" snapshot={preReload} />
			<Section title="POST-MOUNT" snapshot={postMount} />
			<Section title="LIVE" snapshot={live} />
		</div>
	);
};

export default DebugOverlay;
