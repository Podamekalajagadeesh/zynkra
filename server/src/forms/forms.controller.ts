
import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFormDto: any) {
    return this.formsService.create(createFormDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Post(':id/submissions')
  @HttpCode(HttpStatus.CREATED)
  submit(@Param('id') id: string, @Body() submitFormDto: any) {
    return this.formsService.submit(id, submitFormDto);
  }

  @Get(':id/submissions')
  findAllSubmissions(@Param('id') id: string) {
    return this.formsService.findAllSubmissions(id);
  }
}