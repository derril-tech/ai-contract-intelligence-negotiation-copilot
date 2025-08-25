import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AgreementsController } from './agreements.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AgreementsController],
  providers: [],
  exports: [],
})
export class AgreementsModule {}
