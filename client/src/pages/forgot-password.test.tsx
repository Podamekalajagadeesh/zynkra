import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { ForgotPasswordPage } from './forgot-password';
import { ToastProvider } from '../contexts/ToastContext';

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ForgotPasswordPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('ForgotPasswordPage', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // --- Rendering ---

  it('renders email input and submit button', () => {
    renderForgotPasswordPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send password reset link/i })).toBeInTheDocument();
  });

  it('renders a link back to login', () => {
    renderForgotPasswordPage();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  // --- Client-side validation ---

  it('shows success confirmation after submitting valid email', async () => {
    renderForgotPasswordPage();

    server.use(
      http.post('*/auth/forgot-password', () => {
        return HttpResponse.json({
          message: 'If a user with that email exists, a password reset link has been sent.',
        });
      })
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/password reset link/i)).toBeInTheDocument();
    });
  });

  // --- Error handling ---

  it('shows error on API failure', async () => {
    renderForgotPasswordPage();

    server.use(
      http.post('*/auth/forgot-password', () => {
        return HttpResponse.error();
      })
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  // --- Loading state ---

  it('shows loading state while submitting', async () => {
    renderForgotPasswordPage();

    let resolveRequest: any;
    server.use(
      http.post('*/auth/forgot-password', () => {
        return new Promise((resolve) => {
          resolveRequest = resolve;
        });
      })
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    });

    resolveRequest?.(HttpResponse.json({ message: 'ok' }));
  });
});
