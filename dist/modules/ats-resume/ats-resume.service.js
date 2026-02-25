"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AtsResumeService", {
    enumerable: true,
    get: function() {
        return AtsResumeService;
    }
});
const _common = require("@nestjs/common");
const _resumeparserservice = require("../resume-parser/resume-parser.service");
const _fs = /*#__PURE__*/ _interop_require_wildcard(require("fs"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _child_process = require("child_process");
const _util = require("util");
const _uuid = require("uuid");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const execAsync = (0, _util.promisify)(_child_process.exec);
let AtsResumeService = class AtsResumeService {
    // ─────────────────────────────────────────────
    // Upload, parse, and IMPROVE
    // ─────────────────────────────────────────────
    async uploadAndParse(file) {
        const rawParsed = await this.resumeParser.parseResume(file);
        this.logger.log(`Parsed text length: ${rawParsed.text.length}`);
        this.logger.log(`Raw skills found: ${rawParsed.JobSkill.length}`);
        this.logger.log(`Raw positions: ${rawParsed.experience.positions.length}`);
        // DEBUG: dump raw text to see what PDF produced
        const debugPath = _path.join(process.cwd(), 'tmp', 'debug_raw_text.txt');
        if (!_fs.existsSync(_path.join(process.cwd(), 'tmp'))) _fs.mkdirSync(_path.join(process.cwd(), 'tmp'), {
            recursive: true
        });
        _fs.writeFileSync(debugPath, rawParsed.text, 'utf-8');
        this.logger.log(`DEBUG raw text saved to: ${debugPath}`);
        this.logger.log(`FIRST 500 CHARS:\n${rawParsed.text.substring(0, 500)}`);
        // Smart section-based extraction
        const parsedData = this.buildStructuredJson(rawParsed);
        // Improve content for ATS
        const improvedData = this.improveResumeContent(parsedData);
        // Score
        const { score, suggestions } = this.calculateAtsScore(improvedData);
        return {
            parsedData: improvedData,
            atsScore: score,
            suggestions
        };
    }
    scoreResume(data) {
        const { score, suggestions } = this.calculateAtsScore(data);
        return {
            atsScore: score,
            suggestions
        };
    }
    async generatePdfFromData(data) {
        try {
            return await this.generateLatexPdf(data);
        } catch (err) {
            this.logger.warn('LaTeX failed, using HTML fallback: ' + err.message);
            return await this.generateHtmlPdf(data);
        }
    }
    // ═══════════════════════════════════════════════
    // ROBUST SECTION-BASED PARSING
    // ═══════════════════════════════════════════════
    buildStructuredJson(rawParsed) {
        const text = rawParsed.text || '';
        const lines = text.split('\n').map((l)=>l.trim()).filter(Boolean);
        this.logger.log(`Total lines: ${lines.length}`);
        // ── Contact info from top ──
        const headerBlock = lines.slice(0, Math.min(10, lines.length)).join('\n');
        const name = this.extractName(lines);
        const email = this.extractEmail(text);
        const phone = this.extractPhone(text);
        const linkedin = this.extractLinkedin(text);
        const location = this.extractLocation(headerBlock);
        this.logger.log(`Extracted: name="${name}", email="${email}", phone="${phone}"`);
        // ── Split into sections ──
        const sections = this.splitIntoSections(lines);
        this.logger.log(`Sections found: ${Object.keys(sections).join(', ')}`);
        // ── Extract from each section ──
        const summary = this.extractSummary(sections);
        const skills = this.extractSkillsFromSections(sections, rawParsed.JobSkill || [], text);
        const experience = this.extractExperienceFromSection(sections);
        const projects = this.extractProjectsFromSection(sections);
        const education = this.extractEducationFromSection(sections);
        const certifications = this.extractCertificationsFromSection(sections);
        // Merge projects into experience
        const allExperience = [
            ...experience,
            ...projects
        ];
        this.logger.log(`Skills: ${skills.length}, Exp: ${experience.length}, Projects: ${projects.length}, Edu: ${education.length}, Certs: ${certifications.length}`);
        return {
            name,
            email,
            phone,
            location,
            linkedin,
            summary,
            skills,
            experience: allExperience,
            education,
            certifications
        };
    }
    // ── Section splitter — handles messy PDF text ──
    splitIntoSections(lines) {
        const sectionPatterns = [
            {
                name: 'summary',
                pattern: /^(?:professional\s*)?summary|^objective|^profile|^about\s*me|^career\s*(?:summary|objective)|^personal\s*statement|^overview/i
            },
            {
                name: 'skills',
                pattern: /^(?:key\s*|technical\s*|core\s*)?skills|^core\s*competencies|^technologies|^areas?\s*of\s*expertise|^strengths|^proficiencies|^capabilities|^tools\s*(?:\&|and)\s*technologies/i
            },
            {
                name: 'experience',
                pattern: /^(?:professional\s*|work\s*)?experience|^employment|^work\s*history|^career\s*history|^positions?\s*held|^responsibilities|^internships?/i
            },
            {
                name: 'education',
                pattern: /^education|^academic|^qualification|^scholastic|^educational\s*qualifications?|^academics/i
            },
            {
                name: 'certifications',
                pattern: /^certification|^certificate|^licenses?|^professional\s*development|^courses?|^training|^achievements?|^awards?|^honors?|^accomplishments?/i
            },
            {
                name: 'projects',
                pattern: /^(?:key\s*|personal\s*|academic\s*)?projects?|^portfolio/i
            }
        ];
        const sectionBoundaries = [];
        for(let i = 0; i < lines.length; i++){
            const line = lines[i].replace(/[^a-zA-Z\s]/g, '').trim();
            if (line.length < 2 || line.length > 50) continue;
            for (const { name, pattern } of sectionPatterns){
                if (pattern.test(line)) {
                    // Don't add duplicates
                    if (!sectionBoundaries.some((b)=>b.name === name)) {
                        sectionBoundaries.push({
                            name,
                            lineIdx: i
                        });
                    }
                    break;
                }
            }
        }
        // Sort by position
        sectionBoundaries.sort((a, b)=>a.lineIdx - b.lineIdx);
        const sections = {};
        for(let i = 0; i < sectionBoundaries.length; i++){
            const start = sectionBoundaries[i].lineIdx + 1;
            const end = i + 1 < sectionBoundaries.length ? sectionBoundaries[i + 1].lineIdx : lines.length;
            sections[sectionBoundaries[i].name] = lines.slice(start, end);
        }
        // If no sections detected, try to parse everything as one block
        if (sectionBoundaries.length === 0) {
            this.logger.warn('No sections detected — parsing full text');
            sections['_full'] = lines;
        }
        return sections;
    }
    // ── Name extraction ──
    extractName(lines) {
        for (const line of lines.slice(0, 5)){
            // Skip lines with emails, phones, URLs
            if (/@/.test(line) || /\d{5,}/.test(line) || /linkedin|http|www\./i.test(line)) continue;
            if (/^(email|phone|mobile|address|linkedin|location)/i.test(line)) continue;
            // Name: alphabetic, 3-50 chars, first prominent line
            const cleaned = line.replace(/[|•·,\-–—]/g, '').trim();
            if (cleaned.length >= 2 && cleaned.length <= 50 && /^[A-Za-z]/.test(cleaned) && /\s/.test(cleaned)) {
                return cleaned;
            }
        }
        // Fallback — first line
        return lines[0]?.replace(/[|•·,]/g, '').trim() || '';
    }
    extractEmail(text) {
        const match = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
        return match ? match[0] : '';
    }
    extractPhone(text) {
        const match = text.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3,5}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
        return match ? match[0].trim() : '';
    }
    extractLinkedin(text) {
        const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
        return match ? match[0].startsWith('http') ? match[0] : `https://www.${match[0]}` : '';
    }
    extractLocation(text) {
        const cities = /\b(Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Chennai|Pune|Kolkata|Ahmedabad|Jaipur|Lucknow|Noida|Gurgaon|Gurugram|Dehradun|Chandigarh|Indore|Bhopal|Kochi|Coimbatore|Nagpur|Patna|Ranchi|Bhubaneswar|Visakhapatnam|Thiruvananthapuram)\b/i;
        const match = text.match(cities);
        return match ? match[0] : '';
    }
    // ── Summary ──
    extractSummary(sections) {
        const lines = sections.summary || [];
        if (lines.length === 0) return '';
        return lines.map((l)=>l.replace(/^[•·\-–—▪●■]\s*/, '').trim()).filter((l)=>l.length > 10).join(' ').substring(0, 1500);
    }
    // ── Skills from sections + raw parser ──
    extractSkillsFromSections(sections, rawSkills, fullText) {
        const skills = new Set();
        // Add raw parser skills
        rawSkills.forEach((s)=>skills.add(s));
        // Parse skills section
        const skillLines = sections.skills || [];
        for (const line of skillLines){
            // Handle "Category: skill1, skill2, skill3" or "Category – skill1, skill2"
            const colonSplit = line.split(/[:–—]/);
            const skillPart = colonSplit.length > 1 ? colonSplit.slice(1).join(' ') : line;
            // Split by common delimiters
            const items = skillPart.split(/[,;•·|▪●■\/]/);
            for (const item of items){
                const clean = item.replace(/^[\s\-–—•·]+/, '').trim();
                if (clean.length >= 2 && clean.length <= 45 && !/^\d+$/.test(clean) && !/^(and|or|the|in|of|for|to|a)$/i.test(clean)) {
                    skills.add(clean);
                }
            }
        }
        // If still empty, try full text extraction
        if (skills.size === 0) {
            const extracted = this.extractSkillsFromFullText(fullText);
            extracted.forEach((s)=>skills.add(s));
        }
        return Array.from(skills);
    }
    extractSkillsFromFullText(text) {
        const common = [
            'JavaScript',
            'TypeScript',
            'Python',
            'Java',
            'C++',
            'C#',
            'Ruby',
            'PHP',
            'React',
            'Angular',
            'Vue',
            'Node.js',
            'Express',
            'NestJS',
            'Django',
            'Flask',
            'Spring Boot',
            'Spring',
            'MongoDB',
            'PostgreSQL',
            'MySQL',
            'Redis',
            'Kafka',
            'AWS',
            'Azure',
            'GCP',
            'Docker',
            'Kubernetes',
            'Jenkins',
            'Git',
            'GitHub',
            'HTML',
            'CSS',
            'REST API',
            'REST APIs',
            'GraphQL',
            'Microservices',
            'Agile',
            'Hibernate',
            'JPA',
            'Swagger',
            'Postman',
            'Linux',
            'OAuth2',
            'JWT',
            'SQL',
            'JUnit',
            'Mockito',
            'Maven',
            'Gradle',
            'Log4j2',
            'CI/CD',
            'Scrum',
            'Terraform',
            'Ansible',
            'RabbitMQ',
            'Elasticsearch'
        ];
        const lower = text.toLowerCase();
        return common.filter((s)=>lower.includes(s.toLowerCase()));
    }
    // ── Experience — UNIVERSAL multi-pattern parser ──
    extractExperienceFromSection(sections) {
        const expLines = sections.experience || sections._full || [];
        if (expLines.length === 0) return [];
        this.logger.log(`Experience lines (${expLines.length}): ${JSON.stringify(expLines.slice(0, 5))}`);
        const experiences = [];
        let current = null;
        // Flexible date pattern (handles merged text like "CompanyOct 2023 – Oct 2025")
        const datePattern = /((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}|\d{4})\s*(?:[-–—]+|to)\s*((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}|\d{4}|Present|Current|Till\s*Date|Ongoing|Now)/i;
        const titleKeywords = /\b(developer|engineer|intern|manager|lead|architect|analyst|consultant|designer|specialist|coordinator|associate|senior|junior|principal|staff|administrator|trainee|director|head|officer|executive|programmer|scientist|researcher|professor|lecturer|teacher|fellow)\b/i;
        const isBulletLine = (l)=>/^[•·▪●■]\s?/.test(l) || /^[-–—]\s*[A-Z]/.test(l) || /^\d+[.\\)]\s/.test(l);
        const actionVerb = /^(Developed|Designed|Implemented|Built|Created|Led|Managed|Coordinated|Delivered|Achieved|Improved|Optimized|Enhanced|Increased|Reduced|Integrated|Configured|Deployed|Maintained|Migrated|Participated|Used|Worked|Performed|Conducted|Collaborated|Contributed|Spearheaded|Architected|Streamlined|Engineered|Automated|Established|Initiated|Introduced|Launched|Mentored|Modernized|Negotiated|Organized|Pioneered|Planned|Presented|Published|Refactored|Resolved|Revamped|Supervised|Tested|Trained|Transformed|Troubleshot|Upgraded|Authored|Analyzed|Assessed|Administered)/i;
        for(let i = 0; i < expLines.length; i++){
            const line = expLines[i].trim();
            if (!line || line.length < 3) continue;
            const hasDate = datePattern.test(line);
            const hasTitle = titleKeywords.test(line);
            const isBullet = isBulletLine(line);
            if (isBullet) {
                // ── Bullet point ──
                if (current) {
                    const bullet = line.replace(/^[•·\-–—▪●■]+\s*/, '').trim();
                    if (bullet.length > 5) current.bullets.push(bullet);
                }
                continue;
            }
            // ── PATTERN A: Line has date + title → "Role — Company  Mar 2024 – June 2025" ──
            if (hasDate && hasTitle && line.length < 200) {
                if (current) experiences.push(current);
                const dateMatch = line.match(datePattern);
                const startDate = dateMatch ? dateMatch[1] : '';
                const endDate = dateMatch ? dateMatch[2] : '';
                const withoutDate = line.replace(datePattern, '').replace(/[\s,;–—|-]+$/, '').trim();
                let role = '', company = '';
                // Try splitting by common separators: —, –, |, @, " at "
                const splitMatch = withoutDate.split(/\s*(?:[—–|]|,\s+|\s+at\s+|\s+@\s+)\s*/);
                if (splitMatch.length >= 2) {
                    // Determine which part is role vs company
                    if (titleKeywords.test(splitMatch[0])) {
                        role = splitMatch[0].trim();
                        company = splitMatch.slice(1).join(' ').trim();
                    } else {
                        company = splitMatch[0].trim();
                        role = splitMatch.slice(1).join(' ').trim();
                    }
                } else {
                    role = withoutDate;
                }
                current = {
                    role,
                    company,
                    startDate,
                    endDate,
                    project: '',
                    projectDescription: '',
                    bullets: []
                };
                this.logger.log(`EXP(A): role="${role}", company="${company}", dates="${startDate} – ${endDate}"`);
                continue;
            }
            // ── PATTERN B: Line has date, no title → "Company NameOct 2023 – Oct 2025" ──
            if (hasDate && !hasTitle) {
                if (current) experiences.push(current);
                const dateMatch = line.match(datePattern);
                const startDate = dateMatch ? dateMatch[1] : '';
                const endDate = dateMatch ? dateMatch[2] : '';
                const company = line.replace(datePattern, '').replace(/[\s,;–—|-]+$/, '').trim();
                // Peek at next line for role
                let role = '';
                if (i + 1 < expLines.length) {
                    const next = expLines[i + 1].trim();
                    if (titleKeywords.test(next) && !isBulletLine(next) && next.length < 80) {
                        i++;
                        role = next;
                    }
                }
                current = {
                    role,
                    company,
                    startDate,
                    endDate,
                    project: '',
                    projectDescription: '',
                    bullets: []
                };
                this.logger.log(`EXP(B): company="${company}", role="${role}", dates="${startDate} – ${endDate}"`);
                continue;
            }
            // ── PATTERN C: Line has title, no date → standalone role line ──
            if (hasTitle && !hasDate && line.length < 100) {
                // Peek at next line — if it has a date, that's "Role on L1, Company+Date on L2"
                if (i + 1 < expLines.length && datePattern.test(expLines[i + 1]) && !isBulletLine(expLines[i + 1])) {
                    if (current) experiences.push(current);
                    const role = line;
                    i++;
                    const nextLine = expLines[i].trim();
                    const dateMatch = nextLine.match(datePattern);
                    const startDate = dateMatch ? dateMatch[1] : '';
                    const endDate = dateMatch ? dateMatch[2] : '';
                    const company = nextLine.replace(datePattern, '').replace(/[\s,;–—|-]+$/, '').trim();
                    current = {
                        role,
                        company,
                        startDate,
                        endDate,
                        project: '',
                        projectDescription: '',
                        bullets: []
                    };
                    this.logger.log(`EXP(C): role="${role}", company="${company}", dates="${startDate} – ${endDate}"`);
                } else if (current && !current.role) {
                    current.role = line;
                }
                continue;
            }
            // ── PATTERN D: Sub-project line (capitalized, no date, followed by a role) ──
            if (current && !hasDate && line.length > 5 && line.length < 120 && /^[A-Z]/.test(line) && !hasTitle && i + 1 < expLines.length && titleKeywords.test(expLines[i + 1]) && !isBulletLine(expLines[i + 1])) {
                if (current.bullets.length > 0 || current.role) experiences.push(current);
                const parentCompany = current.company || '';
                i++;
                const subRole = expLines[i].trim();
                current = {
                    role: subRole,
                    company: parentCompany,
                    startDate: '',
                    endDate: '',
                    project: line,
                    projectDescription: '',
                    bullets: []
                };
                this.logger.log(`EXP(D-sub): project="${line}", role="${subRole}"`);
                continue;
            }
            // ── Continuation / action-verb line ──
            if (current && line.length > 15) {
                if (actionVerb.test(line)) {
                    current.bullets.push(line);
                } else if (current.bullets.length > 0) {
                    current.bullets[current.bullets.length - 1] += ' ' + line;
                }
            }
        }
        if (current) experiences.push(current);
        this.logger.log(`Total experience entries: ${experiences.length}`);
        return experiences;
    }
    // ── Projects (converted to experience entries) ──
    extractProjectsFromSection(sections) {
        const projLines = sections.projects || [];
        if (projLines.length === 0) return [];
        this.logger.log(`Projects lines (${projLines.length}): ${JSON.stringify(projLines.slice(0, 5))}`);
        const projects = [];
        let current = null;
        for(let i = 0; i < projLines.length; i++){
            const line = projLines[i].trim();
            if (!line || line.length < 3) continue;
            const isBullet = /^[•·▪●■]\s?/.test(line) || /^[-–—]\s*[A-Z]/.test(line);
            // Project header: "ProjectName — tech1, tech2, tech3"
            if (!isBullet && /^[A-Z]/.test(line) && line.length < 200) {
                if (current) projects.push(current);
                // Split by — or – to get project name and tech stack
                const parts = line.split(/\s*[—–]\s*/);
                const projectName = parts[0]?.trim() || line;
                const techStack = parts.length > 1 ? parts.slice(1).join(', ').trim() : '';
                current = {
                    role: '',
                    company: '',
                    startDate: '',
                    endDate: '',
                    project: projectName,
                    projectDescription: techStack,
                    bullets: []
                };
                this.logger.log(`PROJECT: name="${projectName}", tech="${techStack}"`);
            } else if (current && isBullet) {
                const bullet = line.replace(/^[•·\-–—▪●■]+\s*/, '').trim();
                if (bullet.length > 5) {
                    current.bullets.push(bullet);
                }
            } else if (current && line.length > 15) {
                if (current.bullets.length > 0) {
                    current.bullets[current.bullets.length - 1] += ' ' + line;
                }
            }
        }
        if (current) projects.push(current);
        this.logger.log(`Total projects: ${projects.length}`);
        return projects;
    }
    // ── Education — UNIVERSAL multi-pattern parser ──
    extractEducationFromSection(sections) {
        const eduLines = sections.education || [];
        if (eduLines.length === 0) return [];
        this.logger.log(`Education lines (${eduLines.length}): ${JSON.stringify(eduLines)}`);
        const education = [];
        const degreePattern = /\b(B\.?Tech|B\.?E|M\.?Tech|M\.?E|MBA|MCA|BCA|B\.?Sc|M\.?Sc|B\.?A|M\.?A|B\.?Com|M\.?Com|Ph\.?D|Diploma|Bachelor|Master|Intermediate|Matriculation|Class\s*X[II]*|10th|12th|HSC|SSC|CBSE|ICSE)\b/i;
        // Relaxed date pattern: handles both "2020 – 2024" and glued "Jehanabad2017"
        const dateRangePattern = /(\d{4})\s*(?:[-–—]+)\s*(\d{4}|\w+)/;
        const singleYearPattern = /(\d{4})/;
        const gradePattern = /(\d+\.?\d*)\s*(?:\/\s*10|\/\s*100|%|CGPA|GPA|cgpa|gpa)/i;
        let i = 0;
        while(i < eduLines.length){
            const line = eduLines[i].replace(/^[•·\-–—▪●■]+\s*/, '').trim();
            if (!line || line.length < 3) {
                i++;
                continue;
            }
            const hasDegree = degreePattern.test(line);
            const hasDateRange = dateRangePattern.test(line);
            const hasSingleYear = singleYearPattern.test(line);
            const hasAnyDate = hasDateRange || hasSingleYear;
            // Pattern 1: Institution + date (e.g. "G.L. Bajaj...2020 – 2024" or "P.P.M School, Jehanabad2017")
            if (hasAnyDate && !hasDegree) {
                let year = '';
                if (hasDateRange) {
                    const m = line.match(dateRangePattern);
                    year = m ? m[0] : '';
                } else {
                    const m = line.match(singleYearPattern);
                    year = m ? m[0] : '';
                }
                // Remove year(s) to get institution name, also clean up glued text
                const institution = line.replace(dateRangePattern, '').replace(singleYearPattern, '').replace(/[\s,;–—-]+$/, '').trim();
                // Peek at next line for degree
                let degree = '', field = '', grade = '';
                if (i + 1 < eduLines.length) {
                    const nextLine = eduLines[i + 1].replace(/^[•·\-–—▪●■]+\s*/, '').trim();
                    if (degreePattern.test(nextLine)) {
                        i++;
                        const degMatch = nextLine.match(degreePattern);
                        degree = degMatch ? degMatch[0] : nextLine;
                        const afterDegree = nextLine.replace(degreePattern, '').replace(/^[\s,;]+/, '').trim();
                        if (afterDegree.length > 1 && afterDegree.length < 50) {
                            field = afterDegree;
                        }
                        const gMatch = nextLine.match(gradePattern);
                        if (gMatch) grade = gMatch[0];
                    }
                }
                education.push({
                    institution,
                    degree,
                    field,
                    year,
                    grade
                });
                this.logger.log(`EDU(1): inst="${institution}", degree="${degree}", year="${year}"`);
            } else if (hasDegree) {
                const degMatch = line.match(degreePattern);
                const degree = degMatch ? degMatch[0] : line;
                const yearMatches = line.match(/\d{4}/g);
                const gMatch = line.match(gradePattern);
                let institution = '', field = '';
                const afterDegree = line.replace(degreePattern, '').replace(/^[\s,;]+/, '').trim();
                // Try to extract field and institution from same line
                const parts = afterDegree.split(/\s*[,;–—|]\s*/).map((p)=>p.trim()).filter((p)=>p.length > 1);
                for (const part of parts){
                    const cleanPart = part.replace(/\d{4}/g, '').replace(gradePattern, '').trim();
                    if (!cleanPart || cleanPart.length < 2) continue;
                    if (/\b(in|of)\b/i.test(cleanPart) || cleanPart.length < 15) {
                        if (!field) field = cleanPart.replace(/^(in|of)\s+/i, '').trim();
                    } else {
                        if (!institution) institution = cleanPart;
                    }
                }
                // Next line might be institution if not found
                if (!institution && i + 1 < eduLines.length) {
                    const nextLine = eduLines[i + 1].replace(/^[•·\-–—▪●■]+\s*/, '').trim();
                    if (nextLine.length > 5 && !degreePattern.test(nextLine)) {
                        i++;
                        institution = nextLine.replace(/\d{4}/g, '').replace(/[\s,;–—-]+$/, '').trim();
                    }
                }
                education.push({
                    institution,
                    degree,
                    field,
                    year: yearMatches ? yearMatches[yearMatches.length - 1] : '',
                    grade: gMatch ? gMatch[0] : ''
                });
                this.logger.log(`EDU(2): degree="${degree}", field="${field}", inst="${institution}"`);
            }
            i++;
        }
        this.logger.log(`Total education entries: ${education.length}`);
        return education;
    }
    // ── Certifications ──
    extractCertificationsFromSection(sections) {
        const certLines = sections.certifications || [];
        if (certLines.length === 0) return [];
        const certs = [];
        for (const line of certLines){
            const clean = line.replace(/^[•·\-–—▪●■\d.\)]+\s*/, '').trim();
            if (clean.length < 3) continue;
            const yearMatch = clean.match(/\(?(\d{4})\)?/);
            const parts = clean.split(/\s*[-–—]\s*/);
            certs.push({
                name: parts[0]?.replace(/\(\d{4}\)/, '').trim() || clean,
                issuer: parts.length > 1 ? parts[1]?.replace(/\(?\d{4}\)?/g, '').trim() : '',
                year: yearMatch ? yearMatch[1] : ''
            });
        }
        return certs;
    }
    // ═══════════════════════════════════════════════
    // CONTENT IMPROVEMENT ENGINE
    // ═══════════════════════════════════════════════
    improveResumeContent(data) {
        const improved = JSON.parse(JSON.stringify(data));
        // 1. Auto-generate professional summary if missing
        if (!improved.summary || improved.summary.trim().length < 20) {
            improved.summary = this.generateSummary(improved);
        }
        // 2. Enhance bullet points
        improved.experience = improved.experience.map((exp)=>({
                ...exp,
                bullets: exp.bullets.map((b)=>this.enhanceBullet(b))
            }));
        // 3. If no skills from section, extract from full experience bullets
        if (improved.skills.length === 0) {
            const allBulletText = improved.experience.map((e)=>e.bullets.join(' ')).join(' ');
            improved.skills = this.extractSkillsFromFullText(allBulletText + ' ' + improved.summary);
        }
        return improved;
    }
    generateSummary(data) {
        const parts = [];
        const role = data.experience[0]?.role || 'Professional';
        const expCount = data.experience.length;
        parts.push(`${role} with ${expCount > 1 ? expCount + ' roles' : 'experience'} in developing scalable, high-performance, and secure enterprise applications.`);
        if (data.skills.length > 0) {
            const top = data.skills.slice(0, 6).join(', ');
            parts.push(`Proficient in ${top}.`);
        }
        if (data.education.length > 0 && data.education[0].degree) {
            parts.push(`Holds a ${data.education[0].degree}${data.education[0].field ? ' in ' + data.education[0].field : ''}${data.education[0].institution ? ' from ' + data.education[0].institution : ''}.`);
        }
        parts.push('Seeking challenging opportunities to leverage technical expertise and drive impactful results.');
        return parts.join(' ');
    }
    enhanceBullet(bullet) {
        const trimmed = bullet.trim();
        if (!trimmed) return trimmed;
        // Capitalize first letter
        if (/^[a-z]/.test(trimmed)) {
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        }
        return trimmed;
    }
    // ═══════════════════════════════════════════════
    // ATS SCORING
    // ═══════════════════════════════════════════════
    calculateAtsScore(data) {
        let score = 0;
        const suggestions = [];
        // 1. Contact info (max 15)
        if (data.name?.trim()) score += 4;
        else suggestions.push('Add your full name.');
        if (data.email?.trim()) score += 4;
        else suggestions.push('Include a professional email address.');
        if (data.phone?.trim()) score += 3;
        else suggestions.push('Add a phone number.');
        if (data.linkedin?.trim()) score += 2;
        else suggestions.push('Add your LinkedIn profile URL.');
        if (data.location?.trim()) score += 2;
        else suggestions.push('Add your location (City, State).');
        // 2. Summary (max 12)
        const summaryLen = data.summary?.trim().length || 0;
        if (summaryLen > 150) score += 12;
        else if (summaryLen > 80) {
            score += 9;
            suggestions.push('Expand your professional summary to 3-5 sentences.');
        } else if (summaryLen > 30) {
            score += 5;
            suggestions.push('Your professional summary is too short. Aim for 150+ characters.');
        } else {
            score += 0;
            suggestions.push('Add a professional summary (3-5 sentences highlighting key strengths).');
        }
        // 3. Skills (max 12)
        const skillCount = data.skills?.length || 0;
        if (skillCount >= 10) score += 12;
        else if (skillCount >= 6) {
            score += 8;
            suggestions.push('Add more skills (aim for 10+ relevant skills).');
        } else if (skillCount > 0) {
            score += 4;
            suggestions.push('Add more relevant technical and domain skills.');
        } else suggestions.push('Add a skills section with 10+ relevant skills.');
        // 4. Experience (max 35)
        if (data.experience?.length > 0) {
            let expScore = 0;
            // Has entries
            if (data.experience.length >= 3) expScore += 5;
            else if (data.experience.length >= 2) expScore += 4;
            else expScore += 2;
            // Bullets
            const totalBullets = data.experience.reduce((s, e)=>s + (e.bullets?.length || 0), 0);
            if (totalBullets >= 12) expScore += 8;
            else if (totalBullets >= 6) {
                expScore += 5;
                suggestions.push('Add more bullet points (3-5 per role) to describe achievements.');
            } else {
                expScore += 2;
                suggestions.push('Add bullet points describing your achievements and responsibilities.');
            }
            // Action verbs in bullets
            const actionVerbs = /^(developed|built|implemented|designed|led|managed|created|improved|optimized|engineered|configured|deployed|maintained|integrated|automated|established|achieved|delivered|spearheaded|collaborated|streamlined|reduced|increased|launched|mentored|architected)/i;
            const allBullets = data.experience.flatMap((e)=>e.bullets || []);
            const actionCount = allBullets.filter((b)=>actionVerbs.test(b.trim())).length;
            if (allBullets.length > 0) {
                const actionRatio = actionCount / allBullets.length;
                if (actionRatio >= 0.5) expScore += 5;
                else if (actionRatio >= 0.25) {
                    expScore += 3;
                    suggestions.push('Start more bullet points with strong action verbs (e.g., Developed, Implemented, Led).');
                } else {
                    expScore += 1;
                    suggestions.push('Use action verbs to start each bullet point (e.g., Developed, Built, Led).');
                }
            }
            // Quantified achievements (numbers, percentages)
            const quantifiedCount = allBullets.filter((b)=>/\d+[%+]|\d+\s*(users|customers|people|team|members|projects|requests|transactions|endpoints|services|queries|months|years)|\b\d+x\b/i.test(b)).length;
            if (allBullets.length > 0) {
                const quantRatio = quantifiedCount / allBullets.length;
                if (quantRatio >= 0.4) expScore += 5;
                else if (quantRatio >= 0.2) {
                    expScore += 3;
                    suggestions.push('Quantify more achievements with numbers (e.g., "improved performance by 30%").');
                } else {
                    expScore += 1;
                    suggestions.push('Add measurable results to your bullet points (e.g., "reduced load time by 40%", "served 1000+ users").');
                }
            }
            // Dates
            if (data.experience.every((e)=>e.startDate)) expScore += 4;
            else suggestions.push('Add dates for all positions.');
            // Company names
            if (data.experience.every((e)=>e.company?.trim())) expScore += 4;
            else suggestions.push('Add company names for all positions.');
            // Roles
            const hasRoles = data.experience.filter((e)=>e.role?.trim()).length;
            if (hasRoles < data.experience.length) expScore += 2;
            else expScore += 4;
            score += Math.min(expScore, 35);
        } else {
            suggestions.push('Add your work experience (most critical section for ATS).');
        }
        // 5. Education (max 13)
        if (data.education?.length > 0) {
            let eduScore = 5;
            if (data.education.some((e)=>e.year)) eduScore += 3;
            else suggestions.push('Add graduation years to education entries.');
            if (data.education.some((e)=>e.institution?.trim())) eduScore += 3;
            else suggestions.push('Add institution names to education entries.');
            if (data.education.some((e)=>e.degree?.trim())) eduScore += 2;
            score += Math.min(eduScore, 13);
        } else {
            suggestions.push('Add education details.');
        }
        // 6. Certifications (max 5)
        if (data.certifications?.length > 0) score += 5;
        // 7. Content richness (max 8)
        const totalContent = (data.summary?.length || 0) + (data.skills?.length || 0) * 10 + (data.experience?.reduce((s, e)=>s + (e.bullets?.join(' ').length || 0), 0) || 0);
        if (totalContent > 800) score += 8;
        else if (totalContent > 400) {
            score += 5;
            suggestions.push('Add more detail to your resume content.');
        } else {
            score += 2;
            suggestions.push('Your resume needs significantly more content to pass ATS filters.');
        }
        return {
            score: Math.min(score, 100),
            suggestions
        };
    }
    // ═══════════════════════════════════════════════
    // LATEX PDF — User's exact template
    // ═══════════════════════════════════════════════
    async generateLatexPdf(data) {
        const esc = (str)=>{
            if (!str) return '';
            return str.replace(/\\/g, '\\textbackslash{}').replace(/[&%$#_{}]/g, (m)=>`\\${m}`).replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}');
        };
        let tex = `\\documentclass[a4paper,10pt]{article}
\\usepackage[top=0.75in, bottom=0.75in, left=0.55in, right=0.85in]{geometry}
\\usepackage{graphicx}
\\usepackage{url}
\\usepackage{palatino}
\\usepackage{tabularx}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{color}
\\usepackage[colorlinks=true, urlcolor=blue]{hyperref}
\\definecolor{mygrey}{gray}{0.75}
\\textheight=9.75in
\\raggedbottom
\\setlength{\\tabcolsep}{0in}
\\newcommand{\\isep}{-2 pt}
\\newcommand{\\lsep}{-0.5cm}
\\newcommand{\\psep}{-0.6cm}
\\renewcommand{\\labelitemii}{$\\circ$}
\\pagestyle{empty}
\\newcommand{\\resitem}[1]{\\item #1 \\vspace{-2pt}}
\\newcommand{\\resheading}[1]{{\\small \\colorbox{mygrey}{\\begin{minipage}{0.975\\textwidth}{\\textbf{#1 \\vphantom{p\\^{E}}}}\\end{minipage}}}}
\\newcommand{\\ressubheading}[3]{\\begin{tabular*}{6.62in}{l @{\\extracolsep{\\fill}} r} \\textsc{{\\textbf{#1}}} & \\textsc{\\textit{[#2]}} \\\\\\end{tabular*}\\vspace{-8pt}}

\\begin{document}

`;
        // Header
        tex += `\\textbf{\\Large ${esc(data.name)}} \\\\\n`;
        if (data.email) tex += `\\indent Email: \\href{mailto:${esc(data.email)}}{${esc(data.email)}} \\\\\n`;
        if (data.phone) tex += `\\indent Mobile: ${esc(data.phone)} \\\\\n`;
        if (data.location) tex += `\\indent Location: ${esc(data.location)} \\\\\n`;
        if (data.linkedin) {
            const display = data.linkedin.replace('https://www.', '').replace('https://', '');
            tex += `\\indent LinkedIn: \\href{${data.linkedin}}{${esc(display)}} \\\\\n`;
        }
        tex += '\n';
        // Summary
        if (data.summary) {
            tex += `\\resheading{PROFESSIONAL SUMMARY}\\\\[\\lsep]\n\\begin{itemize}\n`;
            const parts = data.summary.split(/[.!]/).map((s)=>s.trim()).filter((s)=>s.length > 10);
            for (const p of parts)tex += `  \\resitem{${esc(p)}.}\n`;
            tex += `\\end{itemize}\n\n`;
        }
        // Skills
        if (data.skills?.length > 0) {
            tex += `\\resheading{KEY SKILLS}\\\\[\\lsep]\n\\begin{itemize}\n`;
            const cats = this.categorizeSkills(data.skills);
            for (const [cat, list] of Object.entries(cats)){
                if (list.length > 0) {
                    tex += `  \\item \\textbf{${esc(cat)}:} ${list.map((s)=>esc(s)).join(', ')}\n`;
                }
            }
            tex += `\\end{itemize}\n\n`;
        }
        // Experience
        if (data.experience?.length > 0) {
            tex += `\\resheading{PROFESSIONAL EXPERIENCE}\\\\[\\lsep]\n\\begin{itemize}\n`;
            for (const exp of data.experience){
                const dates = [
                    exp.startDate,
                    exp.endDate
                ].filter(Boolean).join(' -- ');
                const hasRole = exp.role?.trim();
                const hasProject = exp.project?.trim();
                if (hasRole) {
                    tex += `  \\item \\textbf{${esc(exp.role)}}`;
                    if (exp.company) tex += ` --- \\textit{${esc(exp.company)}}`;
                    if (dates) tex += ` \\hfill \\textbf{${esc(dates)}}`;
                    tex += ` \\\\\n`;
                    if (hasProject) {
                        tex += `  \\textbf{Project: ${esc(exp.project || '')}}`;
                        if (exp.projectDescription) tex += ` --- ${esc(exp.projectDescription || '')}`;
                        tex += `\\\\[-6pt]\n`;
                    }
                } else if (hasProject) {
                    tex += `  \\item \\textbf{Project: ${esc(exp.project || '')}}`;
                    if (exp.projectDescription) tex += ` --- ${esc(exp.projectDescription || '')}`;
                    tex += ` \\\\\n`;
                }
                if (exp.bullets?.length > 0) {
                    tex += `  \\begin{itemize}\n`;
                    for (const b of exp.bullets)tex += `    \\resitem{${esc(b)}}\n`;
                    tex += `  \\end{itemize}\n\n`;
                }
            }
            tex += `\\end{itemize}\n\n`;
        }
        // Certifications
        if (data.certifications?.length > 0) {
            tex += `\\resheading{CERTIFICATIONS}\\\\[\\lsep]\n\\begin{itemize}\n`;
            for (const c of data.certifications){
                let line = esc(c.name);
                if (c.issuer) line += ` -- ${esc(c.issuer)}`;
                if (c.year) line += ` (${esc(c.year)})`;
                tex += `  \\item ${line}\n`;
            }
            tex += `\\end{itemize}\n\n`;
        }
        // Education
        if (data.education?.length > 0) {
            tex += `\\resheading{\\textbf{EDUCATION}}\\\\[\\lsep]\n\\begin{itemize}\n`;
            for (const edu of data.education){
                let line = `\\textbf{${esc(edu.degree)}}`;
                if (edu.field) line += ` in ${esc(edu.field)}`;
                if (edu.institution) line += `, ${esc(edu.institution)}`;
                if (edu.grade) line += ` --- \\textbf{${esc(edu.grade)}}`;
                if (edu.year) line += ` (${esc(edu.year)})`;
                tex += `  \\item ${line}\n`;
            }
            tex += `\\end{itemize}\n\n`;
        }
        tex += `\\end{document}\n`;
        // Write & compile
        const tmpDir = _path.join(process.cwd(), 'tmp');
        if (!_fs.existsSync(tmpDir)) _fs.mkdirSync(tmpDir, {
            recursive: true
        });
        const fileId = (0, _uuid.v4)();
        const texPath = _path.join(tmpDir, `${fileId}.tex`);
        const pdfPath = _path.join(tmpDir, `${fileId}.pdf`);
        _fs.writeFileSync(texPath, tex, 'utf-8');
        try {
            await execAsync(`pdflatex -interaction=nonstopmode -output-directory="${tmpDir}" "${texPath}"`, {
                timeout: 30000
            });
            return _fs.readFileSync(pdfPath);
        } finally{
            for (const ext of [
                '.tex',
                '.pdf',
                '.aux',
                '.log',
                '.out'
            ]){
                const p = _path.join(tmpDir, `${fileId}${ext}`);
                if (_fs.existsSync(p)) _fs.unlinkSync(p);
            }
        }
    }
    categorizeSkills(skills) {
        const categories = {
            'Languages': [],
            'Core Backend': [],
            'Frameworks & ORM': [],
            'DevOps & Tools': [],
            'Testing': [],
            'Practices': [],
            'Other': []
        };
        const mapping = {
            'java': 'Languages',
            'python': 'Languages',
            'javascript': 'Languages',
            'typescript': 'Languages',
            'c++': 'Languages',
            'c#': 'Languages',
            'ruby': 'Languages',
            'php': 'Languages',
            'swift': 'Languages',
            'kotlin': 'Languages',
            'sql': 'Languages',
            'html': 'Languages',
            'css': 'Languages',
            'go': 'Languages',
            'rust': 'Languages',
            'scala': 'Languages',
            'spring boot': 'Core Backend',
            'spring': 'Core Backend',
            'rest api': 'Core Backend',
            'rest apis': 'Core Backend',
            'microservices': 'Core Backend',
            'oauth2': 'Core Backend',
            'oauth': 'Core Backend',
            'redis': 'Core Backend',
            'kafka': 'Core Backend',
            'mysql': 'Core Backend',
            'postgresql': 'Core Backend',
            'mongodb': 'Core Backend',
            'elasticsearch': 'Core Backend',
            'node.js': 'Core Backend',
            'node': 'Core Backend',
            'express': 'Core Backend',
            'nestjs': 'Core Backend',
            'graphql': 'Core Backend',
            'jwt': 'Core Backend',
            'hibernate': 'Frameworks & ORM',
            'jpa': 'Frameworks & ORM',
            'react': 'Frameworks & ORM',
            'angular': 'Frameworks & ORM',
            'vue': 'Frameworks & ORM',
            'django': 'Frameworks & ORM',
            'flask': 'Frameworks & ORM',
            'mvc': 'Frameworks & ORM',
            'jenkins': 'DevOps & Tools',
            'docker': 'DevOps & Tools',
            'kubernetes': 'DevOps & Tools',
            'git': 'DevOps & Tools',
            'github': 'DevOps & Tools',
            'postman': 'DevOps & Tools',
            'swagger': 'DevOps & Tools',
            'log4j2': 'DevOps & Tools',
            'aws': 'DevOps & Tools',
            'azure': 'DevOps & Tools',
            'gcp': 'DevOps & Tools',
            'linux': 'DevOps & Tools',
            'terraform': 'DevOps & Tools',
            'ansible': 'DevOps & Tools',
            'ci/cd': 'DevOps & Tools',
            'maven': 'DevOps & Tools',
            'gradle': 'DevOps & Tools',
            'junit': 'Testing',
            'mockito': 'Testing',
            'jest': 'Testing',
            'pytest': 'Testing',
            'selenium': 'Testing',
            'agile': 'Practices',
            'scrum': 'Practices',
            'debugging': 'Practices',
            'exception handling': 'Practices',
            'api documentation': 'Practices',
            'devops': 'Practices'
        };
        for (const skill of skills){
            const lower = skill.toLowerCase().trim();
            const category = mapping[lower] || 'Other';
            if (categories[category] && !categories[category].some((s)=>s.toLowerCase() === lower)) {
                categories[category].push(skill);
            }
        }
        // Remove empty
        for (const key of Object.keys(categories)){
            if (categories[key].length === 0) delete categories[key];
        }
        return categories;
    }
    // ═══════════════════════════════════════════════
    // HTML FALLBACK
    // ═══════════════════════════════════════════════
    async generateHtmlPdf(data) {
        const esc = (s)=>{
            if (!s) return '';
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        };
        let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
@page{size:A4;margin:0.75in 0.85in 0.75in 0.55in}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Palatino Linotype','Book Antiqua',Palatino,serif;font-size:10pt;color:#000;line-height:1.4}
.header{margin-bottom:10px}
.header h1{font-size:18pt;margin-bottom:4px}
.contact{font-size:10pt}
.contact a{color:#0000ff}
.section-heading{background:#bfbfbf;padding:3px 6px;font-weight:bold;font-size:10pt;margin:10px 0 6px}
ul{padding-left:20px;margin:4px 0}
li{margin-bottom:2px;font-size:10pt}
.exp-title{font-weight:bold}
.exp-company{font-style:italic}
.exp-dates{float:right;font-weight:bold}
.project{font-weight:bold;margin-top:2px}
.skill-label{font-weight:bold}
.edu-degree,.edu-grade{font-weight:bold}
</style></head><body>`;
        // Header
        html += `<div class="header"><h1>${esc(data.name)}</h1><div class="contact">`;
        if (data.email) html += `Email: <a href="mailto:${esc(data.email)}">${esc(data.email)}</a><br>`;
        if (data.phone) html += `Mobile: ${esc(data.phone)}<br>`;
        if (data.linkedin) html += `LinkedIn: <a href="${esc(data.linkedin)}">${esc(data.linkedin.replace('https://www.', '').replace('https://', ''))}</a><br>`;
        html += `</div></div>`;
        if (data.summary) {
            html += `<div class="section-heading">PROFESSIONAL SUMMARY</div><ul>`;
            data.summary.split(/[.!]/).map((s)=>s.trim()).filter((s)=>s.length > 10).forEach((p)=>html += `<li>${esc(p)}.</li>`);
            html += `</ul>`;
        }
        if (data.skills?.length > 0) {
            html += `<div class="section-heading">KEY SKILLS</div><ul>`;
            const cats = this.categorizeSkills(data.skills);
            for (const [cat, list] of Object.entries(cats))html += `<li><span class="skill-label">${esc(cat)}:</span> ${list.map((s)=>esc(s)).join(', ')}</li>`;
            html += `</ul>`;
        }
        if (data.experience?.length > 0) {
            html += `<div class="section-heading">PROFESSIONAL EXPERIENCE</div><ul>`;
            for (const exp of data.experience){
                const dates = [
                    exp.startDate,
                    exp.endDate
                ].filter(Boolean).join(' \u2013 ');
                const hasRole = exp.role?.trim();
                const hasProject = exp.project?.trim();
                html += `<li>`;
                if (hasRole) {
                    html += `<span class="exp-title">${esc(exp.role)}</span>`;
                    if (exp.company) html += ` \u2014 <span class="exp-company">${esc(exp.company)}</span>`;
                    if (dates) html += ` <span class="exp-dates">${esc(dates)}</span>`;
                    html += `<br>`;
                    if (hasProject) {
                        html += `<span class="project">Project: ${esc(exp.project || '')}</span>`;
                        if (exp.projectDescription) html += ` \u2014 ${esc(exp.projectDescription || '')}`;
                        html += `<br>`;
                    }
                } else if (hasProject) {
                    html += `<span class="project">Project: ${esc(exp.project || '')}</span>`;
                    if (exp.projectDescription) html += ` \u2014 ${esc(exp.projectDescription || '')}`;
                    html += `<br>`;
                }
                if (exp.bullets?.length > 0) {
                    html += `<ul>`;
                    for (const b of exp.bullets)html += `<li>${esc(b)}</li>`;
                    html += `</ul>`;
                }
                html += `</li>`;
            }
            html += `</ul>`;
        }
        if (data.certifications?.length > 0) {
            html += `<div class="section-heading">CERTIFICATIONS</div><ul>`;
            for (const c of data.certifications){
                let line = esc(c.name);
                if (c.issuer) line += ` – ${esc(c.issuer)}`;
                if (c.year) line += ` (${esc(c.year)})`;
                html += `<li>${line}</li>`;
            }
            html += `</ul>`;
        }
        if (data.education?.length > 0) {
            html += `<div class="section-heading">EDUCATION</div><ul>`;
            for (const edu of data.education){
                const parts = [];
                if (edu.degree) {
                    let dPart = `<span class="edu-degree">${esc(edu.degree)}</span>`;
                    if (edu.field) dPart += ` in ${esc(edu.field)}`;
                    parts.push(dPart);
                }
                if (edu.institution) parts.push(esc(edu.institution));
                let line = parts.join(', ');
                if (edu.grade) line += ` — <span class="edu-grade">${esc(edu.grade)}</span>`;
                if (edu.year) line += ` (${esc(edu.year)})`;
                if (line.trim()) html += `<li>${line}</li>`;
            }
            html += `</ul>`;
        }
        html += `</body></html>`;
        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });
            const page = await browser.newPage();
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '0.75in',
                    right: '0.85in',
                    bottom: '0.75in',
                    left: '0.55in'
                },
                printBackground: true
            });
            await browser.close();
            return Buffer.from(pdfBuffer);
        } catch  {
            this.logger.warn('Puppeteer not available, returning HTML buffer');
            return Buffer.from(html, 'utf-8');
        }
    }
    constructor(resumeParser){
        this.resumeParser = resumeParser;
        this.logger = new _common.Logger(AtsResumeService.name);
    }
};
AtsResumeService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _resumeparserservice.ResumeParserService === "undefined" ? Object : _resumeparserservice.ResumeParserService
    ])
], AtsResumeService);

//# sourceMappingURL=ats-resume.service.js.map