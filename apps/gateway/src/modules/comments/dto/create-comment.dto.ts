// Created automatically by Cursor AI (2024-12-19)

import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content' })
  @IsString()
  content: string;

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

  @ApiProperty({ description: 'Whether this comment resolves the thread' })
  @IsOptional()
  resolvesThread?: boolean;
}
