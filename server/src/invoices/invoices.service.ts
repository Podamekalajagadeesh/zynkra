import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { subtotal, taxAmount, total } = this.computeTotals(
      dto.lineItems,
      dto.taxRate,
    );

    const invoice = this.invoicesRepository.create({
      user,
      clientName: dto.clientName,
      clientEmail: dto.clientEmail ?? null,
      currency: (dto.currency ?? 'usd').toLowerCase(),
      lineItems: dto.lineItems,
      taxRate: dto.taxRate,
      subtotal,
      taxAmount,
      total,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      invoiceNo: this.nextInvoiceNo(),
      status: InvoiceStatus.DRAFT,
    });

    return this.invoicesRepository.save(invoice);
  }

  async findAll(userId: string): Promise<Invoice[]> {
    return this.invoicesRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.user.id !== userId) {
      throw new ForbiddenException('You can only access your own invoices');
    }
    return invoice;
  }

  async update(userId: string, id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(userId, id);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Paid invoices cannot be edited');
    }

    if (dto.clientName !== undefined) invoice.clientName = dto.clientName;
    if (dto.clientEmail !== undefined) invoice.clientEmail = dto.clientEmail;
    if (dto.dueDate !== undefined) invoice.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.taxRate !== undefined) invoice.taxRate = dto.taxRate;
    if (dto.lineItems !== undefined) invoice.lineItems = dto.lineItems;

    // Recompute totals server-side — never trust a client-supplied total.
    const { subtotal, taxAmount, total } = this.computeTotals(
      invoice.lineItems,
      Number(invoice.taxRate),
    );
    invoice.subtotal = subtotal;
    invoice.taxAmount = taxAmount;
    invoice.total = total;

    return this.invoicesRepository.save(invoice);
  }

  async markPaid(userId: string, id: string): Promise<Invoice> {
    const invoice = await this.findOne(userId, id);
    if (invoice.status === InvoiceStatus.PAID) {
      return invoice;
    }
    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();
    return this.invoicesRepository.save(invoice);
  }

  async remove(userId: string, id: string): Promise<void> {
    const invoice = await this.findOne(userId, id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be deleted');
    }
    await this.invoicesRepository.remove(invoice);
  }

  private computeTotals(
    lineItems: { quantity: number; unitPrice: number }[],
    taxRate: number,
  ): { subtotal: number; taxAmount: number; total: number } {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = subtotal * (taxRate / 100);
    return {
      subtotal: round2(subtotal),
      taxAmount: round2(taxAmount),
      total: round2(subtotal + taxAmount),
    };
  }

  private nextInvoiceNo(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `INV-${year}-${random}`;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
