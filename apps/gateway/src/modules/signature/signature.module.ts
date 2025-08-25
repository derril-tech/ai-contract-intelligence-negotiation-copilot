import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SignatureController } from './signature.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SignatureController],
  providers: [],
  exports: [],
})
export class SignatureModule {}
