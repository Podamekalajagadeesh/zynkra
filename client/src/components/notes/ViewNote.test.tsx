import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewNote } from './ViewNote';

describe('ViewNote', () => {
  const note = {
    id: 'note-1',
    content: 'This is a test note',
    userId: 'user-1',
    createdAt: new Date('2025-01-01T12:00:00Z').toISOString(),
    expiresAt: new Date('2025-01-02T12:00:00Z').toISOString(),
  };

  it('renders the note content', () => {
    render(<ViewNote note={note} onClose={vi.fn()} />);
    expect(screen.getByText('This is a test note')).toBeInTheDocument();
  });

  it('shows the user ID and timestamp', () => {
    render(<ViewNote note={note} onClose={vi.fn()} />);
    expect(screen.getByText(/user-1/)).toBeInTheDocument();
  });

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn();
    render(<ViewNote note={note} onClose={onClose} />);
    fireEvent.click(screen.getByText('X'));
    expect(onClose).toHaveBeenCalled();
  });
});
