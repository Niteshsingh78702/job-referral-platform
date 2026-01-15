import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [InterviewController],
    providers: [InterviewService],
    exports: [InterviewService],
})
export class InterviewModule { }
