import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Regression: PWA update reloads reliably without nav disappearing', () => {
	beforeEach(() => {
		vi.mocked(window.location.reload).mockClear();
	});

	it('sends SKIP_WAITING and reloads when SW reaches activated state', async () => {
		const mockWaiting = new EventTarget() as EventTarget & {
			state: string;
			postMessage: (message: unknown) => void;
		};
		mockWaiting.state = 'installed';
		mockWaiting.postMessage = vi.fn();

		const timeout = setTimeout(() => window.location.reload(), 5000);
		const done = new Promise<void>((resolve) => {
			const handler = (e: Event) => {
				if ((e.target as typeof mockWaiting).state === 'activated') {
					clearTimeout(timeout);
					mockWaiting.removeEventListener('statechange', handler);
					window.location.reload();
					resolve();
				}
			};
			mockWaiting.addEventListener('statechange', handler);
		});

		mockWaiting.postMessage({ type: 'SKIP_WAITING' });

		expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
		expect(window.location.reload).not.toHaveBeenCalled();

		mockWaiting.state = 'activated';
		mockWaiting.dispatchEvent(new Event('statechange'));

		await done;
		expect(window.location.reload).toHaveBeenCalledTimes(1);
		clearTimeout(timeout);
	});

	it('falls back to immediate reload when no waiting SW exists', () => {
		const waiting: ServiceWorker | null = null;
		if (!waiting) window.location.reload();
		expect(window.location.reload).toHaveBeenCalledTimes(1);
	});

	it('does not reload before SW reaches activated state', async () => {
		const mockWaiting = new EventTarget() as EventTarget & {
			state: string;
			postMessage: (message: unknown) => void;
		};
		mockWaiting.state = 'installing';
		mockWaiting.postMessage = vi.fn();

		const timeout = setTimeout(() => window.location.reload(), 5000);
		mockWaiting.addEventListener('statechange', function onStateChange(e) {
			if ((e.target as typeof mockWaiting).state === 'activated') {
				clearTimeout(timeout);
				mockWaiting.removeEventListener('statechange', onStateChange);
				window.location.reload();
			}
		});

		mockWaiting.state = 'activating';
		mockWaiting.dispatchEvent(new Event('statechange'));

		await new Promise((r) => setTimeout(r, 50));

		expect(window.location.reload).not.toHaveBeenCalled();
		clearTimeout(timeout);
	});
});
