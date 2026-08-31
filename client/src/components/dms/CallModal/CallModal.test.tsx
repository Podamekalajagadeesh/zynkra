import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CallModal } from './CallModal';

const props = {
  isOpen: true,
  onClose: vi.fn(),
  onToggleMute: vi.fn(),
  onToggleVideo: vi.fn(),
  onToggleBackgroundBlur: vi.fn(),
  onStartScreenShare: vi.fn(async () => true),
  onStopScreenShare: vi.fn(),
  onStartRecording: vi.fn(),
  onStopRecording: vi.fn(),
  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,
  isRecording: false,
  isBackgroundBlurEnabled: false,
  participants: [],
  localVideoRef: { current: document.createElement('video') },
  remoteVideoRef: { current: null as HTMLVideoElement | null },
};

describe('CallModal Picture-in-Picture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, 'pictureInPictureEnabled', { value: true, configurable: true });
  });

  it('requests Picture-in-Picture for the remote video', async () => {
    const { container } = render(<CallModal {...props} />);
    const remoteVideo = container.querySelectorAll('video')[1] as HTMLVideoElement;
    remoteVideo.requestPictureInPicture = vi.fn(async () => undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Open remote video in picture-in-picture' }));

    expect(remoteVideo.requestPictureInPicture).toHaveBeenCalled();
  });

  it('reports when Picture-in-Picture is unavailable', () => {
    Object.defineProperty(document, 'pictureInPictureEnabled', { value: false, configurable: true });
    render(<CallModal {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open remote video in picture-in-picture' }));

    expect(screen.getByRole('status')).toHaveTextContent('Picture-in-Picture is unavailable');
  });
});
