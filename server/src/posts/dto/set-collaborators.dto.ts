import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class SetCollaboratorsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  userIds: string[];
}
