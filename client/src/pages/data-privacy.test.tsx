import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../contexts/ToastContext';

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiDelete = vi.fn();
const mockUpdatePrivacy = vi.fn();
const mockGetAgeVerificationStatus = vi.fn();
const mockSetBirthDate = vi.fn();

vi.mock('../lib/api', () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
    delete: mockApiDelete,
  },
  updatePrivacy: mockUpdatePrivacy,
  getAgeVerificationStatus: mockGetAgeVerificationStatus,
  setBirthDate: mockSetBirthDate,
}));

describe('DataPrivacyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/data-export') {
        return Promise.resolve({ data: null });
      }
      if (url === '/users/me') {
        return Promise.resolve({
          data: {
            showOnlineStatus: true,
            readReceipts: true,
            mentions: 'everyone',
            activityVisibility: 'friends',
            adPersonalization: true,
            birthDate: '2000-01-01',
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    mockGetAgeVerificationStatus.mockResolvedValue({
      birthDateSet: true,
      verified: true,
      isAdult: true,
      age: 26,
    });
    mockSetBirthDate.mockResolvedValue({ ok: true });
    mockUpdatePrivacy.mockResolvedValue({ ok: true });
  });

  it('renders privacy controls and age verification settings', async () => {
    const { default: DataPrivacyPage } = await import('./data-privacy');

    render(
      <ToastProvider>
        <MemoryRouter>
          <DataPrivacyPage />
        </MemoryRouter>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/privacy controls/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/age verification/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save privacy settings/i })).toBeInTheDocument();
  });
});
