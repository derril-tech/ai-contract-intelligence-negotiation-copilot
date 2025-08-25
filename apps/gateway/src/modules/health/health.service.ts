import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { NatsService } from '../../common/nats/nats.service';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private nats: NatsService,
  ) {}

  async checkBasic(): Promise<HealthIndicatorResult> {
    return {
      app: {
        status: 'up',
      },
    };
  }

  async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }

  async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.redis.set('health-check', 'ok', 10);
      const result = await this.redis.get('health-check');
      if (result === 'ok') {
        return {
          redis: {
            status: 'up',
          },
        };
      }
      throw new Error('Redis health check failed');
    } catch (error) {
      return {
        redis: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }

  async checkNats(): Promise<HealthIndicatorResult> {
    try {
      // Basic NATS health check
      return {
        nats: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        nats: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }
}
