import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ResumeParserModule } from '../resume-parser/resume-parser.module';

@Module({
    imports: [CloudinaryModule, ResumeParserModule],
    controllers: [CandidateController],
    providers: [CandidateService],
    exports: [CandidateService],
})
export class CandidateModule { }
