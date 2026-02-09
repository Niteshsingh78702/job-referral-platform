import { Injectable } from '@nestjs/common';

const pdfParse = require('pdf-parse');

const mammoth = require('mammoth');

export interface ParsedResumeData {
  text: string;
  JobSkill: string[];
  experience: {
    years: number;
    positions: string[];
  };
  education: string[];
}

@Injectable()
export class ResumeParserService {
  private readonly skillKeywords = [
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
    'react',
    'angular',
    'vue',
    'node',
    'express',
    'nestjs',
    'django',
    'flask',
    'spring',
    'mongodb',
    'postgresql',
    'mysql',
    'redis',
    'elasticsearch',
    'aws',
    'azure',
    'gcp',
    'docker',
    'kubernetes',
    'jenkins',
    'git',
    'linux',
    'html',
    'css',
    'sass',
    'tailwind',
    'bootstrap',
    'rest api',
    'graphql',
    'microservices',
    'agile',
    'scrum',
    'machine learning',
    'ai',
    'data science',
    'tensorflow',
    'pytorch',
  ];

  async parseResume(file: Express.Multer.File): Promise<ParsedResumeData> {
    let text = '';

    try {
      // Parse PDF
      if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        text = data.text;
      }
      // Parse DOC/DOCX
      else if (
        file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      }

      const skills = this.extractSkills(text);
      const experience = this.extractExperience(text);
      const education = this.extractEducation(text);

      return { text, JobSkill: skills, experience, education };
    } catch (error) {
      console.error('Error parsing resume:', error);
      return {
        text: '',
        JobSkill: [],
        experience: { years: 0, positions: [] },
        education: [],
      };
    }
  }

  private extractSkills(text: string): string[] {
    const lowerText = text.toLowerCase();
    const foundSkills = new Set<string>();

    this.skillKeywords.forEach((skill) => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.add(skill);
      }
    });

    return Array.from(foundSkills);
  }

  private extractExperience(text: string): {
    years: number;
    positions: string[];
  } {
    const positions: string[] = [];
    let totalYears = 0;

    // Look for job titles (common patterns)
    const titlePatterns = [
      /\b(software engineer|developer|programmer|architect|lead|manager|analyst|consultant)\b/gi,
    ];

    titlePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          if (!positions.includes(match)) {
            positions.push(match);
          }
        });
      }
    });

    // Extract years of experience (e.g., "5 years", "3+ years", "2-4 years")
    const yearPatterns = [
      /(\d+)\+?\s*years?/gi,
      /(\d+)\s*-\s*(\d+)\s*years?/gi,
    ];

    yearPatterns.forEach((pattern) => {
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

  private extractEducation(text: string): string[] {
    const education: string[] = [];

    const degreePatterns = [
      /\b(B\.?Tech|B\.?E|Bachelor of Technology|Bachelor of Engineering)\b/gi,
      /\b(M\.?Tech|M\.?E|Master of Technology|Master of Engineering)\b/gi,
      /\b(MBA|Master of Business Administration)\b/gi,
      /\b(MCA|Master of Computer Applications)\b/gi,
      /\b(B\.?Sc|Bachelor of Science|M\.?Sc|Master of Science)\b/gi,
      /\b(Ph\.?D|Doctorate)\b/gi,
    ];

    degreePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          if (!education.includes(match)) {
            education.push(match);
          }
        });
      }
    });

    return education;
  }
}
