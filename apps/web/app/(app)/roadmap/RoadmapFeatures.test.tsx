import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RoadmapFeatures } from './RoadmapFeatures';

describe('RoadmapFeatures', () => {
  it('renders the CRM tab content by default', () => {
    render(<RoadmapFeatures />);
    expect(screen.getByText('Connect your CRM')).toBeInTheDocument();
    expect(screen.getByText('No CRM connection')).toBeInTheDocument();
  });

  it('renders all six tab labels', () => {
    render(<RoadmapFeatures />);
    expect(screen.getByRole('tab', { name: 'CRM Integration' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Collaboration' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'SSO/SCIM' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'API & Reporting' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Profile Comparison' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Learning Controls' })).toBeInTheDocument();
  });

  it('switches to Collaboration tab content on click', () => {
    render(<RoadmapFeatures />);
    fireEvent.click(screen.getByRole('tab', { name: 'Collaboration' }));
    expect(screen.getByText('Team Discussion')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
  });

  it('switches to SSO/SCIM tab content on click', () => {
    render(<RoadmapFeatures />);
    fireEvent.click(screen.getByRole('tab', { name: 'SSO/SCIM' }));
    expect(screen.getByText('Enterprise SSO & SCIM')).toBeInTheDocument();
    expect(screen.getByText('Azure AD')).toBeInTheDocument();
  });

  it('switches to API & Reporting tab content on click', () => {
    render(<RoadmapFeatures />);
    fireEvent.click(screen.getByRole('tab', { name: 'API & Reporting' }));
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText('Custom Reporting')).toBeInTheDocument();
  });

  it('switches to Profile Comparison tab content on click', () => {
    render(<RoadmapFeatures />);
    fireEvent.click(screen.getByRole('tab', { name: 'Profile Comparison' }));
    expect(screen.getByText('Organization Profiles Comparison')).toBeInTheDocument();
  });

  it('switches to Learning Controls tab content on click', () => {
    render(<RoadmapFeatures />);
    fireEvent.click(screen.getByRole('tab', { name: 'Learning Controls' }));
    expect(screen.getByText('Feedback & Learning')).toBeInTheDocument();
  });
});
