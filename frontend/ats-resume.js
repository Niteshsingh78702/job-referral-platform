// ATS Resume Builder - Frontend Logic (No Login Required)

var API_BASE = window.location.origin + '/api/v1';
var currentResumeData = null;
var skills = [];

function showToast(msg, type) {
    type = type || 'info';
    var toast = document.getElementById('atsToast');
    var msgEl = document.getElementById('atsToastMsg');
    msgEl.textContent = msg;
    toast.className = 'ats-toast ats-toast-' + type;
    toast.style.display = 'flex';
    setTimeout(function () { toast.style.display = 'none'; }, 3500);
}

document.addEventListener('DOMContentLoaded', function () {
    var area = document.getElementById('uploadArea');
    if (!area) return;
    area.addEventListener('dragover', function (e) { e.preventDefault(); area.classList.add('ats-drag-over'); });
    area.addEventListener('dragleave', function () { area.classList.remove('ats-drag-over'); });
    area.addEventListener('drop', function (e) {
        e.preventDefault();
        area.classList.remove('ats-drag-over');
        if (e.dataTransfer.files.length > 0) uploadFile(e.dataTransfer.files[0]);
    });
});

function handleFileSelect(e) { if (e.target.files.length > 0) uploadFile(e.target.files[0]); }

async function uploadFile(file) {
    if (file.size > 5 * 1024 * 1024) { showToast('File size must be less than 5MB', 'error'); return; }
    var progress = document.getElementById('uploadProgress');
    var fill = document.getElementById('progressFill');
    var text = document.getElementById('progressText');
    progress.style.display = 'block';
    var pct = 0;
    var interval = setInterval(function () {
        pct = Math.min(pct + Math.random() * 15, 90);
        fill.style.width = pct + '%';
        text.textContent = 'Analyzing & improving your resume... ' + Math.round(pct) + '%';
    }, 300);
    try {
        var fd = new FormData();
        fd.append('resume', file);
        var res = await fetch(API_BASE + '/ats-resume/upload', { method: 'POST', body: fd });
        clearInterval(interval);
        if (!res.ok) { var err = await res.json().catch(function () { return {}; }); throw new Error(err.message || 'Upload failed'); }
        fill.style.width = '100%';
        text.textContent = 'Done! Resume analyzed & improved!';
        var data = await res.json();
        var result = data.data || data;
        setTimeout(function () { progress.style.display = 'none'; fill.style.width = '0%'; loadResumeData(result); }, 800);
        showToast('Resume analyzed, improved & scored!', 'success');
    } catch (err) {
        clearInterval(interval); progress.style.display = 'none'; fill.style.width = '0%';
        showToast(err.message || 'Upload failed', 'error');
    }
}

