import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  photoId!: string;
}
