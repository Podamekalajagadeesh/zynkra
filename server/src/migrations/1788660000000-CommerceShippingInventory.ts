import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommerceShippingInventory1788660000000 implements MigrationInterface {
  name = 'CommerceShippingInventory1788660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "commerce_inventory_reservations_status_enum" AS ENUM ('active', 'converted', 'released', 'expired')`);
    await queryRunner.query(`CREATE TYPE "commerce_shipments_status_enum" AS ENUM ('pending', 'label_created', 'picked_up', 'in_transit', 'delivered', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "commerce_return_requests_type_enum" AS ENUM ('return', 'exchange')`);
    await queryRunner.query(`CREATE TYPE "commerce_return_requests_status_enum" AS ENUM ('requested', 'approved', 'rejected', 'received', 'refunded', 'completed')`);
    await queryRunner.query(`CREATE TABLE "commerce_warehouses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sellerId" uuid NOT NULL, "name" character varying NOT NULL, "address" jsonb NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_warehouses_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_commerce_warehouses_sellerId" ON "commerce_warehouses" ("sellerId")`);
    await queryRunner.query(`CREATE TABLE "commerce_inventory_stock" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouseId" uuid NOT NULL, "productVariantId" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT 0, "reservedQuantity" integer NOT NULL DEFAULT 0, "reorderPoint" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_inventory_stock_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_commerce_inventory_stock_warehouse_variant" ON "commerce_inventory_stock" ("warehouseId", "productVariantId")`);
    await queryRunner.query(`CREATE TABLE "commerce_inventory_reservations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouseId" uuid NOT NULL, "productVariantId" uuid NOT NULL, "orderId" uuid, "customerId" uuid NOT NULL, "quantity" integer NOT NULL, "status" "commerce_inventory_reservations_status_enum" NOT NULL DEFAULT 'active', "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_inventory_reservations_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_commerce_inventory_reservations_status_expires" ON "commerce_inventory_reservations" ("status", "expiresAt")`);
    await queryRunner.query(`CREATE TABLE "commerce_shipments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "sellerId" uuid NOT NULL, "carrier" character varying NOT NULL, "serviceLevel" character varying NOT NULL, "trackingNumber" character varying NOT NULL, "status" "commerce_shipments_status_enum" NOT NULL DEFAULT 'pending', "label" jsonb, "estimatedDeliveryAt" TIMESTAMP WITH TIME ZONE, "pickedUpAt" TIMESTAMP WITH TIME ZONE, "deliveredAt" TIMESTAMP WITH TIME ZONE, "events" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_shipments_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_commerce_shipments_trackingNumber" ON "commerce_shipments" ("trackingNumber")`);
    await queryRunner.query(`CREATE TABLE "commerce_return_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "customerId" uuid NOT NULL, "sellerId" uuid NOT NULL, "type" "commerce_return_requests_type_enum" NOT NULL, "status" "commerce_return_requests_status_enum" NOT NULL DEFAULT 'requested', "reason" text NOT NULL, "items" jsonb, "resolution" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_return_requests_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_commerce_return_requests_orderId" ON "commerce_return_requests" ("orderId")`);
    await queryRunner.query(`CREATE TABLE "commerce_suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sellerId" uuid NOT NULL, "name" character varying NOT NULL, "contactEmail" character varying, "contactPhone" character varying, "address" jsonb, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_suppliers_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_commerce_suppliers_sellerId" ON "commerce_suppliers" ("sellerId")`);
    await queryRunner.query(`CREATE TABLE "commerce_demand_forecasts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sellerId" uuid NOT NULL, "productVariantId" uuid NOT NULL, "periodStart" date NOT NULL, "periodEnd" date NOT NULL, "forecastQuantity" integer NOT NULL, "basedOnDays" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_demand_forecasts_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_commerce_demand_forecasts_variant_period" ON "commerce_demand_forecasts" ("productVariantId", "periodStart")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "commerce_demand_forecasts"`);
    await queryRunner.query(`DROP TABLE "commerce_suppliers"`);
    await queryRunner.query(`DROP TABLE "commerce_return_requests"`);
    await queryRunner.query(`DROP TABLE "commerce_shipments"`);
    await queryRunner.query(`DROP TABLE "commerce_inventory_reservations"`);
    await queryRunner.query(`DROP TABLE "commerce_inventory_stock"`);
    await queryRunner.query(`DROP TABLE "commerce_warehouses"`);
    await queryRunner.query(`DROP TYPE "commerce_return_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "commerce_return_requests_type_enum"`);
    await queryRunner.query(`DROP TYPE "commerce_shipments_status_enum"`);
    await queryRunner.query(`DROP TYPE "commerce_inventory_reservations_status_enum"`);
  }
}