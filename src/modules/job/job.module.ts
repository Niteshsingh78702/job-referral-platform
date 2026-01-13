import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { SkillBucketModule } from '../skill-bucket/skill-bucket.module';

@Module({
    imports: [SkillBucketModule],
    controllers: [JobController],
    providers: [JobService],
    exports: [JobService],
})
export class JobModule { }
