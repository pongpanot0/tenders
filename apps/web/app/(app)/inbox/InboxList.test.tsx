import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InboxList from './InboxList';
import { mockTenders } from '@/lib/mock-data';

describe('InboxList', () => {
  it('renders all mock tenders by default', () => {
    render(<InboxList />);

    // Check that the page title is present
    expect(screen.getByText('Opportunities')).toBeInTheDocument();

    // Check that at least the first few tender titles are visible
    const firstTender = mockTenders[0];
    expect(screen.getAllByText(firstTender.title).length).toBeGreaterThan(0);

    const secondTender = mockTenders[1];
    expect(screen.getAllByText(secondTender.title).length).toBeGreaterThan(0);
  });

  it('shows the correct count of open matches', () => {
    render(<InboxList />);

    const countText = screen.getByText(
      new RegExp(`${mockTenders.length} open match`)
    );
    expect(countText).toBeInTheDocument();
  });

  it('filters tenders by search text in title', () => {
    render(<InboxList />);

    const searchInput = screen.getByPlaceholderText(
      'Search by title, buyer...'
    ) as HTMLInputElement;

    // Search for "Cloud" - should find the first tender
    fireEvent.change(searchInput, { target: { value: 'Cloud' } });

    const cloudTenders = screen.queryAllByText('Cloud case management');
    expect(cloudTenders.length).toBeGreaterThan(0);
    // Second tender should not be visible
    expect(screen.queryByText('Mobile service platform')).not.toBeInTheDocument();
  });

  it('filters tenders by search text in buyer name', () => {
    render(<InboxList />);

    const searchInput = screen.getByPlaceholderText(
      'Search by title, buyer...'
    ) as HTMLInputElement;

    // Search for "Ministry" - should find the first tender
    fireEvent.change(searchInput, { target: { value: 'Ministry' } });

    const cloudTenders = screen.queryAllByText('Cloud case management');
    expect(cloudTenders.length).toBeGreaterThan(0);
    const ministryTenders = screen.queryAllByText(/Ministry of Health/);
    expect(ministryTenders.length).toBeGreaterThan(0);
  });

  it('displays empty state when search returns no results', () => {
    render(<InboxList />);

    const searchInput = screen.getByPlaceholderText(
      'Search by title, buyer...'
    ) as HTMLInputElement;

    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'NonexistentTender' } });

    expect(
      screen.getByText('No open opportunities match these filters.')
    ).toBeInTheDocument();
  });

  it('clears filters when "Clear filters" button is clicked', () => {
    render(<InboxList />);

    const searchInput = screen.getByPlaceholderText(
      'Search by title, buyer...'
    ) as HTMLInputElement;

    // Perform a search
    fireEvent.change(searchInput, { target: { value: 'NonexistentTender' } });

    expect(
      screen.getByText('No open opportunities match these filters.')
    ).toBeInTheDocument();

    // Click clear filters button - get the one in the empty state, not the reset button
    const clearButtons = screen.getAllByText('Clear filters');
    fireEvent.click(clearButtons[0]);

    // Search should be cleared and all tenders should be visible
    expect(searchInput.value).toBe('');
    const cloudTenders = screen.queryAllByText('Cloud case management');
    expect(cloudTenders.length).toBeGreaterThan(0);
  });

  it('selects a tender and shows its detail panel', () => {
    render(<InboxList />);

    // Find the first tender row (the one with the title in the list area)
    const firstTenderTitles = screen.getAllByText(mockTenders[0].title);
    // The first one should be in the list, the second in the detail panel (if selected)
    const firstTenderRow = firstTenderTitles[0].closest('div');

    // Click the first tender to select it
    fireEvent.click(firstTenderRow!);

    // The detail panel should show the tender's information
    expect(screen.getByText(mockTenders[0].buyerName)).toBeInTheDocument();
    expect(screen.getByText(/Strong match/)).toBeInTheDocument();
  });

  it('updates detail panel when selecting a different tender', () => {
    render(<InboxList />);

    // Click the second tender (get all occurrences and pick the one in the list)
    const secondTenderTitles = screen.getAllByText(mockTenders[1].title);
    const secondTenderRow = secondTenderTitles[0].closest('div');
    fireEvent.click(secondTenderRow!);

    // The detail panel should show the second tender's information
    expect(screen.getByText(mockTenders[1].buyerName)).toBeInTheDocument();
    expect(screen.getAllByText(mockTenders[1].title).length).toBeGreaterThan(0);
  });

  it('displays fit tags for tenders', () => {
    render(<InboxList />);

    const firstTender = mockTenders[0];
    // The first tender has fitTags: ['React', 'AWS']
    firstTender.fitTags.forEach((tag) => {
      const tags = screen.getAllByText(tag);
      expect(tags.length).toBeGreaterThan(0);
    });
  });

  it('displays risk icon only for tenders with hasRisk=true', () => {
    render(<InboxList />);

    // Find tenders with risk
    const tendersWithRisk = mockTenders.filter((t) => t.hasRisk);

    // There should be at least one tender with risk based on mock data
    expect(tendersWithRisk.length).toBeGreaterThan(0);

    // The risk icon should be present in the rendered component
    const riskButtons = screen.getAllByTitle('Risk');
    expect(riskButtons.length).toBe(tendersWithRisk.length);
  });

  it('displays score badge with correct number', () => {
    render(<InboxList />);

    mockTenders.slice(0, 3).forEach((tender) => {
      expect(screen.getByText(tender.score.toString())).toBeInTheDocument();
    });
  });
});
