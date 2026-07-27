import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommerceEscrowReviews1785900200000 implements MigrationInterface {
  name = 'CommerceEscrowReviews1785900200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Product Reviews
    await queryRunner.query(`
      CREATE TABLE "product_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "reviewerId" uuid NOT NULL, "rating" integer NOT NULL, "title" character varying NOT NULL, "content" text, "images" character varying[] array, "verifiedPurchase" boolean NOT NULL DEFAULT false, "helpfulCount" integer NOT NULL DEFAULT 0, "isHidden" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_product_reviews_id" PRIMARY KEY ("id"), CONSTRAINT "FK_product_reviews_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE, CONSTRAINT "FK_product_reviews_reviewerId" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE)
    `);
    await queryRunner.query(`CREATE INDEX "IDX_product_reviews_productId" ON "product_reviews" ("productId")`);

    // Escrow
    await queryRunner.query(`
      CREATE TABLE "escrow_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyerId" uuid NOT NULL, "sellerId" uuid NOT NULL, "productId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'usd', "status" character varying NOT NULL DEFAULT 'held', "releaseDays" integer NOT NULL DEFAULT 7, "heldAt" TIMESTAMP WITH TIME ZONE, "releasedAt" TIMESTAMP WITH TIME ZONE, "reason" text, "trackingNumber" character varying, "buyerConfirmedDelivery" boolean NOT NULL DEFAULT false, "sellerShipped" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_escrow_transactions_id" PRIMARY KEY ("id"), CONSTRAINT "FK_escrow_buyerId" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE, CONSTRAINT "FK_escrow_sellerId" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE, CONSTRAINT "FK_escrow_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE)
    `);

    // Checkout Sessions
    await queryRunner.query(`
      CREATE TABLE "checkout_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyerId" uuid NOT NULL, "productId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'usd', "paymentMethod" character varying NOT NULL DEFAULT 'card', "status" character varying NOT NULL DEFAULT 'pending', "paymentIntentId" character varying, "txHash" character varying, "shippingAddress" jsonb, "orderNumber" character varying, "expiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_checkout_sessions_id" PRIMARY KEY ("id"), CONSTRAINT "FK_checkout_buyerId" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE, CONSTRAINT "FK_checkout_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "checkout_sessions"`);
    await queryRunner.query(`DROP TABLE "escrow_transactions"`);
    await queryRunner.query(`DROP TABLE "product_reviews"`);
  }
}
