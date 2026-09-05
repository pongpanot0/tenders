import { render, screen, fireEvent } from '@testing-library/react';
import { TenderDetail } from './TenderDetail';
import { mockTenders } from '@/lib/mock-data';

describe('TenderDetail', () => {
  it('renders the tender title, buyer, and score for a known tender', () => {
    const tender = mockTenders[0]; // Cloud case management (score: 91)

    render(<TenderDetail tender={tender} />);

    expect(screen.getByText('Cloud case management')).toBeInTheDocument();
    expect(screen.getByText('Ministry of Health')).toBeInTheDocument();
    expect(screen.getByText('91')).toBeInTheDocument();
  });

  it('renders the correct budget information', () => {
    const tender = mockTenders[0]; // 200000 SGD

    render(<TenderDetail tender={tender} />);

    expect(screen.getByText('SGD 200,000')).toBeInTheDocument();
  });

  it('renders the deadline with days until', () => {
    const tender = mockTenders[0]; // 2026-09-28

    render(<TenderDetail tender={tender} />);

    // Should show the formatted date and days remaining
    const deadlineText = screen.getByText(/Sep 28 \(\d+ days\)/);
    expect(deadlineText).toBeInTheDocument();
  });

  it('renders all five tabs', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-requirements')).toBeInTheDocument();
    expect(screen.getByTestId('tab-documents')).toBeInTheDocument();
    expect(screen.getByTestId('tab-activity')).toBeInTheDocument();
    expect(screen.getByTestId('tab-versions')).toBeInTheDocument();
  });

  it('shows overview tab content by default', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    expect(screen.getByText('At a glance')).toBeInTheDocument();
    expect(screen.getByText('AI summary')).toBeInTheDocument();
    expect(screen.getByText('Why it fits')).toBeInTheDocument();
  });

  it('switches to requirements tab when clicked', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    const requirementsTab = screen.getByTestId('tab-requirements');
    fireEvent.click(requirementsTab);

    expect(screen.getByText('Requirement')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Your status')).toBeInTheDocument();
  });

  it('switches to documents tab when clicked', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    const documentsTab = screen.getByTestId('tab-documents');
    fireEvent.click(documentsTab);

    expect(screen.getByText('Tender documents')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
  });

  it('switches to activity tab when clicked', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    const activityTab = screen.getByTestId('tab-activity');
    fireEvent.click(activityTab);

    expect(screen.getByText(/Tender discovered and added to matching queue/))
      .toBeInTheDocument();
  });

  it('switches to versions tab when clicked', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    const versionsTab = screen.getByTestId('tab-versions');
    fireEvent.click(versionsTab);

    expect(screen.getByText('Version 3 (Latest)')).toBeInTheDocument();
    expect(screen.getByText('Version 2')).toBeInTheDocument();
    expect(screen.getByText('Version 1')).toBeInTheDocument();
  });

  it('shows version list with latest version expanded by default', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    const versionsTab = screen.getByTestId('tab-versions');
    fireEvent.click(versionsTab);

    // Latest version (v3) should be expanded by default
    expect(
      screen.getByText('Deadline moved from 18 Sep to 25 Sep (7-day extension).')
    ).toBeInTheDocument();
  });

  it('expands version when clicked', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    const versionsTab = screen.getByTestId('tab-versions');
    fireEvent.click(versionsTab);

    // v2 should not be expanded initially
    expect(
      screen.queryByText('Budget range updated to accommodate additional scope.')
    ).not.toBeInTheDocument();

    // Click on v2 to expand it
    const v2Button = screen.getByTestId('version-v2');
    fireEvent.click(v2Button);

    // Now v2 content should be visible
    expect(
      screen.getByText('Budget range updated to accommodate additional scope.')
    ).toBeInTheDocument();
  });

  it('collapses version when clicked again', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    const versionsTab = screen.getByTestId('tab-versions');
    fireEvent.click(versionsTab);

    // v3 is expanded by default, collapse it
    const v3Button = screen.getByTestId('version-v3');
    fireEvent.click(v3Button);

    // v3 content should no longer be visible
    expect(
      screen.queryByText('Deadline moved from 18 Sep to 25 Sep (7-day extension).')
    ).not.toBeInTheDocument();
  });

  it('renders action buttons', () => {
    const tender = mockTenders[0];

    render(<TenderDetail tender={tender} />);

    expect(screen.getByText('Mark pursuing')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
    expect(screen.getByText('Open source')).toBeInTheDocument();
  });

  it('displays risk items when tender has risk', () => {
    const tenderWithRisk = mockTenders.find((t) => t.hasRisk);
    if (!tenderWithRisk) throw new Error('No tender with risk in mock data');

    render(<TenderDetail tender={tenderWithRisk} />);

    expect(screen.getByText('Missing information')).toBeInTheDocument();
  });

  it('displays fit tags in the summary', () => {
    const tender = mockTenders[0]; // fitTags: ['React', 'AWS']

    render(<TenderDetail tender={tender} />);

    // Check that the fit tags appear in the document
    const elements = screen.getAllByText(/React, AWS/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('displays the correct match band and color for strong match', () => {
    const tender = mockTenders.find((t) => t.matchBand === 'strong');
    if (!tender) throw new Error('No strong match tender in mock data');

    render(<TenderDetail tender={tender} />);

    expect(screen.getByText('Strong match')).toBeInTheDocument();
  });
});
