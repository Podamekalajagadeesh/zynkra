import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../contexts/ToastContext';
import { GroupsPage } from './groups';

// vi.mock factories are hoisted above module init — share the fns through
// vi.hoisted so the factory can close over them safely.
const {
  mockApiGet,
  mockApiPost,
  mockApiPut,
  mockApiDelete,
  mockGetGroups,
  mockDiscoverGroups,
  mockJoinGroup,
  mockLeaveGroup,
  mockCreateGroup,
  mockGetChannels,
  mockCreateChannel,
  mockGetGroupMembers,
  mockUpdateMemberRole,
  mockGetModMailConversations,
  mockCreateModMailConversation,
  mockSendModMailMessage,
  mockGetGroupLockdown,
  mockEnableGroupLockdown,
  mockResolveGroupLockdown,
  mockDetectGroupRaid,
} = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiPut: vi.fn(),
  mockApiDelete: vi.fn(),
  mockGetGroups: vi.fn(),
  mockDiscoverGroups: vi.fn(),
  mockJoinGroup: vi.fn(),
  mockLeaveGroup: vi.fn(),
  mockCreateGroup: vi.fn(),
  mockGetChannels: vi.fn(),
  mockCreateChannel: vi.fn(),
  mockGetGroupMembers: vi.fn(),
  mockUpdateMemberRole: vi.fn(),
  mockGetModMailConversations: vi.fn(),
  mockCreateModMailConversation: vi.fn(),
  mockSendModMailMessage: vi.fn(),
  mockGetGroupLockdown: vi.fn(),
  mockEnableGroupLockdown: vi.fn(),
  mockResolveGroupLockdown: vi.fn(),
  mockDetectGroupRaid: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
    put: mockApiPut,
    delete: mockApiDelete,
  },
  getGroups: mockGetGroups,
  discoverGroups: mockDiscoverGroups,
  joinGroup: mockJoinGroup,
  leaveGroup: mockLeaveGroup,
  createGroup: mockCreateGroup,
  getChannels: mockGetChannels,
  createChannel: mockCreateChannel,
  getGroupMembers: mockGetGroupMembers,
  updateMemberRole: mockUpdateMemberRole,
  getModMailConversations: mockGetModMailConversations,
  createModMailConversation: mockCreateModMailConversation,
  sendModMailMessage: mockSendModMailMessage,
  getGroupLockdown: mockGetGroupLockdown,
  enableGroupLockdown: mockEnableGroupLockdown,
  resolveGroupLockdown: mockResolveGroupLockdown,
  detectGroupRaid: mockDetectGroupRaid,
}));

const renderPage = () =>
  render(
    <ToastProvider>
      <MemoryRouter>
        <GroupsPage />
      </MemoryRouter>
    </ToastProvider>
  );

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('currentUserId', 'u1');
    mockGetGroups.mockResolvedValue([{ id: 'g1', name: 'My Group', privacy: 'public' }]);
    mockDiscoverGroups.mockResolvedValue([{ id: 'g2', name: 'Open Guild', privacy: 'public' }]);
    mockGetGroupMembers.mockResolvedValue([]);
    mockGetChannels.mockResolvedValue([]);
    mockGetModMailConversations.mockResolvedValue([]);
    mockGetGroupLockdown.mockResolvedValue(null);
    mockDetectGroupRaid.mockResolvedValue(0);
    mockApiGet.mockImplementation((url: string) => Promise.resolve({ data: [] }));
    mockApiPost.mockResolvedValue({ data: {} });
    mockApiPut.mockResolvedValue({ data: {} });
    mockApiDelete.mockResolvedValue({ data: {} });
  });

  it('lists joined groups and public discoveries side by side', async () => {
    renderPage();

    expect(await screen.findByText('My Group')).toBeInTheDocument();
    expect(await screen.findByText('Open Guild')).toBeInTheDocument();
    expect(screen.getByText('Your groups')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('joins a discovered group and opens it', async () => {
    mockJoinGroup.mockResolvedValue({ id: 'm2', role: 'member' });
    mockDiscoverGroups
      .mockResolvedValueOnce([{ id: 'g2', name: 'Open Guild', privacy: 'public' }])
      .mockResolvedValue([]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Join' }));

    await waitFor(() => expect(mockJoinGroup).toHaveBeenCalledWith('g2'));
    await waitFor(() => expect(mockDiscoverGroups).toHaveBeenCalledTimes(2));
    // join auto-selects the group → tabs for the group workspace appear
    expect(await screen.findByRole('button', { name: 'Channels' })).toBeInTheDocument();
  });

  it('opens the group workspace with channels, calendar, and tasks panels', async () => {
    renderPage();

    fireEvent.click(await screen.findByText('My Group'));

    expect(await screen.findByRole('button', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tasks' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }));
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/groups/g1/calendar-events'));

    fireEvent.click(screen.getByRole('button', { name: 'Tasks' }));
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/groups/g1/todo-items'));
  });

  it('shows moderator tooling and leave for an admin member', async () => {
    mockGetGroupMembers.mockResolvedValue([
      { id: 'm1', role: 'admin', user: { id: 'u1', email: 'u1@test.com' } },
    ]);

    renderPage();
    fireEvent.click(await screen.findByText('My Group'));

    fireEvent.click(await screen.findByRole('button', { name: 'New Modmail' }));
    expect(await screen.findByPlaceholderText('Subject')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave group' })).toBeInTheDocument();
    await waitFor(() => expect(mockGetGroupMembers).toHaveBeenCalledWith('g1'));
    // members panel resolves for a selected group even without a :id route param
    expect(await screen.findByText('u1@test.com')).toBeInTheDocument();
  });

  it('hides moderator tooling but offers leave for plain members', async () => {
    mockGetGroupMembers.mockResolvedValue([
      { id: 'm1', role: 'member', user: { id: 'u1', email: 'u1@test.com' } },
    ]);

    renderPage();
    fireEvent.click(await screen.findByText('My Group'));

    expect(await screen.findByRole('button', { name: 'Leave group' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Subject')).not.toBeInTheDocument();
  });

  it('leaves the group through the workspace toolbar', async () => {
    mockGetGroupMembers.mockResolvedValue([
      { id: 'm1', role: 'member', user: { id: 'u1', email: 'u1@test.com' } },
    ]);
    mockLeaveGroup.mockResolvedValue(undefined);

    renderPage();
    fireEvent.click(await screen.findByText('My Group'));
    fireEvent.click(await screen.findByRole('button', { name: 'Leave group' }));

    await waitFor(() => expect(mockLeaveGroup).toHaveBeenCalledWith('g1'));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Leave group' })).not.toBeInTheDocument()
    );
    // group workspace closes after leaving
    expect(screen.queryByRole('button', { name: 'Channels' })).not.toBeInTheDocument();
  });
});
