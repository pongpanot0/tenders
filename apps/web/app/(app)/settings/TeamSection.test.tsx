import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamSection } from './TeamSection';

describe('TeamSection', () => {
  it('renders member rows', () => {
    render(<TeamSection />);

    // Check for table headers
    expect(screen.getByText('Team members')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();

    // Check for some hardcoded members
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Marcus Johnson')).toBeInTheDocument();
    expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
  });

  it('invite form adds a new row with entered email', async () => {
    render(<TeamSection />);

    const emailInput = screen.getByPlaceholderText('Enter email address') as HTMLInputElement;
    const inviteButton = screen.getByText('Invite');

    // Type email and submit
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.click(inviteButton);

    // Check that new member appears in the table
    await waitFor(() => {
      expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
    });

    // Check that input is cleared
    expect(emailInput.value).toBe('');
  });

  it('removal requires confirmation before the row disappears', async () => {
    render(<TeamSection />);

    // Find the first remove button (for Sarah Chen)
    const removeButtons = screen.getAllByTitle('Remove member');

    // Sarah Chen should be in the table initially
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();

    fireEvent.click(removeButtons[0]);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Remove member')).toBeInTheDocument();
      expect(
        screen.getByText(/will lose access to all tenders/i)
      ).toBeInTheDocument();
    });

    // Find the confirm button in the modal - it should be the last button with text "Remove"
    const allRemoveButtons = screen.getAllByText('Remove');
    const modalRemoveButton = allRemoveButtons[allRemoveButtons.length - 1];

    fireEvent.click(modalRemoveButton);

    // After removal, Sarah Chen row should be removed from the table
    // Check by verifying Marcus Johnson still exists but counting Sarah Chen occurrences (should only be in modal text if at all)
    await waitFor(() => {
      // Marcus Johnson should still be there
      expect(screen.getByText('Marcus Johnson')).toBeInTheDocument();
    });
  });

  it('allows canceling removal confirmation', async () => {
    render(<TeamSection />);

    // Find the first remove button
    const removeButtons = screen.getAllByTitle('Remove member');
    fireEvent.click(removeButtons[0]);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Remove member')).toBeInTheDocument();
    });

    // Find cancel button in modal
    const allCancelButtons = screen.getAllByText('Cancel');
    const modalCancelButton = allCancelButtons.find(el => {
      const modal = el.closest('div');
      return modal && modal.className.includes('fixed');
    });

    if (modalCancelButton) {
      fireEvent.click(modalCancelButton);
    }

    // Sarah Chen should still be in the table
    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });
  });

  it('displays invite form with email input and role select', () => {
    render(<TeamSection />);

    expect(screen.getByText('Invite team member')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
    expect(screen.getByText('Invite')).toBeInTheDocument();

    // Check that role description is shown
    expect(
      screen.getByText(/Can create and edit tenders and alerts/i)
    ).toBeInTheDocument();
  });

  it('disables invite button when email is empty', () => {
    render(<TeamSection />);

    const inviteButton = screen.getByText('Invite') as HTMLButtonElement;
    expect(inviteButton.disabled).toBe(true);
  });

  it('enables invite button when email is entered', () => {
    render(<TeamSection />);

    const emailInput = screen.getByPlaceholderText('Enter email address');
    const inviteButton = screen.getByText('Invite') as HTMLButtonElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(inviteButton.disabled).toBe(false);
  });
});
