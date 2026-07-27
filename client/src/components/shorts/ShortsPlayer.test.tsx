import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShortsPlayer from './ShortsPlayer';

describe('ShortsPlayer', () => {
  const shorts = [
    { id: 'reel-1', videoUrl: '/video1.mp4', content: 'First short', user: { id: 'u1', username: 'user1' } } as any,
    { id: 'reel-2', videoUrl: '/video2.mp4', content: 'Second short', user: { id: 'u2', username: 'user2' } } as any,
    { id: 'reel-3', videoUrl: '/video3.mp4', content: 'Third short', user: { id: 'u3', username: 'user3' } } as any,
  ];

  it('renders a video element for each short', () => {
    render(<ShortsPlayer shorts={shorts} />);

    const videos = document.querySelectorAll('video');
    expect(videos).toHaveLength(3);
  });

  it('sets correct video sources', () => {
    render(<ShortsPlayer shorts={shorts} />);

    const videos = document.querySelectorAll('video');
    expect(videos[0]).toHaveAttribute('src', expect.stringContaining('/video1.mp4'));
    expect(videos[1]).toHaveAttribute('src', expect.stringContaining('/video2.mp4'));
    expect(videos[2]).toHaveAttribute('src', expect.stringContaining('/video3.mp4'));
  });

  it('renders empty when no shorts', () => {
    const { container } = render(<ShortsPlayer shorts={[]} />);

    const videos = document.querySelectorAll('video');
    expect(videos).toHaveLength(0);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('each video has loop attribute', () => {
    render(<ShortsPlayer shorts={shorts} />);

    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      expect(video).toHaveAttribute('loop');
    });
  });
});
