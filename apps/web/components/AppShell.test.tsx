import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from './AppShell';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/inbox'),
}));

describe('AppShell', () => {
  it('renders all primary nav items', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('nav-item-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-explore')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-pipeline')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-alerts')).toBeInTheDocument();
  });

  it('renders all account nav items', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('nav-item-profile')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-settings')).toBeInTheDocument();
  });

  it('renders org selector with Acme Software', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    const selector = screen.getByDisplayValue('Acme Software');
    expect(selector).toBeInTheDocument();
  });

  it('marks inbox nav item as active on /inbox route', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    const inboxNavItem = screen.getByTestId('nav-item-inbox');
    expect(inboxNavItem).toHaveAttribute('data-active', 'true');
  });

  it('renders children content', () => {
    render(
      <AppShell>
        <div>Custom Content Area</div>
      </AppShell>
    );

    expect(screen.getByText('Custom Content Area')).toBeInTheDocument();
  });

  it('renders search input and cmd+k hint', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    // The search box is rendered as a div with placeholder text
    const searchElements = screen.getAllByText('Search tenders...');
    expect(searchElements.length).toBeGreaterThan(0);
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('renders logo with Tender Intelligence branding', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    expect(screen.getByText('Tender Intelligence')).toBeInTheDocument();
  });

  it('renders mobile nav items', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('mobile-nav-item-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-item-more')).toBeInTheDocument();
  });
});
