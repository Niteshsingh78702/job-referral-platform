import { Module } from '@nestjs/common';
import { TestTemplateController } from './test-template.controller';
import { TestTemplateService } from './test-template.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TestTemplateController],
  providers: [TestTemplateService],
  exports: [TestTemplateService],
})
export class TestTemplateModule {}
