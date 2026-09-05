import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../contexts/ToastContext';

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiDelete = vi.fn();
const mockUpdatePrivacy = vi.fn();
const mockGetAgeVerificationStatus = vi.fn();
const mockSetBirthDate = vi.fn();
const mockDiscoverContacts = vi.fn();

vi.mock('../lib/api', () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
    delete: mockApiDelete,
  },
  updatePrivacy: mockUpdatePrivacy,
  getAgeVerificationStatus: mockGetAgeVerificationStatus,
  setBirthDate: mockSetBirthDate,
  discoverContacts: mockDiscoverContacts,
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
            tagPrivacy: 'everyone',
            activityVisibility: 'friends',
            adPersonalization: true,
            storyVisibility: 'followers',
            searchVisibility: 'friends',
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
    mockDiscoverContacts.mockResolvedValue([
      { id: 'friend-id', username: 'friend', displayName: 'Friend', avatar: null },
    ]);
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
    expect(screen.getByLabelText(/story privacy/i)).toHaveValue('followers');
    expect(screen.getByLabelText(/search visibility/i)).toHaveValue('friends');
    expect(screen.getByLabelText(/mention controls/i)).toHaveValue('everyone');
  });

  it('saves the selected story privacy', async () => {
    const { default: DataPrivacyPage } = await import('./data-privacy');

    render(
      <ToastProvider>
        <MemoryRouter>
          <DataPrivacyPage />
        </MemoryRouter>
      </ToastProvider>,
    );

    const storyPrivacy = await screen.findByLabelText(/story privacy/i);
    fireEvent.change(storyPrivacy, { target: { value: 'only_me' } });
    fireEvent.click(screen.getByRole('button', { name: /save privacy settings/i }));

    await waitFor(() => {
      expect(mockUpdatePrivacy).toHaveBeenCalledWith(expect.objectContaining({ storyVisibility: 'only_me' }));
    });
  });

  it('saves the selected search visibility', async () => {
    const { default: DataPrivacyPage } = await import('./data-privacy');

    render(
      <ToastProvider>
        <MemoryRouter>
          <DataPrivacyPage />
        </MemoryRouter>
      </ToastProvider>,
    );

    const searchVisibility = await screen.findByLabelText(/search visibility/i);
    fireEvent.change(searchVisibility, { target: { value: 'no_one' } });
    fireEvent.click(screen.getByRole('button', { name: /save privacy settings/i }));

    await waitFor(() => {
      expect(mockUpdatePrivacy).toHaveBeenCalledWith(expect.objectContaining({ searchVisibility: 'no_one' }));
    });
  });

  it('loads and saves Mention Controls', async () => {
    const { default: DataPrivacyPage } = await import('./data-privacy');

    render(
      <ToastProvider>
        <MemoryRouter>
          <DataPrivacyPage />
        </MemoryRouter>
      </ToastProvider>,
    );

    const mentionControls = await screen.findByLabelText(/mention controls/i);
    fireEvent.change(mentionControls, { target: { value: 'followers' } });
    fireEvent.click(screen.getByRole('button', { name: /save privacy settings/i }));

    await waitFor(() => {
      expect(mockUpdatePrivacy).toHaveBeenCalledWith(expect.objectContaining({ mentions: 'followers' }));
    });
  });

  it('loads and saves Tag Controls', async () => {
    const { default: DataPrivacyPage } = await import('./data-privacy');

    render(
      <ToastProvider>
        <MemoryRouter>
          <DataPrivacyPage />
        </MemoryRouter>
      </ToastProvider>,
    );

    const tagControls = await screen.findByLabelText(/tag controls/i);
    fireEvent.change(tagControls, { target: { value: 'friends_of_friends' } });
    fireEvent.click(screen.getByRole('button', { name: /save privacy settings/i }));

    await waitFor(() => {
      expect(mockUpdatePrivacy).toHaveBeenCalledWith(expect.objectContaining({ tagPrivacy: 'friends_of_friends' }));
    });
  });

  it('discovers contacts from email and phone input', async () => {
    const { default: DataPrivacyPage } = await import('./data-privacy');

    render(
      <ToastProvider>
        <MemoryRouter>
          <DataPrivacyPage />
        </MemoryRouter>
      </ToastProvider>,
    );

    const input = await screen.findByLabelText(/contact email addresses or phone numbers/i);
    fireEvent.change(input, { target: { value: ' FRIEND@EXAMPLE.COM, +1 (415) 555-2671 ' } });
    fireEvent.click(screen.getByRole('button', { name: /find contacts/i }));

    await waitFor(() => {
      expect(mockDiscoverContacts).toHaveBeenCalledWith([
        'friend@example.com',
        '+14155552671',
      ]);
      expect(screen.getByText('Friend')).toBeInTheDocument();
    });
  });
});
