"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ResumeParserService", {
    enumerable: true,
    get: function() {
        return ResumeParserService;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
let ResumeParserService = class ResumeParserService {
    async parseResume(file) {
        let text = '';
        try {
            // Parse PDF
            if (file.mimetype === 'application/pdf') {
                const data = await pdfParse(file.buffer);
                text = data.text;
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'application/msword') {
                const result = await mammoth.extractRawText({
                    buffer: file.buffer
                });
                text = result.value;
            } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/rtf' || file.mimetype === 'application/rtf' || file.mimetype === 'application/x-tex' || file.mimetype === 'text/x-tex' || file.originalname?.endsWith('.txt') || file.originalname?.endsWith('.tex') || file.originalname?.endsWith('.rtf')) {
                text = file.buffer.toString('utf-8');
                // If it's a .tex file, strip LaTeX commands to get plain text
                if (file.originalname?.endsWith('.tex') || file.mimetype?.includes('tex')) {
                    text = this.stripLatex(text);
                }
            } else {
                try {
                    text = file.buffer.toString('utf-8');
                    // Verify it's actually readable text (not binary garbage)
                    const printableRatio = text.replace(/[^\x20-\x7E\n\r\t]/g, '').length / text.length;
                    if (printableRatio < 0.7) {
                        text = ''; // Too much binary — not readable text
                    }
                } catch  {
                    text = '';
                }
            }
            // Clean up text
            text = this.cleanText(text);
            const skills = this.extractSkills(text);
            const experience = this.extractExperience(text);
            const education = this.extractEducation(text);
            return {
                text,
                JobSkill: skills,
                experience,
                education
            };
        } catch (error) {
            console.error('Error parsing resume:', error);
            return {
                text: '',
                JobSkill: [],
                experience: {
                    years: 0,
                    positions: []
                },
                education: []
            };
        }
    }
    // ── Clean extracted text ──
    cleanText(text) {
        return text.replace(/\r\n/g, '\n') // normalize line endings
        .replace(/\t/g, ' ') // tabs to spaces
        .replace(/ {3,}/g, '  ') // collapse excessive spaces
        .replace(/\n{4,}/g, '\n\n\n') // collapse excessive newlines
        .trim();
    }
    // ── Strip LaTeX commands for .tex files ──
    stripLatex(tex) {
        let text = tex;
        // Remove comments
        text = text.replace(/%.*$/gm, '');
        // Remove preamble (everything before \begin{document})
        const docStart = text.indexOf('\\begin{document}');
        if (docStart !== -1) {
            text = text.substring(docStart + '\\begin{document}'.length);
        }
        const docEnd = text.indexOf('\\end{document}');
        if (docEnd !== -1) {
            text = text.substring(0, docEnd);
        }
        // Convert common LaTeX to readable text
        text = text.replace(/\\textbf\{([^}]*)\}/g, '$1');
        text = text.replace(/\\textit\{([^}]*)\}/g, '$1');
        text = text.replace(/\\textsc\{([^}]*)\}/g, '$1');
        text = text.replace(/\\emph\{([^}]*)\}/g, '$1');
        text = text.replace(/\\Large\s*/g, '');
        text = text.replace(/\\large\s*/g, '');
        text = text.replace(/\\small\s*/g, '');
        text = text.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1');
        text = text.replace(/\\href\{([^}]*)\}/g, '$1');
        text = text.replace(/\\indent\s*/g, '');
        text = text.replace(/\\hfill\s*/g, '  ');
        text = text.replace(/\\resheading\{([^}]*)\}/g, '\n$1\n');
        text = text.replace(/\\resitem\{([^}]*)\}/g, '• $1');
        text = text.replace(/\\ressubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g, '$1 $2');
        text = text.replace(/\\item\s*/g, '• ');
        text = text.replace(/\\begin\{[^}]*\}/g, '');
        text = text.replace(/\\end\{[^}]*\}/g, '');
        text = text.replace(/\\vspace\{[^}]*\}/g, '');
        text = text.replace(/\\\\\[.*?\]/g, '\n');
        text = text.replace(/\\\\/g, '\n');
        text = text.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '');
        text = text.replace(/\\[a-zA-Z]+/g, '');
        text = text.replace(/[{}]/g, '');
        text = text.replace(/\$[^$]*\$/g, '');
        // Clean up
        text = text.replace(/\n{3,}/g, '\n\n');
        text = text.replace(/^ +/gm, '');
        return text.trim();
    }
    extractSkills(text) {
        const lowerText = text.toLowerCase();
        const foundSkills = new Set();
        this.skillKeywords.forEach((skill)=>{
            // Use word boundary matching for better accuracy
            const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(lowerText)) {
                // Capitalize properly
                const properName = skill.split(' ').map((w)=>w === 'api' || w === 'apis' ? w.toUpperCase() : w === 'ci/cd' ? 'CI/CD' : w === 'aws' || w === 'gcp' || w === 'jwt' || w === 'sql' || w === 'html' || w === 'css' || w === 'ai' ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                foundSkills.add(properName);
            }
        });
        return Array.from(foundSkills);
    }
    extractExperience(text) {
        const positions = [];
        let totalYears = 0;
        const titlePatterns = [
            /\b((?:senior|junior|lead|principal|staff|associate)?\s*(?:software|backend|frontend|full[\s-]?stack|devops|cloud|data|mobile|web|java|python|node\.?js?)?\s*(?:engineer|developer|programmer|architect|lead|manager|analyst|consultant|designer|specialist|coordinator|intern))\b/gi
        ];
        titlePatterns.forEach((pattern)=>{
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach((match)=>{
                    const clean = match.trim();
                    if (clean.length > 3 && !positions.some((p)=>p.toLowerCase() === clean.toLowerCase())) {
                        positions.push(clean);
                    }
                });
            }
        });
        const yearPatterns = [
            /(\d+)\+?\s*years?/gi,
            /(\d+)\s*-\s*(\d+)\s*years?/gi
        ];
        yearPatterns.forEach((pattern)=>{
            const matches = text.match(pattern);
            if (matches && matches[0]) {
                const numbers = matches[0].match(/\d+/g);
                if (numbers) {
                    totalYears = Math.max(totalYears, parseInt(numbers[0], 10));
                }
            }
        });
        return {
            years: totalYears,
            positions: positions.slice(0, 10)
        };
    }
    extractEducation(text) {
        const education = [];
        const degreePatterns = [
            /\b(B\.?Tech|B\.?E|Bachelor of Technology|Bachelor of Engineering)\b/gi,
            /\b(M\.?Tech|M\.?E|Master of Technology|Master of Engineering)\b/gi,
            /\b(MBA|Master of Business Administration)\b/gi,
            /\b(MCA|Master of Computer Applications)\b/gi,
            /\b(BCA|Bachelor of Computer Applications)\b/gi,
            /\b(B\.?Sc|Bachelor of Science|M\.?Sc|Master of Science)\b/gi,
            /\b(B\.?A|Bachelor of Arts|M\.?A|Master of Arts)\b/gi,
            /\b(B\.?Com|Bachelor of Commerce|M\.?Com|Master of Commerce)\b/gi,
            /\b(Ph\.?D|Doctorate)\b/gi,
            /\b(Diploma)\b/gi,
            /\b(Class\s*XII|12th|CBSE.*?12|ISC)\b/gi,
            /\b(Class\s*X[^I]|10th|CBSE.*?10|ICSE)\b/gi
        ];
        degreePatterns.forEach((pattern)=>{
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach((match)=>{
                    if (!education.some((e)=>e.toLowerCase() === match.toLowerCase())) {
                        education.push(match);
                    }
                });
            }
        });
        return education;
    }
    constructor(){
        this.skillKeywords = [
            'javascript',
            'typescript',
            'python',
            'java',
            'c++',
            'c#',
            'ruby',
            'php',
            'swift',
            'kotlin',
            'go',
            'rust',
            'scala',
            'perl',
            'react',
            'angular',
            'vue',
            'next.js',
            'nuxt',
            'node',
            'node.js',
            'express',
            'nestjs',
            'django',
            'flask',
            'spring',
            'spring boot',
            'mongodb',
            'postgresql',
            'mysql',
            'redis',
            'elasticsearch',
            'dynamodb',
            'cassandra',
            'aws',
            'azure',
            'gcp',
            'docker',
            'kubernetes',
            'jenkins',
            'terraform',
            'ansible',
            'git',
            'github',
            'gitlab',
            'bitbucket',
            'linux',
            'unix',
            'windows',
            'html',
            'css',
            'sass',
            'less',
            'tailwind',
            'bootstrap',
            'rest api',
            'rest apis',
            'graphql',
            'grpc',
            'microservices',
            'agile',
            'scrum',
            'kanban',
            'machine learning',
            'deep learning',
            'ai',
            'data science',
            'tensorflow',
            'pytorch',
            'scikit-learn',
            'pandas',
            'numpy',
            'kafka',
            'rabbitmq',
            'celery',
            'oauth2',
            'jwt',
            'oauth',
            'hibernate',
            'jpa',
            'mybatis',
            'junit',
            'mockito',
            'jest',
            'mocha',
            'pytest',
            'selenium',
            'swagger',
            'postman',
            'log4j',
            'log4j2',
            'slf4j',
            'maven',
            'gradle',
            'npm',
            'yarn',
            'pip',
            'sql',
            'nosql',
            'plsql',
            'ci/cd',
            'devops',
            'jira',
            'confluence',
            'android',
            'ios',
            'flutter',
            'react native',
            'figma',
            'adobe xd',
            'power bi',
            'tableau',
            'api documentation',
            'debugging',
            'exception handling',
            'mvc',
            'mvvm',
            'clean architecture'
        ];
    }
};
ResumeParserService = _ts_decorate([
    (0, _common.Injectable)()
], ResumeParserService);

//# sourceMappingURL=resume-parser.service.js.map