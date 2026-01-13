"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeParserService = void 0;
const common_1 = require("@nestjs/common");
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
let ResumeParserService = class ResumeParserService {
    skillKeywords = [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
        'react', 'angular', 'vue', 'node', 'express', 'nestjs', 'django', 'flask', 'spring',
        'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'linux',
        'html', 'css', 'sass', 'tailwind', 'bootstrap',
        'rest api', 'graphql', 'microservices', 'agile', 'scrum',
        'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
    ];
    async parseResume(file) {
        let text = '';
        try {
            if (file.mimetype === 'application/pdf') {
                const data = await pdfParse(file.buffer);
                text = data.text;
            }
            else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.mimetype === 'application/msword') {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                text = result.value;
            }
            const skills = this.extractSkills(text);
            const experience = this.extractExperience(text);
            const education = this.extractEducation(text);
            return { text, skills, experience, education };
        }
        catch (error) {
            console.error('Error parsing resume:', error);
            return { text: '', skills: [], experience: { years: 0, positions: [] }, education: [] };
        }
    }
    extractSkills(text) {
        const lowerText = text.toLowerCase();
        const foundSkills = new Set();
        this.skillKeywords.forEach(skill => {
            if (lowerText.includes(skill.toLowerCase())) {
                foundSkills.add(skill);
            }
        });
        return Array.from(foundSkills);
    }
    extractExperience(text) {
        const positions = [];
        let totalYears = 0;
        const titlePatterns = [
            /\b(software engineer|developer|programmer|architect|lead|manager|analyst|consultant)\b/gi,
        ];
        titlePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (!positions.includes(match)) {
                        positions.push(match);
                    }
                });
            }
        });
        const yearPatterns = [
            /(\d+)\+?\s*years?/gi,
            /(\d+)\s*-\s*(\d+)\s*years?/gi,
        ];
        yearPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches && matches[0]) {
                const numbers = matches[0].match(/\d+/g);
                if (numbers) {
                    totalYears = Math.max(totalYears, parseInt(numbers[0], 10));
                }
            }
        });
        return { years: totalYears, positions: positions.slice(0, 5) };
    }
    extractEducation(text) {
        const education = [];
        const degreePatterns = [
            /\b(B\.?Tech|B\.?E|Bachelor of Technology|Bachelor of Engineering)\b/gi,
            /\b(M\.?Tech|M\.?E|Master of Technology|Master of Engineering)\b/gi,
            /\b(MBA|Master of Business Administration)\b/gi,
            /\b(MCA|Master of Computer Applications)\b/gi,
            /\b(B\.?Sc|Bachelor of Science|M\.?Sc|Master of Science)\b/gi,
            /\b(Ph\.?D|Doctorate)\b/gi,
        ];
        degreePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (!education.includes(match)) {
                        education.push(match);
                    }
                });
            }
        });
        return education;
    }
};
exports.ResumeParserService = ResumeParserService;
exports.ResumeParserService = ResumeParserService = __decorate([
    (0, common_1.Injectable)()
], ResumeParserService);
//# sourceMappingURL=resume-parser.service.js.map