function loadResumeData(result) {
    currentResumeData = result;
    var d = result.parsedData;
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
    var expC = document.getElementById('experienceEntries'); expC.innerHTML = '';
    (d.experience || []).forEach(function (exp) { addExperience(exp); });
    var eduC = document.getElementById('educationEntries'); eduC.innerHTML = '';
    (d.education || []).forEach(function (edu) { addEducation(edu); });
    var certC = document.getElementById('certEntries'); certC.innerHTML = '';
    (d.certifications || []).forEach(function (cert) { addCertification(cert); });
    updatePreview();
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

function animateScore(score) {
    var circle = document.getElementById('gaugeCircle');
    var valueEl = document.getElementById('scoreValue');
    var labelEl = document.getElementById('scoreLabel');
    var circumference = 2 * Math.PI * 85;
    var offset = circumference - (score / 100) * circumference;
    var color = '#ef4444', label = 'Needs Improvement';
    if (score >= 80) { color = '#22c55e'; label = 'Excellent - ATS Optimized!'; }
    else if (score >= 60) { color = '#eab308'; label = 'Good - Almost There'; }
    else if (score >= 40) { color = '#f97316'; label = 'Fair - Needs Work'; }
    circle.style.stroke = color;
    circle.style.transition = 'stroke-dashoffset 1.5s ease-out';
    circle.style.strokeDashoffset = offset;
    var current = 0;
    var step = Math.max(1, Math.floor(score / 40));
    var timer = setInterval(function () {
        current = Math.min(current + step, score);
        valueEl.textContent = current + '%';
        if (current >= score) clearInterval(timer);
    }, 30);
    labelEl.textContent = label;
    labelEl.style.color = color;
}

function getSuggestionTarget(suggestion) {
    var s = suggestion.toLowerCase();
    if (s.includes('full name') || s.includes('your name')) return { field: 'edName', label: 'Add' };
    if (s.includes('email')) return { field: 'edEmail', label: 'Add' };
    if (s.includes('phone')) return { field: 'edPhone', label: 'Add' };
    if (s.includes('linkedin')) return { field: 'edLinkedin', label: 'Add' };
    if (s.includes('summary')) return { field: 'edSummary', label: 'Fix' };
    if (s.includes('skill')) return { field: 'skillInput', label: 'Add' };
    if (s.includes('experience') || s.includes('work')) return { field: 'experienceEntries', label: 'Fix' };
    if (s.includes('bullet') || s.includes('achievement')) return { field: 'experienceEntries', label: 'Fix' };
    if (s.includes('education')) return { field: 'educationEntries', label: 'Add' };
    if (s.includes('certification')) return { field: 'certEntries', label: 'Add' };
    return null;
}

function scrollToAndHighlight(fieldId) {
    var el = document.getElementById(fieldId);
    if (!el) return;
    var section = el.closest('.ats-editor-section');
    if (section) {
        var body = section.querySelector('.ats-section-body');
        if (body && body.style.display === 'none') { body.style.display = ''; }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') setTimeout(function () { el.focus(); }, 400);
    el.style.transition = 'box-shadow 0.3s';
    el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.5)';
    setTimeout(function () { el.style.boxShadow = ''; }, 2000);
}

function renderSuggestions(suggestions) {
    var list = document.getElementById('suggestionsList');
    if (!suggestions || suggestions.length === 0) {
        list.innerHTML = '<div class="ats-suggestion-item ats-suggestion-good">Your resume looks great!</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < suggestions.length; i++) {
        var s = suggestions[i];
        var target = getSuggestionTarget(s);
        var btnHtml = target ? '<button class="ats-fix-btn" onclick="scrollToAndHighlight(\'' + target.field + '\')">' + target.label + '</button>' : '';
        html += '<div class="ats-suggestion-item"><span class="ats-suggestion-text">' + escapeHtml(s) + '</span>' + btnHtml + '</div>';
    }
    list.innerHTML = html;
}

function renderSkills() {
    var container = document.getElementById('skillsContainer');
    var html = '';
    for (var i = 0; i < skills.length; i++) {
        html += '<span class="ats-tag">' + escapeHtml(skills[i]) + ' <button onclick="removeSkill(' + i + ')" class="ats-tag-remove">x</button></span>';
    }
    container.innerHTML = html;
    updatePreview();
}

function handleSkillInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        var val = e.target.value.trim();
        if (val && skills.indexOf(val) === -1) { skills.push(val); renderSkills(); }
        e.target.value = '';
    }
}

function removeSkill(i) { skills.splice(i, 1); renderSkills(); }

