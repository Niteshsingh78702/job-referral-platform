// ATS Resume Builder - Frontend Logic (No Login Required)

const API_BASE = window.location.origin + '/api/v1';
let currentResumeData = null;
let skills = [];

function showToast(msg, type = 'info') {
    const toast = document.getElementById('atsToast');
    const msgEl = document.getElementById('atsToastMsg');
    msgEl.textContent = msg;
    toast.className = 'ats-toast ats-toast-' + type;
    toast.style.display = 'flex';
    setTimeout(function () { toast.style.display = 'none'; }, 3500);
}

document.addEventListener('DOMContentLoaded', function () {
    const area = document.getElementById('uploadArea');
    if (!area) return;
    area.addEventListener('dragover', function (e) {
        e.preventDefault();
        area.classList.add('ats-drag-over');
    });
    area.addEventListener('dragleave', function () {
        area.classList.remove('ats-drag-over');
    });
    area.addEventListener('drop', function (e) {
        e.preventDefault();
        area.classList.remove('ats-drag-over');
        if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
        }
    });
});

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        uploadFile(e.target.files[0]);
    }
}

async function uploadFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
    }

    const progress = document.getElementById('uploadProgress');
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    progress.style.display = 'block';

    let pct = 0;
    const interval = setInterval(function () {
        pct = Math.min(pct + Math.random() * 15, 90);
        fill.style.width = pct + '%';
        text.textContent = 'Analyzing & improving your resume... ' + Math.round(pct) + '%';
    }, 300);

    try {
        const fd = new FormData();
        fd.append('resume', file);
        const res = await fetch(API_BASE + '/ats-resume/upload', {
            method: 'POST',
            body: fd,
        });

        clearInterval(interval);

        if (!res.ok) {
            const err = await res.json().catch(function () { return {}; });
            throw new Error(err.message || 'Upload failed');
        }

        fill.style.width = '100%';
        text.textContent = 'Done! Resume analyzed & improved!';

        const data = await res.json();
        const result = data.data || data;

        setTimeout(function () {
            progress.style.display = 'none';
            fill.style.width = '0%';
            loadResumeData(result);
        }, 800);

        showToast('Resume analyzed, improved & scored!', 'success');
    } catch (err) {
        clearInterval(interval);
        progress.style.display = 'none';
        fill.style.width = '0%';
        showToast(err.message || 'Upload failed', 'error');
    }
}

