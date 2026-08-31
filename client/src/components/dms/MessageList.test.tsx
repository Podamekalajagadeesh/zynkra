import { describe, it, expect } from 'vitest';
import { getReadReceiptLabel } from './MessageList';

describe('MessageList read receipts', () => {
  it('labels unread outgoing messages as sent', () => {
    expect(getReadReceiptLabel(false)).toBe('Sent');
  });

  it('labels outgoing messages read by the recipient', () => {
    expect(getReadReceiptLabel(true)).toBe('Read by recipient');
  });
});
