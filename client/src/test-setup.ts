import '@testing-library/jest-dom';
import { vi } from 'vitest';

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();
