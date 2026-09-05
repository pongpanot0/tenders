import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportJobsList from './ExportJobsList';

describe('ExportJobsList', () => {
  it('renders the page title', () => {
    render(<ExportJobsList />);
    expect(screen.getByText('Export Jobs')).toBeInTheDocument();
  });

  it('renders the info box with expected text', () => {
    render(<ExportJobsList />);
    expect(
      screen.getByText(/Export jobs run asynchronously/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we'll notify you when the file is ready/)
    ).toBeInTheDocument();
  });

  it('renders a "New export" button', () => {
    render(<ExportJobsList />);
    const newExportButton = screen.getByRole('button', { name: /New export/ });
    expect(newExportButton).toBeInTheDocument();
  });

  describe('processing job state', () => {
    it('renders processing job with correct title', () => {
      render(<ExportJobsList />);
      expect(
        screen.getByText('Inbox opportunities (14 items)')
      ).toBeInTheDocument();
    });

    it('displays processing status badge', () => {
      render(<ExportJobsList />);
      const badges = screen.getAllByText('Processing');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows progress bar for processing job', () => {
      render(<ExportJobsList />);
      expect(screen.getByText(/Extracting tender data:/)).toBeInTheDocument();
    });

    it('shows estimated time remaining for processing job', () => {
      render(<ExportJobsList />);
      expect(screen.getByText('1 min')).toBeInTheDocument();
    });

    it('displays Cancel button for processing job', () => {
      render(<ExportJobsList />);
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/ });
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it('shows Exporting label for processing job', () => {
      render(<ExportJobsList />);
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  describe('ready job state', () => {
    it('renders ready job with correct title', () => {
      render(<ExportJobsList />);
      expect(
        screen.getByText('Recent tenders (247 items)')
      ).toBeInTheDocument();
    });

    it('displays ready status badge', () => {
      render(<ExportJobsList />);
      const badges = screen.getAllByText('Ready');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows file size for ready job', () => {
      render(<ExportJobsList />);
      expect(screen.getByText('3.2 MB')).toBeInTheDocument();
    });

    it('displays Download File button for ready job', () => {
      render(<ExportJobsList />);
      const downloadButtons = screen.getAllByRole('button', {
        name: /Download File/,
      });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    it('displays Delete button for ready job', () => {
      render(<ExportJobsList />);
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('does not show progress bar for ready job', () => {
      render(<ExportJobsList />);
      const exporting = screen.queryAllByText('Exporting...');
      // Should only have one "Exporting..." for the processing job
      expect(exporting.length).toBe(1);
    });
  });

  describe('expired job state', () => {
    it('renders expired job with correct title', () => {
      render(<ExportJobsList />);
      expect(
        screen.getByText('Pipeline opportunities (5 items)')
      ).toBeInTheDocument();
    });

    it('displays expired status badge', () => {
      render(<ExportJobsList />);
      const badges = screen.getAllByText('Expired');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows expiration message with Re-export link', () => {
      render(<ExportJobsList />);
      expect(
        screen.getByText(/File automatically deleted after 7 days/)
      ).toBeInTheDocument();
      const reexportLinks = screen.getAllByText(/Create new export/);
      expect(reexportLinks.length).toBeGreaterThan(0);
    });

    it('displays Re-export button for expired job', () => {
      render(<ExportJobsList />);
      const reexportButtons = screen.getAllByRole('button', {
        name: /Re-export/,
      });
      expect(reexportButtons.length).toBeGreaterThan(0);
    });
  });

  describe('common job fields', () => {
    it('displays format for all jobs', () => {
      render(<ExportJobsList />);
      const csvFormats = screen.getAllByText('CSV');
      expect(csvFormats.length).toBeGreaterThan(0);
      expect(screen.getByText('XLSX (Excel)')).toBeInTheDocument();
    });

    it('displays export scope for all jobs', () => {
      render(<ExportJobsList />);
      expect(screen.getByText('Inbox (filtered)')).toBeInTheDocument();
      expect(screen.getByText('Explore (last 30 days)')).toBeInTheDocument();
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
    });

    it('displays requested by for all jobs', () => {
      render(<ExportJobsList />);
      const requestedByText = screen.getAllByText('you@company.com');
      expect(requestedByText.length).toBeGreaterThan(0);
    });
  });

  describe('new export functionality', () => {
    it('adds a new processing job when New export button is clicked', async () => {
      render(<ExportJobsList />);

      // Initially should have 1 processing job
      const initialProcessingBadges = screen.getAllByText('Processing');
      expect(initialProcessingBadges.length).toBe(1);

      const newExportButton = screen.getByRole('button', { name: /New export/ });
      fireEvent.click(newExportButton);

      // After clicking, we should have 2 processing jobs
      await waitFor(() => {
        const processingBadges = screen.getAllByText('Processing');
        expect(processingBadges.length).toBe(2);
      });
    });

    it('new export job initially shows processing status', async () => {
      render(<ExportJobsList />);

      const newExportButton = screen.getByRole('button', { name: /New export/ });
      fireEvent.click(newExportButton);

      await waitFor(() => {
        const processingBadges = screen.getAllByText('Processing');
        expect(processingBadges.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('new export job transitions to ready after simulated delay', async () => {
      render(<ExportJobsList />);

      const newExportButton = screen.getByRole('button', { name: /New export/ });
      fireEvent.click(newExportButton);

      // Wait for the job to transition to ready (3 second timeout)
      await waitFor(
        () => {
          const readyBadges = screen.getAllByText('Ready');
          // Should have 2 ready jobs: the original + the new one
          expect(readyBadges.length).toBeGreaterThanOrEqual(2);
        },
        { timeout: 4000 }
      );
    });

    it('new export job shows 1.5 MB file size after completion', async () => {
      render(<ExportJobsList />);

      const newExportButton = screen.getByRole('button', { name: /New export/ });
      fireEvent.click(newExportButton);

      // Wait for the job to complete and show file size
      await waitFor(
        () => {
          const fileSizes = screen.getAllByText('1.5 MB');
          expect(fileSizes.length).toBeGreaterThanOrEqual(1);
        },
        { timeout: 4000 }
      );
    });
  });

  describe('delete functionality', () => {
    it('removes a job when Delete button is clicked', async () => {
      render(<ExportJobsList />);

      // Click the first Delete button (for the ready job)
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      fireEvent.click(deleteButtons[0]);

      // The ready job should be removed
      await waitFor(() => {
        expect(
          screen.queryByText('Recent tenders (247 items)')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('cancel functionality', () => {
    it('removes a processing job when Cancel button is clicked', async () => {
      render(<ExportJobsList />);

      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(
          screen.queryByText('Inbox opportunities (14 items)')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('re-export functionality', () => {
    it('creates a new processing job when Re-export button is clicked on expired job', async () => {
      render(<ExportJobsList />);

      const reexportButtons = screen.getAllByRole('button', {
        name: /Re-export/,
      });
      fireEvent.click(reexportButtons[0]);

      // Should have 2 processing jobs now (the original + the re-exported)
      await waitFor(() => {
        const processingBadges = screen.getAllByText('Processing');
        expect(processingBadges.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('re-exported job transitions to ready after simulated delay', async () => {
      render(<ExportJobsList />);

      const reexportButtons = screen.getAllByRole('button', {
        name: /Re-export/,
      });
      fireEvent.click(reexportButtons[0]);

      // Wait for the job to transition to ready
      await waitFor(
        () => {
          const readyBadges = screen.getAllByText('Ready');
          // Should have at least 2 ready jobs
          expect(readyBadges.length).toBeGreaterThanOrEqual(2);
        },
        { timeout: 4000 }
      );
    });
  });

  describe('download functionality', () => {
    it('handles download button click', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      render(<ExportJobsList />);

      const downloadButtons = screen.getAllByRole('button', {
        name: /Download File/,
      });
      fireEvent.click(downloadButtons[0]);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Downloading')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('job details rendering', () => {
    it('displays all detail fields for each job', () => {
      render(<ExportJobsList />);

      // Check that format labels are present (multiple instances, one per job)
      const formats = screen.getAllByText('Format');
      expect(formats.length).toBeGreaterThan(0);
      const scopes = screen.getAllByText('Export scope');
      expect(scopes.length).toBeGreaterThan(0);
      const requestedBys = screen.getAllByText('Requested by');
      expect(requestedBys.length).toBeGreaterThan(0);
    });

    it('shows correct time indicators for different job ages', () => {
      render(<ExportJobsList />);

      // Processing job started 2 min ago
      expect(screen.getByText(/Started .* ago/)).toBeInTheDocument();

      // Ready job completed 15 min ago
      const completedTexts = screen.getAllByText(/Completed/);
      expect(completedTexts.length).toBeGreaterThan(0);
    });
  });
});
