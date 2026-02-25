import { Module } from '@nestjs/common';
import { AtsResumeController } from './ats-resume.controller';
import { AtsResumeService } from './ats-resume.service';
import { ResumeParserModule } from '../resume-parser/resume-parser.module';

@Module({
    imports: [ResumeParserModule],
    controllers: [AtsResumeController],
    providers: [AtsResumeService],
    exports: [AtsResumeService],
})
export class AtsResumeModule { }