function addExperience(data) {
    data = data || {};
    var container = document.getElementById('experienceEntries');
    var idx = container.children.length;
    var div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = '<div class="ats-entry-header"><strong>Experience ' + (idx + 1) + '</strong><button class="ats-entry-remove" onclick="this.closest(\'.ats-entry-card\').remove(); updatePreview();">x</button></div>'
        + '<div class="ats-form-grid"><div class="ats-form-group"><label>Role / Job Title</label><input type="text" class="exp-role" value="' + escapeAttr(data.role || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Company</label><input type="text" class="exp-company" value="' + escapeAttr(data.company || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Start Date</label><input type="text" class="exp-start" placeholder="Mar 2024" value="' + escapeAttr(data.startDate || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>End Date</label><input type="text" class="exp-end" placeholder="Present" value="' + escapeAttr(data.endDate || '') + '" oninput="updatePreview()"></div></div>'
        + '<div class="ats-form-grid"><div class="ats-form-group"><label>Project Name (optional)</label><input type="text" class="exp-project" value="' + escapeAttr(data.project || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Project Description (optional)</label><input type="text" class="exp-project-desc" value="' + escapeAttr(data.projectDescription || '') + '" oninput="updatePreview()"></div></div>'
        + '<div class="ats-form-group"><label>Bullet Points (one per line)</label><textarea class="exp-bullets" rows="4" oninput="updatePreview()">' + (data.bullets || []).join('\n') + '</textarea></div>';
    container.appendChild(div);
    updatePreview();
}

function addEducation(data) {
    data = data || {};
    var container = document.getElementById('educationEntries');
    var idx = container.children.length;
    var div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = '<div class="ats-entry-header"><strong>Education ' + (idx + 1) + '</strong><button class="ats-entry-remove" onclick="this.closest(\'.ats-entry-card\').remove(); updatePreview();">x</button></div>'
        + '<div class="ats-form-grid"><div class="ats-form-group"><label>Degree</label><input type="text" class="edu-degree" value="' + escapeAttr(data.degree || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Field</label><input type="text" class="edu-field" value="' + escapeAttr(data.field || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Institution</label><input type="text" class="edu-institution" value="' + escapeAttr(data.institution || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Grade / GPA / %</label><input type="text" class="edu-grade" placeholder="7.8 / 10" value="' + escapeAttr(data.grade || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Year</label><input type="text" class="edu-year" placeholder="2023" value="' + escapeAttr(data.year || '') + '" oninput="updatePreview()"></div></div>';
    container.appendChild(div);
    updatePreview();
}

function addCertification(data) {
    data = data || {};
    var container = document.getElementById('certEntries');
    var idx = container.children.length;
    var div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = '<div class="ats-entry-header"><strong>Certification ' + (idx + 1) + '</strong><button class="ats-entry-remove" onclick="this.closest(\'.ats-entry-card\').remove(); updatePreview();">x</button></div>'
        + '<div class="ats-form-grid"><div class="ats-form-group"><label>Name</label><input type="text" class="cert-name" value="' + escapeAttr(data.name || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Issuer</label><input type="text" class="cert-issuer" value="' + escapeAttr(data.issuer || '') + '" oninput="updatePreview()"></div>'
        + '<div class="ats-form-group"><label>Year</label><input type="text" class="cert-year" placeholder="2023" value="' + escapeAttr(data.year || '') + '" oninput="updatePreview()"></div></div>';
    container.appendChild(div);
    updatePreview();
}

function collectFormData() {
    var experience = [];
    var expCards = document.querySelectorAll('#experienceEntries .ats-entry-card');
    for (var i = 0; i < expCards.length; i++) {
        var card = expCards[i];
        experience.push({
            role: (card.querySelector('.exp-role') || {}).value || '',
            company: (card.querySelector('.exp-company') || {}).value || '',
            startDate: (card.querySelector('.exp-start') || {}).value || '',
            endDate: (card.querySelector('.exp-end') || {}).value || '',
            project: (card.querySelector('.exp-project') || {}).value || '',
            projectDescription: (card.querySelector('.exp-project-desc') || {}).value || '',
            bullets: ((card.querySelector('.exp-bullets') || {}).value || '').split('\n').filter(Boolean)
        });
    }
    var education = [];
    var eduCards = document.querySelectorAll('#educationEntries .ats-entry-card');
    for (var j = 0; j < eduCards.length; j++) {
        var ecard = eduCards[j];
        education.push({
            degree: (ecard.querySelector('.edu-degree') || {}).value || '',
            field: (ecard.querySelector('.edu-field') || {}).value || '',
            institution: (ecard.querySelector('.edu-institution') || {}).value || '',
            grade: (ecard.querySelector('.edu-grade') || {}).value || '',
            year: (ecard.querySelector('.edu-year') || {}).value || ''
        });
    }
    var certifications = [];
    var certCards = document.querySelectorAll('#certEntries .ats-entry-card');
    for (var k = 0; k < certCards.length; k++) {
        var ccard = certCards[k];
        certifications.push({
            name: (ccard.querySelector('.cert-name') || {}).value || '',
            issuer: (ccard.querySelector('.cert-issuer') || {}).value || '',
            year: (ccard.querySelector('.cert-year') || {}).value || ''
        });
    }
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
        certifications: certifications
    };
}

async function rescoreResume() {
    var data = collectFormData();
    var btn = document.querySelector('.ats-editor-header .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Scoring...'; }
    try {
        var res = await fetch(API_BASE + '/ats-resume/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Score failed');
        var result = await res.json();
        var d = result.data || result;
        animateScore(d.atsScore || 0);
        renderSuggestions(d.suggestions || []);
        showToast('ATS score updated!', 'success');
    } catch (err) { showToast(err.message || 'Scoring failed', 'error'); }
    finally { if (btn) { btn.disabled = false; btn.textContent = 'Re-Score'; } }
}

// =============================================
// BUILD RESUME HTML - used by both preview and PDF
// Returns compact HTML matching the LaTeX template
// =============================================
function buildResumeHTML(data, compact) {
    var fs = compact ? '9pt' : '10pt';
    var lh = compact ? '1.2' : '1.45';
    var sm = compact ? '8pt' : '9pt';
    var xsm = compact ? '7.5pt' : '8.5pt';
    var secM = compact ? '4px 0 1px 0' : '8px 0 4px 0';
    var liM = compact ? '-2px' : '1px';
    var pad = compact ? '2px 4px' : '4px 8px';
    var nameSize = compact ? '16pt' : '18pt';

    function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function secBox(t) { return '<div style="background:#bfbfbf;padding:1px 5px;font-weight:bold;font-size:' + fs + ';margin:' + secM + ';">' + t + '</div>'; }

    var cats = {
        'Languages': ['java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'c', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css', 'go', 'rust', 'scala', 'r', 'perl', 'dart', 'html5', 'css3', 'sass', 'less'],
        'Core Backend': ['spring boot', 'spring', 'rest api', 'rest apis', 'microservices', 'oauth2', 'oauth', 'redis', 'kafka', 'mysql', 'postgresql', 'mongodb', 'elasticsearch', 'node.js', 'node', 'express', 'nestjs', 'graphql', 'jwt', 'rabbitmq', 'django', 'flask', 'fastapi', 'laravel', 'rails', 'asp.net', 'hibernate', 'jpa'],
        'ORM & Frameworks': ['hibernate', 'jpa', 'mvc', 'j2ee', 'mvc'],
        'Frontend': ['react', 'react.js', 'angular', 'vue', 'vue.js', 'next.js', 'nextjs', 'svelte', 'redux', 'tailwind', 'bootstrap', 'jquery', 'webpack', 'vite'],
        'DevOps & Tools': ['jenkins', 'docker', 'kubernetes', 'git', 'github', 'gitlab', 'postman', 'swagger', 'log4j2', 'aws', 'azure', 'gcp', 'linux', 'terraform', 'ansible', 'ci/cd', 'maven', 'gradle', 'nginx', 'vercel', 'heroku', 'netlify', 'firebase', 'cd (jenkins)', 'ci'],
        'Cloud/CI-CD': ['ci/cd pipelines', 'cd pipelines', 'containerization', 'deployment automation'],
        'Testing': ['junit', 'mockito', 'jest', 'pytest', 'selenium', 'cypress', 'mocha', 'chai'],
        'Practices': ['agile', 'scrum', 'debugging', 'exception handling', 'api documentation', 'devops', 'performance optimization', 'tdd', 'bdd', 'oop', 'design patterns', 'solid']
    };

    var h = '';
    // Header
    h += '<div style="font-size:' + nameSize + ';font-weight:bold;margin-bottom:2px;">' + esc(data.name || 'Your Name') + '</div>';
    if (data.email) h += '<div style="font-size:' + sm + ';">Email: <a href="mailto:' + esc(data.email) + '" style="color:#0000EE;">' + esc(data.email) + '</a></div>';
    if (data.phone) h += '<div style="font-size:' + sm + ';">Mobile: ' + esc(data.phone) + '</div>';
    if (data.location && !compact) h += '<div style="font-size:' + sm + ';">Location: ' + esc(data.location) + '</div>';
    if (data.linkedin) {
        var ldisp = data.linkedin.replace('https://www.', '').replace('https://', '');
        h += '<div style="font-size:' + sm + ';">LinkedIn: <a href="' + esc(data.linkedin) + '" style="color:#0000EE;">' + esc(ldisp) + '</a></div>';
    }

    // Summary
    if (data.summary && data.summary.trim()) {
        h += secBox('PROFESSIONAL SUMMARY');
        h += '<ul style="padding-left:16px;margin:1px 0;">';
        var parts = data.summary.split(/[.!]/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 10; });
        for (var pi = 0; pi < parts.length; pi++) {
            h += '<li style="font-size:' + sm + ';margin-bottom:' + liM + ';line-height:' + lh + ';">' + esc(parts[pi]) + '.</li>';
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
            var sk = data.skills[si];
            var low = sk.toLowerCase().trim();
            var fnd = false;
            var ckeys = Object.keys(cats);
            for (var ci = 0; ci < ckeys.length; ci++) {
                if (cats[ckeys[ci]].indexOf(low) !== -1) {
                    if (!categorized[ckeys[ci]]) categorized[ckeys[ci]] = [];
                    var dup2 = false;
                    for (var dd = 0; dd < categorized[ckeys[ci]].length; dd++) { if (categorized[ckeys[ci]][dd].toLowerCase() === low) dup2 = true; }
                    if (!dup2) categorized[ckeys[ci]].push(sk);
                    fnd = true; break;
                }
            }
            if (!fnd) uncategorized.push(sk);
        }
        var ck2 = Object.keys(categorized);
        for (var ck = 0; ck < ck2.length; ck++) {
            if (categorized[ck2[ck]].length > 0) {
                h += '<li style="font-size:' + sm + ';margin-bottom:' + liM + ';line-height:' + lh + ';"><b>' + esc(ck2[ck]) + ':</b> ' + categorized[ck2[ck]].map(function (s) { return esc(s); }).join(', ') + '</li>';
            }
        }
        if (uncategorized.length > 0) {
            h += '<li style="font-size:' + sm + ';margin-bottom:' + liM + ';line-height:' + lh + ';"><b>Other:</b> ' + uncategorized.map(function (s) { return esc(s); }).join(', ') + '</li>';
        }
        h += '</ul>';
    }

    // Experience
    if (data.experience && data.experience.length > 0) {
        h += secBox('PROFESSIONAL EXPERIENCE');
        h += '<ul style="padding-left:16px;margin:1px 0;list-style:none;">';
        for (var ei = 0; ei < data.experience.length; ei++) {
            var exp = data.experience[ei];
            var dates = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
            if (exp.role && exp.role.trim()) {
                h += '<li style="font-size:' + sm + ';margin-bottom:0;line-height:' + lh + ';">';
                h += '<b>' + esc(exp.role) + '</b>';
                if (exp.company) h += ' -- <i>' + esc(exp.company) + '</i>';
                if (dates) h += ' <span style="float:right;font-weight:bold;">' + esc(dates) + '</span>';
                h += '</li>';
            }
            if (exp.project && exp.project.trim()) {
                var projLine = '<b>Project: ' + esc(exp.project) + '</b>';
                if (exp.projectDescription) projLine += ' -- ' + esc(exp.projectDescription);
                h += '<div style="font-size:' + xsm + ';margin-left:0;line-height:' + lh + ';">' + projLine + '</div>';
            }
            if (exp.bullets && exp.bullets.length > 0) {
                h += '<ul style="padding-left:16px;margin:0;">';
                for (var bi = 0; bi < exp.bullets.length; bi++) {
                    h += '<li style="font-size:' + xsm + ';margin-bottom:' + liM + ';line-height:' + lh + ';">' + esc(exp.bullets[bi]) + '</li>';
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
        for (var ci3 = 0; ci3 < data.certifications.length; ci3++) {
            var cert = data.certifications[ci3];
            var cLine = esc(cert.name || '');
            if (cert.issuer) cLine += ' - ' + esc(cert.issuer);
            if (cert.year) cLine += ' (' + esc(cert.year) + ')';
            h += '<li style="font-size:' + sm + ';margin-bottom:' + liM + ';line-height:' + lh + ';">' + cLine + '</li>';
        }
        h += '</ul>';
    }

    // Education
    if (data.education && data.education.length > 0) {
        h += secBox('EDUCATION');
        h += '<ul style="padding-left:16px;margin:1px 0;">';
        for (var edi = 0; edi < data.education.length; edi++) {
            var edu = data.education[edi];
            var eParts = [];
            if (edu.degree) {
                var dp = '<b>' + esc(edu.degree) + '</b>';
                if (edu.field) dp += ' in ' + esc(edu.field);
                eParts.push(dp);
            }
            if (edu.institution) eParts.push(esc(edu.institution));
            var eLine2 = eParts.join(', ');
            if (edu.grade) eLine2 += ' -- <b>' + esc(edu.grade) + '</b>';
            if (edu.year) eLine2 += ' (' + esc(edu.year) + ')';
            if (eLine2.trim()) h += '<li style="font-size:' + sm + ';margin-bottom:' + liM + ';line-height:' + lh + ';">' + eLine2 + '</li>';
        }
        h += '</ul>';
    }

    return h;
}

// =============================================
// Download PDF - html2canvas + jsPDF
// =============================================
async function downloadPdf() {
    var btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.textContent = 'Generating PDF...';

    try {
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
        console.log('[PDF] Data collected:', JSON.stringify({
            name: data.name,
            expCount: data.experience.length,
            certCount: data.certifications.length,
            eduCount: data.education.length,
            skillCount: data.skills.length
        }));

        // Build compact LaTeX-matching HTML
        var resumeHTML = buildResumeHTML(data, true);

        // Create hidden container
        var container = document.createElement('div');
        container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;padding:48px 56px 48px 36px;box-sizing:border-box;z-index:-1;font-family:Palatino Linotype,Book Antiqua,Palatino,Times New Roman,serif;font-size:9pt;color:#000;line-height:1.2;';
        container.innerHTML = resumeHTML;
        document.body.appendChild(container);

        console.log('[PDF] Container height:', container.scrollHeight, 'px');

        var canvas = await html2canvas(container, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        });
        document.body.removeChild(container);

        console.log('[PDF] Canvas size:', canvas.width, 'x', canvas.height);

        // Create PDF
        var jsPDF2 = window.jspdf.jsPDF;
        var pdf = new jsPDF2('p', 'mm', 'a4');
        var pdfW = 210, pdfH = 297;
        var imgW = canvas.width;
        var imgH = canvas.height;
        var ratio = pdfW / imgW;
        var scaledH = imgH * ratio;

        if (scaledH <= pdfH) {
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, scaledH);
        } else {
            var pagePixH = pdfH / ratio;
            var yOff = 0;
            var pg = 0;
            while (yOff < imgH) {
                if (pg > 0) pdf.addPage();
                var slH = Math.min(pagePixH, imgH - yOff);
                var pc = document.createElement('canvas');
                pc.width = imgW; pc.height = slH;
                var ctx = pc.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, imgW, slH);
                ctx.drawImage(canvas, 0, yOff, imgW, slH, 0, 0, imgW, slH);
                pdf.addImage(pc.toDataURL('image/png'), 'PNG', 0, 0, pdfW, slH * ratio);
                yOff += slH;
                pg++;
            }
        }

        pdf.save('ats_resume.pdf');
        showToast('PDF downloaded!', 'success');
    } catch (err) {
        console.error('[PDF] Error:', err);
        showToast(err.message || 'PDF failed', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Download ATS PDF';
    }
}

// =============================================
// Live Preview - uses same buildResumeHTML
// =============================================
function updatePreview() {
    var data = collectFormData();
    var frame = document.getElementById('previewFrame');
    var html = '<div style="font-family:Palatino Linotype,Book Antiqua,Palatino,serif;font-size:10pt;color:#000;line-height:1.45;padding:4px 8px;">';
    html += buildResumeHTML(data, false);
    html += '</div>';
    frame.innerHTML = html;
}

function toggleEditorSection(titleEl) {
    var body = titleEl.nextElementSibling;
    var toggle = titleEl.querySelector('.ats-section-toggle');
    if (body.style.display === 'none') { body.style.display = 'block'; if (toggle) toggle.textContent = 'v'; }
    else { body.style.display = 'none'; if (toggle) toggle.textContent = '>'; }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
