import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OnboardingWizard from './OnboardingWizard';

describe('OnboardingWizard', () => {
  it('renders the first step (Company) by default', () => {
    render(<OnboardingWizard />);

    expect(screen.getByText('About your company')).toBeInTheDocument();
    expect(screen.getByText(/Help us understand who you are/)).toBeInTheDocument();
  });

  it('displays all step labels in the progress rail', () => {
    render(<OnboardingWizard />);

    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Capabilities')).toBeInTheDocument();
    expect(screen.getByText('Markets')).toBeInTheDocument();
    expect(screen.getByText('Constraints')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  it('advances to the next step when clicking Next', async () => {
    render(<OnboardingWizard />);

    // Initially on step 1 (Company)
    expect(screen.getByText('About your company')).toBeInTheDocument();

    // Click Next
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Should now be on step 2 (Capabilities)
    expect(screen.getByText('What can your team build?')).toBeInTheDocument();
  });

  it('returns to the previous step when clicking Back', async () => {
    render(<OnboardingWizard />);

    // Go to step 2
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText('What can your team build?')).toBeInTheDocument();

    // Click Back
    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);

    // Should be back on step 1
    expect(screen.getByText('About your company')).toBeInTheDocument();
  });

  it('updates the profile preview when filling in company name', () => {
    render(<OnboardingWizard />);

    const companyInput = screen.getByPlaceholderText('e.g., Acme Software') as HTMLInputElement;
    fireEvent.change(companyInput, { target: { value: 'Test Company' } });

    // The preview should now show the company name
    expect(screen.getByText(/Company: Test Company/)).toBeInTheDocument();
  });

  it('updates the profile preview when filling in country', () => {
    render(<OnboardingWizard />);

    // Fill company name first (location only shows if company name is present)
    const companyInput = screen.getByPlaceholderText('e.g., Acme Software') as HTMLInputElement;
    fireEvent.change(companyInput, { target: { value: 'Test Company' } });

    const countryInput = screen.getByPlaceholderText('e.g., Singapore') as HTMLInputElement;
    fireEvent.change(countryInput, { target: { value: 'Singapore' } });

    // The preview should now show both company and location
    expect(screen.getByText(/Company: Test Company/)).toBeInTheDocument();
    expect(screen.getByText('Location: Singapore')).toBeInTheDocument();
  });

  it('updates the profile preview when selecting services', () => {
    render(<OnboardingWizard />);

    // Go to Capabilities step
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Click on a service chip
    const customSoftwareChip = screen.getByRole('button', {
      name: /Custom software/i,
    });
    fireEvent.click(customSoftwareChip);

    // The preview should now show the service
    expect(screen.getByText(/Delivers: Custom software/)).toBeInTheDocument();
  });

  it('updates the profile preview when filling technologies', () => {
    render(<OnboardingWizard />);

    // Go to Capabilities step
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Fill technologies
    const techInput = screen.getByPlaceholderText('e.g., React, Node.js, AWS') as HTMLInputElement;
    fireEvent.change(techInput, { target: { value: 'React, Node.js' } });

    // The preview should now show the tech
    expect(screen.getByText(/Tech: React, Node.js/)).toBeInTheDocument();
  });

  it('shows "Incomplete profile" badge when profile is missing required fields', () => {
    render(<OnboardingWizard />);

    expect(screen.getByText('Incomplete profile')).toBeInTheDocument();
  });

  it('shows "Profile ready to match" badge when all required fields are filled', () => {
    render(<OnboardingWizard />);

    // Fill Company step
    const companyInput = screen.getByPlaceholderText('e.g., Acme Software') as HTMLInputElement;
    fireEvent.change(companyInput, { target: { value: 'Test Company' } });

    // Go to Capabilities
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Select a service
    const customSoftwareChip = screen.getByRole('button', {
      name: /Custom software/i,
    });
    fireEvent.click(customSoftwareChip);

    // Go to Markets
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Fill countries
    const countriesInput = screen.getByPlaceholderText(
      'e.g., Singapore, Australia, Thailand'
    ) as HTMLInputElement;
    fireEvent.change(countriesInput, { target: { value: 'Singapore' } });

    // Go to Constraints
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Fill budget
    const budgetInput = screen.getByPlaceholderText('e.g., $20k–$150k') as HTMLInputElement;
    fireEvent.change(budgetInput, { target: { value: '$50k' } });

    // Now the profile should show "Profile ready to match"
    expect(screen.getByText('Profile ready to match')).toBeInTheDocument();
  });

  it('shows the Finish button instead of Next on the last step', () => {
    render(<OnboardingWizard />);

    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);
    }

    // On the last step, should have Finish button visible
    expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();
  });

  it('maintains form data when navigating between steps', () => {
    render(<OnboardingWizard />);

    // Fill in company name
    const companyInput = screen.getByPlaceholderText('e.g., Acme Software') as HTMLInputElement;
    fireEvent.change(companyInput, { target: { value: 'My Company' } });

    // Go to next step
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Go back
    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);

    // Company name should still be there
    const companyInputAgain = screen.getByPlaceholderText('e.g., Acme Software') as HTMLInputElement;
    expect(companyInputAgain.value).toBe('My Company');
  });

  it('hides Back button on the first step', () => {
    render(<OnboardingWizard />);

    // Should not have a Back button on the first step
    const backButtons = screen.queryAllByRole('button', { name: /Back/i });
    expect(backButtons).toHaveLength(0);
  });

  it('displays preview content in the side panel', () => {
    render(<OnboardingWizard />);

    // Initially shows "Incomplete profile"
    expect(screen.getByText('Incomplete profile')).toBeInTheDocument();

    // Fill in some data
    const companyInput = screen.getByPlaceholderText('e.g., Acme Software') as HTMLInputElement;
    fireEvent.change(companyInput, { target: { value: 'Test Company' } });

    // Preview should update
    expect(screen.getByText(/Company: Test Company/)).toBeInTheDocument();
  });

  it('renders all service options as chips on Capabilities step', async () => {
    render(<OnboardingWizard />);

    // Go to Capabilities
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // All service options should be rendered
    expect(screen.getByText('Custom software')).toBeInTheDocument();
    expect(screen.getByText('Mobile development')).toBeInTheDocument();
    expect(screen.getByText('Cloud infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Data engineering')).toBeInTheDocument();
    expect(screen.getByText('QA & testing')).toBeInTheDocument();
  });

  it('toggles service chip selection', async () => {
    render(<OnboardingWizard />);

    // Go to Capabilities
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Click a service chip
    const customSoftwareButton = screen.getByRole('button', {
      name: /Custom software/i,
    });
    fireEvent.click(customSoftwareButton);

    // Service should now appear in preview
    expect(screen.getByText(/Delivers: Custom software/)).toBeInTheDocument();

    // Click again to deselect
    fireEvent.click(customSoftwareButton);

    // Service should be removed from preview
    expect(screen.queryByText(/Delivers: Custom software/)).not.toBeInTheDocument();
  });

  it('shows "Save and finish later" button on every step', () => {
    render(<OnboardingWizard />);

    // Should be visible on first step
    expect(screen.getByRole('button', { name: /Save and finish later/i })).toBeInTheDocument();

    // Go to next step
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Should still be visible
    expect(screen.getByRole('button', { name: /Save and finish later/i })).toBeInTheDocument();
  });
});
