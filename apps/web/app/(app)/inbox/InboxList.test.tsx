import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InboxList from './InboxList';
import { Tender } from '@/lib/api';

const { fetchTenders } = vi.hoisted(() => ({ fetchTenders: vi.fn() }));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return { ...actual, fetchTenders };
});

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
    id: 'tender-002',
    title: 'Mobile service platform',
    buyerName: 'State Bank',
    country: 'Singapore',
    deadline: '2026-10-02',
    estimatedValue: 100000,
    currency: 'SGD',
    score: 84,
    matchBand: 'strong',
    status: 'open',
    fitTags: ['React'],
    hasRisk: false,
    source: 'govtender.sg',
  },
  {
    id: 'tender-003',
    title: 'Data integration support',
    buyerName: 'Transportation Authority',
    country: 'Singapore',
    deadline: '2026-09-18',
    estimatedValue: 75000,
    currency: 'SGD',
    score: 73,
    matchBand: 'worth-reviewing',
    status: 'deadline-soon',
    fitTags: ['Node.js'],
    hasRisk: true,
    source: 'govtender.sg',
  },
];

beforeEach(() => {
  fetchTenders.mockReset();
  fetchTenders.mockResolvedValue(fixtureTenders);
});

describe('InboxList', () => {
  it('renders all tenders by default', async () => {
    render(<InboxList />);

    expect(screen.getByText('Opportunities')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(fixtureTenders[0].title).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(fixtureTenders[1].title).length).toBeGreaterThan(0);
  });

  it('shows the correct count of open matches', async () => {
    render(<InboxList />);

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`${fixtureTenders.length} open match`))
      ).toBeInTheDocument();
    });
  });

  it('filters tenders by search text in title', async () => {
    render(<InboxList />);
    await waitFor(() => screen.getAllByText('Cloud case management'));

    const searchInput = screen.getByPlaceholderText(
      'Search by title, buyer...'
    ) as HTMLInputElement;

    fireEvent.change(searchInput, { target: { value: 'Cloud' } });

    const cloudTenders = screen.queryAllByText('Cloud case management');
    expect(cloudTenders.length).toBeGreaterThan(0);
    expect(screen.queryByText('Mobile service platform')).not.toBeInTheDocument();
  });

  it('filters tenders by search text in buyer name', async () => {
    render(<InboxList />);
    await waitFor(() => screen.getAllByText('Cloud case management'));

    const searchInput = screen.getByPlaceholderText(
      'Search by title, buyer...'
    ) as HTMLInputElement;

    fireEvent.change(searchInput, { target: { value: 'Ministry' } });

    expect(screen.queryAllByText('Cloud case management').length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Ministry of Health/).length).toBeGreaterThan(0);
  });

  it('displays empty state when search returns no results', async () => {
    render(<InboxList />);
    await waitFor(() => screen.getAllByText('Cloud case management'));

    const searchInput = screen.getByPlaceholderText(
      'Search by title, buyer...'
    ) as HTMLInputElement;

    fireEvent.change(searchInput, { target: { value: 'NonexistentTender' } });

    expect(
      screen.getByText('No open opportunities match these filters.')
    ).toBeInTheDocument();
  });

  it('clears filters when "Clear filters" button is clicked', async () => {
    render(<InboxList />);
    await waitFor(() => screen.getAllByText('Cloud case management'));

    const searchInput = screen.getByPlaceholderText(
      'Search by title, buyer...'
    ) as HTMLInputElement;

    fireEvent.change(searchInput, { target: { value: 'NonexistentTender' } });
    expect(
      screen.getByText('No open opportunities match these filters.')
    ).toBeInTheDocument();

    const clearButtons = screen.getAllByText('Clear filters');
    fireEvent.click(clearButtons[0]);

    expect(searchInput.value).toBe('');
    expect(screen.queryAllByText('Cloud case management').length).toBeGreaterThan(0);
  });

  it('selects a tender and shows its detail panel', async () => {
    render(<InboxList />);
    await waitFor(() => screen.getAllByText(fixtureTenders[0].title));

    const firstTenderRow = screen.getAllByText(fixtureTenders[0].title)[0].closest('div');
    fireEvent.click(firstTenderRow!);

    expect(screen.getByText(fixtureTenders[0].buyerName)).toBeInTheDocument();
    expect(screen.getByText(/Strong match/)).toBeInTheDocument();
  });

  it('updates detail panel when selecting a different tender', async () => {
    render(<InboxList />);
    await waitFor(() => screen.getAllByText(fixtureTenders[1].title));

    const secondTenderRow = screen.getAllByText(fixtureTenders[1].title)[0].closest('div');
    fireEvent.click(secondTenderRow!);

    expect(screen.getByText(fixtureTenders[1].buyerName)).toBeInTheDocument();
  });

  it('displays fit tags for tenders', async () => {
    render(<InboxList />);
    await waitFor(() => {
      fixtureTenders[0].fitTags.forEach((tag) => {
        expect(screen.getAllByText(tag).length).toBeGreaterThan(0);
      });
    });
  });

  it('displays risk icon only for tenders with hasRisk=true', async () => {
    render(<InboxList />);

    await waitFor(() => {
      const tendersWithRisk = fixtureTenders.filter((t) => t.hasRisk);
      const riskButtons = screen.getAllByTitle('Risk');
      expect(riskButtons.length).toBe(tendersWithRisk.length);
    });
  });

  it('displays score badge with correct number', async () => {
    render(<InboxList />);

    await waitFor(() => {
      fixtureTenders.forEach((tender) => {
        expect(screen.getByText(tender.score!.toString())).toBeInTheDocument();
      });
    });
  });

  it('shows "Analysis limited" when score is not available', async () => {
    fetchTenders.mockResolvedValue([
      {
        ...fixtureTenders[0],
        score: null,
        matchBand: 'analysis-limited',
        fitTags: [],
      },
    ]);
    render(<InboxList />);

    await waitFor(() => {
      expect(screen.getAllByText('Analysis limited').length).toBeGreaterThan(0);
    });
  });

  it('shows a retry option when the API call fails', async () => {
    fetchTenders.mockRejectedValue(new Error('network error'));
    render(<InboxList />);

    await waitFor(() => {
      expect(screen.getByText('Could not refresh. Retry.')).toBeInTheDocument();
    });
  });
});
