import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  signUp,
  login,
  setAuthToken,
  getLoginSessions,
  forgotPassword,
  resetPassword,
  resendVerification,
  checkEmailAvailability,
  checkUsernameAvailability,
  createGuestUser,
  createAnonymousUser,
  reactivateAccount,
  getPrivacySettings,
} from './api';
import { api } from './api';

describe('reactivateAccount API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('posts to the account reactivation endpoint', async () => {
    server.use(
      http.post('*/users/reactivate', () => HttpResponse.json({ id: 'user-1', status: 'active' })),
    );

    await expect(reactivateAccount()).resolves.toEqual({ id: 'user-1', status: 'active' });
  });
});

describe('getPrivacySettings API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches the current account permission settings', async () => {
    server.use(
      http.get('*/users/me/privacy', () => HttpResponse.json({ postVisibility: 'public' })),
    );

    await expect(getPrivacySettings()).resolves.toEqual({ postVisibility: 'public' });
  });
});

// ─── signUp ──────────────────────────────────────────────────────────────────

describe('signUp API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const validData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  it('sends POST to /auth/signup and returns the response', async () => {
    server.use(
      http.post('*/auth/signup', () => {
        return HttpResponse.json({
          message: 'Signup successful. Please check your email to verify your account.',
        });
      })
    );

    const result = await signUp(validData);

    expect(result).toEqual({
      message: 'Signup successful. Please check your email to verify your account.',
    });
  });

  it('throws on 409 conflict (duplicate email)', async () => {
    server.use(
      http.post('*/auth/signup', () => {
        return HttpResponse.json(
          { message: 'Email already in use', statusCode: 409 },
          { status: 409 }
        );
      })
    );

    await expect(signUp(validData)).rejects.toThrow();
  });

  it('throws on 400 validation error', async () => {
    server.use(
      http.post('*/auth/signup', () => {
        return HttpResponse.json(
          { message: 'Password must be at least 8 characters long', statusCode: 400 },
          { status: 400 }
        );
      })
    );

    await expect(signUp({ ...validData, password: 'short' })).rejects.toThrow();
  });

  it('sends correct request body', async () => {
    let capturedBody: any;

    server.use(
      http.post('*/auth/signup', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'ok' });
      })
    );

    await signUp(validData);

    expect(capturedBody).toEqual(validData);
  });

  it('sends correct Content-Type header', async () => {
    let capturedContentType: string | null = null;

    server.use(
      http.post('*/auth/signup', ({ request }) => {
        capturedContentType = request.headers.get('Content-Type');
        return HttpResponse.json({ message: 'ok' });
      })
    );

    await signUp(validData);

    expect(capturedContentType).toContain('application/json');
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('login API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /auth/signin and returns access_token', async () => {
    server.use(
      http.post('*/auth/signin', () => {
        return HttpResponse.json({ access_token: 'jwt-token' });
      })
    );

    const result = await login({ email: 'test@example.com', password: 'password123' });

    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('sends correct request body with email', async () => {
    let capturedBody: any;

    server.use(
      http.post('*/auth/signin', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ access_token: 'jwt-token' });
      })
    );

    await login({ email: 'test@example.com', password: 'password123' });

    expect(capturedBody).toEqual({ email: 'test@example.com', password: 'password123' });
  });

  it('sends correct request body with username', async () => {
    let capturedBody: any;

    server.use(
      http.post('*/auth/signin', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ access_token: 'jwt-token' });
      })
    );

    await login({ username: 'testuser', password: 'password123' });

    expect(capturedBody).toEqual({ username: 'testuser', password: 'password123' });
  });

  it('throws on 401 invalid credentials', async () => {
    server.use(
      http.post('*/auth/signin', () => {
        return HttpResponse.json(
          { message: 'Invalid credentials', statusCode: 401 },
          { status: 401 }
        );
      })
    );

    await expect(login({ email: 'wrong@example.com', password: 'wrong' })).rejects.toThrow();
  });

  it('throws on 401 unverified email', async () => {
    server.use(
      http.post('*/auth/signin', () => {
        return HttpResponse.json(
          { message: 'Please verify your email before logging in.', statusCode: 401 },
          { status: 401 }
        );
      })
    );

    await expect(login({ email: 'unverified@example.com', password: 'password123' })).rejects.toThrow();
  });

  it('returns 2FA response when 2FA is enabled', async () => {
    server.use(
      http.post('*/auth/signin', () => {
        return HttpResponse.json({
          twoFactorEnabled: true,
          tempToken: 'temp-jwt-token',
        });
      })
    );

    const result = await login({ email: '2fa@example.com', password: 'password123' });

    expect(result.twoFactorEnabled).toBe(true);
    expect(result.tempToken).toBeDefined();
  });
});

// ─── setAuthToken ────────────────────────────────────────────────────────────

