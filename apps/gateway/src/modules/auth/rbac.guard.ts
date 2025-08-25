# Created automatically by Cursor AI (2024-12-19)

import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { structlog } from 'structlog';

const logger = structlog.get_logger(__name__);

export interface RBACMetadata {
  roles: string[];
  permissions: string[];
  orgRequired: boolean;
  matterRequired: boolean;
  audit: boolean;
}

export const RBAC = (metadata: RBACMetadata) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rbac', metadata, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const rbacMetadata = this.reflector.get<RBACMetadata>('rbac', handler);

    if (!rbacMetadata) {
      return true; // No RBAC requirements
    }

    try {
      // Get user from request (set by auth middleware)
      const user = request.user as any;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      // Rate limiting check
      await this.checkRateLimit(request, user);

      // Get user's roles and permissions
      const userRoles = await this.getUserRoles(user.id, user.orgId);
      const userPermissions = await this.getUserPermissions(user.id, user.orgId);

      // Check role requirements
      if (rbacMetadata.roles.length > 0) {
        const hasRequiredRole = rbacMetadata.roles.some(role => 
          userRoles.includes(role)
        );
        if (!hasRequiredRole) {
          throw new ForbiddenException(`Required roles: ${rbacMetadata.roles.join(', ')}`);
        }
      }

      // Check permission requirements
      if (rbacMetadata.permissions.length > 0) {
        const hasRequiredPermission = rbacMetadata.permissions.some(permission => 
          userPermissions.includes(permission)
        );
        if (!hasRequiredPermission) {
          throw new ForbiddenException(`Required permissions: ${rbacMetadata.permissions.join(', ')}`);
        }
      }

      // Organization-level access control
      if (rbacMetadata.orgRequired) {
        await this.validateOrgAccess(request, user);
      }

      // Matter-level access control
      if (rbacMetadata.matterRequired) {
        await this.validateMatterAccess(request, user);
      }

      // Audit logging
      if (rbacMetadata.audit) {
        await this.logAccess(request, user, rbacMetadata);
      }

      return true;

    } catch (error) {
      logger.error('RBAC check failed', {
        error: error.message,
        userId: request.user?.id,
        path: request.path,
        method: request.method,
        ip: request.ip,
        userAgent: request.get('User-Agent')
      });

      throw error;
    }
  }

  private async checkRateLimit(request: Request, user: any): Promise<void> {
    const key = `rate_limit:${user.id}:${request.path}`;
    const limit = await this.redis.get(key);
    
    if (limit && parseInt(limit) > 100) { // 100 requests per minute
      throw new ForbiddenException('Rate limit exceeded');
    }

    await this.redis.incr(key);
    await this.redis.expire(key, 60); // 1 minute window
  }

  private async getUserRoles(userId: string, orgId: string): Promise<string[]> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        orgId,
        status: 'active'
      },
      include: {
        role: true
      }
    });

    if (!membership) {
      return [];
    }

    return [membership.role.name];
  }

  private async getUserPermissions(userId: string, orgId: string): Promise<string[]> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        orgId,
        status: 'active'
      },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!membership) {
      return [];
    }

    return membership.role.permissions.map(p => p.name);
  }

  private async validateOrgAccess(request: Request, user: any): Promise<void> {
    const orgId = request.params.orgId || request.body.orgId || request.query.orgId;
    
    if (!orgId) {
      throw new ForbiddenException('Organization ID required');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.id,
        orgId,
        status: 'active'
      }
    });

    if (!membership) {
      throw new ForbiddenException('Access denied to organization');
    }
  }

  private async validateMatterAccess(request: Request, user: any): Promise<void> {
    const matterId = request.params.matterId || request.body.matterId || request.query.matterId;
    
    if (!matterId) {
      throw new ForbiddenException('Matter ID required');
    }

    const matter = await this.prisma.matter.findFirst({
      where: {
        id: matterId,
        orgId: user.orgId
      },
      include: {
        members: {
          where: {
            userId: user.id,
            status: 'active'
          }
        }
      }
    });

    if (!matter || matter.members.length === 0) {
      throw new ForbiddenException('Access denied to matter');
    }
  }

  private async logAccess(request: Request, user: any, metadata: RBACMetadata): Promise<void> {
    const auditLog = {
      userId: user.id,
      orgId: user.orgId,
      action: `${request.method} ${request.path}`,
      resource: request.params.id || request.body.id,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      timestamp: new Date(),
      metadata: {
        roles: metadata.roles,
        permissions: metadata.permissions,
        success: true
      }
    };

    // Store in database
    await this.prisma.auditLog.create({
      data: {
        userId: auditLog.userId,
        orgId: auditLog.orgId,
        action: auditLog.action,
        resource: auditLog.resource,
        ip: auditLog.ip,
        userAgent: auditLog.userAgent,
        metadata: auditLog.metadata
      }
    });

    // Log to structured logger
    logger.info('Access granted', auditLog);
  }
}
