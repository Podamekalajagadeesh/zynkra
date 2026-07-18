import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private productVariantsRepository: Repository<ProductVariant>,
  ) {}

  async create(orderData: { customerId: string; items: { productVariantId: string; quantity: number }[] }): Promise<Order> {
    let total = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const variant = await this.productVariantsRepository.findOne({ where: { id: item.productVariantId } });
      if (!variant || variant.stock < item.quantity) {
        throw new Error('Product variant not available in desired quantity.');
      }
      total += variant.price * item.quantity;
      const orderItem = this.orderItemsRepository.create({
        productVariant: variant,
        quantity: item.quantity,
        price: variant.price,
      });
      orderItems.push(await this.orderItemsRepository.save(orderItem));
      variant.stock -= item.quantity;
      await this.productVariantsRepository.save(variant);
    }

    const order = this.ordersRepository.create({
      customerId: orderData.customerId,
      items: orderItems,
      total,
    });

    return this.ordersRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({ relations: ['items', 'items.productVariant'] });
  }

  async findOne(id: string): Promise<Order> {
    return this.ordersRepository.findOne({ where: { id }, relations: ['customer', 'items', 'items.productVariant'] });
  }

  async update(id: string, orderData: Partial<Order>): Promise<Order> {
    await this.ordersRepository.update(id, orderData);
    return this.findOne(id);
  }
}