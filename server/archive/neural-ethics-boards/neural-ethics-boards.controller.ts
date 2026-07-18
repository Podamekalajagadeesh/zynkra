import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NeuralEthicsBoardsService } from './neural-ethics-boards.service';

@Controller('neural-ethics-boards')
@UseGuards(JwtAuthGuard)
export class NeuralEthicsBoardsController {
  constructor(private readonly neuralEthicsBoardsService: NeuralEthicsBoardsService) {}

  @Get('boards')
  async getAllBoards() {
    return this.neuralEthicsBoardsService.getAllBoards();
  }

  @Get('boards/:id')
  async getBoard(@Param('id') id: string) {
    return this.neuralEthicsBoardsService.getBoardById(id);
  }

  @Post('boards')
  async createBoard(@Body() body: any) {
    return this.neuralEthicsBoardsService.createBoard(body);
  }

  @Patch('boards/:id')
  async updateBoard(@Param('id') id: string, @Body() body: any) {
    return this.neuralEthicsBoardsService.updateBoard(id, body);
  }

  @Get('audits')
  async getAllAudits() {
    return this.neuralEthicsBoardsService.getAllAudits();
  }

  @Get('audits/:id')
  async getAudit(@Param('id') id: string) {
    return this.neuralEthicsBoardsService.getAuditById(id);
  }

  @Post('audits')
  async createAudit(@Body() body: any) {
    return this.neuralEthicsBoardsService.createAudit(body);
  }

  @Patch('audits/:id')
  async updateAudit(@Param('id') id: string, @Body() body: any) {
    return this.neuralEthicsBoardsService.updateAudit(id, body);
  }

  @Get('stats')
  async getStats() {
    return this.neuralEthicsBoardsService.getStats();
  }
}
