import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		clear: () => {
			store = {};
		},
		removeItem: (key: string) => {
			delete store[key];
		},
	};
})();

// Mock Worker for jsdom
class WorkerMock {
	onmessage: ((ev: MessageEvent) => any) | null = null;
	terminate = vi.fn();
	postMessage = vi.fn();
	addEventListener = vi.fn();
	removeEventListener = vi.fn();
}

vi.stubGlobal('Worker', WorkerMock);

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
});
