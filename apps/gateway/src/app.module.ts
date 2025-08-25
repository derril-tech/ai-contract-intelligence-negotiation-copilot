import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from './modules/auth/auth.module';
import { MattersModule } from './modules/matters/matters.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { LibraryModule } from './modules/library/library.module';
import { RedlineModule } from './modules/redline/redline.module';
import { RiskModule } from './modules/risk/risk.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { EmailModule } from './modules/email/email.module';
import { SignatureModule } from './modules/signature/signature.module';
import { ObligationsModule } from './modules/obligations/obligations.module';
import { ExportsModule } from './modules/exports/exports.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { NatsModule } from './common/nats/nats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TerminusModule,
    PrismaModule,
    RedisModule,
    NatsModule,
    AuthModule,
    MattersModule,
    AgreementsModule,
    LibraryModule,
    RedlineModule,
    RiskModule,
    CommentsModule,
    ApprovalsModule,
    EmailModule,
    SignatureModule,
    ObligationsModule,
    ExportsModule,
    HealthModule,
  ],
})
export class AppModule {}
