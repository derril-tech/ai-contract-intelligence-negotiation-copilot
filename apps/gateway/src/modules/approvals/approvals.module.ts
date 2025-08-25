import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ApprovalsController } from './approvals.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ApprovalsController],
  providers: [],
  exports: [],
})
export class ApprovalsModule {}
