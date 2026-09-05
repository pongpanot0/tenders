import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SourceHealthPage from './page';

// Mock next/navigation for usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/source-health',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('SourceHealthPage', () => {
  it('renders source health page with title', () => {
    render(<SourceHealthPage />);

    expect(screen.getByText('Source Health')).toBeInTheDocument();
  });

  it('renders all mock sources in table', () => {
    render(<SourceHealthPage />);

    expect(screen.getByText('EU TED')).toBeInTheDocument();
    expect(screen.getByText('National e-Procurement Portal (SG)')).toBeInTheDocument();
    expect(screen.getByText('Government Procurement (TH)')).toBeInTheDocument();
    expect(screen.getByText('Australian Contracts Finder')).toBeInTheDocument();
    expect(screen.getByText('World Bank Procurement')).toBeInTheDocument();
  });

  it('displays table headers', () => {
    render(<SourceHealthPage />);

    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Last Fetch')).toBeInTheDocument();
    expect(screen.getByText('Records/Run')).toBeInTheDocument();
    expect(screen.getByText('Error Rate')).toBeInTheDocument();
  });

  it('shows breach indicator for sources with SLA breach', () => {
    render(<SourceHealthPage />);

    // Australian Contracts Finder has a breach
    expect(screen.getByText('2 hours ago (breach)')).toBeInTheDocument();
  });

  it('shows disabled state when source is disabled', () => {
    const { rerender } = render(<SourceHealthPage />);

    // Open disable form for first source
    const buttons = screen.getAllByLabelText('More options');
    fireEvent.click(buttons[0]);

    // Fill in reason and submit
    const reasonTextarea = screen.getByPlaceholderText(
      /e\.g\., Temporary maintenance/
    ) as HTMLTextAreaElement;
    fireEvent.change(reasonTextarea, { target: { value: 'Testing disable' } });

    const disableButtons = screen.getAllByText(/Disable Source/);
    fireEvent.click(disableButtons[1]); // Click the button, not the heading

    // Re-render to see updated state
    rerender(<SourceHealthPage />);

    // The disabled source should show (disabled) label
    expect(screen.getByText(/\(disabled\)/)).toBeInTheDocument();
  });

  it('displays dashboard metrics', () => {
    render(<SourceHealthPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Active sources')).toBeInTheDocument();
    expect(screen.getByText('Avg. freshness')).toBeInTheDocument();
    expect(screen.getByText('SLA status')).toBeInTheDocument();
  });

  it('displays quick actions', () => {
    render(<SourceHealthPage />);

    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(screen.getByText('Run all sources now')).toBeInTheDocument();
    expect(screen.getByText('View system logs')).toBeInTheDocument();
    expect(screen.getByText('Source config')).toBeInTheDocument();
  });

  it('disable form requires reason before submission', () => {
    render(<SourceHealthPage />);

    // Open disable form
    const buttons = screen.getAllByLabelText('More options');
    fireEvent.click(buttons[0]);

    // Try to submit without reason - button should be disabled
    const disableButtons = screen.getAllByText(/Disable Source/);
    const disableButton = disableButtons[1] as HTMLButtonElement; // Get the button, not the heading
    expect(disableButton).toBeDisabled();

    // Fill in reason
    const reasonTextarea = screen.getByPlaceholderText(
      /e\.g\., Temporary maintenance/
    ) as HTMLTextAreaElement;
    fireEvent.change(reasonTextarea, { target: { value: 'Testing disable' } });

    // Button should now be enabled
    expect(disableButton).not.toBeDisabled();
  });

  it('closes modal when cancel is clicked', () => {
    render(<SourceHealthPage />);

    // Open disable form
    const buttons = screen.getAllByLabelText('More options');
    fireEvent.click(buttons[0]);

    const disableTexts = screen.getAllByText(/Disable Source/);
    expect(disableTexts.length).toBeGreaterThan(0);

    // Click cancel
    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);

    // Modal should be gone - the heading should not exist anymore
    const headings = screen.queryAllByText(/Disable Source/);
    expect(headings.length).toBe(0);
  });

  it('displays correct error rates for sources', () => {
    render(<SourceHealthPage />);

    expect(screen.getByText('0.02%')).toBeInTheDocument();
    expect(screen.getByText('0.00%')).toBeInTheDocument();
    expect(screen.getByText('0.15%')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('displays correct record counts', () => {
    render(<SourceHealthPage />);

    expect(screen.getByText('2,847 items')).toBeInTheDocument();
    expect(screen.getByText('153 items')).toBeInTheDocument();
    expect(screen.getByText('421 items')).toBeInTheDocument();
  });

  it('shows active policy status badges', () => {
    render(<SourceHealthPage />);

    const activeBadges = screen.getAllByText('Active');
    // Each source has a policy status badge
    expect(activeBadges.length).toBeGreaterThan(0);
  });
});
