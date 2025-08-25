import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CommentsController } from './comments.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [],
  exports: [],
})
export class CommentsModule {}