function loadResumeData(result) {
    currentResumeData = result;
    const d = result.parsedData;

    document.getElementById('resultsSection').style.display = 'block';
    animateScore(result.atsScore || 0);
    renderSuggestions(result.suggestions || []);

    document.getElementById('edName').value = d.name || '';
    document.getElementById('edEmail').value = d.email || '';
    document.getElementById('edPhone').value = d.phone || '';
    document.getElementById('edLocation').value = d.location || '';
    document.getElementById('edLinkedin').value = d.linkedin || '';
    document.getElementById('edSummary').value = d.summary || '';

    skills = d.skills || [];
    renderSkills();

    var expContainer = document.getElementById('experienceEntries');
    expContainer.innerHTML = '';
    (d.experience || []).forEach(function (exp) { addExperience(exp); });

    var eduContainer = document.getElementById('educationEntries');
    eduContainer.innerHTML = '';
    (d.education || []).forEach(function (edu) { addEducation(edu); });

    var certContainer = document.getElementById('certEntries');
    certContainer.innerHTML = '';
    (d.certifications || []).forEach(function (cert) { addCertification(cert); });

    updatePreview();
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

function animateScore(score) {
    const circle = document.getElementById('gaugeCircle');
    const valueEl = document.getElementById('scoreValue');
    const labelEl = document.getElementById('scoreLabel');
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (score / 100) * circumference;

    let color = '#ef4444';
    let label = 'Needs Improvement';
    if (score >= 80) { color = '#22c55e'; label = 'Excellent - ATS Optimized!'; }
    else if (score >= 60) { color = '#eab308'; label = 'Good - Almost There'; }
    else if (score >= 40) { color = '#f97316'; label = 'Fair - Needs Work'; }

    circle.style.stroke = color;
    circle.style.transition = 'stroke-dashoffset 1.5s ease-out';
    circle.style.strokeDashoffset = offset;

    let current = 0;
    const step = Math.max(1, Math.floor(score / 40));
    const timer = setInterval(function () {
        current = Math.min(current + step, score);
        valueEl.textContent = current + '%';
        if (current >= score) clearInterval(timer);
    }, 30);

    labelEl.textContent = label;
    labelEl.style.color = color;
}

function getSuggestionTarget(suggestion) {
    const s = suggestion.toLowerCase();
    if (s.includes('full name') || s.includes('your name')) return { field: 'edName', label: 'Add' };
    if (s.includes('email')) return { field: 'edEmail', label: 'Add' };
    if (s.includes('phone')) return { field: 'edPhone', label: 'Add' };
    if (s.includes('linkedin')) return { field: 'edLinkedin', label: 'Add' };
    if (s.includes('summary')) return { field: 'edSummary', label: 'Fix' };
    if (s.includes('skill')) return { field: 'skillInput', label: 'Add' };
    if (s.includes('experience') || s.includes('work')) return { field: 'experienceEntries', label: 'Fix' };
    if (s.includes('bullet') || s.includes('achievement')) return { field: 'experienceEntries', label: 'Fix' };
    if (s.includes('dates') || s.includes('positions')) return { field: 'experienceEntries', label: 'Fix' };
    if (s.includes('company')) return { field: 'experienceEntries', label: 'Fix' };
    if (s.includes('education')) return { field: 'educationEntries', label: 'Add' };
    if (s.includes('certification') || s.includes('course')) return { field: 'certEntries', label: 'Add' };
    if (s.includes('content') || s.includes('detail')) return { field: 'edSummary', label: 'Fix' };
    return null;
}

function scrollToAndHighlight(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    let section = el.closest('.ats-editor-section');
    if (section) {
        const body = section.querySelector('.ats-section-body');
        if (body && body.style.display === 'none') {
            body.style.display = '';
            const toggle = section.querySelector('.ats-section-toggle');
            if (toggle) toggle.textContent = String.fromCharCode(9660);
        }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        setTimeout(function () { el.focus(); }, 400);
    }
    el.style.transition = 'box-shadow 0.3s, outline 0.3s';
    el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.5)';
    el.style.outline = '2px solid #6366f1';
    setTimeout(function () {
        el.style.boxShadow = '';
        el.style.outline = '';
    }, 2000);
}

function renderSuggestions(suggestions) {
    const list = document.getElementById('suggestionsList');
    if (!suggestions || suggestions.length === 0) {
        list.innerHTML = '<div class="ats-suggestion-item ats-suggestion-good">Your resume looks great! No major issues found.</div>';
        return;
    }
    list.innerHTML = suggestions.map(function (s) {
        const target = getSuggestionTarget(s);
        const btnHtml = target
            ? '<button class="ats-fix-btn" onclick="scrollToAndHighlight(\'' + target.field + '\')">' + target.label + ' &rarr;</button>'
            : '';
        return '<div class="ats-suggestion-item"><span class="ats-suggestion-icon">&#9889;</span><span class="ats-suggestion-text">' + escapeHtml(s) + '</span>' + btnHtml + '</div>';
    }).join('');
}

function renderSkills() {
    const container = document.getElementById('skillsContainer');
    container.innerHTML = skills.map(function (s, i) {
        return '<span class="ats-tag">' + escapeHtml(s) + ' <button onclick="removeSkill(' + i + ')" class="ats-tag-remove">&times;</button></span>';
    }).join('');
    updatePreview();
}

function handleSkillInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const val = e.target.value.trim();
        if (val && !skills.includes(val)) {
            skills.push(val);
            renderSkills();
        }
        e.target.value = '';
    }
}

function removeSkill(i) {
    skills.splice(i, 1);
    renderSkills();
}

