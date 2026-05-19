import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	captureLayoutSnapshot,
	PRE_RELOAD_SNAPSHOT_KEY,
	TRACKED_RECT_IDS,
} from '../utils/debugSnapshot';

describe('captureLayoutSnapshot', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		const style = document.createElement('style');
		style.id = 'test-css-vars';
		style.textContent = ':root { --sat: 0px; --sar: 0px; --sab: 24px; --sal: 0px; }';
		document.head.appendChild(style);
	});

	afterEach(() => {
		document.getElementById('test-css-vars')?.remove();
		localStorage.removeItem(PRE_RELOAD_SNAPSHOT_KEY);
	});

	it('returns a stable shape with null rects when no tracked elements exist', () => {
		const snap = captureLayoutSnapshot('no-elements');

		expect(snap.label).toBe('no-elements');
		expect(typeof snap.timestamp).toBe('number');
		expect(snap.timestamp).toBeGreaterThan(0);

		for (const id of TRACKED_RECT_IDS) {
			expect(snap.rects[id]).toBeNull();
		}

		expect(snap.viewport.innerWidth).toBeGreaterThanOrEqual(0);
		expect(snap.viewport.innerHeight).toBeGreaterThanOrEqual(0);
	});

	it('captures bounding rect when a tracked element exists', () => {
		const el = document.createElement('div');
		el.id = 'bottom-nav';
		el.style.position = 'absolute';
		el.style.bottom = '0';
		el.style.height = '64px';
		el.style.width = '100%';
		document.body.appendChild(el);

		const snap = captureLayoutSnapshot('with-element');
		const navRect = snap.rects['bottom-nav'];

		expect(navRect).not.toBeNull();
		expect(navRect?.bounding.height).toBeGreaterThanOrEqual(0);
		expect(navRect?.computed.position).toBe('absolute');
	});

	it('reads safe-area inset CSS variables from :root', () => {
		const snap = captureLayoutSnapshot('css-vars');

		expect(snap.safeAreaInsets.sab).toBe('24px');
		expect(snap.safeAreaInsets.sat).toBe('0px');
	});

	it('normalizes missing CSS variables to "0px"', () => {
		document.getElementById('test-css-vars')?.remove();
		const snap = captureLayoutSnapshot('missing-vars');

		expect(snap.safeAreaInsets.sab).toBe('0px');
	});

	it('exposes service worker controller URL or null', () => {
		const snap = captureLayoutSnapshot('sw');
		expect(
			snap.serviceWorker.controllerScriptURL === null ||
				typeof snap.serviceWorker.controllerScriptURL === 'string',
		).toBe(true);
	});
});
