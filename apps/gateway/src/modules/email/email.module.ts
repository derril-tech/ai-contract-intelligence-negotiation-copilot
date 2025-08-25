import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EmailController } from './email.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EmailController],
  providers: [],
  exports: [],
})
export class EmailModule {}
