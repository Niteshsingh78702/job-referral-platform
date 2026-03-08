// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATS Resume Builder — Frontend Logic (No Login Required)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_BASE = window.location.origin + '/api/v1';
let currentResumeData = null;
let skills = [];

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const toast = document.getElementById('atsToast');
    const msgEl = document.getElementById('atsToastMsg');
    msgEl.textContent = msg;
    toast.className = 'ats-toast ats-toast-' + type;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

// ─────────────────────────────────────────────
// Drag & Drop
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const area = document.getElementById('uploadArea');
    if (!area) return;

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('ats-drag-over');
    });
    area.addEventListener('dragleave', () => {
        area.classList.remove('ats-drag-over');
    });
    area.addEventListener('drop', (e) => {
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

// ─────────────────────────────────────────────
// Upload (no auth required)
// ─────────────────────────────────────────────
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
    const interval = setInterval(() => {
        pct = Math.min(pct + Math.random() * 15, 90);
        fill.style.width = pct + '%';
        text.textContent = `Analyzing & improving your resume... ${Math.round(pct)}%`;
    }, 300);

    try {
        const fd = new FormData();
        fd.append('resume', file);
        const res = await fetch(`${API_BASE}/ats-resume/upload`, {
            method: 'POST',
            body: fd,
        });

        clearInterval(interval);

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Upload failed');
        }

        fill.style.width = '100%';
        text.textContent = 'Done! ✅ Resume analyzed & improved!';

        const data = await res.json();
        const result = data.data || data;

        setTimeout(() => {
            progress.style.display = 'none';
            fill.style.width = '0%';
            loadResumeData(result);
        }, 800);

        showToast('✨ Resume analyzed, improved & scored!', 'success');
    } catch (err) {
        clearInterval(interval);
        progress.style.display = 'none';
        fill.style.width = '0%';
        showToast(err.message || 'Upload failed', 'error');
    }
}

// ─────────────────────────────────────────────
// Populate editor from data
// ─────────────────────────────────────────────
function loadResumeData(result) {
    currentResumeData = result;
    const d = result.parsedData;

    // Show results section
    document.getElementById('resultsSection').style.display = 'block';

    // Score
    animateScore(result.atsScore || 0);

    // Suggestions
    renderSuggestions(result.suggestions || []);

    // Personal info
    document.getElementById('edName').value = d.name || '';
    document.getElementById('edEmail').value = d.email || '';
    document.getElementById('edPhone').value = d.phone || '';
    document.getElementById('edLocation').value = d.location || '';
    document.getElementById('edLinkedin').value = d.linkedin || '';
    document.getElementById('edSummary').value = d.summary || '';

    // Skills
    skills = d.skills || [];
    renderSkills();

    // Experience
    const expContainer = document.getElementById('experienceEntries');
    expContainer.innerHTML = '';
    (d.experience || []).forEach((exp) => addExperience(exp));

    // Education
    const eduContainer = document.getElementById('educationEntries');
    eduContainer.innerHTML = '';
    (d.education || []).forEach((edu) => addEducation(edu));

    // Certifications
    const certContainer = document.getElementById('certEntries');
    certContainer.innerHTML = '';
    (d.certifications || []).forEach((cert) => addCertification(cert));

    // Preview
    updatePreview();

    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// Score Gauge Animation
// ─────────────────────────────────────────────
function animateScore(score) {
    const circle = document.getElementById('gaugeCircle');
    const valueEl = document.getElementById('scoreValue');
    const labelEl = document.getElementById('scoreLabel');
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (score / 100) * circumference;

    let color = '#ef4444';
    let label = 'Needs Improvement';
    if (score >= 80) { color = '#22c55e'; label = '🎯 Excellent — ATS Optimized!'; }
    else if (score >= 60) { color = '#eab308'; label = 'Good — Almost There'; }
    else if (score >= 40) { color = '#f97316'; label = 'Fair — Needs Work'; }

    circle.style.stroke = color;
    circle.style.transition = 'stroke-dashoffset 1.5s ease-out';
    circle.style.strokeDashoffset = offset;

    let current = 0;
    const step = Math.max(1, Math.floor(score / 40));
    const timer = setInterval(() => {
        current = Math.min(current + step, score);
        valueEl.textContent = current + '%';
        if (current >= score) clearInterval(timer);
    }, 30);

    labelEl.textContent = label;
    labelEl.style.color = color;
}

// ─────────────────────────────────────────────
// Suggestions with actionable Fix buttons
// ─────────────────────────────────────────────

// Map suggestion text patterns to target editor field IDs
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

    // Find the parent editor section and make sure it's open
    let section = el.closest('.ats-editor-section');
    if (section) {
        const body = section.querySelector('.ats-section-body');
        if (body && body.style.display === 'none') {
            body.style.display = '';
            const toggle = section.querySelector('.ats-section-toggle');
            if (toggle) toggle.textContent = '▼';
        }
    }

    // Scroll into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Focus if it's an input/textarea
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        setTimeout(() => el.focus(), 400);
    }

    // Add highlight pulse animation
    el.style.transition = 'box-shadow 0.3s, outline 0.3s';
    el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.5)';
    el.style.outline = '2px solid #6366f1';
    setTimeout(() => {
        el.style.boxShadow = '';
        el.style.outline = '';
    }, 2000);
}

