import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignInForm from './SignInForm';

describe('SignInForm', () => {
  it('renders the form with all elements', () => {
    render(<SignInForm />);

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('displays error message when email is invalid on blur', () => {
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Work email') as HTMLInputElement;

    // Set invalid email value
    fireEvent.change(emailInput, { target: { value: 'invalid@' } });

    // Blur to trigger validation
    fireEvent.blur(emailInput);

    // Check error message appears
    expect(screen.getByTestId('email-error')).toBeInTheDocument();
  });

  it('does not display error message when email is valid on blur', () => {
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Work email') as HTMLInputElement;

    // Set valid email value
    fireEvent.change(emailInput, { target: { value: 'user@company.com' } });

    // Blur to trigger validation
    fireEvent.blur(emailInput);

    // Check error message does not appear
    expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
  });

  it('clears error message when user corrects invalid email', () => {
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Work email') as HTMLInputElement;

    // Set invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid@' } });

    // Blur to show error
    fireEvent.blur(emailInput);

    // Verify error is shown
    expect(screen.getByTestId('email-error')).toBeInTheDocument();

    // Clear and type valid email
    fireEvent.change(emailInput, { target: { value: 'user@company.com' } });

    // Error should be gone
    expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
  });
});
