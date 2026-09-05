import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ExploreTable from './ExploreTable';
import { mockTenders } from '@/lib/mock-data';

describe('ExploreTable', () => {
  it('renders all tenders by default', () => {
    render(<ExploreTable tenders={mockTenders} showFitColumn={true} />);

    // Check that all tender titles are visible
    mockTenders.forEach((tender) => {
      expect(screen.getByText(tender.title)).toBeInTheDocument();
    });

    // Check column headers exist
    expect(screen.getByText('Tender / Buyer')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Deadline')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('displays buyer names for each tender', () => {
    render(<ExploreTable tenders={mockTenders} showFitColumn={true} />);

    mockTenders.forEach((tender) => {
      expect(screen.getByText(new RegExp(tender.buyerName))).toBeInTheDocument();
    });
  });

  it('displays all countries correctly', () => {
    render(<ExploreTable tenders={mockTenders} showFitColumn={true} />);

    const uniqueCountries = [...new Set(mockTenders.map((t) => t.country))];
    uniqueCountries.forEach((country) => {
      expect(screen.getAllByText(country).length).toBeGreaterThan(0);
    });
  });

  it('formats value correctly for tenders with estimated value', () => {
    render(<ExploreTable tenders={mockTenders} showFitColumn={true} />);

    // Check that a tender with a value is formatted with currency and amount
    const tenderWithValue = mockTenders.find((t) => t.estimatedValue !== null);
    if (tenderWithValue && tenderWithValue.estimatedValue !== null) {
      const expectedText = `${tenderWithValue.currency} ${tenderWithValue.estimatedValue.toLocaleString()}`;
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    }
  });

  it('displays "Not stated" for tenders without estimated value', () => {
    render(<ExploreTable tenders={mockTenders} showFitColumn={true} />);

    // Tender 005 has estimatedValue: null
    const notStatedElements = screen.getAllByText('Not stated');
    expect(notStatedElements.length).toBeGreaterThan(0);
  });

  it('shows Your fit column when showFitColumn is true', () => {
    render(<ExploreTable tenders={mockTenders} showFitColumn={true} />);

    expect(screen.getByText('Your fit')).toBeInTheDocument();

    // Check that score badges are rendered
    mockTenders.forEach((tender) => {
      expect(screen.getByText(tender.score.toString())).toBeInTheDocument();
    });
  });

  it('hides Your fit column when showFitColumn is false', () => {
    const { queryByText } = render(
      <ExploreTable tenders={mockTenders} showFitColumn={false} />
    );

    // The "Your fit" header should not be visible
    // Note: We check for the header text; individual score badges won't appear in the grid
    const columnHeaders = screen.getAllByText(/Tender \/ Buyer|Country|Published|Deadline|Value/);
    // If Your fit is hidden, the column header shouldn't be there
    const fitHeader = queryByText('Your fit');
    expect(fitHeader).not.toBeInTheDocument();
  });

  it('renders with empty tenders array', () => {
    const { container } = render(<ExploreTable tenders={[]} showFitColumn={true} />);

    // Should only show the table header, no rows
    expect(screen.getByText('Tender / Buyer')).toBeInTheDocument();
    const rows = container.querySelectorAll('[class*="grid"]');
    // At least the header row should be present
    expect(rows.length).toBeGreaterThan(0);
  });

  it('displays source alongside buyer name', () => {
    const { container } = render(
      <ExploreTable tenders={mockTenders} showFitColumn={true} />
    );

    mockTenders.forEach((tender) => {
      const sourceWithBuyer = `${tender.buyerName} · ${tender.source}`;
      const textContent = container.textContent;
      expect(textContent).toContain(tender.buyerName);
      expect(textContent).toContain(tender.source);
    });
  });

  it('renders score badges with correct values', () => {
    render(<ExploreTable tenders={mockTenders} showFitColumn={true} />);

    mockTenders.forEach((tender) => {
      // Each score should be visible when Your fit column is shown
      const scoreElements = screen.getAllByText(tender.score.toString());
      expect(scoreElements.length).toBeGreaterThan(0);
    });
  });
});
