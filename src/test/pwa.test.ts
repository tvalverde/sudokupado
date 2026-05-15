import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ReloadPrompt from '../components/ReloadPrompt';

// Mock the PWA register hook
vi.mock('virtual:pwa-register/react', () => ({
	useRegisterSW: () => ({
		offlineReady: [true, vi.fn()],
		needRefresh: [false, vi.fn()],
		updateServiceWorker: vi.fn(),
	}),
}));

describe('Regression: PWA Toast Mobile Layout', () => {
	it('should render with responsive absolute positioning', () => {
		render(React.createElement(ReloadPrompt));

		// Check the motion.div wrapper (it has absolute class)
		const container = screen
			.getByText(/Sudokupado is ready|SUDOKUPADO ya puede/i)
			.closest('div[class*="absolute"]');

		expect(container).not.toBeNull();
		expect(container?.className).toContain('absolute');
		expect(container?.className).toContain('left-4');
		expect(container?.className).toContain('right-4');
	});

	it('should be positioned above BottomNavBar', () => {
		render(React.createElement(ReloadPrompt));
		const wrapper = screen
			.getByText(/Sudokupado is ready|SUDOKUPADO ya puede/i)
			.closest('div[class*="absolute"]');
		expect(wrapper?.className).toContain('bottom-20');
	});
});
