import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LibraryController } from './library.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LibraryController],
  providers: [],
  exports: [],
})
export class LibraryModule {}
