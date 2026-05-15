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
	it('should render with responsive flex classes', () => {
		render(React.createElement(ReloadPrompt));

		// The main container inside motion.div
		const container = screen.getByText(/Sudokupado is ready|SUDOKUPADO ya puede/i).parentElement
			?.parentElement;

		expect(container).not.toBeNull();
		// Check for flex-col (mobile) and sm:flex-row (tablet/desktop)
		expect(container?.className).toContain('flex-col');
		expect(container?.className).toContain('sm:flex-row');
	});

	it('should be positioned above BottomNavBar', () => {
		render(React.createElement(ReloadPrompt));
		const motionDiv = screen
			.getByText(/Sudokupado is ready|SUDOKUPADO ya puede/i)
			.closest('div[style*="opacity"]');
		// We can check if it has the fixed and bottom classes
		const wrapper = screen.getByText(/Sudokupado is ready|SUDOKUPADO ya puede/i).parentElement
			?.parentElement?.parentElement;
		expect(wrapper?.className).toContain('bottom-20');
	});
});
