import { Controller, Get, Post, Put, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BrandCollabsService } from './brand-collabs.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCollabOpportunityDto } from './dto/create-collab-opportunity.dto';
import { SubmitCollabApplicationDto } from './dto/submit-collab-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller('brand-collabs')
export class BrandCollabsController {
  constructor(private readonly brandCollabsService: BrandCollabsService) {}

  // Brand endpoints
  @UseGuards(JwtAuthGuard)
  @Post('brands')
  async createBrand(@Request() req, @Body() dto: CreateBrandDto) {
    return this.brandCollabsService.createBrand(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('brands')
  async getMyBrands(@Request() req) {
    return this.brandCollabsService.getUserBrands(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('brands/:id')
  async getBrand(@Request() req, @Param('id') brandId: string) {
    return this.brandCollabsService.getBrandById(brandId, req.user.userId);
  }

  // Opportunity endpoints
  @UseGuards(JwtAuthGuard)
  @Post('opportunities')
  async createOpportunity(
    @Request() req,
    @Body() dto: CreateCollabOpportunityDto & { brandId: string }
  ) {
    return this.brandCollabsService.createCollabOpportunity(req.user, dto.brandId, dto);
  }

  @Get('opportunities')
  async getOpportunities(
    @Query('category') category?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
    @Query('minFollowers') minFollowers?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (category) filters.category = category;
    if (minBudget) filters.minBudget = parseFloat(minBudget);
    if (maxBudget) filters.maxBudget = parseFloat(maxBudget);
    if (minFollowers) filters.minFollowers = parseInt(minFollowers);
    if (search) filters.search = search;
    
    return this.brandCollabsService.getOpportunities(filters);
  }

  @Get('opportunities/:id')
  async getOpportunity(@Param('id') opportunityId: string) {
    return this.brandCollabsService.getOpportunityById(opportunityId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-opportunities')
  async getMyOpportunities(@Request() req) {
    return this.brandCollabsService.getUserOpportunities(req.user.userId);
  }

  // Application endpoints
  @UseGuards(JwtAuthGuard)
  @Post('opportunities/:id/apply')
  async applyToOpportunity(
    @Request() req,
    @Param('id') opportunityId: string,
    @Body() dto: SubmitCollabApplicationDto
  ) {
    return this.brandCollabsService.submitApplication(req.user, opportunityId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-applications')
  async getMyApplications(@Request() req) {
    return this.brandCollabsService.getUserApplications(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('opportunities/:id/applications')
  async getOpportunityApplications(@Request() req, @Param('id') opportunityId: string) {
    return this.brandCollabsService.getOpportunityApplications(opportunityId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('applications/:id/status')
  async updateApplicationStatus(
    @Request() req,
    @Param('id') applicationId: string,
    @Body() dto: UpdateApplicationStatusDto
  ) {
    return this.brandCollabsService.updateApplicationStatus(applicationId, req.user.userId, dto);
  }

  // Dashboard stats
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Request() req) {
    return this.brandCollabsService.getDashboardStats(req.user.userId);
  }
}