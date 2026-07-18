import { PartialType } from '@nestjs/mapped-types';
import { CreateInstantFormDto } from './create-instant-form.dto';

export class UpdateInstantFormDto extends PartialType(CreateInstantFormDto) {}