import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { LoginPage } from './login';
import { ToastProvider } from '../contexts/ToastContext';

// Mock useAuth — LoginPage uses addAccount
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    addAccount: vi.fn().mockResolvedValue(undefined),
    user: null,
    isLoggedIn: false,
  }),
}));

// Mock WebAuthn
vi.mock('../components/WebAuthn', () => ({
  default: ({ children, className, variant }: any) => (
    <button className={className} data-variant={variant}>{children}</button>
  ),
}));

// Mock wallet service
vi.mock('../services/wallet', () => ({
  walletService: { connectWallet: vi.fn() },
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <LoginPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // --- Rendering ---

  it('renders login form with identifier and password fields', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    // The password input has placeholder •••••••• and is inside the password tab
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('renders sign up link', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
  });

  it('renders tab navigation (Password, Recovery, Passkey, Wallet)', () => {
    renderLoginPage();
    expect(screen.getByRole('tab', { name: /password/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /recovery/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /passkey/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /wallet/i })).toBeInTheDocument();
  });

  // --- Client-side validation ---

  it('shows error when submitting with empty fields', async () => {
    renderLoginPage();

    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  // --- Successful login ---

  it('calls login API and sets token on success', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    let capturedBody: any;

    server.use(
      http.post('*/auth/signin', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ access_token: 'test-jwt-token' });
      }),
      http.get('*/users/me', () => {
        return HttpResponse.json({ id: 'user-1', username: 'testuser', email: 'test@example.com' });
      }),
    );

    await user.type(screen.getByLabelText(/email or username/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(capturedBody.email).toBe('test@example.com');
      expect(capturedBody.password).toBe('password123');
    });
  });

  // --- Error handling ---

  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    server.use(
      http.post('*/auth/signin', () => {
        return HttpResponse.json(
          { message: 'Invalid credentials', statusCode: 401 },
          { status: 401 }
        );
      })
    );

    await user.type(screen.getByLabelText(/email or username/i), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows error on unverified email', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    server.use(
      http.post('*/auth/signin', () => {
        return HttpResponse.json(
          { message: 'Please verify your email before logging in.', statusCode: 401 },
          { status: 401 }
        );
      })
    );

    await user.type(screen.getByLabelText(/email or username/i), 'unverified@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });
  });

  it('shows generic error on network failure', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    server.use(
      http.post('*/auth/signin', () => {
        return HttpResponse.error();
      })
    );

    await user.type(screen.getByLabelText(/email or username/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  // --- 2FA flow ---

  it('shows 2FA form when login returns twoFactorEnabled', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    server.use(
      http.post('*/auth/signin', () => {
        return HttpResponse.json({
          twoFactorEnabled: true,
          tempToken: 'temp-token',
        });
      })
    );

    await user.type(screen.getByLabelText(/email or username/i), '2fa@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication code/i)).toBeInTheDocument();
    });
  });

  // --- Remember me ---

  it('renders a remember me checkbox and includes rememberMe in the signin payload', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    let capturedBody: any;
    server.use(
      http.post('*/auth/signin', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ access_token: 'test-jwt-token' });
      }),
      http.get('*/users/me', () => {
        return HttpResponse.json({ id: 'user-1', username: 'testuser', email: 'test@example.com' });
      }),
    );

    const rememberCheckbox = screen.getByLabelText(/remember me/i);
    expect(rememberCheckbox).toBeInTheDocument();
    await user.click(rememberCheckbox);

    await user.type(screen.getByLabelText(/email or username/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(capturedBody).toBeDefined();
    });
    expect(capturedBody.rememberMe).toBe(true);
  });

  // --- Magic link / passwordless ---

  it('sends a magic link request from the password tab', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    let capturedBody: any;
    server.use(
      http.post('*/auth/magic-link/request', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'If an account exists for that email, a sign-in link has been sent.' });
      })
    );

    await user.click(screen.getByRole('button', { name: /email me a sign-in link instead/i }));
    await user.type(screen.getByLabelText(/sign in with email link/i), 'magic@example.com');
    await user.click(screen.getByRole('button', { name: /send sign-in link/i }));

    await waitFor(() => {
      expect(capturedBody.email).toBe('magic@example.com');
    });
    expect(screen.getByText(/sign-in link has been sent/i)).toBeInTheDocument();
  });

  // --- Biometric ---

  it('shows the Face ID / Fingerprint biometric button in the passkey tab', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('tab', { name: /passkey/i }));

    expect(screen.getByRole('button', { name: /sign in with passkey/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /face id \/ fingerprint/i })).toBeInTheDocument();
  });
});
