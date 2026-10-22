import { ethers } from 'ethers';
import { ServiceUnavailableException } from '@nestjs/common';
import { CryptoPayoutsService, USDC_ADDRESSES } from './crypto-payouts.service';

/**
 * Independently transcribed from Circle's official list:
 * https://developers.circle.com/stablecoins/usdc-contract-addresses
 *
 * Deliberately written out here rather than imported, so that editing
 * `USDC_ADDRESSES` to "fix" something cannot make this test agree with itself.
 * Compared case-insensitively: the bytes are the part that matters, and it
 * keeps the test independent of whether Circle's published casing is
 * canonical EIP-55.
 */
const AUTHORITATIVE_USDC: Record<number, string> = {
  1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Ethereum
  137: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', // Polygon PoS
  8453: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // Base
  42161: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // Arbitrum One
};

const configStub = {
  get: (key: string, fallback?: string) =>
    key === 'CRYPTO_PAYOUT_CHAINS' ? '1,137,8453,42161' : fallback,
};

function makeService(): CryptoPayoutsService {
  return new CryptoPayoutsService(null as any, null as any, configStub as any, null as any);
}

describe('USDC_ADDRESSES', () => {
  it('matches the addresses Circle publishes, for every supported chain', () => {
    for (const [chainId, expected] of Object.entries(AUTHORITATIVE_USDC)) {
      const configured = USDC_ADDRESSES[Number(chainId)];
      expect(configured).toBeDefined();
      expect(configured!.toLowerCase()).toBe(expected);
    }
  });

  it('does not carry the previous Arbitrum address, which was not a contract', () => {
    // The bug this pins: `0xaf88d065b77c8c223d7d5ac3b63c4c8c6c6b6b6` looked
    // plausible but is a different address entirely. It is a valid 20-byte hex
    // string, so no amount of format validation would ever have caught it.
    expect(USDC_ADDRESSES[42161]?.toLowerCase()).not.toBe(
      '0xaf88d065b77c8c223d7d5ac3b63c4c8c6c6b6b6'
    );
  });

  it('contains only well-formed addresses', () => {
    for (const [chainId, address] of Object.entries(USDC_ADDRESSES)) {
      expect({ chainId, valid: ethers.isAddress(address) }).toEqual({
        chainId,
        valid: true,
      });
    }
  });

  it('has no duplicate addresses, which would mean two chains share a token', () => {
    const normalized = Object.values(USDC_ADDRESSES).map((a) => a.toLowerCase());
    expect(new Set(normalized).size).toBe(normalized.length);
  });
});

describe('CryptoPayoutsService.assertUsdcContract', () => {
  const service = makeService();
  const assertUsdcContract = (chainId: number, address: string, provider: any) =>
    (service as any).assertUsdcContract(chainId, address, provider);

  it('passes when the chain has contract code at the address', async () => {
    const provider = { getCode: jest.fn().mockResolvedValue('0x60806040') };
    await expect(assertUsdcContract(8453, USDC_ADDRESSES[8453], provider)).resolves.toBeUndefined();
    expect(provider.getCode).toHaveBeenCalledWith(USDC_ADDRESSES[8453]);
  });

  it('refuses when the address has no contract code, instead of moving funds', async () => {
    // This is the case a wrong-but-well-formed address produces.
    const provider = { getCode: jest.fn().mockResolvedValue('0x') };
    await expect(assertUsdcContract(42161, USDC_ADDRESSES[42161], provider)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });

  it('refuses a malformed address before touching the network', async () => {
    const provider = { getCode: jest.fn() };
    await expect(assertUsdcContract(8453, '0xnot-an-address', provider)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    expect(provider.getCode).not.toHaveBeenCalled();
  });

  it('treats an empty code response as no contract', async () => {
    const provider = { getCode: jest.fn().mockResolvedValue('') };
    await expect(assertUsdcContract(8453, USDC_ADDRESSES[8453], provider)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });

  it('skips the network check when no provider is configured', async () => {
    await expect(assertUsdcContract(8453, USDC_ADDRESSES[8453], null)).resolves.toBeUndefined();
  });
});

describe('CryptoPayoutsService.getSupportedChains', () => {
  it('only advertises chains that have a USDC address', () => {
    const chains = makeService().getSupportedChains();
    expect(chains).toEqual([
      { chainId: 1, name: 'Ethereum', usdcAddress: USDC_ADDRESSES[1] },
      { chainId: 137, name: 'Polygon', usdcAddress: USDC_ADDRESSES[137] },
      { chainId: 8453, name: 'Base', usdcAddress: USDC_ADDRESSES[8453] },
      { chainId: 42161, name: 'Arbitrum', usdcAddress: USDC_ADDRESSES[42161] },
    ]);
  });
});
