import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ethers } from 'ethers';
import { User } from '../users/entities/user.entity';
import { WalletService } from './wallet.service';

/**
 * USDC contract addresses across supported chains.
 *
 * Authoritative source (Circle):
 * https://developers.circle.com/stablecoins/usdc-contract-addresses
 *
 * These are transcribed by hand, so they are pinned by
 * `crypto-payouts.spec.ts`. Never "fix" a typo here by eyeballing the hex —
 * a wrong-but-well-formed address sends real funds to an address nobody
 * controls, and a transfer to an account with no contract code can succeed
 * while moving nothing. That is why `assertUsdcContract` also checks the
 * chain actually has code at the address before any money moves.
 */
export const USDC_ADDRESSES: Record<number, string> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon PoS
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One
};

/** Minimum USDC payout amount (~$0.50 equivalent). */
const MIN_PAYOUT_AMOUNT_USDC = '0.50';
const GAS_LIMIT = 100000; // USDC transfer gas limit

@Injectable()
export class CryptoPayoutsService {
  private readonly logger = new Logger(CryptoPayoutsService.name);
  private readonly cryptoEnabled: boolean;
  private readonly supportedChains: number[];

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource
  ) {
    this.cryptoEnabled =
      this.configService.get<string>('CRYPTO_PAYOUTS_ENABLED', 'false') === 'true';
    const chains = this.configService.get<string>('CRYPTO_PAYOUT_CHAINS', '8453');
    this.supportedChains = chains.split(',').map(Number).filter(Boolean);
  }

  /**
   * Get available payout chains and their USDC addresses.
   */
  getSupportedChains() {
    return this.supportedChains
      .filter((chainId) => USDC_ADDRESSES[chainId])
      .map((chainId) => ({
        chainId,
        name: this.getChainName(chainId),
        usdcAddress: USDC_ADDRESSES[chainId],
      }));
  }

  /**
   * Check if crypto payouts are enabled for this instance.
   */
  isEnabled(): boolean {
    return this.cryptoEnabled;
  }

  /**
   * Initiate a crypto payout (USDC) to a creator's wallet.
   *
   * 1. Checks the user has a connected wallet
   * 2. Deducts from internal wallet balance
   * 3. Builds and sends the USDC transfer transaction
   * 4. Records the transaction for tracking
   */
  async sendCryptoPayout(
    userId: string,
    amountUsd: number,
    chainId: number = 8453 // default: Base
  ): Promise<{
    success: boolean;
    txHash: string | null;
    amount: number;
    currency: string;
    recipientAddress: string;
    status: string;
  }> {
    this.assertEnabled();

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.walletAddress) {
      throw new BadRequestException('No wallet connected. Connect a wallet first.');
    }

    const minAmount = parseFloat(MIN_PAYOUT_AMOUNT_USDC);
    if (amountUsd < minAmount) {
      throw new BadRequestException(`Minimum payout is $${minAmount}`);
    }

    // Check chain support
    const usdcAddress = USDC_ADDRESSES[chainId];
    if (!usdcAddress) {
      throw new BadRequestException(
        `Chain ${chainId} (${this.getChainName(chainId)}) is not supported`
      );
    }

    // Get signer
    const signer = await this.getSigner(chainId);
    if (!signer) {
      throw new ServiceUnavailableException('Crypto payouts are not configured on this instance');
    }

    // Verify the USDC address is a real contract BEFORE the wallet is debited.
    // See assertUsdcContract for why this is not optional.
    await this.assertUsdcContract(chainId, usdcAddress, this.getProvider(chainId));

    // This is the amount in USD that goes to the user
    // We transfer the same amount in USDC (1:1)
    const usdcAmount = amountUsd;

    // Deduct from internal balance FIRST (prevents double-spend)
    const payoutRef = `crypto_payout_${userId}_${Date.now()}`;
    await this.walletService.debit(userId, usdcAmount, {
      purpose: 'crypto-payout',
      type: 'payout',
      reference: payoutRef,
      metadata: { chainId, recipientAddress: user.walletAddress },
    });

    try {
      // Build USDC transfer transaction
      const usdcContract = new ethers.Contract(
        usdcAddress,
        ['function transfer(address to, uint256 amount) external returns (bool)'],
        signer
      );

      // USDC has 6 decimals
      const amountWithDecimals = ethers.parseUnits(usdcAmount.toFixed(6), 6);
      const recipientAddress = user.walletAddress;

      this.logger.log(`Sending ${usdcAmount} USDC to ${recipientAddress} on chain ${chainId}`);

      // Send the transaction
      const tx = await usdcContract.transfer(recipientAddress, amountWithDecimals, {
        gasLimit: GAS_LIMIT,
      });

      this.logger.log(`Crypto payout tx sent: ${tx.hash}`);

      return {
        success: true,
        txHash: tx.hash,
        amount: usdcAmount,
        currency: 'USDC',
        recipientAddress,
        status: 'pending',
      };
    } catch (error: any) {
      // Refund the wallet on failure
      await this.walletService.credit(userId, usdcAmount, {
        purpose: 'crypto-payout-reversal',
        type: 'payout_reversal',
        reference: payoutRef,
      });

      this.logger.error(`Crypto payout failed: ${error.message}`);
      throw new BadRequestException(`Crypto payout failed: ${error.message}`);
    }
  }

  /**
   * Get the transaction status of a crypto payout.
   */
  async getTransactionStatus(
    txHash: string,
    chainId: number = 8453
  ): Promise<{
    confirmed: boolean;
    blockNumber: number | null;
    confirmations: number;
  }> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      throw new ServiceUnavailableException(`No provider configured for chain ${chainId}`);
    }

    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return { confirmed: false, blockNumber: null, confirmations: 0 };
    }

    const receipt = await tx.wait();
    if (!receipt) {
      return { confirmed: false, blockNumber: null, confirmations: 0 };
    }

    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber + 1;

    return {
      confirmed: receipt.status === 1,
      blockNumber: receipt.blockNumber,
      confirmations,
    };
  }

  private assertEnabled(): void {
    if (!this.cryptoEnabled) {
      throw new ServiceUnavailableException(
        'Crypto payouts are disabled. Set CRYPTO_PAYOUTS_ENABLED=true and configure a private key.'
      );
    }
  }

  /**
   * Verify the configured USDC address is well-formed, and that the target chain
   * actually has a contract deployed there.
   *
   * `ethers` will happily construct a Contract against an address that has no
   * code. Calling `transfer` on it reverts with an opaque ABI error, or on some
   * chains succeeds while moving no tokens at all — and in both cases the
   * creator's wallet has already been debited. A single `eth_getCode` before the
   * debit is the cheapest place to catch a mistyped or wrong-chain address.
   *
   * Skips the network check when no provider is configured, since that is
   * already reported as "not configured on this instance" by the caller.
   */
  private async assertUsdcContract(
    chainId: number,
    usdcAddress: string,
    provider: ethers.JsonRpcProvider | null
  ): Promise<void> {
    if (!ethers.isAddress(usdcAddress)) {
      this.logger.error(`USDC_ADDRESSES[${chainId}] is not a valid address: ${usdcAddress}`);
      throw new ServiceUnavailableException(
        'Crypto payouts are misconfigured: the USDC contract address is malformed. Refusing to move funds.'
      );
    }

    if (!provider) return;

    const code = await provider.getCode(usdcAddress);
    if (!code || code === '0x') {
      this.logger.error(
        `No contract deployed at USDC address ${usdcAddress} on chain ${chainId}. ` +
          'The address is wrong, or the RPC endpoint is pointing at a different network.'
      );
      throw new ServiceUnavailableException(
        'Crypto payouts are misconfigured: no USDC contract at the configured address on this network. Refusing to move funds.'
      );
    }
  }

  private getChainName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      8453: 'Base',
      42161: 'Arbitrum',
    };
    return names[chainId] || `Chain ${chainId}`;
  }

  private getProvider(chainId: number): ethers.JsonRpcProvider | null {
    const rpcUrl = this.configService.get<string>(`RPC_URL_${chainId}`);
    if (!rpcUrl) return null;
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private async getSigner(chainId: number): Promise<ethers.Wallet | null> {
    const privateKey = this.configService.get<string>('CRYPTO_PAYOUT_PRIVATE_KEY');
    if (!privateKey) return null;

    const provider = this.getProvider(chainId);
    if (!provider) return null;

    return new ethers.Wallet(privateKey, provider);
  }
}
