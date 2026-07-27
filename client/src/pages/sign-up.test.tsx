import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { SignUpPage } from './sign-up';
import { ToastProvider } from '../contexts/ToastContext';

// Mock WebAuthn to avoid complex browser API dependencies
vi.mock('../components/WebAuthn', () => ({
  default: ({ children, className, variant }: any) => (
    <button className={className} data-variant={variant}>{children}</button>
  ),
}));

function renderSignUpPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <SignUpPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('SignUpPage', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // --- Rendering ---

  it('renders the sign-up form with all fields', () => {
    renderSignUpPage();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument();
  });

  it('renders the Google sign-up button', () => {
    renderSignUpPage();
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
  });

  it('renders the passkey registration button', () => {
    renderSignUpPage();
    expect(screen.getByRole('button', { name: /register with passkey/i })).toBeInTheDocument();
  });

  it('renders a link to the login page', () => {
    renderSignUpPage();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  // --- Client-side validation ---

  it('shows error when submitting with empty fields', async () => {
    renderSignUpPage();

    // Submit the form directly (no prior interaction)
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('shows error when password is shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'short');
    // Submit the form directly to trigger validation
    const form = screen.getByRole('button', { name: /^sign up$/i }).closest('form');
    if (form) fireEvent.submit(form);
    else {
      // Fallback: click submit button
      const submitBtn = screen.getByRole('button', { name: /^sign up$/i });
      await user.click(submitBtn);
    }

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  // --- Successful sign-up ---

  it('shows success message and switches to "check your email" view on success', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    server.use(
      http.post('*/auth/signup', () => {
        return HttpResponse.json({
          message: 'Signup successful. Please check your email to verify your account.',
        });
      })
    );

    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    // Submit the form directly
    const form = screen.getByRole('button', { name: /^sign up$/i }).closest('form');
    if (form) fireEvent.submit(form);
    else {
      const submitBtn = screen.getByRole('button', { name: /^sign up$/i });
      await user.click(submitBtn);
    }

    // The title "Check your email" appears in both desktop sidebar and mobile header
    await waitFor(() => {
      const headings = screen.getAllByText(/check your email/i);
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    // The verification link message is inside the content area — may appear once or twice
    const verifyMsgs = screen.getAllByText(/verification link/i);
    expect(verifyMsgs.length).toBeGreaterThanOrEqual(1);
  });

  // --- Error handling ---

  it('shows error message when API returns 409 conflict', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    server.use(
      http.post('*/auth/signup', () => {
        return HttpResponse.json(
          { message: 'Email already in use', statusCode: 409 },
          { status: 409 }
        );
      })
    );

    await user.type(screen.getByLabelText(/username/i), 'existinguser');
    await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });

  it('shows generic error when network fails', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    server.use(
      http.post('*/auth/signup', () => {
        return HttpResponse.error();
      })
    );

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });
});
