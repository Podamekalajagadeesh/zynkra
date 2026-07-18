import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/product.dto';
import { ProductVariant } from './entities/product-variant.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantsRepository: Repository<ProductVariant>,
  ) {}

  async create(user: User, createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
      seller: user,
      sellerId: user.id,
    });

    await this.productsRepository.save(product);
    this.logger.log(`User ${user.id} created product ${product.id}`);

    // Create variants if they exist
    if (createProductDto.variants && createProductDto.variants.length > 0) {
      for (const variantData of createProductDto.variants) {
        const variant = this.productVariantsRepository.create({
          ...variantData,
          productId: product.id,
        });
        await this.productVariantsRepository.save(variant);
      }
    }

    return this.findOne(product.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    category?: string,
    search?: string,
    minPrice?: number,
    maxPrice?: number,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.productsRepository.createQueryBuilder('product');

    queryBuilder
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.isActive = :isActive', { isActive: true });

    if (category) {
      queryBuilder.andWhere('product.categories LIKE :category', { category: `%${category}%` });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    const [products, total] = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
      relations: ['seller'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findUserProducts(user: User, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await this.productsRepository.findAndCount({
      where: { sellerId: user.id },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(user: User, id: string, updateProductDto: Partial<CreateProductDto>): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id, sellerId: user.id } });

    if (!product) {
      throw new NotFoundException('Product not found or you do not have permission to update it');
    }

    Object.assign(product, updateProductDto);
    await this.productsRepository.save(product);
    this.logger.log(`User ${user.id} updated product ${id}`);

    // Update variants if they exist
    if (updateProductDto.variants && updateProductDto.variants.length > 0) {
      // Delete existing variants
      await this.productVariantsRepository.delete({ productId: id });
      
      // Create new variants
      for (const variantData of updateProductDto.variants) {
        const variant = this.productVariantsRepository.create({
          ...variantData,
          productId: product.id,
        });
        await this.productVariantsRepository.save(variant);
      }
    }

    return this.findOne(id);
  }

  async remove(user: User, id: string): Promise<{ success: boolean }> {
    const product = await this.productsRepository.findOne({ where: { id, sellerId: user.id } });

    if (!product) {
      throw new NotFoundException('Product not found or you do not have permission to delete it');
    }

    // Soft delete by marking as inactive
    product.isActive = false;
    await this.productsRepository.save(product);
    this.logger.log(`User ${user.id} deleted product ${id}`);

    return { success: true };
  }

  async addVariant(productId: string, variantData: Partial<ProductVariant>): Promise<ProductVariant> {
    const variant = this.productVariantsRepository.create({
      ...variantData,
      productId: productId,
    });
    return this.productVariantsRepository.save(variant);
  }

  async removeVariant(variantId: string): Promise<void> {
    await this.productVariantsRepository.delete(variantId);
  }
}