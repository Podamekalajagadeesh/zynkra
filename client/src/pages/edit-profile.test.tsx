import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EditProfilePage } from './edit-profile';
import { ToastProvider } from '../contexts/ToastContext';

// vi.mock factories are hoisted above the module body, so any fixture they
// reference must be created via vi.hoisted to avoid TDZ errors.
const { mockSetUser, mockUser, mockUpdateProfile, mockThemes } = vi.hoisted(() => ({
  mockSetUser: vi.fn(),
  mockUser: {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    bio: 'A test user',
    website: 'https://example.com',
    avatar: '/avatar.jpg',
    relationshipStatus: 'Single',
    profileTheme: 'default',
    profileThemeColor: '#000000',
    profileBioFont: 'default',
    lifeEvents: [],
    verified: false,
    verificationStatus: null,
  },
  mockUpdateProfile: vi.fn(),
  mockThemes: {
    default: { name: 'Default', styles: { backgroundColor: '#ffffff', color: '#000000' } },
    dark: { name: 'Dark', styles: { backgroundColor: '#000000', color: '#ffffff' } },
    light: { name: 'Light', styles: { backgroundColor: '#f5f5f5', color: '#000000' } },
  },
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    setUser: mockSetUser,
  }),
}));

// Mock updateProfile
vi.mock('../lib/api', () => ({
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  getProfile: vi.fn(),
  getThemes: vi.fn(() => Promise.resolve([])),
  createLifeEvent: vi.fn(() => Promise.resolve()),
  deleteLifeEvent: vi.fn(() => Promise.resolve()),
  setBirthDate: vi.fn(() => Promise.resolve()),
  api: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// Mock themes module
vi.mock('../themes', () => ({ themes: mockThemes }));
// The component references `themes` globally (masked by @ts-nocheck)
vi.stubGlobal('themes', mockThemes);

function renderEditProfilePage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <EditProfilePage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('EditProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it('renders profile form fields', async () => {
    renderEditProfilePage();

    await waitFor(() => {
      expect(screen.getByLabelText('Display Name', { exact: true })).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Username', { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText('Website', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('renders verification section', async () => {
    renderEditProfilePage();

    await waitFor(() => {
      expect(screen.getByText(/account verification/i)).toBeInTheDocument();
    });
  });

  it('renders theme selector', async () => {
    renderEditProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Profile Theme', { exact: true })).toBeInTheDocument();
    });
  });

  // --- Pre-population ---

  it('pre-populates fields with user data', async () => {
    renderEditProfilePage();

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Test User');
    });

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    expect(usernameInput.value).toBe('testuser');
  });

  // --- Form submission ---

  it('submits form data on save', async () => {
    mockUpdateProfile.mockResolvedValue({ ...mockUser, displayName: 'Updated Name' });

    renderEditProfilePage();

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });

    expect(mockUpdateProfile.mock.calls[0][0]).toBeInstanceOf(FormData);
  });

  it('handles form submission error gracefully', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Update failed'));

    renderEditProfilePage();

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
  });
});
