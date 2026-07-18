
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { Form } from './entities/form.entity';
import { Question } from './entities/question.entity';
import { Submission } from './entities/submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Form, Question, Submission])],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}