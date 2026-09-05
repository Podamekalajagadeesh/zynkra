import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryStock } from './entities/inventory-stock.entity';
import { InventoryReservation, InventoryReservationStatus } from './entities/inventory-reservation.entity';
import { Shipment, ShipmentStatus } from './entities/shipment.entity';
import { ReturnRequest, ReturnRequestStatus, ReturnRequestType } from './entities/return-request.entity';
import { Supplier } from './entities/supplier.entity';
import { DemandForecast } from './entities/demand-forecast.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class ShippingInventoryService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProductVariant) private readonly variants: Repository<ProductVariant>,
    @InjectRepository(Warehouse) private readonly warehouses: Repository<Warehouse>,
    @InjectRepository(InventoryStock) private readonly stocks: Repository<InventoryStock>,
    @InjectRepository(InventoryReservation) private readonly reservations: Repository<InventoryReservation>,
    @InjectRepository(Shipment) private readonly shipments: Repository<Shipment>,
    @InjectRepository(ReturnRequest) private readonly returns: Repository<ReturnRequest>,
    @InjectRepository(Supplier) private readonly suppliers: Repository<Supplier>,
    @InjectRepository(DemandForecast) private readonly forecasts: Repository<DemandForecast>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  async createWarehouse(sellerId: string, data: { name: string; address: Record<string, unknown> }) {
    return this.warehouses.save(this.warehouses.create({ ...data, sellerId }));
  }

  async listWarehouses(sellerId: string) {
    return this.warehouses.find({ where: { sellerId }, order: { createdAt: 'DESC' } });
  }

  async upsertStock(sellerId: string, warehouseId: string, productVariantId: string, data: { quantity: number; reorderPoint?: number }) {
    if (data.quantity < 0 || (data.reorderPoint ?? 0) < 0) throw new BadRequestException('Stock values cannot be negative');
    await this.assertWarehouseOwner(warehouseId, sellerId);
    await this.assertVariantOwner(productVariantId, sellerId);
    let stock = await this.stocks.findOne({ where: { warehouseId, productVariantId } });
    stock = this.stocks.create({ ...(stock || {}), warehouseId, productVariantId, ...data });
    return this.stocks.save(stock);
  }

  async listStock(sellerId: string, warehouseId?: string) {
    if (warehouseId) await this.assertWarehouseOwner(warehouseId, sellerId);
    const warehouseIds = warehouseId ? [warehouseId] : (await this.listWarehouses(sellerId)).map((warehouse) => warehouse.id);
    const where = { warehouseId: In(warehouseIds) };
    return this.stocks.find({ where, order: { updatedAt: 'DESC' } });
  }

  async listStockAlerts(sellerId: string, warehouseId?: string) {
    const stock = await this.listStock(sellerId, warehouseId);
    return stock.filter((item) => item.quantity - item.reservedQuantity <= item.reorderPoint);
  }

  async reserveStock(customerId: string, data: { warehouseId: string; productVariantId: string; quantity: number; expiresInMinutes?: number }) {
    if (data.quantity <= 0) throw new BadRequestException('Quantity must be positive');
    const expiresAt = new Date(Date.now() + (data.expiresInMinutes || 30) * 60 * 1000);
    return this.dataSource.transaction(async (manager) => {
      const stock = await manager.findOne(InventoryStock, { where: { warehouseId: data.warehouseId, productVariantId: data.productVariantId }, lock: { mode: 'pessimistic_write' } });
      if (!stock || stock.quantity - stock.reservedQuantity < data.quantity) throw new BadRequestException('Insufficient available stock');
      stock.reservedQuantity += data.quantity;
      await manager.save(stock);
      return manager.save(InventoryReservation, manager.create(InventoryReservation, { ...data, customerId, status: InventoryReservationStatus.ACTIVE, expiresAt }));
    });
  }

  async releaseReservation(id: string, customerId: string) {
    return this.dataSource.transaction(async (manager) => {
      const reservation = await manager.findOne(InventoryReservation, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (reservation.customerId !== customerId) throw new BadRequestException('Not authorized');
      if (reservation.status !== InventoryReservationStatus.ACTIVE) return reservation;
      const stock = await manager.findOneOrFail(InventoryStock, { where: { warehouseId: reservation.warehouseId, productVariantId: reservation.productVariantId }, lock: { mode: 'pessimistic_write' } });
      stock.reservedQuantity = Math.max(0, stock.reservedQuantity - reservation.quantity);
      reservation.status = new Date() > reservation.expiresAt ? InventoryReservationStatus.EXPIRED : InventoryReservationStatus.RELEASED;
      await manager.save(stock);
      return manager.save(reservation);
    });
  }

  async expireReservations() {
    const active = await this.reservations.find({ where: { status: InventoryReservationStatus.ACTIVE } });
    const expired = active.filter((reservation) => reservation.expiresAt <= new Date());
    for (const reservation of expired) await this.releaseReservation(reservation.id, reservation.customerId);
    return { expired: expired.length };
  }

  async createShipment(sellerId: string, data: { orderId: string; carrier: string; serviceLevel: string; trackingNumber?: string; estimatedDeliveryAt?: string; pickupScheduledAt?: string; pickupLocation?: string }) {
    const order = await this.orders.findOne({ where: { id: data.orderId }, relations: ['items', 'items.productVariant', 'items.productVariant.product'] });
    if (!order || !order.items.length || order.items.some((item) => item.productVariant.product.sellerId !== sellerId)) throw new NotFoundException('Order not found');
    const existing = await this.shipments.findOne({ where: { orderId: data.orderId, sellerId } });
    if (existing) throw new BadRequestException('A shipment already exists for this order');
    if (!data.carrier?.trim() || !data.serviceLevel?.trim()) throw new BadRequestException('Carrier and service level are required');
    const trackingNumber = data.trackingNumber || `ZYN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const rate = this.calculateShippingRate({ subtotal: Number(order.total), serviceLevel: data.serviceLevel });
    const now = new Date();
    const estimatedDeliveryAt = data.estimatedDeliveryAt ? new Date(data.estimatedDeliveryAt) : new Date(now.getTime() + rate.estimatedDays * 86400000);
    const pickupScheduledAt = data.pickupScheduledAt ? new Date(data.pickupScheduledAt) : undefined;
    if (Number.isNaN(estimatedDeliveryAt.getTime()) || (pickupScheduledAt && Number.isNaN(pickupScheduledAt.getTime()))) throw new BadRequestException('Invalid shipment date');
    return this.shipments.save(this.shipments.create({ orderId: data.orderId, sellerId, carrier: data.carrier.trim(), serviceLevel: data.serviceLevel.trim(), trackingNumber, estimatedDeliveryAt, pickupScheduledAt, pickupLocation: data.pickupLocation, status: ShipmentStatus.LABEL_CREATED, label: { provider: 'zynkra', carrier: data.carrier.trim(), serviceLevel: data.serviceLevel.trim(), trackingNumber, createdAt: now.toISOString(), shippingAmount: rate.amount, currency: rate.currency }, events: [{ status: ShipmentStatus.LABEL_CREATED, at: now.toISOString() }] }));
  }

  async fulfillOrder(sellerId: string, orderId: string, warehouseId: string, pickup?: { scheduledAt?: string; location?: string }) {
    const order = await this.orders.findOne({ where: { id: orderId }, relations: ['items', 'items.productVariant', 'items.productVariant.product'] });
    if (!order || !order.items.length || order.items.some((item) => item.productVariant.product.sellerId !== sellerId)) throw new NotFoundException('Order not found');
    if (!['pending', 'processing'].includes(order.status)) throw new BadRequestException('Order is not fulfillable in its current state');
    await this.assertWarehouseOwner(warehouseId, sellerId);
    await this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        const stock = await manager.findOne(InventoryStock, { where: { warehouseId, productVariantId: item.productVariant.id }, lock: { mode: 'pessimistic_write' } });
        if (!stock || stock.quantity - stock.reservedQuantity < item.quantity) throw new BadRequestException(`Insufficient stock for ${item.productVariant.name}`);
        stock.quantity -= item.quantity;
        stock.reservedQuantity = Math.max(0, stock.reservedQuantity - item.quantity);
        await manager.save(stock);
        const variant = await manager.findOneOrFail(ProductVariant, { where: { id: item.productVariant.id }, lock: { mode: 'pessimistic_write' } });
        variant.stock = Math.max(0, variant.stock - item.quantity);
        await manager.save(variant);
      }
      order.status = 'processing';
      await manager.save(order);
    });
    return this.createShipment(sellerId, { orderId, carrier: 'local', serviceLevel: 'standard', pickupScheduledAt: pickup?.scheduledAt, pickupLocation: pickup?.location });
  }

  async updateShipment(id: string, sellerId: string, status: ShipmentStatus) {
    const shipment = await this.shipments.findOne({ where: { id, sellerId } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const allowed: Record<ShipmentStatus, ShipmentStatus[]> = {
      [ShipmentStatus.PENDING]: [ShipmentStatus.LABEL_CREATED, ShipmentStatus.CANCELLED],
      [ShipmentStatus.LABEL_CREATED]: [ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELLED],
      [ShipmentStatus.PICKED_UP]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED],
      [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.DELIVERED],
      [ShipmentStatus.DELIVERED]: [], [ShipmentStatus.CANCELLED]: [],
    };
    if (!Object.values(ShipmentStatus).includes(status) || !allowed[shipment.status]?.includes(status)) throw new BadRequestException(`Cannot move shipment from ${shipment.status} to ${status}`);
    shipment.status = status;
    shipment.events = [...(shipment.events || []), { status, at: new Date().toISOString() }];
    if (status === ShipmentStatus.PICKED_UP) shipment.pickedUpAt = new Date();
    if (status === ShipmentStatus.DELIVERED) shipment.deliveredAt = new Date();
    const saved = await this.shipments.save(shipment);
    if (status === ShipmentStatus.CANCELLED) await this.orders.update(shipment.orderId, { status: 'cancelled' });
    if (status === ShipmentStatus.PICKED_UP || status === ShipmentStatus.IN_TRANSIT) await this.orders.update(shipment.orderId, { status: 'shipped' });
    if (status === ShipmentStatus.DELIVERED) await this.orders.update(shipment.orderId, { status: 'delivered' });
    return saved;
  }

  getShipment(id: string, sellerId: string) { return this.shipments.findOne({ where: { id, sellerId } }); }

  listShipments(sellerId: string) { return this.shipments.find({ where: { sellerId }, order: { createdAt: 'DESC' } }); }

  calculateShippingRate(data: { subtotal: number; country?: string; serviceLevel?: string }) {
    const international = data.country && data.country.toUpperCase() !== 'US';
    const express = data.serviceLevel === 'express';
    const amount = (international ? 24 : 8) + (express ? 12 : 0) + (data.subtotal >= 100 ? 0 : 3);
    return { currency: 'USD', amount: Number(amount.toFixed(2)), serviceLevel: express ? 'express' : 'standard', estimatedDays: international ? (express ? 4 : 10) : (express ? 2 : 5) };
  }

  async createReturn(customerId: string, data: { orderId: string; sellerId: string; type: ReturnRequestType; reason: string; items?: Array<Record<string, unknown>> }) {
    const order = await this.orders.findOne({ where: { id: data.orderId }, relations: ['items', 'items.productVariant', 'items.productVariant.product'] });
    if (!order || order.customerId !== customerId || !order.items.length) throw new NotFoundException('Order not found');
    const sellerIds = new Set(order.items.map((item) => item.productVariant.product.sellerId));
    if (!sellerIds.has(data.sellerId) || !Object.values(ReturnRequestType).includes(data.type) || !data.reason?.trim()) throw new BadRequestException('Invalid return request');
    const existing = await this.returns.findOne({ where: { orderId: data.orderId, customerId, type: data.type, status: ReturnRequestStatus.REQUESTED } });
    if (existing) throw new BadRequestException('An active request already exists for this order');
    return this.returns.save(this.returns.create({ orderId: data.orderId, sellerId: data.sellerId, type: data.type, reason: data.reason.trim(), items: data.items, customerId, status: ReturnRequestStatus.REQUESTED }));
  }

  async updateReturn(id: string, sellerId: string, status: ReturnRequestStatus, resolution?: string) {
    const request = await this.returns.findOne({ where: { id, sellerId } });
    if (!request) throw new NotFoundException('Return request not found');
    const transitions: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
      [ReturnRequestStatus.REQUESTED]: [ReturnRequestStatus.APPROVED, ReturnRequestStatus.REJECTED],
      [ReturnRequestStatus.APPROVED]: [ReturnRequestStatus.RECEIVED, ReturnRequestStatus.REJECTED],
      [ReturnRequestStatus.RECEIVED]: [ReturnRequestStatus.REFUNDED, ReturnRequestStatus.COMPLETED],
      [ReturnRequestStatus.REFUNDED]: [ReturnRequestStatus.COMPLETED],
      [ReturnRequestStatus.REJECTED]: [],
      [ReturnRequestStatus.COMPLETED]: [],
    };
    if (!Object.values(ReturnRequestStatus).includes(status) || !transitions[request.status].includes(status)) throw new BadRequestException(`Cannot move return from ${request.status} to ${status}`);
    request.status = status;
    request.resolution = resolution;
    return this.returns.save(request);
  }

  listReturns(userId: string) { return this.returns.find({ where: [{ customerId: userId }, { sellerId: userId }], order: { createdAt: 'DESC' } }); }

  createSupplier(sellerId: string, data: Partial<Supplier>) {
    if (!data.name?.trim()) throw new BadRequestException('Supplier name is required');
    return this.suppliers.save(this.suppliers.create({ ...data, sellerId, name: data.name.trim() }));
  }
  listSuppliers(sellerId: string) { return this.suppliers.find({ where: { sellerId }, order: { name: 'ASC' } }); }
  async updateSupplier(id: string, sellerId: string, data: Partial<Supplier>) {
    const supplier = await this.suppliers.findOne({ where: { id, sellerId } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (data.name !== undefined && !data.name.trim()) throw new BadRequestException('Supplier name cannot be empty');
    Object.assign(supplier, data, data.name === undefined ? {} : { name: data.name.trim() });
    return this.suppliers.save(supplier);
  }
  async deleteSupplier(id: string, sellerId: string) {
    const result = await this.suppliers.delete({ id, sellerId });
    if (!result.affected) throw new NotFoundException('Supplier not found');
    return { deleted: true };
  }

  async forecast(sellerId: string, productVariantId: string, days = 30) {
    if (!Number.isInteger(days) || !Number.isFinite(days) || days < 1 || days > 365) throw new BadRequestException('Forecast history must be between 1 and 365 days');
    await this.assertVariantOwner(productVariantId, sellerId);
    const start = new Date(Date.now() - days * 86400000);
    const result = await this.dataSource.createQueryBuilder().select('COALESCE(SUM(oi.quantity), 0)', 'quantity').from('order_items', 'oi').innerJoin('orders', 'o', 'o.id = oi."orderId"').where('oi."productVariantId" = :productVariantId', { productVariantId }).andWhere('o."createdAt" >= :start', { start }).getRawOne();
    const forecastQuantity = Math.ceil(Number(result?.quantity || 0) / days * 30);
    return this.forecasts.save(this.forecasts.create({ sellerId, productVariantId, periodStart: new Date().toISOString().slice(0, 10), periodEnd: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), forecastQuantity, basedOnDays: days }));
  }

  listForecasts(sellerId: string) { return this.forecasts.find({ where: { sellerId }, order: { createdAt: 'DESC' } }); }

  private async assertWarehouseOwner(id: string, sellerId: string) { const warehouse = await this.warehouses.findOne({ where: { id, sellerId } }); if (!warehouse) throw new NotFoundException('Warehouse not found'); return warehouse; }
  private async assertVariantOwner(id: string, sellerId: string) { const variant = await this.variants.findOne({ where: { id }, relations: ['product'] }); if (!variant || variant.product.sellerId !== sellerId) throw new NotFoundException('Product variant not found'); return variant; }
}