describe('registration helper checks', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('checks email availability', async () => {
    server.use(
      http.get('*/auth/check-email', () => {
        return HttpResponse.json({ available: true });
      })
    );

    await expect(checkEmailAvailability('new@example.com')).resolves.toEqual({ available: true });
  });

  it('checks username availability', async () => {
    server.use(
      http.get('*/auth/check-username', () => {
        return HttpResponse.json({ available: false });
      })
    );

    await expect(checkUsernameAvailability('takenname')).resolves.toEqual({ available: false });
  });

  it('creates a guest user session', async () => {
    server.use(
      http.post('*/auth/guest', () => {
        return HttpResponse.json({ access_token: 'guest-token' });
      })
    );

    await expect(createGuestUser()).resolves.toEqual({ access_token: 'guest-token' });
  });

  it('creates an anonymous user session', async () => {
    server.use(
      http.post('*/auth/anonymous', () => {
        return HttpResponse.json({ access_token: 'anonymous-token' });
      })
    );

    await expect(createAnonymousUser()).resolves.toEqual({ access_token: 'anonymous-token' });
  });
});

describe('setAuthToken', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores the token in sessionStorage by default (not remembered) and sets the header', () => {
    setAuthToken('test-jwt-token');

    expect(sessionStorage.getItem('access_token')).toBe('test-jwt-token');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-jwt-token');
  });

  it('stores the token in localStorage when remembered', () => {
    localStorage.setItem('zynkra_remember_me', 'true');

    setAuthToken('test-jwt-token');

    expect(localStorage.getItem('access_token')).toBe('test-jwt-token');
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('removes the token from both stores when called with null', () => {
    sessionStorage.setItem('access_token', 'existing-token');
    api.defaults.headers.common['Authorization'] = 'Bearer existing-token';

    setAuthToken(null);

    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });
});

// ─── getLoginSessions ────────────────────────────────────────────────────────

describe('getLoginSessions', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches login sessions', async () => {
    server.use(
      http.get('*/auth/sessions', () => {
        return HttpResponse.json([
          { id: 's1', deviceName: 'Chrome', ipAddress: '127.0.0.1', isCurrent: true },
          { id: 's2', deviceName: 'Firefox', ipAddress: '127.0.0.2', isCurrent: false },
        ]);
      })
    );

    const sessions = await getLoginSessions();

    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toHaveProperty('id', 's1');
  });
});

// ─── forgotPassword ──────────────────────────────────────────────────────────

describe('forgotPassword API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /auth/forgot-password and returns success message', async () => {
    server.use(
      http.post('*/auth/forgot-password', () => {
        return HttpResponse.json({
          message: 'If a user with that email exists, a password reset link has been sent.',
        });
      })
    );

    const result = await forgotPassword({ email: 'test@example.com' });

    expect(result.message).toContain('password reset link');
  });

  it('sends correct request body', async () => {
    let capturedBody: any;

    server.use(
      http.post('*/auth/forgot-password', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'ok' });
      })
    );

    await forgotPassword({ email: 'test@example.com' });

    expect(capturedBody).toEqual({ email: 'test@example.com' });
  });

  it('throws on 400 invalid email', async () => {
    server.use(
      http.post('*/auth/forgot-password', () => {
        return HttpResponse.json(
          { message: 'Validation failed', statusCode: 400 },
          { status: 400 }
        );
      })
    );

    await expect(forgotPassword({ email: 'not-an-email' })).rejects.toThrow();
  });
});

// ─── resetPassword ───────────────────────────────────────────────────────────

describe('resetPassword API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /auth/reset-password and returns success', async () => {
    server.use(
      http.post('*/auth/reset-password', () => {
        return HttpResponse.json({ message: 'Password has been reset successfully.' });
      })
    );

    const result = await resetPassword({ token: 'valid-token', password: 'newpassword123' });

    expect(result.message).toContain('Password has been reset');
  });

  it('sends correct request body', async () => {
    let capturedBody: any;

    server.use(
      http.post('*/auth/reset-password', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'ok' });
      })
    );

    await resetPassword({ token: 'valid-token', password: 'newpassword123' });

    expect(capturedBody).toEqual({ token: 'valid-token', password: 'newpassword123' });
  });

  it('throws on 401 expired token', async () => {
    server.use(
      http.post('*/auth/reset-password', () => {
        return HttpResponse.json(
          { message: 'Invalid or expired password reset token.', statusCode: 401 },
          { status: 401 }
        );
      })
    );

    await expect(resetPassword({ token: 'expired-token', password: 'newpassword123' })).rejects.toThrow();
  });

  it('throws on 400 short password', async () => {
    server.use(
      http.post('*/auth/reset-password', () => {
        return HttpResponse.json(
          { message: 'Password must be at least 8 characters long', statusCode: 400 },
          { status: 400 }
        );
      })
    );

    await expect(resetPassword({ token: 'valid-token', password: 'short' })).rejects.toThrow();
  });
});

// ─── resendVerification ──────────────────────────────────────────────────────

describe('resendVerification API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /auth/resend-verification', async () => {
    server.use(
      http.post('*/auth/resend-verification', () => {
        return HttpResponse.json({
          message: 'If a user with that email exists, a verification email has been sent.',
        });
      })
    );

    const result = await resendVerification({ email: 'test@example.com' });

    expect(result.message).toContain('verification email has been sent');
  });
});
