import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ObligationsController } from './obligations.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ObligationsController],
  providers: [],
  exports: [],
})
export class ObligationsModule {}
