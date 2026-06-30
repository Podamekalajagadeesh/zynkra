import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  NotFoundException,
  UnauthorizedException,
  InjectRepository,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/product.dto';
import { ProductVariant } from './entities/product-variant.entity';
import { Order } from './entities/order.entity';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: User) {
    return this.productsService.create(user, createProductDto);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return this.productsService.findAll(page, limit, category, search, minPrice, maxPrice);
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard)
  findUserProducts(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.productsService.findUserProducts(user, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: Partial<CreateProductDto>,
    @CurrentUser() user: User,
  ) {
    return this.productsService.update(user, id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.remove(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/variants')
  addVariant(
    @Param('id') id: string,
    @Body() variantData: Partial<ProductVariant>,
  ) {
    return this.productsService.addVariant(id, variantData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('variants/:variantId')
  removeVariant(@Param('variantId') variantId: string) {
    return this.productsService.removeVariant(variantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/download')
  async getDownloadUrl(@Param('id') id: string, @CurrentUser() user: User) {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
      relations: ['orderItems', 'orderItems.order'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.productType !== 'digital' || !product.fileUrl) {
      throw new UnauthorizedException('This product is not available for download');
    }

    // Check if user has purchased this product by finding a completed order that includes this product
    const userHasPurchased = product.orderItems.some(orderItem => 
      orderItem.order.customerId === user.id && 
      orderItem.order.status === 'completed'
    );

    // Also allow the seller to download their own product
    const isSeller = product.sellerId === user.id;

    if (!userHasPurchased && !isSeller) {
      throw new UnauthorizedException('You have not purchased this product');
    }

    return { downloadUrl: product.fileUrl };
  }
}