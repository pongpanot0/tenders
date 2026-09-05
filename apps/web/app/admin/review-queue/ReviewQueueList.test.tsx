import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewQueuePage from './page';

// Mock next/navigation for usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/review-queue',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('ReviewQueuePage', () => {
  it('renders review queue page with title', () => {
    render(<ReviewQueuePage />);

    expect(screen.getByText('Review Queue')).toBeInTheDocument();
  });

  it('renders all review items across issue types', () => {
    render(<ReviewQueuePage />);

    expect(screen.getByText('Duplicate tender detected')).toBeInTheDocument();
    expect(screen.getByText('Unable to extract deadline')).toBeInTheDocument();
    expect(screen.getByText('Ambiguous technical requirement')).toBeInTheDocument();
    expect(screen.getByText('Missing required buyer information')).toBeInTheDocument();
    expect(screen.getByText('Accessibility restriction detected')).toBeInTheDocument();
    expect(screen.getByText('Conflicting budget ranges')).toBeInTheDocument();
  });

  it('displays stats correctly', () => {
    render(<ReviewQueuePage />);

    expect(screen.getByText('Items in queue')).toBeInTheDocument();
    expect(screen.getByText('Policy issues')).toBeInTheDocument();
    expect(screen.getByText('Extraction errors')).toBeInTheDocument();

    // Should show 6 items, 2 policy issues, 2 extraction errors
    const itemsInQueue = screen.getByText('Items in queue').nextElementSibling;
    expect(itemsInQueue?.textContent).toBe('6');
  });

  it('renders policy issue badges', () => {
    render(<ReviewQueuePage />);

    const policyBadges = screen.getAllByText('Policy Issue');
    expect(policyBadges.length).toBeGreaterThan(0);
  });

  it('renders extraction error badges', () => {
    render(<ReviewQueuePage />);

    const extractionBadges = screen.getAllByText('Extraction Error');
    expect(extractionBadges.length).toBeGreaterThan(0);
  });

  it('renders low confidence badges', () => {
    render(<ReviewQueuePage />);

    const lowConfidenceBadges = screen.getAllByText('Low Confidence');
    expect(lowConfidenceBadges.length).toBeGreaterThan(0);
  });

  it('renders malformed item badges', () => {
    render(<ReviewQueuePage />);

    const malformedBadges = screen.getAllByText('Malformed Item');
    expect(malformedBadges.length).toBeGreaterThan(0);
  });

  it('displays item metadata with source and run ID', () => {
    render(<ReviewQueuePage />);

    // Use queryAllByText since there might be multiple elements with this pattern
    const sourceTexts = screen.getAllByText(/Source: EU TED/);
    expect(sourceTexts.length).toBeGreaterThan(0);

    const runTexts = screen.getAllByText(/run-2026-001/);
    expect(runTexts.length).toBeGreaterThan(0);
  });

  it('shows resolution requires confirmation with reason', () => {
    render(<ReviewQueuePage />);

    // Click on a disposition action (e.g., "Mark as duplicate")
    const markDuplicateButtons = screen.getAllByText('Mark as duplicate');
    fireEvent.click(markDuplicateButtons[0]); // Click the first one

    // Confirmation modal should appear
    expect(screen.getByText('Resolve Review Item')).toBeInTheDocument();

    // The action should be shown in the modal - use getAllByText since it appears in both button and modal
    const actionTexts = screen.getAllByText(/Mark as duplicate/);
    expect(actionTexts.length).toBeGreaterThan(0);

    // Try to submit without reason - button should be disabled
    const confirmButton = screen.getByText('Confirm Resolution') as HTMLButtonElement;
    expect(confirmButton).toBeDisabled();
  });

  it('requires reason before item can be resolved', () => {
    render(<ReviewQueuePage />);

    // Click on a disposition action
    const markDuplicateButton = screen.getByText('Mark as duplicate');
    fireEvent.click(markDuplicateButton);

    // Fill in reason
    const reasonTextarea = screen.getByPlaceholderText(
      /Explain why you are resolving/
    ) as HTMLTextAreaElement;
    fireEvent.change(reasonTextarea, { target: { value: 'Verified duplicate' } });

    // Button should now be enabled
    const confirmButton = screen.getByText('Confirm Resolution') as HTMLButtonElement;
    expect(confirmButton).not.toBeDisabled();
  });

  it('removes item from queue after confirmation', () => {
    render(<ReviewQueuePage />);

    // Get initial item count
    let itemsInQueue = screen.getByText('Items in queue').nextElementSibling;
    const initialCount = parseInt(itemsInQueue?.textContent || '0');

    // Click on a disposition action
    const markDuplicateButton = screen.getByText('Mark as duplicate');
    fireEvent.click(markDuplicateButton);

    // Fill in reason and submit
    const reasonTextarea = screen.getByPlaceholderText(
      /Explain why you are resolving/
    ) as HTMLTextAreaElement;
    fireEvent.change(reasonTextarea, { target: { value: 'Verified duplicate' } });

    const confirmButton = screen.getByText('Confirm Resolution');
    fireEvent.click(confirmButton);

    // Item count should decrease
    itemsInQueue = screen.getByText('Items in queue').nextElementSibling;
    const newCount = parseInt(itemsInQueue?.textContent || '0');
    expect(newCount).toBe(initialCount - 1);

    // The specific item should be removed
    expect(screen.queryByText('Duplicate tender detected')).not.toBeInTheDocument();
  });

  it('closes confirmation modal when cancel is clicked', () => {
    render(<ReviewQueuePage />);

    // Click on a disposition action
    const markDuplicateButton = screen.getByText('Mark as duplicate');
    fireEvent.click(markDuplicateButton);

    expect(screen.getByText('Resolve Review Item')).toBeInTheDocument();

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Modal should be gone but items should still be there
    expect(screen.queryByText('Resolve Review Item')).not.toBeInTheDocument();
    expect(screen.getByText('Duplicate tender detected')).toBeInTheDocument();
  });

  it('displays items with specific source identifiers in confirmation', () => {
    render(<ReviewQueuePage />);

    // Click on "Not a duplicate" for the first policy issue
    const notDuplicateButton = screen.getByText('Not a duplicate');
    fireEvent.click(notDuplicateButton);

    // Should show the specific item details in confirmation - use getAllByText for duplicates
    const itemTitles = screen.getAllByText('Duplicate tender detected');
    expect(itemTitles.length).toBeGreaterThan(0);

    const sourceTexts = screen.getAllByText(/Source: EU TED/);
    expect(sourceTexts.length).toBeGreaterThan(0);

    const runTexts = screen.getAllByText(/run-2026-001/);
    expect(runTexts.length).toBeGreaterThan(0);
  });

  it('handles multiple action buttons per item', () => {
    render(<ReviewQueuePage />);

    // The "Ambiguous technical requirement" item should have 3 action buttons
    expect(screen.getByText('Accept extraction')).toBeInTheDocument();
    expect(screen.getByText('Edit & resave')).toBeInTheDocument();
    expect(screen.getByText('Uncertain — escalate')).toBeInTheDocument();
  });

  it('displays item descriptions in content area', () => {
    render(<ReviewQueuePage />);

    // Check that descriptions are visible
    expect(screen.getByText(/Tender ID TEN\/2026-8844.*duplicate.*TEN\/2026-8840/)).toBeInTheDocument();
    expect(screen.getByText(/OCR extracted text.*deadline field/)).toBeInTheDocument();
  });

  it('shows empty state when all items are resolved', () => {
    const { rerender } = render(<ReviewQueuePage />);

    // Resolve all 6 items
    for (let i = 0; i < 6; i++) {
      const firstButton = screen.getAllByText(/Mark as duplicate|Provide deadline|Accept extraction|Lookup buyer|Acknowledge|Verify budget/)[0];
      fireEvent.click(firstButton);

      const reasonTextarea = screen.getByPlaceholderText(
        /Explain why you are resolving/
      ) as HTMLTextAreaElement;
      fireEvent.change(reasonTextarea, { target: { value: `Reason ${i}` } });

      const confirmButton = screen.getByText('Confirm Resolution');
      fireEvent.click(confirmButton);

      rerender(<ReviewQueuePage />);
    }

    // Empty state should be shown
    expect(screen.getByText(/No items in review queue/)).toBeInTheDocument();
  });

  it('displays item metadata with timestamp', () => {
    render(<ReviewQueuePage />);

    expect(screen.getByText(/Discovered 3 hours ago/)).toBeInTheDocument();
    expect(screen.getByText(/Discovered 2 hours ago/)).toBeInTheDocument();
    expect(screen.getByText(/Discovered 1 hour ago/)).toBeInTheDocument();
  });
});
