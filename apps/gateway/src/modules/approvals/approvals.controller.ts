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
import { ApprovalsService } from './approvals.service';
import { CreateApprovalGateDto, CreateApprovalDto, UpdateApprovalDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('approvals')
@Controller('v1/approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post('gates')
  @ApiOperation({ summary: 'Create a new approval gate' })
  @ApiResponse({ status: 201, description: 'Approval gate created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createGate(
    @Body() createGateDto: CreateApprovalGateDto,
    @Request() req: any,
  ) {
    return this.approvalsService.createGate(createGateDto, req.user.id);
  }

  @Get('gates')
  @ApiOperation({ summary: 'Get approval gates for an agreement' })
  @ApiResponse({ status: 200, description: 'Approval gates retrieved successfully' })
  async getGates(
    @Query('agreementId') agreementId: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ) {
    return this.approvalsService.getGates(agreementId, status);
  }

  @Get('gates/:gateId')
  @ApiOperation({ summary: 'Get a specific approval gate' })
  @ApiResponse({ status: 200, description: 'Approval gate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Approval gate not found' })
  async getGate(@Param('gateId') gateId: string) {
    return this.approvalsService.getGate(gateId);
  }

  @Put('gates/:gateId')
  @ApiOperation({ summary: 'Update an approval gate' })
  @ApiResponse({ status: 200, description: 'Approval gate updated successfully' })
  @ApiResponse({ status: 404, description: 'Approval gate not found' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateGate(
    @Param('gateId') gateId: string,
    @Body() updateGateDto: any,
    @Request() req: any,
  ) {
    return this.approvalsService.updateGate(gateId, updateGateDto, req.user.id);
  }

  @Delete('gates/:gateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an approval gate' })
  @ApiResponse({ status: 204, description: 'Approval gate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Approval gate not found' })
  @Roles(UserRole.ADMIN)
  async deleteGate(
    @Param('gateId') gateId: string,
    @Request() req: any,
  ) {
    return this.approvalsService.deleteGate(gateId, req.user.id);
  }

  @Post('gates/:gateId/approvals')
  @ApiOperation({ summary: 'Create an approval request' })
  @ApiResponse({ status: 201, description: 'Approval request created successfully' })
  @ApiResponse({ status: 404, description: 'Approval gate not found' })
  async createApproval(
    @Param('gateId') gateId: string,
    @Body() createApprovalDto: CreateApprovalDto,
    @Request() req: any,
  ) {
    return this.approvalsService.createApproval(gateId, createApprovalDto, req.user.id);
  }

  @Get('gates/:gateId/approvals')
  @ApiOperation({ summary: 'Get approval requests for a gate' })
  @ApiResponse({ status: 200, description: 'Approval requests retrieved successfully' })
  async getApprovals(
    @Param('gateId') gateId: string,
    @Query('status') status?: 'pending' | 'approved' | 'rejected' | 'all',
  ) {
    return this.approvalsService.getApprovals(gateId, status);
  }

  @Get('approvals/:approvalId')
  @ApiOperation({ summary: 'Get a specific approval request' })
  @ApiResponse({ status: 200, description: 'Approval request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  async getApproval(@Param('approvalId') approvalId: string) {
    return this.approvalsService.getApproval(approvalId);
  }

  @Put('approvals/:approvalId/approve')
  @ApiOperation({ summary: 'Approve an approval request' })
  @ApiResponse({ status: 200, description: 'Approval request approved successfully' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized approver' })
  async approve(
    @Param('approvalId') approvalId: string,
    @Body() updateApprovalDto: UpdateApprovalDto,
    @Request() req: any,
  ) {
    return this.approvalsService.approve(approvalId, updateApprovalDto, req.user.id);
  }

  @Put('approvals/:approvalId/reject')
  @ApiOperation({ summary: 'Reject an approval request' })
  @ApiResponse({ status: 200, description: 'Approval request rejected successfully' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized approver' })
  async reject(
    @Param('approvalId') approvalId: string,
    @Body() updateApprovalDto: UpdateApprovalDto,
    @Request() req: any,
  ) {
    return this.approvalsService.reject(approvalId, updateApprovalDto, req.user.id);
  }

  @Put('approvals/:approvalId/request-changes')
  @ApiOperation({ summary: 'Request changes for an approval request' })
  @ApiResponse({ status: 200, description: 'Changes requested successfully' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized approver' })
  async requestChanges(
    @Param('approvalId') approvalId: string,
    @Body() updateApprovalDto: UpdateApprovalDto,
    @Request() req: any,
  ) {
    return this.approvalsService.requestChanges(approvalId, updateApprovalDto, req.user.id);
  }

  @Get('agreements/:agreementId/summary')
  @ApiOperation({ summary: 'Get approval summary for an agreement' })
  @ApiResponse({ status: 200, description: 'Approval summary retrieved successfully' })
  async getApprovalSummary(@Param('agreementId') agreementId: string) {
    return this.approvalsService.getApprovalSummary(agreementId);
  }

  @Get('my-pending')
  @ApiOperation({ summary: 'Get pending approvals for the current user' })
  @ApiResponse({ status: 200, description: 'Pending approvals retrieved successfully' })
  async getMyPendingApprovals(@Request() req: any) {
    return this.approvalsService.getMyPendingApprovals(req.user.id);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get approval requests created by the current user' })
  @ApiResponse({ status: 200, description: 'Approval requests retrieved successfully' })
  async getMyApprovalRequests(@Request() req: any) {
    return this.approvalsService.getMyApprovalRequests(req.user.id);
  }

  @Post('gates/:gateId/notify')
  @ApiOperation({ summary: 'Send notification for approval gate' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @ApiResponse({ status: 404, description: 'Approval gate not found' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async sendNotification(
    @Param('gateId') gateId: string,
    @Body('message') message: string,
    @Request() req: any,
  ) {
    return this.approvalsService.sendNotification(gateId, message, req.user.id);
  }

  @Get('gates/:gateId/sla-status')
  @ApiOperation({ summary: 'Get SLA status for an approval gate' })
  @ApiResponse({ status: 200, description: 'SLA status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Approval gate not found' })
  async getSlaStatus(@Param('gateId') gateId: string) {
    return this.approvalsService.getSlaStatus(gateId);
  }
}
