import { Module } from '@nestjs/common';
import { MattersController } from './matters.controller';
import { MattersService } from './matters.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MattersController],
  providers: [MattersService],
  exports: [MattersService],
})
export class MattersModule {}
