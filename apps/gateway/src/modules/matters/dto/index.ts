import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatterDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  orgId: string;

  @ApiProperty({ description: 'Matter name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Counterparty name', required: false })
  @IsOptional()
  @IsString()
  counterparty?: string;

  @ApiProperty({ description: 'Region', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'Value in USD', required: false })
  @IsOptional()
  @IsNumber()
  valueUsd?: number;

  @ApiProperty({ description: 'Stage', required: false })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiProperty({ description: 'Created by user ID' })
  @IsString()
  createdBy: string;
}

export class UpdateMatterDto {
  @ApiProperty({ description: 'Matter name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Counterparty name', required: false })
  @IsOptional()
  @IsString()
  counterparty?: string;

  @ApiProperty({ description: 'Region', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'Value in USD', required: false })
  @IsOptional()
  @IsNumber()
  valueUsd?: number;

  @ApiProperty({ description: 'Stage', required: false })
  @IsOptional()
  @IsString()
  stage?: string;
}
