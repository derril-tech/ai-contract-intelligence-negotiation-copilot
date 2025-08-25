import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MattersService } from './matters.service';
import { CreateMatterDto, UpdateMatterDto } from './dto';

@ApiTags('matters')
@Controller('matters')
export class MattersController {
  constructor(private readonly mattersService: MattersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new matter' })
  @ApiResponse({ status: 201, description: 'Matter created successfully' })
  async create(@Body() createMatterDto: CreateMatterDto) {
    return this.mattersService.create(createMatterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all matters' })
  @ApiResponse({ status: 200, description: 'List of matters' })
  async findAll(@Query() query: any) {
    return this.mattersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get matter by ID' })
  @ApiResponse({ status: 200, description: 'Matter details' })
  async findOne(@Param('id') id: string) {
    return this.mattersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update matter' })
  @ApiResponse({ status: 200, description: 'Matter updated successfully' })
  async update(@Param('id') id: string, @Body() updateMatterDto: UpdateMatterDto) {
    return this.mattersService.update(id, updateMatterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete matter' })
  @ApiResponse({ status: 200, description: 'Matter deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.mattersService.remove(id);
  }
}
