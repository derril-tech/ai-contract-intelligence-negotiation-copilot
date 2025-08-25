import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedlineController } from './redline.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RedlineController],
  providers: [],
  exports: [],
})
export class RedlineModule {}
