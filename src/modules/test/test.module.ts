import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { SkillBucketModule } from '../skill-bucket/skill-bucket.module';

@Module({
  imports: [SkillBucketModule],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}
