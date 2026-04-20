import { ApiProperty } from '@nestjs/swagger';
import { EnhancementType } from '@prisma/client';
import { ArrayMinSize, IsArray, IsEnum, IsString } from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  photoId!: string;

  @ApiProperty({
    enum: EnhancementType,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(EnhancementType, { each: true })
  enhancements!: EnhancementType[];
}
