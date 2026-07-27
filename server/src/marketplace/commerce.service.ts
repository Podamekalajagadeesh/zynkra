import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview } from './entities/product-review.entity';
import { EscrowTransaction, EscrowStatus } from './entities/escrow.entity';
import { CheckoutSession, CheckoutStatus } from './entities/checkout-session.entity';
import { Product } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class CommerceService {
  private readonly logger = new Logger(CommerceService.name);

  constructor(
    @InjectRepository(ProductReview) private readonly reviewsRepo: Repository<ProductReview>,
    @InjectRepository(EscrowTransaction) private readonly escrowRepo: Repository<EscrowTransaction>,
    @InjectRepository(CheckoutSession) private readonly checkoutRepo: Repository<CheckoutSession>,
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly walletService: WalletService,
  ) {}

  // ---- Checkout -----------------------------------------------------------

  async createCheckoutSession(
    buyerId: string,
    productId: string,
    paymentMethod: 'card' | 'crypto' | 'wallet' = 'card',
    shippingAddress?: any,
  ): Promise<CheckoutSession> {
    const buyer = await this.usersRepo.findOne({ where: { id: buyerId } });
    if (!buyer) throw new NotFoundException('User not found');

    const product = await this.productsRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.isActive) throw new BadRequestException('Product is no longer available');
    if (product.stock <= 0) throw new BadRequestException('Product is out of stock');
    if (product.sellerId === buyerId) throw new BadRequestException('Cannot purchase your own product');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

    const session = this.checkoutRepo.create({
      buyerId,
      productId,
      amount: Number(product.price),
      currency: product.currency || 'usd',
      paymentMethod,
      shippingAddress: shippingAddress || null,
      expiresAt,
    });

    return this.checkoutRepo.save(session);
  }

  async completeCheckout(checkoutId: string): Promise<{
    success: boolean;
    checkout: CheckoutSession;
    escrow?: EscrowTransaction;
  }> {
    const session = await this.checkoutRepo.findOne({
      where: { id: checkoutId },
      relations: ['product', 'buyer'],
    });
    if (!session) throw new NotFoundException('Checkout session not found');
    if (session.status !== CheckoutStatus.PENDING) throw new BadRequestException('Checkout already processed');
    if (session.expiresAt && new Date() > session.expiresAt) {
      session.status = CheckoutStatus.EXPIRED;
      await this.checkoutRepo.save(session);
      throw new BadRequestException('Checkout session has expired');
    }

    // Debit buyer wallet (if wallet payment)
    if (session.paymentMethod === 'wallet') {
      await this.walletService.debit(session.buyerId, session.amount, {
        purpose: 'product-purchase',
        type: 'payout',
        reference: session.id,
        metadata: { productId: session.productId },
      });
    }

    // Credit seller
    const product = session.product;
    const sellerFee = session.amount * 0.1; // 10% platform fee
    const sellerAmount = session.amount - sellerFee;

    await this.walletService.credit(product.sellerId, sellerAmount, {
      purpose: 'product-sale',
      type: 'earning',
      reference: session.id,
      metadata: { productId: session.productId, buyerId: session.buyerId },
    });

    // Decrement stock
    product.stock -= 1;
    await this.productsRepo.save(product);

    // Create escrow for physical products
    let escrow: EscrowTransaction | undefined;
    if (product.productType === 'physical') {
      escrow = this.escrowRepo.create({
        buyerId: session.buyerId,
        sellerId: product.sellerId,
        productId: product.id,
        amount: sellerAmount,
        status: EscrowStatus.HELD,
        heldAt: new Date(),
        releaseDays: 7,
      });
      await this.escrowRepo.save(escrow);
    }

    // Mark checkout complete
    session.status = CheckoutStatus.COMPLETED;
    session.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await this.checkoutRepo.save(session);

    this.logger.log(`Checkout completed: ${session.orderNumber} ($${session.amount})`);

    return { success: true, checkout: session, escrow };
  }

  // ---- Escrow -------------------------------------------------------------

  async confirmDelivery(escrowId: string, buyerId: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepo.findOne({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.buyerId !== buyerId) throw new BadRequestException('Not authorized');
    if (escrow.status !== EscrowStatus.HELD) throw new BadRequestException('Escrow is not in held status');

    escrow.buyerConfirmedDelivery = true;
    escrow.status = EscrowStatus.RELEASED;
    escrow.releasedAt = new Date();

    return this.escrowRepo.save(escrow);
  }

  async shipProduct(escrowId: string, sellerId: string, trackingNumber: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepo.findOne({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.sellerId !== sellerId) throw new BadRequestException('Not authorized');

    escrow.sellerShipped = true;
    escrow.trackingNumber = trackingNumber;

    return this.escrowRepo.save(escrow);
  }

  async disputeEscrow(escrowId: string, userId: string, reason: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepo.findOne({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.buyerId !== userId && escrow.sellerId !== userId) throw new BadRequestException('Not authorized');
    if (escrow.status !== EscrowStatus.HELD) throw new BadRequestException('Escrow is not in held status');

    escrow.status = EscrowStatus.DISPUTED;
    escrow.reason = reason;

    return this.escrowRepo.save(escrow);
  }

  // ---- Reviews ------------------------------------------------------------

  async createReview(
    reviewerId: string,
    productId: string,
    data: { rating: number; title: string; content?: string; images?: string[] },
  ): Promise<ProductReview> {
    if (data.rating < 1 || data.rating > 5) throw new BadRequestException('Rating must be 1-5');

    const product = await this.productsRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Check for duplicate review
    const existing = await this.reviewsRepo.findOne({ where: { reviewerId, productId } });
    if (existing) throw new BadRequestException('You have already reviewed this product');

    const review = this.reviewsRepo.create({
      productId,
      reviewerId,
      rating: data.rating,
      title: data.title,
      content: data.content || '',
      images: data.images || [],
    });

    return this.reviewsRepo.save(review);
  }

  async getProductReviews(
    productId: string,
    options: { page?: number; limit?: number; sortBy?: string } = {},
  ): Promise<{ reviews: ProductReview[]; total: number; averageRating: number }> {
    const { page = 1, limit = 20, sortBy = 'recent' } = options;

    const order = sortBy === 'helpful' ? { helpfulCount: 'DESC' as const } : { createdAt: 'DESC' as const };

    const [reviews, total] = await this.reviewsRepo.findAndCount({
      where: { productId, isHidden: false },
      relations: ['reviewer'],
      skip: (page - 1) * limit,
      take: limit,
      order,
    });

    const avgResult = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.productId = :productId', { productId })
      .getRawOne();

    return {
      reviews,
      total,
      averageRating: parseFloat(avgResult?.avg || '0'),
    };
  }

  async markReviewHelpful(reviewId: string): Promise<ProductReview> {
    const review = await this.reviewsRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    review.helpfulCount += 1;
    return this.reviewsRepo.save(review);
  }
}
