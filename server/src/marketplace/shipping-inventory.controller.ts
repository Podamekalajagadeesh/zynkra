import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShippingInventoryService } from './shipping-inventory.service';
import { ReturnRequestStatus, ReturnRequestType } from './entities/return-request.entity';
import { ShipmentStatus } from './entities/shipment.entity';

@Controller('commerce')
@UseGuards(JwtAuthGuard)
export class ShippingInventoryController {
  constructor(private readonly service: ShippingInventoryService) {}

  @Post('warehouses') createWarehouse(@Req() req, @Body() body) { return this.service.createWarehouse(req.user.userId || req.user.id, body); }
  @Get('warehouses') listWarehouses(@Req() req) { return this.service.listWarehouses(req.user.userId || req.user.id); }
  @Post('warehouses/:warehouseId/stock/:productVariantId') upsertStock(@Req() req, @Param('warehouseId') warehouseId: string, @Param('productVariantId') productVariantId: string, @Body() body) { return this.service.upsertStock(req.user.userId || req.user.id, warehouseId, productVariantId, body); }
  @Get('inventory') listStock(@Req() req, @Query('warehouseId') warehouseId?: string) { return this.service.listStock(req.user.userId || req.user.id, warehouseId); }
  @Get('inventory/alerts') listAlerts(@Req() req, @Query('warehouseId') warehouseId?: string) { return this.service.listStockAlerts(req.user.userId || req.user.id, warehouseId); }
  @Post('reservations') reserve(@Req() req, @Body() body) { return this.service.reserveStock(req.user.userId || req.user.id, body); }
  @Post('reservations/:id/release') release(@Req() req, @Param('id') id: string) { return this.service.releaseReservation(id, req.user.userId || req.user.id); }
  @Get('shipping/rates') rates(@Query() query) { return this.service.calculateShippingRate({ subtotal: Number(query.subtotal || 0), country: query.country, serviceLevel: query.serviceLevel }); }
  @Post('shipments') createShipment(@Req() req, @Body() body) { return this.service.createShipment(req.user.userId || req.user.id, body); }
  @Post('orders/:orderId/fulfill') fulfill(@Req() req, @Param('orderId') orderId: string, @Body() body: { warehouseId: string; pickup?: { scheduledAt?: string; location?: string } }) { return this.service.fulfillOrder(req.user.userId || req.user.id, orderId, body.warehouseId, body.pickup); }
  @Get('shipments') listShipments(@Req() req) { return this.service.listShipments(req.user.userId || req.user.id); }
  @Patch('shipments/:id/status') updateShipment(@Req() req, @Param('id') id: string, @Body('status') status: ShipmentStatus) { return this.service.updateShipment(id, req.user.userId || req.user.id, status); }
  @Get('shipments/:id') getShipment(@Req() req, @Param('id') id: string) { return this.service.getShipment(id, req.user.userId || req.user.id); }
  @Post('returns') createReturn(@Req() req, @Body() body: { orderId: string; sellerId: string; type: ReturnRequestType; reason: string; items?: Array<Record<string, unknown>> }) { return this.service.createReturn(req.user.userId || req.user.id, body); }
  @Get('returns') listReturns(@Req() req) { return this.service.listReturns(req.user.userId || req.user.id); }
  @Patch('returns/:id') updateReturn(@Req() req, @Param('id') id: string, @Body() body: { status: ReturnRequestStatus; resolution?: string }) { return this.service.updateReturn(id, req.user.userId || req.user.id, body.status, body.resolution); }
  @Post('suppliers') createSupplier(@Req() req, @Body() body) { return this.service.createSupplier(req.user.userId || req.user.id, body); }
  @Get('suppliers') listSuppliers(@Req() req) { return this.service.listSuppliers(req.user.userId || req.user.id); }
  @Patch('suppliers/:id') updateSupplier(@Req() req, @Param('id') id: string, @Body() body) { return this.service.updateSupplier(id, req.user.userId || req.user.id, body); }
  @Delete('suppliers/:id') deleteSupplier(@Req() req, @Param('id') id: string) { return this.service.deleteSupplier(id, req.user.userId || req.user.id); }
  @Post('demand-forecast/:productVariantId') forecast(@Req() req, @Param('productVariantId') productVariantId: string, @Query('days') days?: string) { return this.service.forecast(req.user.userId || req.user.id, productVariantId, Math.min(Number(days || 30), 365)); }
  @Get('demand-forecasts') listForecasts(@Req() req) { return this.service.listForecasts(req.user.userId || req.user.id); }
}