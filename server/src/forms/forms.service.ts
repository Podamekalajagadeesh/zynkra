
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from './entities/form.entity';
import { Question } from './entities/question.entity';
import { Submission } from './entities/submission.entity';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {}

  async create(createFormDto: any): Promise<Form> {
    const { questions, ...formData } = createFormDto;
    const form = this.formRepository.create({
      ...formData,
      questions: questions.map(q => this.formRepository.manager.create(Question, q)),
    });
    return this.formRepository.save(form) as unknown as Promise<Form>;
  }

  async findOne(id: string): Promise<Form> {
    const form = await this.formRepository.findOne({ where: { id }, relations: ['questions'] });
    if (!form) {
      throw new NotFoundException(`Form with ID "${id}" not found`);
    }
    return form;
  }

  async submit(id: string, submitFormDto: any): Promise<Submission> {
    const form = await this.findOne(id);
    const submission = this.submissionRepository.create({
      form,
      submitterId: submitFormDto.submitterId,
    });
    return this.submissionRepository.save(submission);
  }

  async findAllSubmissions(id: string): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { form: { id } },
    });
  }
}