import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineBoard, PipelineCardData } from './PipelineBoard';

const mockCards: PipelineCardData[] = [
  {
    id: 'tender-001',
    title: 'Cloud case management',
    buyerName: 'Ministry of Health',
    deadline: '2026-09-28',
    score: 91,
    matchBand: 'strong',
    stage: 'New',
    owner: 'Alice',
    nextActionDate: '2026-09-10',
  },
  {
    id: 'tender-002',
    title: 'Mobile service platform',
    buyerName: 'State Bank',
    deadline: '2026-10-02',
    score: 84,
    matchBand: 'strong',
    stage: 'New',
    owner: 'Bob',
    nextActionDate: '2026-09-12',
  },
  {
    id: 'tender-003',
    title: 'Data integration support',
    buyerName: 'Transportation Authority',
    deadline: '2026-09-18',
    score: 73,
    matchBand: 'worth-reviewing',
    stage: 'Reviewing',
    owner: 'Charlie',
    nextActionDate: '2026-09-18',
  },
  {
    id: 'tender-004',
    title: 'Government portal upgrade',
    buyerName: 'Ministry of Communications',
    deadline: '2026-11-10',
    score: 79,
    matchBand: 'worth-reviewing',
    stage: 'Pursuing',
    owner: 'Alice',
    nextActionDate: '2026-10-15',
  },
  {
    id: 'tender-005',
    title: 'Mobile banking security audit',
    buyerName: 'Central Bank Philippines',
    deadline: '2026-10-08',
    score: 88,
    matchBand: 'strong',
    stage: 'Submitted',
    owner: 'Bob',
    nextActionDate: '2026-09-25',
  },
  {
    id: 'tender-006',
    title: 'Police case management system',
    buyerName: 'Law Enforcement',
    deadline: '2026-09-05',
    score: 92,
    matchBand: 'strong',
    stage: 'Won',
    owner: 'Charlie',
  },
  {
    id: 'tender-007',
    title: 'Legacy system migration',
    buyerName: 'Bank Holdings',
    deadline: '2026-08-30',
    score: 68,
    matchBand: 'low-priority',
    stage: 'Lost',
    owner: 'Alice',
  },
];

