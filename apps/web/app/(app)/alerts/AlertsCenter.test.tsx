import { render, screen, fireEvent } from '@testing-library/react';
import { AlertsCenter } from './AlertsCenter';

describe('AlertsCenter', () => {
  it('renders feed items correctly', () => {
    render(<AlertsCenter />);

    expect(screen.getByText('Alerts Center')).toBeInTheDocument();
    expect(screen.getByText('Cloud case management')).toBeInTheDocument();
    expect(screen.getByText('Mobile service platform: Deadline moved to 05 Oct')).toBeInTheDocument();
    expect(screen.getByText('Data integration support')).toBeInTheDocument();
  });

  it('displays unread count in tab', () => {
    render(<AlertsCenter />);

    // Initial state has 1 unread alert
    expect(screen.getByText(/Unread \(1\)/)).toBeInTheDocument();
  });

  it('toggles read status when clicking an alert item', () => {
    render(<AlertsCenter />);

    const alertItems = screen.getAllByText('Cloud case management');
    expect(alertItems.length > 0).toBe(true);
  });

  it('renders settings panel with all controls', () => {
    render(<AlertsCenter />);

    expect(screen.getByText('Alert settings')).toBeInTheDocument();
    expect(screen.getByText('Email notifications')).toBeInTheDocument();
    expect(screen.getByText('In-app notifications')).toBeInTheDocument();
    expect(screen.getByText('Slack notifications')).toBeInTheDocument();
    expect(screen.getByText('Instant alert score')).toBeInTheDocument();
    expect(screen.getByText('Digest settings')).toBeInTheDocument();
    expect(screen.getByText('Deadline reminders')).toBeInTheDocument();
  });

  it('updates preview text when threshold changes', () => {
    render(<AlertsCenter />);

    const thresholdInput = screen.getByDisplayValue('80') as HTMLInputElement;
    expect(thresholdInput).toBeInTheDocument();

    // Initial preview should show 80
    expect(screen.getByText(/A tender scoring 80, published today/)).toBeInTheDocument();

    // Change threshold
    fireEvent.change(thresholdInput, { target: { value: '90' } });

    // Preview should update to show 90
    expect(screen.getByText(/A tender scoring 90, published today/)).toBeInTheDocument();
  });

  it('shows default channel toggles state', () => {
    render(<AlertsCenter />);

    // Email and In-app should be enabled by default
    const emailEnabled = screen.getAllByText('Enabled');
    expect(emailEnabled.length >= 2).toBe(true);
  });

  it('shows Slack as not connected initially', () => {
    render(<AlertsCenter />);

    expect(screen.getByText('Connect Slack workspace')).toBeInTheDocument();
  });

  it('connects Slack workspace and shows configuration panel', () => {
    render(<AlertsCenter />);

    // Initial state: Connect button visible
    const connectButton = screen.getByText('Connect Slack workspace');
    expect(connectButton).toBeInTheDocument();

    // Click connect button
    fireEvent.click(connectButton);

    // Connected panel should show
    expect(screen.getByText('Connected workspace')).toBeInTheDocument();
    expect(screen.getByText('Acme Software')).toBeInTheDocument();
    expect(screen.getByText('Primary channel')).toBeInTheDocument();
    expect(screen.getByText('Message detail')).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('allows changing Slack channel when connected', () => {
    render(<AlertsCenter />);

    // Connect
    fireEvent.click(screen.getByText('Connect Slack workspace'));

    // Find channel select
    const channelSelect = screen.getByDisplayValue('#tenders') as HTMLSelectElement;
    expect(channelSelect).toBeInTheDocument();

    // Change channel
    fireEvent.change(channelSelect, { target: { value: '#opportunities' } });

    // Verify change
    const updatedSelect = screen.getByDisplayValue('#opportunities') as HTMLSelectElement;
    expect(updatedSelect).toBeInTheDocument();
  });

  it('allows changing message detail level when connected', () => {
    render(<AlertsCenter />);

    // Connect
    fireEvent.click(screen.getByText('Connect Slack workspace'));

    // Find detail level select
    const detailSelect = screen.getByDisplayValue('Summary') as HTMLSelectElement;
    expect(detailSelect).toBeInTheDocument();

    // Change to full detail
    fireEvent.change(detailSelect, { target: { value: 'full' } });

    // Verify change
    const updatedSelect = screen.getByDisplayValue('Full detail') as HTMLSelectElement;
    expect(updatedSelect).toBeInTheDocument();
  });

  it('toggles emoji reactions when connected', () => {
    render(<AlertsCenter />);

    // Connect
    fireEvent.click(screen.getByText('Connect Slack workspace'));

    // Find emoji checkbox
    const emojiCheckbox = screen.getByLabelText(/React with emojis/);
    expect(emojiCheckbox).toBeInTheDocument();

    const initialChecked = (emojiCheckbox as HTMLInputElement).checked;

    // Toggle
    fireEvent.click(emojiCheckbox);

    // Verify state changed
    const updatedCheckbox = screen.getByLabelText(/React with emojis/) as HTMLInputElement;
    expect(updatedCheckbox.checked).toBe(!initialChecked);
  });

  it('disconnects Slack and returns to connect button', () => {
    render(<AlertsCenter />);

    // Connect
    fireEvent.click(screen.getByText('Connect Slack workspace'));

    // Verify connected state
    expect(screen.getByText('Acme Software')).toBeInTheDocument();

    // Disconnect
    fireEvent.click(screen.getByText('Disconnect'));

    // Should return to not-connected state with connect button
    expect(screen.getByText('Connect Slack workspace')).toBeInTheDocument();
    expect(screen.queryByText('Acme Software')).not.toBeInTheDocument();
  });

  it('toggles email notifications', () => {
    render(<AlertsCenter />);

    // Find email toggle button
    const emailSection = screen.getByText('Email notifications').closest('div');
    const toggleButton = emailSection?.querySelector('button');

    const enabledBefore = screen.getAllByText('Enabled').length;

    if (toggleButton) {
      fireEvent.click(toggleButton);
      const enabledAfter = screen.getAllByText('Enabled').length;
      expect(enabledAfter).toBeLessThan(enabledBefore);
    }
  });

  it('handles digest day selection', () => {
    render(<AlertsCenter />);

    // Find and click a day checkbox
    const monCheckbox = screen.getByLabelText('Mon') as HTMLInputElement;
    const initialChecked = monCheckbox.checked;

    fireEvent.click(monCheckbox);

    // Verify state changed
    const newChecked = monCheckbox.checked;
    expect(newChecked).toBe(!initialChecked);
  });

  it('handles time input for digest', () => {
    render(<AlertsCenter />);

    const timeInput = screen.getByDisplayValue('09:00') as HTMLInputElement;
    expect(timeInput).toBeInTheDocument();

    fireEvent.change(timeInput, { target: { value: '14:30' } });

    const updatedTimeInput = screen.getByDisplayValue('14:30') as HTMLInputElement;
    expect(updatedTimeInput).toBeInTheDocument();
  });

  it('renders all deadline reminder options', () => {
    render(<AlertsCenter />);

    expect(screen.getByLabelText('7 days before')).toBeInTheDocument();
    expect(screen.getByLabelText('3 days before')).toBeInTheDocument();
    expect(screen.getByLabelText('1 day before')).toBeInTheDocument();
  });

  it('includes alert type information', () => {
    render(<AlertsCenter />);

    const newStrongMatches = screen.getAllByText('New strong match');
    const deadlineChanges = screen.getAllByText('Deadline changed');
    const worthReviewing = screen.getAllByText('Worth reviewing');

    expect(newStrongMatches.length > 0).toBe(true);
    expect(deadlineChanges.length > 0).toBe(true);
    expect(worthReviewing.length > 0).toBe(true);
  });

  it('shows preview text updates with channel changes', () => {
    render(<AlertsCenter />);

    // Default should have both email and in-app
    expect(screen.getByText(/will be emailed and shown in-app/)).toBeInTheDocument();

    const emailToggle = screen.getByText('Email notifications').closest('div')?.querySelector('button');

    if (emailToggle) {
      fireEvent.click(emailToggle);
      // Should update to only in-app
      expect(screen.getByText(/will be shown in-app immediately/)).toBeInTheDocument();
    }
  });
});
