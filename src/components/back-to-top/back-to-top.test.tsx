import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BackToTop } from './back-to-top';

describe('BackToTop', () => {
  beforeEach(() => {
    // Reset scroll position
    window.scrollY = 0;
    // Mock scrollTo
    window.scrollTo = vi.fn();

    // Mock matchMedia for Framer Motion
    const mediaQueryList = {
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    window.matchMedia = vi.fn((query) => ({
      ...mediaQueryList,
      media: query,
    }));
  });

  it('should not be visible initially', () => {
    render(<BackToTop />);

    const button = screen.queryByLabelText('Back to top');
    expect(button).not.toBeInTheDocument();
  });

  it('should become visible when scrolled down more than 250px', async () => {
    render(<BackToTop />);

    await act(async () => {
      window.scrollY = 251;
      window.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      const button = screen.getByLabelText('Back to top');
      expect(button).toBeInTheDocument();
    });
  });

  it('should hide when scrolled back up', async () => {
    render(<BackToTop />);

    // Scroll down
    await act(async () => {
      window.scrollY = 251;
      window.dispatchEvent(new Event('scroll'));
    });

    // Verify button appears
    await waitFor(() => {
      expect(screen.getByLabelText('Back to top')).toBeInTheDocument();
    });

    // Scroll back up
    await act(async () => {
      window.scrollY = 0;
      window.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Back to top')).not.toBeInTheDocument();
    });
  });

  it('should scroll to top when clicked', async () => {
    render(<BackToTop />);

    // Make button visible
    await act(async () => {
      window.scrollY = 251;
      window.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      const button = screen.getByLabelText('Back to top');
      expect(button).toBeInTheDocument();
    });

    // Click the button
    await act(async () => {
      screen.getByLabelText('Back to top').click();
    });

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });
});