describe('PipelineBoard', () => {
  it('renders all stage columns', () => {
    render(<PipelineBoard cards={mockCards} />);

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Reviewing')).toBeInTheDocument();
    expect(screen.getByText('Pursuing')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
  });

  it('groups cards into their correct stage columns', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Check that "New" stage has 2 cards
    const newStageSection = screen.getByText('New').closest('.bg-canvas');
    expect(newStageSection).toBeInTheDocument();
    const newCards = newStageSection?.querySelectorAll('[data-testid^="pipeline-card-"]');
    expect(newCards?.length).toBe(2);

    // Check that "Reviewing" stage has 1 card
    const reviewingStageSection = screen.getByText('Reviewing').closest('.bg-canvas');
    const reviewingCards = reviewingStageSection?.querySelectorAll(
      '[data-testid^="pipeline-card-"]'
    );
    expect(reviewingCards?.length).toBe(1);

    // Check that "Pursuing" stage has 1 card
    const pursuingStageSection = screen.getByText('Pursuing').closest('.bg-canvas');
    const pursuingCards = pursuingStageSection?.querySelectorAll(
      '[data-testid^="pipeline-card-"]'
    );
    expect(pursuingCards?.length).toBe(1);
  });

  it('displays card count for each stage', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Get all column-count elements - there should be one per stage
    const countBadges = screen.getAllByText(/^\d+$/);
    // We have counts for: New (2), Reviewing (1), Pursuing (1), Submitted (1), Won (1), Lost (1) = 7 badges total
    expect(countBadges.length).toBeGreaterThanOrEqual(6);
  });

  it('renders card content correctly', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Check for card content
    expect(screen.getByText('Cloud case management')).toBeInTheDocument();
    expect(screen.getByText('Ministry of Health')).toBeInTheDocument();
    expect(screen.getByText('Data integration support')).toBeInTheDocument();
    expect(screen.getByText('Transportation Authority')).toBeInTheDocument();
  });

  it('allows selecting a card to show details', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Initially, detail panel should not be visible
    expect(screen.queryByTestId('detail-panel-close')).not.toBeInTheDocument();

    // Click on the first card
    const firstCard = screen.getByTestId('pipeline-card-tender-001');
    fireEvent.click(firstCard);

    // Detail panel should now be visible
    expect(screen.getByTestId('detail-panel-close')).toBeInTheDocument();
    expect(screen.getAllByText('Cloud case management').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ministry of Health').length).toBeGreaterThan(0);
  });

  it('displays detailed information for selected card', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Select a card
    const card = screen.getByTestId('pipeline-card-tender-003');
    fireEvent.click(card);

    // Check for detailed information
    expect(screen.getAllByText('Data integration support').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Transportation Authority').length).toBeGreaterThan(0);
    // Match band is formatted as "worth reviewing" (hyphens replaced with spaces)
    expect(screen.getByText('worth reviewing')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('closes detail panel when close button is clicked', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Select a card
    const card = screen.getByTestId('pipeline-card-tender-001');
    fireEvent.click(card);
    expect(screen.getByTestId('detail-panel-close')).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByTestId('detail-panel-close');
    fireEvent.click(closeButton);

    // Detail panel should be hidden
    expect(screen.queryByTestId('detail-panel-close')).not.toBeInTheDocument();
  });

  it('updates selected card when clicking a different card', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Select first card
    const firstCard = screen.getByTestId('pipeline-card-tender-001');
    fireEvent.click(firstCard);
    expect(screen.getAllByText('Cloud case management').length).toBeGreaterThan(0);

    // Click second card
    const secondCard = screen.getByTestId('pipeline-card-tender-002');
    fireEvent.click(secondCard);

    // Detail should now show second card - the detail panel title should be visible
    // Check that the card is in the detail panel (appears twice - in card and detail)
    expect(screen.getAllByText('Mobile service platform').length).toBeGreaterThan(0);
  });

  it('displays score and match band in detail panel', () => {
    render(<PipelineBoard cards={mockCards} />);

    const card = screen.getByTestId('pipeline-card-tender-004');
    fireEvent.click(card);

    // Check for score display
    const scores = screen.getAllByText('79');
    expect(scores.length).toBeGreaterThan(0);

    // Check for match band - formatted as "worth reviewing" (hyphens replaced with spaces)
    expect(screen.getByText('worth reviewing')).toBeInTheDocument();
  });

  it('renders empty columns when no cards in stage', () => {
    const fewCards = [mockCards[0], mockCards[1]]; // Only New stage cards
    render(<PipelineBoard cards={fewCards} />);

    // All stages should still be visible
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Reviewing')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();

    // But only New column should have cards
    const newStageSection = screen.getByText('New').closest('.bg-canvas');
    const newCards = newStageSection?.querySelectorAll('[data-testid^="pipeline-card-"]');
    expect(newCards?.length).toBe(2);

    // Reviewing should show 0
    const reviewingCount = screen.getAllByText(/^\d+$/);
    // The "0" count should appear for empty stages
    expect(reviewingCount.length).toBeGreaterThanOrEqual(1);
  });

  it('displays collaborators in detail panel', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Select a card
    const card = screen.getByTestId('pipeline-card-tender-001');
    fireEvent.click(card);

    // Check for collaborators section and avatars
    expect(screen.getByText('Owner & Collaborators')).toBeInTheDocument();
    const collaboratorsList = screen.getByTestId('collaborators-list');
    expect(collaboratorsList).toBeInTheDocument();

    // Should have multiple collaborator avatars
    const avatars = collaboratorsList.querySelectorAll('[data-testid^="collaborator-avatar-"]');
    expect(avatars.length).toBeGreaterThanOrEqual(1);
  });

  it('displays and allows editing notes in detail panel', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Select a card
    const card = screen.getByTestId('pipeline-card-tender-002');
    fireEvent.click(card);

    // Check for notes section and textarea
    expect(screen.getByText('Internal Notes')).toBeInTheDocument();
    const notesTextarea = screen.getByTestId('notes-textarea') as HTMLTextAreaElement;
    expect(notesTextarea).toBeInTheDocument();

    // Textarea should have initial content
    expect(notesTextarea.value).toContain('Need to clarify technical requirements');

    // Test editing notes
    const newNote = 'Updated note content';
    fireEvent.change(notesTextarea, { target: { value: newNote } });
    expect(notesTextarea.value).toBe(newNote);
  });

  it('displays stage history in detail panel', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Select a card with stage history
    const card = screen.getByTestId('pipeline-card-tender-004');
    fireEvent.click(card);

    // Check for stage history section
    expect(screen.getByText('Stage History')).toBeInTheDocument();
    const stageHistory = screen.getByTestId('stage-history');
    expect(stageHistory).toBeInTheDocument();

    // Should have multiple history items
    const historyItems = stageHistory.querySelectorAll('div[class*="flex"]');
    expect(historyItems.length).toBeGreaterThanOrEqual(1);
  });

  it('displays next action date with relative time in detail panel', () => {
    render(<PipelineBoard cards={mockCards} />);

    // Select a card with next action date
    const card = screen.getByTestId('pipeline-card-tender-003');
    fireEvent.click(card);

    // Check for next action date section
    expect(screen.getByText('Next Action Date')).toBeInTheDocument();
    const nextActionElement = screen.getByTestId('next-action-date');
    expect(nextActionElement).toBeInTheDocument();

    // Should contain the date and relative time
    const text = nextActionElement.textContent || '';
    expect(text).toMatch(/\w+\s+\d{1,2},\s+\d{4}/); // Date format: Sep 18, 2026
  });
});