function renderSuggestions(suggestions) {
    const list = document.getElementById('suggestionsList');
    if (!suggestions || suggestions.length === 0) {
        list.innerHTML = '<div class="ats-suggestion-item ats-suggestion-good">🎉 Your resume looks great! No major issues found.</div>';
        return;
    }
    list.innerHTML = suggestions.map((s) => {
        const target = getSuggestionTarget(s);
        const btnHtml = target
            ? `<button class="ats-fix-btn" onclick="scrollToAndHighlight('${target.field}')">${target.label} →</button>`
            : '';
        return `<div class="ats-suggestion-item">
            <span class="ats-suggestion-icon">⚡</span>
            <span class="ats-suggestion-text">${escapeHtml(s)}</span>
            ${btnHtml}
        </div>`;
    }).join('');
}

// ─────────────────────────────────────────────
// Skills Tag Input
// ─────────────────────────────────────────────
function renderSkills() {
    const container = document.getElementById('skillsContainer');
    container.innerHTML = skills.map((s, i) =>
        `<span class="ats-tag">
            ${escapeHtml(s)}
            <button onclick="removeSkill(${i})" class="ats-tag-remove">×</button>
        </span>`
    ).join('');
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

// ─────────────────────────────────────────────
// Experience Entries (with project fields)
// ─────────────────────────────────────────────
function addExperience(data = {}) {
    const container = document.getElementById('experienceEntries');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = `
        <div class="ats-entry-header">
            <strong>Experience ${idx + 1}</strong>
            <button class="ats-entry-remove" onclick="this.closest('.ats-entry-card').remove(); updatePreview();">×</button>
        </div>
        <div class="ats-form-grid">
            <div class="ats-form-group">
                <label>Role / Job Title</label>
                <input type="text" class="exp-role" value="${escapeAttr(data.role || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Company</label>
                <input type="text" class="exp-company" value="${escapeAttr(data.company || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Start Date</label>
                <input type="text" class="exp-start" placeholder="Mar 2024" value="${escapeAttr(data.startDate || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>End Date</label>
                <input type="text" class="exp-end" placeholder="Present" value="${escapeAttr(data.endDate || '')}" oninput="updatePreview()">
            </div>
        </div>
        <div class="ats-form-grid">
            <div class="ats-form-group">
                <label>Project Name (optional)</label>
                <input type="text" class="exp-project" value="${escapeAttr(data.project || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Project Description (optional)</label>
                <input type="text" class="exp-project-desc" value="${escapeAttr(data.projectDescription || '')}" oninput="updatePreview()">
            </div>
        </div>
        <div class="ats-form-group">
            <label>Bullet Points (one per line)</label>
            <textarea class="exp-bullets" rows="4" oninput="updatePreview()"
                placeholder="Designed RESTful APIs for claim submission...\nImproved API performance by 35% via async programming...">${(data.bullets || []).join('\n')}</textarea>
        </div>
    `;
    container.appendChild(div);
    updatePreview();
}

// ─────────────────────────────────────────────
// Education Entries (with grade field)
// ─────────────────────────────────────────────
function addEducation(data = {}) {
    const container = document.getElementById('educationEntries');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = `
        <div class="ats-entry-header">
            <strong>Education ${idx + 1}</strong>
            <button class="ats-entry-remove" onclick="this.closest('.ats-entry-card').remove(); updatePreview();">×</button>
        </div>
        <div class="ats-form-grid">
            <div class="ats-form-group">
                <label>Degree</label>
                <input type="text" class="edu-degree" value="${escapeAttr(data.degree || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Field</label>
                <input type="text" class="edu-field" value="${escapeAttr(data.field || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Institution</label>
                <input type="text" class="edu-institution" value="${escapeAttr(data.institution || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Grade / GPA / %</label>
                <input type="text" class="edu-grade" placeholder="7.8 / 10" value="${escapeAttr(data.grade || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Year</label>
                <input type="text" class="edu-year" placeholder="2023" value="${escapeAttr(data.year || '')}" oninput="updatePreview()">
            </div>
        </div>
    `;
    container.appendChild(div);
    updatePreview();
}

// ─────────────────────────────────────────────
// Certification Entries
// ─────────────────────────────────────────────
function addCertification(data = {}) {
    const container = document.getElementById('certEntries');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'ats-entry-card';
    div.innerHTML = `
        <div class="ats-entry-header">
            <strong>Certification ${idx + 1}</strong>
            <button class="ats-entry-remove" onclick="this.closest('.ats-entry-card').remove(); updatePreview();">×</button>
        </div>
        <div class="ats-form-grid">
            <div class="ats-form-group">
                <label>Name</label>
                <input type="text" class="cert-name" value="${escapeAttr(data.name || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Issuer</label>
                <input type="text" class="cert-issuer" value="${escapeAttr(data.issuer || '')}" oninput="updatePreview()">
            </div>
            <div class="ats-form-group">
                <label>Year</label>
                <input type="text" class="cert-year" placeholder="2023" value="${escapeAttr(data.year || '')}" oninput="updatePreview()">
            </div>
        </div>
    `;
    container.appendChild(div);
    updatePreview();
}

// ─────────────────────────────────────────────
// Collect form data (including project & grade)
// ─────────────────────────────────────────────
function collectFormData() {
    const experience = [];
    document.querySelectorAll('#experienceEntries .ats-entry-card').forEach((card) => {
        experience.push({
            role: card.querySelector('.exp-role')?.value || '',
            company: card.querySelector('.exp-company')?.value || '',
            startDate: card.querySelector('.exp-start')?.value || '',
            endDate: card.querySelector('.exp-end')?.value || '',
            project: card.querySelector('.exp-project')?.value || '',
            projectDescription: card.querySelector('.exp-project-desc')?.value || '',
            bullets: (card.querySelector('.exp-bullets')?.value || '').split('\n').filter(Boolean),
        });
    });

    const education = [];
    document.querySelectorAll('#educationEntries .ats-entry-card').forEach((card) => {
        education.push({
            degree: card.querySelector('.edu-degree')?.value || '',
            field: card.querySelector('.edu-field')?.value || '',
            institution: card.querySelector('.edu-institution')?.value || '',
            grade: card.querySelector('.edu-grade')?.value || '',
            year: card.querySelector('.edu-year')?.value || '',
        });
    });

    const certifications = [];
    document.querySelectorAll('#certEntries .ats-entry-card').forEach((card) => {
        certifications.push({
            name: card.querySelector('.cert-name')?.value || '',
            issuer: card.querySelector('.cert-issuer')?.value || '',
            year: card.querySelector('.cert-year')?.value || '',
        });
    });

    return {
        name: document.getElementById('edName').value,
        email: document.getElementById('edEmail').value,
        phone: document.getElementById('edPhone').value,
        location: document.getElementById('edLocation').value,
        linkedin: document.getElementById('edLinkedin').value,
        summary: document.getElementById('edSummary').value,
        skills,
        experience,
        education,
        certifications,
    };
}

// ─────────────────────────────────────────────
// Re-score
// ─────────────────────────────────────────────
async function rescoreResume() {
    const data = collectFormData();
    const btn = document.querySelector('.ats-editor-header .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Scoring...'; }

    try {
        const res = await fetch(`${API_BASE}/ats-resume/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Score failed');
        }

        const result = (await res.json());
        const d = result.data || result;
        animateScore(d.atsScore || 0);
        renderSuggestions(d.suggestions || []);
        showToast('ATS score updated!', 'success');
    } catch (err) {
        showToast(err.message || 'Scoring failed', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🔄 Re-Score'; }
    }
}

// ─────────────────────────────────────────────
// Download PDF — Captures the Live Preview as PDF
// Uses html2canvas + jsPDF for pixel-perfect output
// ─────────────────────────────────────────────
async function downloadPdf() {
    const btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.textContent = '\u23F3 Generating PDF...';

    try {
        // Dynamically load html2canvas if needed
        if (typeof html2canvas === 'undefined') {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                s.onload = resolve;
                s.onerror = () => reject(new Error('Failed to load html2canvas library.'));
                document.head.appendChild(s);
            });
        }
        // Dynamically load jsPDF if needed
        if (!window.jspdf) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
                s.onload = resolve;
                s.onerror = () => reject(new Error('Failed to load jsPDF library.'));
                document.head.appendChild(s);
            });
        }

        // Make sure the preview is up-to-date
        updatePreview();

        // Get the preview content
        const previewFrame = document.getElementById('previewFrame');
        if (!previewFrame || !previewFrame.innerHTML.trim()) {
            throw new Error('No resume data to export. Please upload a resume first.');
        }

        // Create a hidden container that matches A4 proportions
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;padding:40px 50px;box-sizing:border-box;z-index:-1;';
        container.innerHTML = previewFrame.innerHTML;
        document.body.appendChild(container);

        // Render to canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        document.body.removeChild(container);

        // Create PDF — fit canvas to A4 pages
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = 210;  // A4 width in mm
        const pdfH = 297;  // A4 height in mm
        const marginX = 0;
        const marginY = 0;
        const contentW = pdfW - marginX * 2;

        const imgW = canvas.width;
        const imgH = canvas.height;
        const ratio = contentW / imgW;
        const scaledH = imgH * ratio;

        // If content fits on one page
        if (scaledH <= pdfH - marginY * 2) {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', marginX, marginY, contentW, scaledH);
        } else {
            // Multi-page: slice the canvas into page-sized chunks
            const pageContentH = (pdfH - marginY * 2) / ratio; // pixels per page
            let yOffset = 0;
            let page = 0;

            while (yOffset < imgH) {
                if (page > 0) pdf.addPage();

                const sliceH = Math.min(pageContentH, imgH - yOffset);
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = imgW;
                pageCanvas.height = sliceH;
                const ctx = pageCanvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, imgW, sliceH);
                ctx.drawImage(canvas, 0, yOffset, imgW, sliceH, 0, 0, imgW, sliceH);

                const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
                const pageScaledH = sliceH * ratio;
                pdf.addImage(pageImgData, 'JPEG', marginX, marginY, contentW, pageScaledH);

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
        btn.textContent = '\uD83D\uDCE5 Download ATS PDF';
    }
}

// ─────────────────────────────────────────────

// Live Preview — Matches LaTeX template style
// ─────────────────────────────────────────────
function updatePreview() {
    const d = collectFormData();
    const frame = document.getElementById('previewFrame');

    let html = `<div class="ats-preview-resume" style="font-family:'Palatino Linotype','Book Antiqua',Palatino,serif;font-size:10pt;color:#000;line-height:1.45;padding:4px 8px;">`;

    // Header
    html += `<div style="margin-bottom:8px;">
        <div style="font-size:18pt;font-weight:bold;">${escapeHtml(d.name || 'Your Name')}</div>`;
    if (d.email) html += `<div style="font-size:9pt;">Email: <a href="mailto:${escapeHtml(d.email)}" style="color:#0000ff;">${escapeHtml(d.email)}</a></div>`;
    if (d.phone) html += `<div style="font-size:9pt;">Mobile: ${escapeHtml(d.phone)}</div>`;
    if (d.location) html += `<div style="font-size:9pt;">Location: ${escapeHtml(d.location)}</div>`;
    if (d.linkedin) html += `<div style="font-size:9pt;">LinkedIn: <a href="${escapeHtml(d.linkedin)}" style="color:#0000ff;" target="_blank">${escapeHtml(d.linkedin.replace('https://www.', '').replace('https://', ''))}</a></div>`;
    html += `</div>`;

    // Section heading helper
    const sectionHead = (title) => `<div style="background:#bfbfbf;padding:2px 6px;font-weight:bold;font-size:10pt;margin:8px 0 4px 0;">${title}</div>`;

    // Summary
    if (d.summary) {
        html += sectionHead('PROFESSIONAL SUMMARY');
        html += `<ul style="padding-left:18px;margin:2px 0;">`;
        const parts = d.summary.split(/[.!]/).map(s => s.trim()).filter(s => s.length > 10);
        parts.forEach(p => { html += `<li style="font-size:9pt;margin-bottom:1px;">${escapeHtml(p)}.</li>`; });
        html += `</ul>`;
    }

    // Skills — categorized, compact format
    if (d.skills && d.skills.length > 0) {
        html += sectionHead('KEY SKILLS');
        html += `<ul style="padding-left:18px;margin:2px 0;">`;

        // Categorize skills for professional display
        const skillCategories = {
            'Languages': ['java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'c', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css', 'go', 'rust', 'scala', 'r', 'perl', 'dart', 'html5', 'css3', 'sass', 'less'],
            'Core Backend': ['spring boot', 'spring', 'rest api', 'rest apis', 'microservices', 'oauth2', 'oauth', 'redis', 'kafka', 'mysql', 'postgresql', 'mongodb', 'elasticsearch', 'node.js', 'node', 'express', 'nestjs', 'graphql', 'jwt', 'rabbitmq', 'django', 'flask', 'fastapi', 'laravel', 'rails', 'asp.net', 'hibernate', 'jpa'],
            'Frontend': ['react', 'react.js', 'angular', 'vue', 'vue.js', 'next.js', 'nextjs', 'nuxt.js', 'svelte', 'redux', 'tailwind', 'tailwind css', 'bootstrap', 'material ui', 'chakra ui', 'jquery', 'webpack', 'vite'],
            'DevOps & Tools': ['jenkins', 'docker', 'kubernetes', 'git', 'github', 'gitlab', 'postman', 'swagger', 'log4j2', 'aws', 'azure', 'gcp', 'linux', 'terraform', 'ansible', 'ci/cd', 'maven', 'gradle', 'nginx', 'vercel', 'heroku', 'netlify', 'firebase', 'aws (ec2)', 's3', 'cd (jenkins)', 'ci'],
            'Testing': ['junit', 'mockito', 'jest', 'pytest', 'selenium', 'cypress', 'mocha', 'chai', 'testing library'],
            'Practices': ['agile', 'scrum', 'debugging', 'exception handling', 'api documentation', 'devops', 'performance optimization', 'tdd', 'bdd', 'oop', 'design patterns', 'solid'],
        };

        const categorized = {};
        const uncategorized = [];

        for (const skill of d.skills) {
            const lower = skill.toLowerCase().trim();
            let found = false;
            for (const [cat, keywords] of Object.entries(skillCategories)) {
                if (keywords.includes(lower)) {
                    if (!categorized[cat]) categorized[cat] = [];
                    if (!categorized[cat].some(s => s.toLowerCase() === lower)) {
                        categorized[cat].push(skill);
                    }
                    found = true;
                    break;
                }
            }
            if (!found) uncategorized.push(skill);
        }

        // Render categorized skills
        for (const [cat, list] of Object.entries(categorized)) {
            if (list.length > 0) {
                html += `<li style="font-size:9pt;margin-bottom:1px;"><b>${escapeHtml(cat)}:</b> ${list.map(s => escapeHtml(s)).join(', ')}</li>`;
            }
        }
        if (uncategorized.length > 0) {
            html += `<li style="font-size:9pt;margin-bottom:1px;"><b>Other:</b> ${uncategorized.map(s => escapeHtml(s)).join(', ')}</li>`;
        }

        html += `</ul>`;
    }

    // Experience
    if (d.experience && d.experience.length > 0) {
        html += sectionHead('PROFESSIONAL EXPERIENCE');
        d.experience.forEach(exp => {
            const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' \u2013 ');
            const hasRole = exp.role && exp.role.trim();
            const hasProject = exp.project && exp.project.trim();

            if (hasRole) {
                // Work experience entry: Role — Company  Date
                html += `<div style="margin:4px 0 2px 0;">
                    <b>${escapeHtml(exp.role)}</b>`;
                if (exp.company) html += ` \u2014 <i>${escapeHtml(exp.company)}</i>`;
                if (dates) html += ` <span style="float:right;font-weight:bold;font-size:9pt;">${escapeHtml(dates)}</span>`;
                html += `</div>`;
                if (hasProject) {
                    html += `<div style="font-size:9pt;"><b>Project: ${escapeHtml(exp.project)}</b>`;
                    if (exp.projectDescription) html += ` \u2014 ${escapeHtml(exp.projectDescription)}`;
                    html += `</div>`;
                }
            } else if (hasProject) {
                // Project-only entry: Project Name — TechStack
                html += `<div style="margin:4px 0 2px 0;">
                    <b>Project: ${escapeHtml(exp.project)}</b>`;
                if (exp.projectDescription) html += ` \u2014 ${escapeHtml(exp.projectDescription)}`;
                html += `</div>`;
            }

            if (exp.bullets && exp.bullets.length > 0) {
                html += `<ul style="padding-left:18px;margin:2px 0;">`;
                exp.bullets.forEach(b => { html += `<li style="font-size:9pt;margin-bottom:1px;">${escapeHtml(b)}</li>`; });
                html += `</ul>`;
            }
        });
    }

    // Certifications
    if (d.certifications && d.certifications.length > 0) {
        html += sectionHead('CERTIFICATIONS');
        html += `<ul style="padding-left:18px;margin:2px 0;">`;
        d.certifications.forEach(c => {
            let line = escapeHtml(c.name || '');
            if (c.issuer) line += ` \u2013 ${escapeHtml(c.issuer)}`;
            if (c.year) line += ` (${escapeHtml(c.year)})`;
            html += `<li style="font-size:9pt;">${line}</li>`;
        });
        html += `</ul>`;
    }

    // Education
    if (d.education && d.education.length > 0) {
        html += sectionHead('EDUCATION');
        html += `<ul style="padding-left:18px;margin:2px 0;">`;
        d.education.forEach(edu => {
            let parts = [];
            if (edu.degree) {
                let dPart = `<b>${escapeHtml(edu.degree)}</b>`;
                if (edu.field) dPart += ` in ${escapeHtml(edu.field)}`;
                parts.push(dPart);
            }
            if (edu.institution) parts.push(escapeHtml(edu.institution));
            let line = parts.join(', ');
            if (edu.grade) line += ` \u2014 <b>${escapeHtml(edu.grade)}</b>`;
            if (edu.year) line += ` (${escapeHtml(edu.year)})`;
            if (line.trim()) html += `<li style="font-size:9pt;">${line}</li>`;
        });
        html += `</ul>`;
    }

    html += `</div>`;
    frame.innerHTML = html;
}

// ─────────────────────────────────────────────
// Section toggle
// ─────────────────────────────────────────────
function toggleEditorSection(titleEl) {
    const body = titleEl.nextElementSibling;
    const toggle = titleEl.querySelector('.ats-section-toggle');
    if (body.style.display === 'none') {
        body.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        body.style.display = 'none';
        toggle.textContent = '▶';
    }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
