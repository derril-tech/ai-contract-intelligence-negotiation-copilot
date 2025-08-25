import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RiskController } from './risk.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RiskController],
  providers: [],
  exports: [],
})
export class RiskModule {}
