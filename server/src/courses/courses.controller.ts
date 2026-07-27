import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post() @UseGuards(JwtAuthGuard) @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() body: any) {
    return this.coursesService.create(req.user.userId || req.user.id, body);
  }

  @Post(':courseId/lessons') @UseGuards(JwtAuthGuard) @HttpCode(HttpStatus.CREATED)
  async addLesson(@Param('courseId') courseId: string, @Req() req, @Body() body: any) {
    return this.coursesService.addLesson(courseId, body);
  }

  @Post(':courseId/publish') @UseGuards(JwtAuthGuard) @HttpCode(HttpStatus.OK)
  async publish(@Param('courseId') id: string, @Req() req) {
    return this.coursesService.publish(id, req.user.userId || req.user.id);
  }

  @Post(':courseId/enroll') @UseGuards(JwtAuthGuard) @HttpCode(HttpStatus.OK)
  async enroll(@Param('courseId') courseId: string, @Req() req) {
    return this.coursesService.enroll(req.user.userId || req.user.id, courseId);
  }

  @Post('lessons/:lessonId/complete') @UseGuards(JwtAuthGuard) @HttpCode(HttpStatus.OK)
  async completeLesson(@Param('lessonId') lessonId: string, @Req() req) {
    return this.coursesService.markLessonComplete(req.user.userId || req.user.id, lessonId);
  }

  @Get('feed') async getFeed(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.coursesService.getFeed({ page: page ? parseInt(page, 10) : 1, limit: limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20 });
  }

  @Get(':id/lessons') async getLessons(@Param('id') courseId: string) {
    return this.coursesService.getLessons(courseId);
  }
}
