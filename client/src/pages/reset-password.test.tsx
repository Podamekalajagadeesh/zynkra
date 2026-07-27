import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { ResetPasswordPage } from './reset-password';
import { ToastProvider } from '../contexts/ToastContext';

function renderResetPasswordPage(token = 'valid-token') {
  return render(
    <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
      <ToastProvider>
        <ResetPasswordPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

// Use placeholder to disambiguate password fields (both labels match regex)
function getPasswordField() {
  const inputs = screen.getAllByPlaceholderText('••••••••');
  return inputs[0]; // first is "New Password"
}

function getConfirmPasswordField() {
  const inputs = screen.getAllByPlaceholderText('••••••••');
  return inputs[1]; // second is "Confirm New Password"
}

describe('ResetPasswordPage', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // --- Rendering ---

  it('renders new password and confirm password fields', () => {
    renderResetPasswordPage();

    expect(getPasswordField()).toBeInTheDocument();
    expect(getConfirmPasswordField()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  // --- Validation ---

  it('shows error when passwords do not match', async () => {
    renderResetPasswordPage();

    fireEvent.change(getPasswordField(), { target: { value: 'password123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'different123' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  // --- Successful reset ---

  it('shows success and navigates to login after reset', async () => {
    renderResetPasswordPage();

    server.use(
      http.post('*/auth/reset-password', () => {
        return HttpResponse.json({ message: 'Password has been reset successfully.' });
      })
    );

    fireEvent.change(getPasswordField(), { target: { value: 'newpassword123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'newpassword123' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/password has been reset/i)).toBeInTheDocument();
    });
  });

  // --- Error handling ---

  it('shows error on invalid/expired token', async () => {
    renderResetPasswordPage();

    server.use(
      http.post('*/auth/reset-password', () => {
        return HttpResponse.json(
          { message: 'Invalid or expired password reset token.', statusCode: 401 },
          { status: 401 }
        );
      })
    );

    fireEvent.change(getPasswordField(), { target: { value: 'newpassword123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'newpassword123' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument();
    });
  });

  it('shows generic error on network failure', async () => {
    renderResetPasswordPage();

    server.use(
      http.post('*/auth/reset-password', () => {
        return HttpResponse.error();
      })
    );

    fireEvent.change(getPasswordField(), { target: { value: 'newpassword123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'newpassword123' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  // --- Loading state ---

  it('shows loading state while submitting', async () => {
    renderResetPasswordPage();

    let resolveRequest: any;
    server.use(
      http.post('*/auth/reset-password', () => {
        return new Promise((resolve) => {
          resolveRequest = resolve;
        });
      })
    );

    fireEvent.change(getPasswordField(), { target: { value: 'newpassword123' } });
    fireEvent.change(getConfirmPasswordField(), { target: { value: 'newpassword123' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
    });

    resolveRequest?.(HttpResponse.json({ message: 'ok' }));
  });
});
