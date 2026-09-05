import { ShippingInventoryService } from './shipping-inventory.service';
import { InventoryReservationStatus } from './entities/inventory-reservation.entity';

function createService(overrides: Record<string, unknown> = {}) {
  return new ShippingInventoryService(
    overrides.dataSource as never,
    overrides.variants as never,
    overrides.warehouses as never,
    overrides.stocks as never,
    overrides.reservations as never,
    overrides.shipments as never,
    overrides.returns as never,
    overrides.suppliers as never,
    overrides.forecasts as never,
    overrides.orders as never,
  );
}

describe('ShippingInventoryService', () => {
  it('calculates domestic and international shipping rates', () => {
    const service = createService();

    expect(service.calculateShippingRate({ subtotal: 50, country: 'US', serviceLevel: 'standard' })).toEqual({
      currency: 'USD',
      amount: 11,
      serviceLevel: 'standard',
      estimatedDays: 5,
    });
    expect(service.calculateShippingRate({ subtotal: 150, country: 'GB', serviceLevel: 'express' })).toEqual({
      currency: 'USD',
      amount: 36,
      serviceLevel: 'express',
      estimatedDays: 4,
    });
  });

  it('returns only stock at or below the reorder point', async () => {
    const stocks = {
      find: jest.fn().mockResolvedValue([
        { id: 'low', warehouseId: 'w1', quantity: 5, reservedQuantity: 2, reorderPoint: 3 },
        { id: 'healthy', warehouseId: 'w1', quantity: 20, reservedQuantity: 2, reorderPoint: 3 },
      ]),
    };
    const warehouses = {
      find: jest.fn().mockResolvedValue([{ id: 'w1' }]),
    };
    const service = createService({ stocks, warehouses });

    await expect(service.listStockAlerts('seller-1')).resolves.toEqual([
      { id: 'low', warehouseId: 'w1', quantity: 5, reservedQuantity: 2, reorderPoint: 3 },
    ]);
    expect(stocks.find).toHaveBeenCalledWith({ where: { warehouseId: expect.anything() }, order: { updatedAt: 'DESC' } });
  });

  it('expires active reservations through the normal release path', async () => {
    const reservations = {
      find: jest.fn().mockResolvedValue([
        { id: 'expired', customerId: 'customer-1', status: InventoryReservationStatus.ACTIVE, expiresAt: new Date(Date.now() - 1000) },
        { id: 'active', customerId: 'customer-1', status: InventoryReservationStatus.ACTIVE, expiresAt: new Date(Date.now() + 60_000) },
      ]),
    };
    const service = createService({ reservations });
    const release = jest.spyOn(service, 'releaseReservation').mockResolvedValue({} as never);

    await expect(service.expireReservations()).resolves.toEqual({ expired: 1 });
    expect(release).toHaveBeenCalledWith('expired', 'customer-1');
  });

  it('projects demand from recent order volume and saves the forecast', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ quantity: '10' }),
    };
    const dataSource = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const variants = { findOne: jest.fn().mockResolvedValue({ id: 'variant-1', product: { sellerId: 'seller-1' } }) };
    const forecasts = {
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve({ id: 'forecast-1', ...value })),
    };
    const service = createService({ dataSource, variants, forecasts });

    await expect(service.forecast('seller-1', 'variant-1', 10)).resolves.toMatchObject({
      id: 'forecast-1',
      sellerId: 'seller-1',
      productVariantId: 'variant-1',
      forecastQuantity: 30,
      basedOnDays: 10,
    });
    expect(variants.findOne).toHaveBeenCalledWith({ where: { id: 'variant-1' }, relations: ['product'] });
  });

  it('rejects invalid forecast history windows before querying', async () => {
    const dataSource = { createQueryBuilder: jest.fn() };
    const service = createService({ dataSource });

    await expect(service.forecast('seller-1', 'variant-1', Number.NaN)).rejects.toThrow('Forecast history must be between 1 and 365 days');
    expect(dataSource.createQueryBuilder).not.toHaveBeenCalled();
  });
});
