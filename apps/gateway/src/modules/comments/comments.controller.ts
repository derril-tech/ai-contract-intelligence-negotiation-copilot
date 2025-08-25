// Created automatically by Cursor AI (2024-12-19)

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto, CreateThreadDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('comments')
@Controller('v1/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('threads')
  @ApiOperation({ summary: 'Create a new comment thread' })
  @ApiResponse({ status: 201, description: 'Comment thread created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createThread(
    @Body() createThreadDto: CreateThreadDto,
    @Request() req: any,
  ) {
    return this.commentsService.createThread(createThreadDto, req.user.id);
  }

  @Get('threads')
  @ApiOperation({ summary: 'Get comment threads for an agreement' })
  @ApiResponse({ status: 200, description: 'Comment threads retrieved successfully' })
  async getThreads(
    @Query('agreementId') agreementId: string,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: 'open' | 'resolved' | 'all',
  ) {
    return this.commentsService.getThreads(agreementId, sectionId, status);
  }

  @Get('threads/:threadId')
  @ApiOperation({ summary: 'Get a specific comment thread' })
  @ApiResponse({ status: 200, description: 'Comment thread retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment thread not found' })
  async getThread(@Param('threadId') threadId: string) {
    return this.commentsService.getThread(threadId);
  }

  @Post('threads/:threadId/comments')
  @ApiOperation({ summary: 'Add a comment to a thread' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async addComment(
    @Param('threadId') threadId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ) {
    return this.commentsService.addComment(threadId, createCommentDto, req.user.id);
  }

  @Put('threads/:threadId/resolve')
  @ApiOperation({ summary: 'Resolve a comment thread' })
  @ApiResponse({ status: 200, description: 'Thread resolved successfully' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async resolveThread(
    @Param('threadId') threadId: string,
    @Request() req: any,
  ) {
    return this.commentsService.resolveThread(threadId, req.user.id);
  }

  @Put('threads/:threadId/reopen')
  @ApiOperation({ summary: 'Reopen a resolved comment thread' })
  @ApiResponse({ status: 200, description: 'Thread reopened successfully' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async reopenThread(
    @Param('threadId') threadId: string,
    @Request() req: any,
  ) {
    return this.commentsService.reopenThread(threadId, req.user.id);
  }

  @Put('comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment author' })
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: any,
  ) {
    return this.commentsService.updateComment(commentId, updateCommentDto, req.user.id);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment author' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    return this.commentsService.deleteComment(commentId, req.user.id);
  }

  @Get('agreements/:agreementId/summary')
  @ApiOperation({ summary: 'Get comment summary for an agreement' })
  @ApiResponse({ status: 200, description: 'Comment summary retrieved successfully' })
  async getCommentSummary(@Param('agreementId') agreementId: string) {
    return this.commentsService.getCommentSummary(agreementId);
  }

  @Post('threads/:threadId/assign')
  @ApiOperation({ summary: 'Assign a comment thread to a user' })
  @ApiResponse({ status: 200, description: 'Thread assigned successfully' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async assignThread(
    @Param('threadId') threadId: string,
    @Body('assigneeId') assigneeId: string,
    @Request() req: any,
  ) {
    return this.commentsService.assignThread(threadId, assigneeId, req.user.id);
  }

  @Post('threads/:threadId/mention')
  @ApiOperation({ summary: 'Mention users in a comment thread' })
  @ApiResponse({ status: 200, description: 'Users mentioned successfully' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async mentionUsers(
    @Param('threadId') threadId: string,
    @Body('userIds') userIds: string[],
    @Request() req: any,
  ) {
    return this.commentsService.mentionUsers(threadId, userIds, req.user.id);
  }
}
