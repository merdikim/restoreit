import { ApiProperty } from '@nestjs/swagger';

export class UploadPhotoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  originalName!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty({ nullable: true })
  width!: number | null;

  @ApiProperty({ nullable: true })
  height!: number | null;

  @ApiProperty()
  originalUrl!: string;

  @ApiProperty()
  createdAt!: Date;
}
