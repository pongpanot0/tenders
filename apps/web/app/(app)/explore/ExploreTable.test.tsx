import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ExploreTable from './ExploreTable';
import { Tender } from '@/lib/api';

const fixtureTenders: Tender[] = [
  {
    id: 'tender-001',
    title: 'Cloud case management',
    buyerName: 'Ministry of Health',
    country: 'Singapore',
    deadline: '2026-09-28',
    estimatedValue: 200000,
    currency: 'SGD',
    score: 91,
    matchBand: 'strong',
    status: 'open',
    fitTags: ['React', 'AWS'],
    hasRisk: false,
    source: 'govtender.sg',
  },
  {
    id: 'tender-005',
    title: 'Supply chain analytics dashboard',
    buyerName: 'Logistics Network Southeast',
    country: 'Thailand',
    deadline: '2026-09-25',
    estimatedValue: null,
    currency: 'THB',
    score: 56,
    matchBand: 'low-priority',
    status: 'open',
    fitTags: ['Vue.js', 'Python'],
    hasRisk: true,
    source: 'e-bidding.go.th',
  },
];

describe('ExploreTable', () => {
  it('renders all tenders by default', () => {
    render(<ExploreTable tenders={fixtureTenders} showFitColumn={true} />);

    fixtureTenders.forEach((tender) => {
      expect(screen.getByText(tender.title)).toBeInTheDocument();
    });

    expect(screen.getByText('Tender / Buyer')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Deadline')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('displays buyer names for each tender', () => {
    render(<ExploreTable tenders={fixtureTenders} showFitColumn={true} />);

    fixtureTenders.forEach((tender) => {
      expect(screen.getByText(new RegExp(tender.buyerName))).toBeInTheDocument();
    });
  });

  it('displays all countries correctly', () => {
    render(<ExploreTable tenders={fixtureTenders} showFitColumn={true} />);

    const uniqueCountries = [...new Set(fixtureTenders.map((t) => t.country))];
    uniqueCountries.forEach((country) => {
      expect(screen.getAllByText(country).length).toBeGreaterThan(0);
    });
  });

  it('formats value correctly for tenders with estimated value', () => {
    render(<ExploreTable tenders={fixtureTenders} showFitColumn={true} />);

    const tenderWithValue = fixtureTenders.find((t) => t.estimatedValue !== null);
    if (tenderWithValue && tenderWithValue.estimatedValue !== null) {
      const expectedText = `${tenderWithValue.currency} ${tenderWithValue.estimatedValue.toLocaleString()}`;
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    }
  });

  it('displays "Not stated" for tenders without estimated value', () => {
    render(<ExploreTable tenders={fixtureTenders} showFitColumn={true} />);

    const notStatedElements = screen.getAllByText('Not stated');
    expect(notStatedElements.length).toBeGreaterThan(0);
  });

  it('shows Your fit column when showFitColumn is true', () => {
    render(<ExploreTable tenders={fixtureTenders} showFitColumn={true} />);

    expect(screen.getByText('Your fit')).toBeInTheDocument();

    fixtureTenders.forEach((tender) => {
      expect(screen.getByText(tender.score!.toString())).toBeInTheDocument();
    });
  });

  it('hides Your fit column when showFitColumn is false', () => {
    const { queryByText } = render(
      <ExploreTable tenders={fixtureTenders} showFitColumn={false} />
    );

    const fitHeader = queryByText('Your fit');
    expect(fitHeader).not.toBeInTheDocument();
  });

  it('renders with empty tenders array', () => {
    const { container } = render(<ExploreTable tenders={[]} showFitColumn={true} />);

    expect(screen.getByText('Tender / Buyer')).toBeInTheDocument();
    const rows = container.querySelectorAll('[class*="grid"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('displays source alongside buyer name', () => {
    const { container } = render(
      <ExploreTable tenders={fixtureTenders} showFitColumn={true} />
    );

    fixtureTenders.forEach((tender) => {
      const textContent = container.textContent;
      expect(textContent).toContain(tender.buyerName);
      expect(textContent).toContain(tender.source);
    });
  });

  it('renders score badges with correct values', () => {
    render(<ExploreTable tenders={fixtureTenders} showFitColumn={true} />);

    fixtureTenders.forEach((tender) => {
      const scoreElements = screen.getAllByText(tender.score!.toString());
      expect(scoreElements.length).toBeGreaterThan(0);
    });
  });

  it('shows "Analysis limited" when score is not available', () => {
    render(
      <ExploreTable
        tenders={[{ ...fixtureTenders[0], score: null, matchBand: 'analysis-limited' }]}
        showFitColumn={true}
      />
    );

    expect(screen.getByText('Analysis limited')).toBeInTheDocument();
  });
});