function addExperience(data) {
    data = data || {};
    const container = document.getElementById('experienceEntries');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = '<div class="ats-entry-header"><strong>Experience ' + (idx + 1) + '</strong><button class="ats-entry-remove" onclick="this.closest(\'.ats-entry-card\').remove(); updatePreview();">&times;</button></div>'
        + '<div class="ats-form-grid">'
        + '<div class="ats-form-group"><label>Role / Job Title</label><input type="text" class="exp-role" value="' + escapeAttr(data.role || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Company</label><input type="text" class="exp-company" value="' + escapeAttr(data.company || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Start Date</label><input type="text" class="exp-start" placeholder="Mar 2024" value="' + escapeAttr(data.startDate || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>End Date</label><input type="text" class="exp-end" placeholder="Present" value="' + escapeAttr(data.endDate || '') + '" oninput="updatePreview()"></div>'
        + '</div>'
        + '<div class="ats-form-grid">'
        + '<div class="ats-form-group"><label>Project Name (optional)</label><input type="text" class="exp-project" value="' + escapeAttr(data.project || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Project Description (optional)</label><input type="text" class="exp-project-desc" value="' + escapeAttr(data.projectDescription || '') + '" oninput="updatePreview()"></div>'
        + '</div>'
        + '<div class="ats-form-group"><label>Bullet Points (one per line)</label><textarea class="exp-bullets" rows="4" oninput="updatePreview()" placeholder="Designed RESTful APIs...">' + (data.bullets || []).join('\n') + '</textarea></div>';
    container.appendChild(div);
    updatePreview();
}

function addEducation(data) {
    data = data || {};
    const container = document.getElementById('educationEntries');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = '<div class="ats-entry-header"><strong>Education ' + (idx + 1) + '</strong><button class="ats-entry-remove" onclick="this.closest(\'.ats-entry-card\').remove(); updatePreview();">&times;</button></div>'
        + '<div class="ats-form-grid">'
        + '<div class="ats-form-group"><label>Degree</label><input type="text" class="edu-degree" value="' + escapeAttr(data.degree || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Field</label><input type="text" class="edu-field" value="' + escapeAttr(data.field || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Institution</label><input type="text" class="edu-institution" value="' + escapeAttr(data.institution || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Grade / GPA / %</label><input type="text" class="edu-grade" placeholder="7.8 / 10" value="' + escapeAttr(data.grade || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Year</label><input type="text" class="edu-year" placeholder="2023" value="' + escapeAttr(data.year || '') + '" oninput="updatePreview()"></div>'
        + '</div>';
    container.appendChild(div);
    updatePreview();
}

function addCertification(data) {
    data = data || {};
    const container = document.getElementById('certEntries');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = '<div class="ats-entry-header"><strong>Certification ' + (idx + 1) + '</strong><button class="ats-entry-remove" onclick="this.closest(\'.ats-entry-card\').remove(); updatePreview();">&times;</button></div>'
        + '<div class="ats-form-grid">'
        + '<div class="ats-form-group"><label>Name</label><input type="text" class="cert-name" value="' + escapeAttr(data.name || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Issuer</label><input type="text" class="cert-issuer" value="' + escapeAttr(data.issuer || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Year</label><input type="text" class="cert-year" placeholder="2023" value="' + escapeAttr(data.year || '') + '" oninput="updatePreview()"></div>'
        + '</div>';
    container.appendChild(div);
    updatePreview();
}

function collectFormData() {
    var experience = [];
    document.querySelectorAll('#experienceEntries .ats-entry-card').forEach(function (card) {
        experience.push({
            role: (card.querySelector('.exp-role') || {}).value || '',
            company: (card.querySelector('.exp-company') || {}).value || '',
            startDate: (card.querySelector('.exp-start') || {}).value || '',
            endDate: (card.querySelector('.exp-end') || {}).value || '',
            project: (card.querySelector('.exp-project') || {}).value || '',
            projectDescription: (card.querySelector('.exp-project-desc') || {}).value || '',
            bullets: ((card.querySelector('.exp-bullets') || {}).value || '').split('\n').filter(Boolean),
        });
    });

    var education = [];
    document.querySelectorAll('#educationEntries .ats-entry-card').forEach(function (card) {
        education.push({
            degree: (card.querySelector('.edu-degree') || {}).value || '',
            field: (card.querySelector('.edu-field') || {}).value || '',
            institution: (card.querySelector('.edu-institution') || {}).value || '',
            grade: (card.querySelector('.edu-grade') || {}).value || '',
            year: (card.querySelector('.edu-year') || {}).value || '',
        });
    });

    var certifications = [];
    document.querySelectorAll('#certEntries .ats-entry-card').forEach(function (card) {
        certifications.push({
            name: (card.querySelector('.cert-name') || {}).value || '',
            issuer: (card.querySelector('.cert-issuer') || {}).value || '',
            year: (card.querySelector('.cert-year') || {}).value || '',
        });
    });

    return {
        name: document.getElementById('edName').value,
        email: document.getElementById('edEmail').value,
        phone: document.getElementById('edPhone').value,
        location: document.getElementById('edLocation').value,
        linkedin: document.getElementById('edLinkedin').value,
        summary: document.getElementById('edSummary').value,
        skills: skills,
        experience: experience,
        education: education,
        certifications: certifications,
    };
}

async function rescoreResume() {
    const data = collectFormData();
    const btn = document.querySelector('.ats-editor-header .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Scoring...'; }

    try {
        const res = await fetch(API_BASE + '/ats-resume/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(function () { return {}; });
            throw new Error(err.message || 'Score failed');
        }
        const result = await res.json();
        const d = result.data || result;
        animateScore(d.atsScore || 0);
        renderSuggestions(d.suggestions || []);
        showToast('ATS score updated!', 'success');
    } catch (err) {
        showToast(err.message || 'Scoring failed', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Re-Score'; }
    }
}

// =============================================
// Download PDF - Generates LaTeX-matching compact HTML, captures as PDF
// =============================================
async function downloadPdf() {
    var btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.textContent = 'Generating PDF...';

    try {
        // Load libraries if needed
        if (typeof html2canvas === 'undefined') {
            await new Promise(function (resolve, reject) {
                var s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                s.onload = resolve;
                s.onerror = function () { reject(new Error('Failed to load html2canvas')); };
                document.head.appendChild(s);
            });
        }
        if (!window.jspdf) {
            await new Promise(function (resolve, reject) {
                var s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
                s.onload = resolve;
                s.onerror = function () { reject(new Error('Failed to load jsPDF')); };
                document.head.appendChild(s);
            });
        }

        var data = collectFormData();
        if (!data.name && !data.email) {
            throw new Error('No resume data. Please upload a resume first.');
        }

        // Helper functions
        function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
        function secBox(t) { return '<div style="background:#bfbfbf;padding:1px 5px;font-weight:bold;font-size:10pt;margin:6px 0 2px 0;">' + t + '</div>'; }

        // Skill categories
        var cats = {
            'Languages': ['java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'c', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css', 'go', 'rust', 'scala', 'r', 'perl', 'dart', 'html5', 'css3', 'sass', 'less'],
            'Core Backend': ['spring boot', 'spring', 'rest api', 'rest apis', 'microservices', 'oauth2', 'oauth', 'redis', 'kafka', 'mysql', 'postgresql', 'mongodb', 'elasticsearch', 'node.js', 'node', 'express', 'nestjs', 'graphql', 'jwt', 'rabbitmq', 'django', 'flask', 'fastapi', 'laravel', 'rails', 'asp.net', 'hibernate', 'jpa'],
            'Frontend': ['react', 'react.js', 'angular', 'vue', 'vue.js', 'next.js', 'nextjs', 'nuxt.js', 'svelte', 'redux', 'tailwind', 'tailwind css', 'bootstrap', 'material ui', 'chakra ui', 'jquery', 'webpack', 'vite'],
            'DevOps & Tools': ['jenkins', 'docker', 'kubernetes', 'git', 'github', 'gitlab', 'postman', 'swagger', 'log4j2', 'aws', 'azure', 'gcp', 'linux', 'terraform', 'ansible', 'ci/cd', 'maven', 'gradle', 'nginx', 'vercel', 'heroku', 'netlify', 'firebase', 'cd (jenkins)', 'ci'],
            'Testing': ['junit', 'mockito', 'jest', 'pytest', 'selenium', 'cypress', 'mocha', 'chai', 'testing library'],
            'Practices': ['agile', 'scrum', 'debugging', 'exception handling', 'api documentation', 'devops', 'performance optimization', 'tdd', 'bdd', 'oop', 'design patterns', 'solid']
        };

        // Build PDF HTML
        var h = '';

        // Header
        h += '<div style="font-size:17pt;font-weight:bold;margin-bottom:2px;">' + esc(data.name || 'Your Name') + '</div>';
        if (data.email) h += '<div style="font-size:9pt;">Email: <a href="mailto:' + esc(data.email) + '" style="color:#0000EE;">' + esc(data.email) + '</a></div>';
        if (data.phone) h += '<div style="font-size:9pt;">Mobile: ' + esc(data.phone) + '</div>';
        if (data.linkedin) {
            var disp = data.linkedin.replace('https://www.', '').replace('https://', '');
            h += '<div style="font-size:9pt;">LinkedIn: <a href="' + esc(data.linkedin) + '" style="color:#0000EE;">' + esc(disp) + '</a></div>';
        }

        // Summary
        if (data.summary && data.summary.trim()) {
            h += secBox('PROFESSIONAL SUMMARY');
            h += '<ul style="padding-left:16px;margin:1px 0;">';
            var parts = data.summary.split(/[.!]/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 10; });
            for (var pi = 0; pi < parts.length; pi++) {
                h += '<li style="font-size:9pt;margin-bottom:-1px;line-height:1.3;">' + esc(parts[pi]) + '.</li>';
            }
            h += '</ul>';
        }

        // Skills
        if (data.skills && data.skills.length > 0) {
            h += secBox('KEY SKILLS');
            h += '<ul style="padding-left:16px;margin:1px 0;">';
            var categorized = {};
            var uncategorized = [];
            for (var si = 0; si < data.skills.length; si++) {
                var skill = data.skills[si];
                var lower = skill.toLowerCase().trim();
                var found = false;
                var catKeys = Object.keys(cats);
                for (var ci = 0; ci < catKeys.length; ci++) {
                    if (cats[catKeys[ci]].indexOf(lower) !== -1) {
                        if (!categorized[catKeys[ci]]) categorized[catKeys[ci]] = [];
                        var already = false;
                        for (var x = 0; x < categorized[catKeys[ci]].length; x++) {
                            if (categorized[catKeys[ci]][x].toLowerCase() === lower) already = true;
                        }
                        if (!already) categorized[catKeys[ci]].push(skill);
                        found = true;
                        break;
                    }
                }
                if (!found) uncategorized.push(skill);
            }
            var catKeys2 = Object.keys(categorized);
            for (var ck = 0; ck < catKeys2.length; ck++) {
                if (categorized[catKeys2[ck]].length > 0) {
                    h += '<li style="font-size:9pt;margin-bottom:-1px;line-height:1.3;"><b>' + esc(catKeys2[ck]) + ':</b> ' + categorized[catKeys2[ck]].map(function (s) { return esc(s); }).join(', ') + '</li>';
                }
            }
            if (uncategorized.length > 0) {
                h += '<li style="font-size:9pt;margin-bottom:-1px;line-height:1.3;"><b>Other:</b> ' + uncategorized.map(function (s) { return esc(s); }).join(', ') + '</li>';
            }
            h += '</ul>';
        }

        // Experience
        if (data.experience && data.experience.length > 0) {
            h += secBox('PROFESSIONAL EXPERIENCE');
            h += '<ul style="padding-left:16px;margin:1px 0;">';
            for (var ei = 0; ei < data.experience.length; ei++) {
                var exp = data.experience[ei];
                var hasRole = exp.role && exp.role.trim();
                var hasProject = exp.project && exp.project.trim();
                var datesArr = [];
                if (exp.startDate) datesArr.push(exp.startDate);
                if (exp.endDate) datesArr.push(exp.endDate);
                var dates = datesArr.join(' - ');

                if (hasRole) {
                    h += '<li style="font-size:9pt;margin-bottom:0;line-height:1.3;">';
                    h += '<b>' + esc(exp.role) + '</b>';
                    if (exp.company) h += ' -- <i>' + esc(exp.company) + '</i>';
                    if (dates) h += ' <span style="float:right;font-weight:bold;">' + esc(dates) + '</span>';
                    h += '</li>';
                }
                if (hasProject) {
                    var projLine = '<b>Project: ' + esc(exp.project) + '</b>';
                    if (exp.projectDescription) projLine += ' -- ' + esc(exp.projectDescription);
                    h += '<div style="font-size:9pt;margin-left:16px;line-height:1.3;">' + projLine + '</div>';
                }
                if (exp.bullets && exp.bullets.length > 0) {
                    h += '<ul style="padding-left:16px;margin:0;">';
                    for (var bi = 0; bi < exp.bullets.length; bi++) {
                        h += '<li style="font-size:8.5pt;margin-bottom:-2px;line-height:1.3;">' + esc(exp.bullets[bi]) + '</li>';
                    }
                    h += '</ul>';
                }
            }
            h += '</ul>';
        }

        // Certifications
        if (data.certifications && data.certifications.length > 0) {
            h += secBox('CERTIFICATIONS');
            h += '<ul style="padding-left:16px;margin:1px 0;">';
            for (var ci2 = 0; ci2 < data.certifications.length; ci2++) {
                var c = data.certifications[ci2];
                var line = esc(c.name || '');
                if (c.issuer) line += ' - ' + esc(c.issuer);
                if (c.year) line += ' (' + esc(c.year) + ')';
                h += '<li style="font-size:9pt;margin-bottom:-1px;line-height:1.3;">' + line + '</li>';
            }
            h += '</ul>';
        }

        // Education
        if (data.education && data.education.length > 0) {
            h += secBox('EDUCATION');
            h += '<ul style="padding-left:16px;margin:1px 0;">';
            for (var edi = 0; edi < data.education.length; edi++) {
                var edu = data.education[edi];
                var eduParts = [];
                if (edu.degree) {
                    var dStr = '<b>' + esc(edu.degree) + '</b>';
                    if (edu.field) dStr += ' in ' + esc(edu.field);
                    eduParts.push(dStr);
                }
                if (edu.institution) eduParts.push(esc(edu.institution));
                var eLine = eduParts.join(', ');
                if (edu.grade) eLine += ' -- <b>' + esc(edu.grade) + '</b>';
                if (edu.year) eLine += ' (' + esc(edu.year) + ')';
                if (eLine.trim()) h += '<li style="font-size:9pt;margin-bottom:-1px;line-height:1.3;">' + eLine + '</li>';
            }
            h += '</ul>';
        }

        // Render to canvas
        var container = document.createElement('div');
        container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:auto;background:#fff;padding:54px 60px 54px 40px;box-sizing:border-box;z-index:-1;font-family:Palatino Linotype,Book Antiqua,Palatino,Times New Roman,serif;font-size:10pt;color:#000;line-height:1.25;';
        container.innerHTML = h;
        document.body.appendChild(container);

        var canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        });
        document.body.removeChild(container);

        // Create PDF
        var jsPDF = window.jspdf.jsPDF;
        var pdf = new jsPDF('p', 'mm', 'a4');
        var pdfW = 210;
        var pdfH = 297;
        var imgW = canvas.width;
        var imgH = canvas.height;
        var ratio = pdfW / imgW;
        var scaledH = imgH * ratio;

        if (scaledH <= pdfH) {
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, scaledH);
        } else {
            var pageContentH = pdfH / ratio;
            var yOffset = 0;
            var page = 0;
            while (yOffset < imgH) {
                if (page > 0) pdf.addPage();
                var sliceH = Math.min(pageContentH, imgH - yOffset);
                var pc = document.createElement('canvas');
                pc.width = imgW;
                pc.height = sliceH;
                var ctx = pc.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, imgW, sliceH);
                ctx.drawImage(canvas, 0, yOffset, imgW, sliceH, 0, 0, imgW, sliceH);
                pdf.addImage(pc.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, sliceH * ratio);
                yOffset += sliceH;
                page++;
            }
        }

        pdf.save('ats_resume.pdf');
        showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
        console.error('PDF generation error:', err);
        showToast(err.message || 'PDF generation failed', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Download ATS PDF';
    }
}

// =============================================
// Live Preview
// =============================================
function updatePreview() {
    var d = collectFormData();
    var frame = document.getElementById('previewFrame');

    var html = '<div style="font-family:Palatino Linotype,Book Antiqua,Palatino,serif;font-size:10pt;color:#000;line-height:1.45;padding:4px 8px;">';

    // Header
    html += '<div style="margin-bottom:8px;"><div style="font-size:18pt;font-weight:bold;">' + escapeHtml(d.name || 'Your Name') + '</div>';
    if (d.email) html += '<div style="font-size:9pt;">Email: <a href="mailto:' + escapeHtml(d.email) + '" style="color:#0000ff;">' + escapeHtml(d.email) + '</a></div>';
    if (d.phone) html += '<div style="font-size:9pt;">Mobile: ' + escapeHtml(d.phone) + '</div>';
    if (d.location) html += '<div style="font-size:9pt;">Location: ' + escapeHtml(d.location) + '</div>';
    if (d.linkedin) html += '<div style="font-size:9pt;">LinkedIn: <a href="' + escapeHtml(d.linkedin) + '" style="color:#0000ff;" target="_blank">' + escapeHtml(d.linkedin.replace('https://www.', '').replace('https://', '')) + '</a></div>';
    html += '</div>';

    function secHead(title) { return '<div style="background:#bfbfbf;padding:2px 6px;font-weight:bold;font-size:10pt;margin:8px 0 4px 0;">' + title + '</div>'; }

    // Summary
    if (d.summary) {
        html += secHead('PROFESSIONAL SUMMARY');
        html += '<ul style="padding-left:18px;margin:2px 0;">';
        var parts = d.summary.split(/[.!]/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 10; });
        for (var i = 0; i < parts.length; i++) {
            html += '<li style="font-size:9pt;margin-bottom:1px;">' + escapeHtml(parts[i]) + '.</li>';
        }
        html += '</ul>';
    }

    // Skills
    if (d.skills && d.skills.length > 0) {
        html += secHead('KEY SKILLS');
        html += '<ul style="padding-left:18px;margin:2px 0;">';
        var skillCats = {
            'Languages': ['java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'c', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css', 'go', 'rust', 'scala', 'r', 'perl', 'dart', 'html5', 'css3', 'sass', 'less'],
            'Core Backend': ['spring boot', 'spring', 'rest api', 'rest apis', 'microservices', 'oauth2', 'oauth', 'redis', 'kafka', 'mysql', 'postgresql', 'mongodb', 'elasticsearch', 'node.js', 'node', 'express', 'nestjs', 'graphql', 'jwt', 'rabbitmq', 'django', 'flask', 'fastapi', 'laravel', 'rails', 'asp.net', 'hibernate', 'jpa'],
            'Frontend': ['react', 'react.js', 'angular', 'vue', 'vue.js', 'next.js', 'nextjs', 'nuxt.js', 'svelte', 'redux', 'tailwind', 'tailwind css', 'bootstrap', 'material ui', 'chakra ui', 'jquery', 'webpack', 'vite'],
            'DevOps & Tools': ['jenkins', 'docker', 'kubernetes', 'git', 'github', 'gitlab', 'postman', 'swagger', 'log4j2', 'aws', 'azure', 'gcp', 'linux', 'terraform', 'ansible', 'ci/cd', 'maven', 'gradle', 'nginx', 'vercel', 'heroku', 'netlify', 'firebase', 'aws (ec2)', 's3', 'cd (jenkins)', 'ci'],
            'Testing': ['junit', 'mockito', 'jest', 'pytest', 'selenium', 'cypress', 'mocha', 'chai', 'testing library'],
            'Practices': ['agile', 'scrum', 'debugging', 'exception handling', 'api documentation', 'devops', 'performance optimization', 'tdd', 'bdd', 'oop', 'design patterns', 'solid']
        };
        var cat2 = {};
        var uncat = [];
        for (var si = 0; si < d.skills.length; si++) {
            var skLow = d.skills[si].toLowerCase().trim();
            var fnd = false;
            var ks = Object.keys(skillCats);
            for (var ki = 0; ki < ks.length; ki++) {
                if (skillCats[ks[ki]].indexOf(skLow) !== -1) {
                    if (!cat2[ks[ki]]) cat2[ks[ki]] = [];
                    var dup = false;
                    for (var di = 0; di < cat2[ks[ki]].length; di++) { if (cat2[ks[ki]][di].toLowerCase() === skLow) dup = true; }
                    if (!dup) cat2[ks[ki]].push(d.skills[si]);
                    fnd = true; break;
                }
            }
            if (!fnd) uncat.push(d.skills[si]);
        }
        var ks2 = Object.keys(cat2);
        for (var ki2 = 0; ki2 < ks2.length; ki2++) {
            if (cat2[ks2[ki2]].length > 0) {
                html += '<li style="font-size:9pt;margin-bottom:1px;"><b>' + escapeHtml(ks2[ki2]) + ':</b> ' + cat2[ks2[ki2]].map(function (s) { return escapeHtml(s); }).join(', ') + '</li>';
            }
        }
        if (uncat.length > 0) {
            html += '<li style="font-size:9pt;margin-bottom:1px;"><b>Other:</b> ' + uncat.map(function (s) { return escapeHtml(s); }).join(', ') + '</li>';
        }
        html += '</ul>';
    }

    // Experience
    if (d.experience && d.experience.length > 0) {
        html += secHead('PROFESSIONAL EXPERIENCE');
        for (var ei = 0; ei < d.experience.length; ei++) {
            var exp = d.experience[ei];
            var dts = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
            var hasR = exp.role && exp.role.trim();
            var hasP = exp.project && exp.project.trim();

            if (hasR) {
                html += '<div style="margin:4px 0 2px 0;"><b>' + escapeHtml(exp.role) + '</b>';
                if (exp.company) html += ' -- <i>' + escapeHtml(exp.company) + '</i>';
                if (dts) html += ' <span style="float:right;font-weight:bold;font-size:9pt;">' + escapeHtml(dts) + '</span>';
                html += '</div>';
                if (hasP) {
                    html += '<div style="font-size:9pt;"><b>Project: ' + escapeHtml(exp.project) + '</b>';
                    if (exp.projectDescription) html += ' -- ' + escapeHtml(exp.projectDescription);
                    html += '</div>';
                }
            } else if (hasP) {
                html += '<div style="margin:4px 0 2px 0;"><b>Project: ' + escapeHtml(exp.project) + '</b>';
                if (exp.projectDescription) html += ' -- ' + escapeHtml(exp.projectDescription);
                html += '</div>';
            }

            if (exp.bullets && exp.bullets.length > 0) {
                html += '<ul style="padding-left:18px;margin:2px 0;">';
                for (var bi = 0; bi < exp.bullets.length; bi++) {
                    html += '<li style="font-size:9pt;margin-bottom:1px;">' + escapeHtml(exp.bullets[bi]) + '</li>';
                }
                html += '</ul>';
            }
        }
    }

    // Certifications
    if (d.certifications && d.certifications.length > 0) {
        html += secHead('CERTIFICATIONS');
        html += '<ul style="padding-left:18px;margin:2px 0;">';
        for (var ci = 0; ci < d.certifications.length; ci++) {
            var c = d.certifications[ci];
            var cLine = escapeHtml(c.name || '');
            if (c.issuer) cLine += ' - ' + escapeHtml(c.issuer);
            if (c.year) cLine += ' (' + escapeHtml(c.year) + ')';
            html += '<li style="font-size:9pt;">' + cLine + '</li>';
        }
        html += '</ul>';
    }

    // Education
    if (d.education && d.education.length > 0) {
        html += secHead('EDUCATION');
        html += '<ul style="padding-left:18px;margin:2px 0;">';
        for (var edi = 0; edi < d.education.length; edi++) {
            var edu = d.education[edi];
            var eParts = [];
            if (edu.degree) {
                var dp = '<b>' + escapeHtml(edu.degree) + '</b>';
                if (edu.field) dp += ' in ' + escapeHtml(edu.field);
                eParts.push(dp);
            }
            if (edu.institution) eParts.push(escapeHtml(edu.institution));
            var eLine = eParts.join(', ');
            if (edu.grade) eLine += ' -- <b>' + escapeHtml(edu.grade) + '</b>';
            if (edu.year) eLine += ' (' + escapeHtml(edu.year) + ')';
            if (eLine.trim()) html += '<li style="font-size:9pt;">' + eLine + '</li>';
        }
        html += '</ul>';
    }

    html += '</div>';
    frame.innerHTML = html;
}

function toggleEditorSection(titleEl) {
    var body = titleEl.nextElementSibling;
    var toggle = titleEl.querySelector('.ats-section-toggle');
    if (body.style.display === 'none') {
        body.style.display = 'block';
        toggle.textContent = String.fromCharCode(9660);
    } else {
        body.style.display = 'none';
        toggle.textContent = String.fromCharCode(9654);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
