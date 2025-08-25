import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ExportsController } from './exports.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ExportsController],
  providers: [],
  exports: [],
})
export class ExportsModule {}
