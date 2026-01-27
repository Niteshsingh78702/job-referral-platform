import { Module } from '@nestjs/common';
import { RapidFireController } from './rapid-fire.controller';
import { RapidFireTestService } from './rapid-fire.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { QuestionBankModule } from '../question-bank/question-bank.module';

@Module({
  imports: [PrismaModule, QuestionBankModule],
  controllers: [RapidFireController],
  providers: [RapidFireTestService],
  exports: [RapidFireTestService],
})
export class RapidFireModule {}
