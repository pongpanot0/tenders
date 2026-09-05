import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SavedSearchesList, { SavedSearch } from './SavedSearchesList';

describe('SavedSearchesList', () => {
  const mockSearches: SavedSearch[] = [
    {
      id: '1',
      name: 'React + Node.js in Southeast Asia',
      filterSummary:
        'Countries: Singapore, Thailand, Malaysia · Technology: React, Node.js',
      alertThreshold: 'Strong matches (80+)',
      deliveryMode: 'Email (instant)',
    },
    {
      id: '2',
      name: 'Healthcare IT contracts',
      filterSummary: 'Industry: Healthcare · Procedure: Open bidding',
      alertThreshold: 'Worth reviewing (60+)',
      deliveryMode: 'Slack (daily digest)',
    },
  ];

  it('renders saved searches with name, filters, threshold, and delivery mode', () => {
    const mockOnDelete = vi.fn();
    const mockOnUpdate = vi.fn();

    render(
      <SavedSearchesList
        searches={mockSearches}
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );

    // Check first search
    expect(screen.getByText('React + Node.js in Southeast Asia')).toBeInTheDocument();
    expect(
      screen.getByText('Countries: Singapore, Thailand, Malaysia · Technology: React, Node.js')
    ).toBeInTheDocument();
    expect(screen.getByText('Strong matches (80+)')).toBeInTheDocument();
    expect(screen.getByText('Email (instant)')).toBeInTheDocument();

    // Check second search
    expect(screen.getByText('Healthcare IT contracts')).toBeInTheDocument();
    expect(screen.getByText('Industry: Healthcare · Procedure: Open bidding')).toBeInTheDocument();
    expect(screen.getByText('Worth reviewing (60+)')).toBeInTheDocument();
    expect(screen.getByText('Slack (daily digest)')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = vi.fn();
    const mockOnUpdate = vi.fn();

    render(
      <SavedSearchesList
        searches={mockSearches}
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('shows empty state when no searches are provided', () => {
    const mockOnDelete = vi.fn();
    const mockOnUpdate = vi.fn();

    render(
      <SavedSearchesList searches={[]} onDelete={mockOnDelete} onUpdate={mockOnUpdate} />
    );

    expect(screen.getByText('No saved searches yet.')).toBeInTheDocument();
  });

  it('allows editing threshold and delivery mode', () => {
    const mockOnDelete = vi.fn();
    const mockOnUpdate = vi.fn();

    render(
      <SavedSearchesList
        searches={mockSearches}
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);

    // Find the select elements by role
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);

    // Change threshold
    const thresholdSelect = selects[0] as HTMLSelectElement;
    fireEvent.change(thresholdSelect, { target: { value: 'All matches (40+)' } });

    // Change delivery mode
    const modeSelect = selects[1] as HTMLSelectElement;
    fireEvent.change(modeSelect, { target: { value: 'In-app (weekly)' } });

    // Click save
    const saveButtons = screen.getAllByText('Save');
    fireEvent.click(saveButtons[0]);

    expect(mockOnUpdate).toHaveBeenCalledWith('1', {
      alertThreshold: 'All matches (40+)',
      deliveryMode: 'In-app (weekly)',
    });
  });

  it('cancels editing when cancel button is clicked', () => {
    const mockOnDelete = vi.fn();
    const mockOnUpdate = vi.fn();

    render(
      <SavedSearchesList
        searches={mockSearches}
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);

    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);

    // The edit form should be gone, showing action buttons again
    expect(screen.getAllByTitle('Edit')).toHaveLength(mockSearches.length);
  });
});
