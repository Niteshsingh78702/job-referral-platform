import { Module } from '@nestjs/common';
import { SkillBucketController } from './skill-bucket.controller';
import { SkillBucketService } from './skill-bucket.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SkillBucketController],
    providers: [SkillBucketService],
    exports: [SkillBucketService],
})
export class SkillBucketModule { }
