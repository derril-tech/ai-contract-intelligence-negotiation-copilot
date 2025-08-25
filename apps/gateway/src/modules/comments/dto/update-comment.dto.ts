// Created automatically by Cursor AI (2024-12-19)

import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ description: 'Updated comment content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'User IDs to mention in the comment' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  mentionUserIds?: string[];

  @ApiProperty({ description: 'Tags for the comment' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
