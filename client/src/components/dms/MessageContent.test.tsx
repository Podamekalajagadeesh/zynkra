import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageContent from './MessageContent';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'reader' } }),
}));

vi.mock('../../hooks/useE2EE', () => ({
  useE2EE: () => ({ decryptMessage: vi.fn(), isReady: false }),
}));

describe('MessageContent text to speech', () => {
  const message = {
    id: 'message-1',
    content: 'Hello from Zynkra',
    createdAt: new Date().toISOString(),
    sender: { id: 'sender-1', username: 'sender', email: 'sender@example.com' },
    readBy: [],
  } as any;

  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(),
      cancel: vi.fn(),
    });
    vi.stubGlobal('SpeechSynthesisUtterance', vi.fn(function (text: string) {
      return { text, onend: undefined, onerror: undefined };
    }));
  });

  it('reads the displayed message aloud when requested', () => {
    render(<MessageContent message={message} />);
    fireEvent.click(screen.getByRole('button', { name: 'Read message aloud' }));

    expect(window.speechSynthesis.speak).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hello from Zynkra' }),
    );
    expect(screen.getByRole('button', { name: 'Stop reading message aloud' })).toBeInTheDocument();
  });

  it('stops an active reading session', () => {
    render(<MessageContent message={message} />);
    fireEvent.click(screen.getByRole('button', { name: 'Read message aloud' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop reading message aloud' }));

    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Read message aloud' })).toBeInTheDocument();
  });
});
