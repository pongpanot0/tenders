import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from './page';
import ProfileEditor from './ProfileEditor';

describe('ProfilePage', () => {
  it('renders profile view by default with three sections', () => {
    render(<ProfilePage />);

    // Check header
    expect(screen.getByText('Company profile')).toBeInTheDocument();
    expect(screen.getByText('Edit profile')).toBeInTheDocument();

    // Check metadata
    expect(screen.getByText(/Profile version 12/)).toBeInTheDocument();
    expect(screen.getByText(/Active/)).toBeInTheDocument();

    // Check three column headers
    expect(screen.getByText('Capabilities')).toBeInTheDocument();
    expect(screen.getByText('Markets & delivery')).toBeInTheDocument();
    expect(screen.getByText('Constraints')).toBeInTheDocument();

    // Check sample content
    expect(screen.getByText('Custom software')).toBeInTheDocument();
    expect(screen.getByText('React, Node.js, AWS')).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByText('Preview matched tenders')).toBeInTheDocument();
    expect(screen.getByText('View recent profile changes')).toBeInTheDocument();
  });

  it('switches to edit mode when Edit profile is clicked', async () => {
    render(<ProfilePage />);

    const editButton = screen.getByText('Edit profile');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit company profile')).toBeInTheDocument();
    });

    // Verify edit form is shown
    expect(screen.getByDisplayValue('Custom software')).toBeInTheDocument();
    expect(screen.getByDisplayValue('React, Node.js, AWS')).toBeInTheDocument();
  });

  it('displays Save and Cancel buttons in edit mode', async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByText('Edit profile'));

    await waitFor(() => {
      expect(screen.getByText('Save changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('shows apply choice prompt after Save', async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByText('Edit profile'));

    const saveButton = await screen.findByText('Save changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('How should we apply this profile update?')).toBeInTheDocument();
      expect(screen.getByText('Apply to new tenders only')).toBeInTheDocument();
      expect(screen.getByText('Recalculate recent matches')).toBeInTheDocument();
    });
  });

  it('cancels edit mode when Cancel is clicked', async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByText('Edit profile'));

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Company profile')).toBeInTheDocument();
    });
  });
});

describe('ProfileEditor', () => {
  const mockProfile = {
    version: 12,
    status: 'active' as const,
    lastUpdated: '2 Sep',
    capabilities: ['Custom software', 'React, Node.js, AWS'],
    markets: ['Singapore, Australia'],
    languages: ['English'],
    constraints: ['Budget: $20k-$150k'],
  };

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  it('renders form fields with initial values', () => {
    render(
      <ProfileEditor
        initialProfile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Custom software')).toBeInTheDocument();
    expect(screen.getByDisplayValue('React, Node.js, AWS')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Singapore, Australia')).toBeInTheDocument();
  });

  it('allows adding new capabilities', async () => {
    render(
      <ProfileEditor
        initialProfile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const addCapabilityButton = screen.getAllByText(/\+ Add/)[0];
    fireEvent.click(addCapabilityButton);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText('e.g., Custom software');
      expect(inputs.length).toBe(3); // Original 2 + 1 new
    });
  });

  it('allows removing capabilities', async () => {
    render(
      <ProfileEditor
        initialProfile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Get all remove buttons by finding the X buttons after each input
    const capabilityInputs = screen.getAllByDisplayValue('Custom software');
    expect(capabilityInputs.length).toBe(1);

    // Find the parent container of the first input and click its remove button
    const capabilityContainer = capabilityInputs[0].closest('.flex');
    const removeButton = capabilityContainer?.querySelector('button');

    if (removeButton) {
      fireEvent.click(removeButton);
    }

    await waitFor(() => {
      const remainingInputs = screen.queryAllByDisplayValue('Custom software');
      expect(remainingInputs.length).toBe(0);
    });
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    render(
      <ProfileEditor
        initialProfile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows apply choice options after save', async () => {
    render(
      <ProfileEditor
        initialProfile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText('Save changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('How should we apply this profile update?')).toBeInTheDocument();
      expect(screen.getByText('Apply to new tenders only')).toBeInTheDocument();
      expect(screen.getByText('Recalculate recent matches')).toBeInTheDocument();
    });
  });

  it('calls onSave with updated profile when apply choice is made', async () => {
    render(
      <ProfileEditor
        initialProfile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText('Save changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('How should we apply this profile update?')).toBeInTheDocument();
    });

    const applyNewOnlyButton = screen.getByText('Apply to new tenders only');
    fireEvent.click(applyNewOnlyButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});
