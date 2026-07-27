import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseLesson, CourseEnrollment, CourseStatus } from './course.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private readonly coursesRepository: Repository<Course>,
    @InjectRepository(CourseLesson) private readonly lessonsRepository: Repository<CourseLesson>,
    @InjectRepository(CourseEnrollment) private readonly enrollmentsRepository: Repository<CourseEnrollment>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async create(authorId: string, data: { title: string; description: string; coverImage?: string; price?: number; isGated?: boolean }): Promise<Course> {
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('User not found');
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
    const course = this.coursesRepository.create({ slug, title: data.title, description: data.description, coverImage: data.coverImage || null, author, isGated: data.isGated || false, price: data.price || null });
    return this.coursesRepository.save(course);
  }

  async addLesson(courseId: string, data: { title: string; content: string; orderIndex: number; videoUrl?: string; durationMinutes?: number }): Promise<CourseLesson> {
    const course = await this.coursesRepository.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const lesson = this.lessonsRepository.create({ courseId, title: data.title, content: data.content, orderIndex: data.orderIndex, videoUrl: data.videoUrl || null, durationMinutes: data.durationMinutes || 0 });
    const saved = await this.lessonsRepository.save(lesson);
    course.lessonCount = await this.lessonsRepository.count({ where: { courseId } });
    await this.coursesRepository.save(course);
    return saved;
  }

  async getFeed(options: { page?: number; limit?: number } = {}): Promise<{ courses: Course[]; total: number }> {
    const { page = 1, limit = 20 } = options;
    const [courses, total] = await this.coursesRepository.findAndCount({
      where: { status: CourseStatus.PUBLISHED },
      skip: (page - 1) * limit, take: limit, order: { createdAt: 'DESC' },
    });
    return { courses, total };
  }

  async getLessons(courseId: string): Promise<CourseLesson[]> {
    return this.lessonsRepository.find({ where: { courseId }, order: { orderIndex: 'ASC' } });
  }

  async enroll(userId: string, courseId: string): Promise<CourseEnrollment> {
    const existing = await this.enrollmentsRepository.findOne({ where: { userId, courseId } });
    if (existing) return existing;
    const enrollment = this.enrollmentsRepository.create({ userId, courseId, completedLessons: [] });
    const saved = await this.enrollmentsRepository.save(enrollment);
    await this.coursesRepository.increment({ id: courseId }, 'enrollmentCount', 1);
    return saved;
  }

  async markLessonComplete(userId: string, lessonId: string): Promise<CourseEnrollment> {
    const lesson = await this.lessonsRepository.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const enrollment = await this.enrollmentsRepository.findOne({ where: { userId, courseId: lesson.courseId } });
    if (!enrollment) throw new NotFoundException('Not enrolled');
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons = [...(enrollment.completedLessons || []), lessonId];
    }
    const totalLessons = await this.lessonsRepository.count({ where: { courseId: lesson.courseId } });
    enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    enrollment.isCompleted = enrollment.progress >= 100;
    return this.enrollmentsRepository.save(enrollment);
  }

  async publish(id: string, userId: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({ where: { id }, relations: ['author'] });
    if (!course) throw new NotFoundException('Course not found');
    if (course.author.id !== userId) throw new BadRequestException('Not authorized');
    course.status = CourseStatus.PUBLISHED;
    return this.coursesRepository.save(course);
  }
}
