// Created automatically by Cursor AI (2024-12-19)

import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateThreadDto {
  @ApiProperty({ description: 'Agreement ID' })
  @IsUUID()
  agreementId: string;

  @ApiProperty({ description: 'Section ID where comment is located' })
  @IsUUID()
  sectionId: string;

  @ApiProperty({ description: 'Comment thread title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Initial comment content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Text selection or context for the comment' })
  @IsOptional()
  @IsString()
  selection?: string;

  @ApiProperty({ description: 'Page number where comment is located' })
  @IsOptional()
  pageNumber?: number;

  @ApiProperty({ description: 'Line number or position in the document' })
  @IsOptional()
  lineNumber?: number;

  @ApiProperty({ description: 'Tags for categorizing the comment' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Priority level of the comment' })
  @IsOptional()
  @IsString()
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'User IDs to assign the thread to' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  assigneeIds?: string[];
}
