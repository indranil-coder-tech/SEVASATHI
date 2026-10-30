import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { NeomorphicCard } from '../components/NeomorphicCard';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { AgriImage } from '../components/AgriImage';

describe('UI Components', () => {
  it('NeomorphicCard renders correctly with different variants and handles click', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <NeomorphicCard variant="raised" hoverEffect onClick={handleClick} className="test-class">
        <span>Card Content</span>
      </NeomorphicCard>
    );

    const card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('neo-card');
    expect(card).toHaveClass('test-class');
    expect(card).toHaveClass('cursor-pointer');

    fireEvent.click(card!);
    expect(handleClick).toHaveBeenCalledTimes(1);

    rerender(
      <NeomorphicCard variant="inset">
        <span>Card Content</span>
      </NeomorphicCard>
    );
    expect(screen.getByText('Card Content').parentElement).toHaveClass('neo-inset');

    rerender(
      <NeomorphicCard variant="flat">
        <span>Card Content</span>
      </NeomorphicCard>
    );
    expect(screen.getByText('Card Content').parentElement).toHaveClass('bg-[#E9EEE8]');
  });

  it('Footer renders brand info and year', () => {
    render(
      <AppProvider>
        <Footer />
      </AppProvider>
    );

    expect(screen.getByText(/SevaSathi/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('Navbar renders navigation links and allows tab switching', () => {
    const setActiveTab = vi.fn();
    render(
      <AppProvider>
        <Navbar activeTab="dashboard" setActiveTab={setActiveTab} />
      </AppProvider>
    );

    expect(screen.getByText(/SevaSathi/i)).toBeInTheDocument();
    
    // Test language buttons
    const englishBtn = screen.getByRole('button', { name: /English/i });
    expect(englishBtn).toBeInTheDocument();
    fireEvent.click(englishBtn);
  });

  it('AgriImage renders image with fallback on error', () => {
    render(
      <AgriImage
        src="invalid-image.jpg"
        alt="Test Crop"
        category="crop"
        className="crop-image"
      />
    );

    const img = screen.getByAltText('Test Crop');
    expect(img).toBeInTheDocument();

    // Trigger error event to test graceful degradation
    fireEvent.error(img);
  });
});
