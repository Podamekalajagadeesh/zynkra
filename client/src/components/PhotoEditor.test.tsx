import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoEditor } from './PhotoEditor';

describe('PhotoEditor', () => {
  const baseProps = {
    imageUrl: 'https://example.com/photo.jpg',
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders the editor title', () => {
    render(<PhotoEditor {...baseProps} />);
    expect(screen.getByText('Photo Editor')).toBeInTheDocument();
  });

  it('renders filter presets', () => {
    render(<PhotoEditor {...baseProps} />);
    expect(screen.getByText('Grayscale')).toBeInTheDocument();
    expect(screen.getByText('Sepia')).toBeInTheDocument();
    expect(screen.getByText('Vintage')).toBeInTheDocument();
    expect(screen.getByText('Noir')).toBeInTheDocument();
    expect(screen.getByText('Summer')).toBeInTheDocument();
  });

  it('renders adjustment sliders', () => {
    render(<PhotoEditor {...baseProps} />);
    expect(screen.getByText(/Brightness/)).toBeInTheDocument();
    expect(screen.getByText(/Contrast/)).toBeInTheDocument();
    expect(screen.getByText(/Saturation/)).toBeInTheDocument();
  });

  it('renders AI tools section', () => {
    render(<PhotoEditor {...baseProps} />);
    expect(screen.getByText('Remove Background')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(<PhotoEditor {...baseProps} />);
    const closeButton = screen.getByLabelText('Close editor');
    fireEvent.click(closeButton);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('renders save button', () => {
    render(<PhotoEditor {...baseProps} />);
    expect(screen.getByText('Save Edited Image')).toBeInTheDocument();
  });

  it('renders reset button', () => {
    render(<PhotoEditor {...baseProps} />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('renders the preview image with correct src', () => {
    render(<PhotoEditor {...baseProps} />);
    const img = screen.getByAltText('Edit preview');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('shows current adjustment values', () => {
    render(<PhotoEditor {...baseProps} />);
    expect(screen.getByText(/Brightness:\s*100%/)).toBeInTheDocument();
    expect(screen.getByText(/Contrast:\s*100%/)).toBeInTheDocument();
    expect(screen.getByText(/Saturation:\s*100%/)).toBeInTheDocument();
  });
});
