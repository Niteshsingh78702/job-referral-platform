// =============================================
// Configuration
// =============================================
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/v1'
    : `${window.location.origin}/api/v1`;

// =============================================
// State Management
// =============================================
let state = {
    user: null,
    token: null,
    jobs: [],
    applications: [],
    isLoading: false,
};

// Confirmation modal state
let confirmModalResolver = null;

// =============================================
// Initialize App
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadJobs();

    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
        const profileMenu = document.getElementById('profileMenu');
        const profileBtn = document.querySelector('.profile-btn');
        if (profileMenu && profileBtn && !profileBtn.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });

    // Auto-filter: Apply filters automatically when dropdown values change
    const filterIds = ['locationFilter', 'experienceFilter', 'jobTypeFilter', 'workModeFilter', 'postedDateFilter', 'sortBy'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => searchJobs());
        }
    });

    // Also trigger search on Enter key in search input
    const searchInput = document.getElementById('jobSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchJobs();
            }
        });
    }
});

// =============================================
// Authentication
// =============================================
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            state.token = token;
            state.user = JSON.parse(user);

            // Redirect based on role
            if (state.user.role === 'EMPLOYEE') {
                window.location.href = 'employee-dashboard.html';
                return;
            } else if (state.user.role === 'HR') {
                window.location.href = 'hr-dashboard.html';
                return;
            } else if (state.user.role === 'ADMIN') {
                window.location.href = 'admin.html';
                return;
            }

            updateUIForLoggedInUser();

            // Fetch full profile from backend to ensure data is up-to-date
            fetchCandidateProfile();
        } catch (e) {
            // Invalid stored data, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
}

// Fetch candidate profile from backend and merge with state.user
async function fetchCandidateProfile() {
    if (!state.token || state.user?.role !== 'CANDIDATE') return;

    try {
        const response = await fetch(`${API_BASE_URL}/candidates/profile`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (response.ok) {
            const result = await response.json();
            const profile = result.data || result;

            // Extract skills from CandidateSkill array with safety check
            const skills = (profile.CandidateSkill || []).map(s => s?.name).filter(Boolean);

            // Safely extract resume filename
            let resumeData = state.user?.resume;
            if (profile.resumeUrl && typeof profile.resumeUrl === 'string') {
                const parts = profile.resumeUrl.split('/');
                resumeData = { filename: parts[parts.length - 1] || profile.resumeUrl };
            }

            // Merge profile data with existing user data (with safety checks)
            const profileData = {
                ...state.user,
                firstName: profile.firstName || state.user?.firstName,
                lastName: profile.lastName || state.user?.lastName,
                phone: profile.User?.phone || profile.phone || state.user?.phone,
                linkedIn: profile.linkedIn || state.user?.linkedIn,
                experience: profile.totalExperience || profile.experience || state.user?.experience,
                skills: skills.length > 0 ? skills : (state.user?.skills || []),
                preferredLocations: profile.preferredLocations || state.user?.preferredLocations || [],
                preferredLocation: profile.preferredLocation || state.user?.preferredLocation,
                resume: resumeData,
                resumeUrl: profile.resumeUrl || state.user?.resumeUrl
            };

            state.user = profileData;
            localStorage.setItem('user', JSON.stringify(state.user));

            // Update UI silently (no toasts)
            updateDashboard();
            updateProfileCompletion();
        }
    } catch (error) {
        console.log('Could not fetch profile from backend, using cached data');
    }
}


function updateUIForLoggedInUser() {
    // Update navigation
    document.getElementById('navAuth').style.display = 'none';
    document.getElementById('navUser').style.display = 'flex';

    // Get user display name
    const displayName = getUserDisplayName();
    const initial = displayName.charAt(0).toUpperCase();

    // Update navbar user info
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    if (userNameEl) userNameEl.textContent = displayName;
    if (userAvatarEl) userAvatarEl.textContent = initial;

    // Update hero CTA
    updateHeroCTA(true);

    // Update pricing CTA
    updatePricingCTA(true);

    // Show dashboard section
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
        updateDashboard();
    }
}

function updateUIForLoggedOutUser() {
    // Update navigation
    document.getElementById('navAuth').style.display = 'flex';
    document.getElementById('navUser').style.display = 'none';

    // Update hero CTA
    updateHeroCTA(false);

    // Update pricing CTA
    updatePricingCTA(false);

    // Hide dashboard section
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        dashboardSection.style.display = 'none';
    }
}

function updateHeroCTA(isLoggedIn) {
    const heroMainBtn = document.getElementById('heroMainBtn');
    const heroSecondaryBtn = document.getElementById('heroSecondaryBtn');

    if (heroMainBtn) {
        if (isLoggedIn) {
            heroMainBtn.innerHTML = 'Browse Jobs <span class="btn-arrow">→</span>';
            heroMainBtn.onclick = () => scrollToSection('#jobs');
        } else {
            heroMainBtn.innerHTML = 'Start Your Journey <span class="btn-arrow">→</span>';
            heroMainBtn.onclick = () => showModal('register');
        }
    }

    if (heroSecondaryBtn) {
        if (isLoggedIn) {
            heroSecondaryBtn.textContent = 'My Dashboard';
            heroSecondaryBtn.onclick = () => scrollToSection('#dashboard');
        } else {
            heroSecondaryBtn.textContent = 'Learn More';
            heroSecondaryBtn.onclick = () => scrollToSection('#how-it-works');
        }
    }
}

function updatePricingCTA(isLoggedIn) {
    const pricingCta = document.getElementById('pricingCta');
    if (pricingCta) {
        if (isLoggedIn) {
            pricingCta.textContent = 'Browse Jobs';
            pricingCta.onclick = () => scrollToSection('#jobs');
        } else {
            pricingCta.textContent = 'Get Started Free';
            pricingCta.onclick = () => showModal('register');
        }
    }
}

function updateDashboard() {
    const displayName = getUserDisplayName();
    const initial = displayName.charAt(0).toUpperCase();

    // Update dashboard welcome
    const dashboardUserName = document.getElementById('dashboardUserName');
    if (dashboardUserName) dashboardUserName.textContent = displayName;

    // Update profile card
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    const profileFullName = document.getElementById('profileFullName');
    const profileEmail = document.getElementById('profileEmail');
    const profileRole = document.getElementById('profileRole');

    if (profileAvatarLarge) profileAvatarLarge.textContent = initial;
    if (profileFullName) {
        const fullName = state.user.firstName && state.user.lastName
            ? `${state.user.firstName} ${state.user.lastName}`
            : displayName;
        profileFullName.textContent = fullName;
    }
    if (profileEmail) profileEmail.textContent = state.user.email || '';
    if (profileRole) {
        const roleMap = {
            'CANDIDATE': 'Job Seeker',
            'EMPLOYEE': 'Referrer',
            'HR': 'HR/Recruiter',
            'ADMIN': 'Administrator'
        };
        profileRole.textContent = roleMap[state.user.role] || 'Candidate';
    }

    // Load user stats
    loadUserStats();
}

async function loadUserStats() {
    // For now, show default values
    // In production, this would fetch from API
    const stats = {
        applications: 0,
        tests: 0,
        passed: 0,
        referrals: 0
    };

    // Try to fetch from API if available
    if (state.token) {
        try {
            // Attempt to get candidate profile
            const response = await fetch(`${API_BASE_URL}/candidates/me`, {
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    // Update stats from candidate data if available
                    stats.applications = data.data.applications?.length || 0;
                }
            }
        } catch (e) {
            // Silently fail - just use default values
        }
    }

    // Update UI
    document.getElementById('statApplications').textContent = stats.applications;
    document.getElementById('statTests').textContent = stats.tests;
    document.getElementById('statPassed').textContent = stats.passed;
    document.getElementById('statReferrals').textContent = stats.referrals;
}

function getUserDisplayName() {
    if (!state.user) return 'User';

    if (state.user.firstName) {
        return state.user.firstName;
    }

    if (state.user.email) {
        return state.user.email.split('@')[0];
    }

    return 'User';
}

function toggleProfileMenu() {
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) {
        profileMenu.classList.toggle('active');
    }
}

function showDashboard() {
    scrollToSection('#dashboard');
    document.getElementById('profileMenu')?.classList.remove('active');
}

function showProfile() {
    showToast('info', 'Profile settings coming soon!');
    document.getElementById('profileMenu')?.classList.remove('active');
}

function showApplications() {
    showToast('info', 'Applications page coming soon!');
    document.getElementById('profileMenu')?.classList.remove('active');
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
            // Backend returns: { token: { accessToken, refreshToken }, user }
            state.token = data.data.token.accessToken;
            // Handle case where user object might not be in response
            state.user = data.data.user || { email: email };

            localStorage.setItem('token', state.token);
            localStorage.setItem('user', JSON.stringify(state.user));

            closeModal();
            showToast('success', 'Welcome back! Redirecting...');

            // Redirect based on role
            setTimeout(() => {
                if (state.user.role === 'EMPLOYEE') {
                    window.location.href = 'employee-dashboard.html';
                } else if (state.user.role === 'HR') {
                    window.location.href = 'hr-dashboard.html';
                } else if (state.user.role === 'ADMIN') {
                    window.location.href = 'admin.html';
                } else {
                    // Candidate / default - stay on page
                    updateUIForLoggedInUser();
                    scrollToSection('#dashboard');
                }
            }, 500);
        } else {
            showToast('error', data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('error', 'Unable to connect to server. Please try again.');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                role,
                firstName,
                lastName
            }),
        });

        const data = await response.json();

        if (data.success) {
            // Backend now returns tokens and user data - auto-login!
            state.token = data.data.token.accessToken;
            state.user = data.data.user || { email, firstName, lastName, role };

            localStorage.setItem('token', state.token);
            localStorage.setItem('user', JSON.stringify(state.user));

            closeModal();
            showToast('success', 'Account created successfully! Redirecting to your dashboard...');

            // Redirect based on role (same as login)
            setTimeout(() => {
                if (state.user.role === 'EMPLOYEE') {
                    window.location.href = 'employee-dashboard.html';
                } else if (state.user.role === 'HR') {
                    window.location.href = 'hr-dashboard.html';
                } else if (state.user.role === 'ADMIN') {
                    window.location.href = 'admin.html';
                } else {
                    // Candidate / default - stay on page and show dashboard
                    updateUIForLoggedInUser();
                    scrollToSection('#dashboard');
                }
            }, 500);
        } else {
            showToast('error', data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('error', 'Unable to connect to server. Please try again.');
    }
}

function logout() {
    state.token = null;
    state.user = null;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    updateUIForLoggedOutUser();

    // Close profile menu if open
    document.getElementById('profileMenu')?.classList.remove('active');

    showToast('success', 'You have been logged out.');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
// Jobs
// =============================================
let usingSampleJobs = false;

// Demo jobs for testing when API is unavailable
const demoJobs = [
    {
        id: 'demo-job-1',
        slug: 'senior-software-engineer-google',
        title: 'Senior Software Engineer',
        companyName: 'Google',
        location: 'Bangalore',
        isRemote: false,
        salaryMin: 4000000,
        salaryMax: 6000000,
        experienceMin: 5,
        experienceMax: 8,
        skills: [{ name: 'React' }, { name: 'Node.js' }, { name: 'TypeScript' }],
        referralFee: 499,
        isHot: true,
    },
    {
        id: 'demo-job-2',
        slug: 'product-manager-microsoft',
        title: 'Product Manager',
        companyName: 'Microsoft',
        location: 'Hyderabad',
        isRemote: false,
        salaryMin: 3500000,
        salaryMax: 5000000,
        experienceMin: 3,
        experienceMax: 6,
        skills: [{ name: 'Product Strategy' }, { name: 'Agile' }, { name: 'SQL' }],
        referralFee: 499,
        isHot: false,
    },
    {
        id: 'demo-job-3',
        slug: 'data-scientist-amazon',
        title: 'Data Scientist',
        companyName: 'Amazon',
        location: 'Remote',
        isRemote: true,
        salaryMin: 2500000,
        salaryMax: 4000000,
        experienceMin: 2,
        experienceMax: 4,
        skills: [{ name: 'Python' }, { name: 'Machine Learning' }, { name: 'AWS' }],
        referralFee: 499,
        isHot: false,
    },
    {
        id: 'demo-job-4',
        slug: 'frontend-developer-flipkart',
        title: 'Frontend Developer',
        companyName: 'Flipkart',
        location: 'Bangalore',
        isRemote: false,
        salaryMin: 2000000,
        salaryMax: 3500000,
        experienceMin: 2,
        experienceMax: 5,
        skills: [{ name: 'React' }, { name: 'JavaScript' }, { name: 'CSS' }],
        referralFee: 499,
        isHot: false,
    },
    {
        id: 'demo-job-5',
        slug: 'devops-engineer-swiggy',
        title: 'DevOps Engineer',
        companyName: 'Swiggy',
        location: 'Bangalore',
        isRemote: false,
        salaryMin: 2500000,
        salaryMax: 4500000,
        experienceMin: 3,
        experienceMax: 6,
        skills: [{ name: 'Kubernetes' }, { name: 'Docker' }, { name: 'AWS' }],
        referralFee: 499,
        isHot: true,
    },
    {
        id: 'demo-job-6',
        slug: 'backend-engineer-zomato',
        title: 'Backend Engineer',
        companyName: 'Zomato',
        location: 'Delhi NCR',
        isRemote: false,
        salaryMin: 1800000,
        salaryMax: 3000000,
        experienceMin: 2,
        experienceMax: 4,
        skills: [{ name: 'Go' }, { name: 'PostgreSQL' }, { name: 'Redis' }],
        referralFee: 499,
        isHot: false,
    },
];

// Track demo applications
let demoApplications = JSON.parse(localStorage.getItem('demoApplications') || '[]');

// Check if a job is already applied
// Handles ID mapping between sample jobs ('1'-'6') and demo jobs ('demo-job-1' to 'demo-job-6')
function isJobApplied(jobId) {
    // Direct match
    if (demoApplications.some(a => a.jobId === jobId)) {
        return true;
    }

    // Check for sample -> demo mapping (jobId is 'demo-job-X', check if 'X' was applied)
    if (jobId.startsWith('demo-job-')) {
        const sampleId = jobId.replace('demo-job-', '');
        if (demoApplications.some(a => a.jobId === sampleId)) {
            return true;
        }
    }

    // Check for demo -> sample mapping (jobId is 'X', check if 'demo-job-X' was applied)
    if (/^\d+$/.test(jobId)) {
        const demoId = 'demo-job-' + jobId;
        if (demoApplications.some(a => a.jobId === demoId)) {
            return true;
        }
    }

    return false;
}

// Get the appropriate button HTML based on application status
function getApplyButtonHtml(jobId, isSmall = true) {
    if (isJobApplied(jobId)) {
        const sizeClass = isSmall ? 'btn-sm' : '';
        return `<button class="btn btn-success ${sizeClass}" disabled style="cursor: not-allowed; opacity: 0.8;">✓ Applied</button>`;
    }
    const sizeClass = isSmall ? 'btn-sm' : '';
    const onclick = isSmall
        ? `onclick="event.stopPropagation(); applyForJob('${jobId}')"`
        : `onclick="closeJobModal(); applyForJob('${jobId}')"`;
    return `<button class="btn btn-primary ${sizeClass}" ${onclick}>Apply Now</button>`;
}

async function loadJobs() {
    const loadingEl = document.getElementById('jobsLoading');
    const sampleJobsEl = document.getElementById('sampleJobs');
    const jobsGridEl = document.getElementById('jobsGrid');

    try {
        const response = await fetch(`${API_BASE_URL}/jobs`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        // Handle different response formats
        let jobs = [];
        if (data.success && data.data) {
            jobs = Array.isArray(data.data) ? data.data : (data.data.data || []);
        } else if (Array.isArray(data.data)) {
            jobs = data.data;
        } else if (Array.isArray(data)) {
            jobs = data;
        }

        if (jobs.length > 0) {
            state.jobs = jobs;
            usingSampleJobs = false;
            renderJobs(state.jobs);
            loadingEl.style.display = 'none';
            sampleJobsEl.style.display = 'none';
        } else {
            // Use demo jobs if API returns no data
            useDemoJobs();
            loadingEl.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        // Use demo jobs on error
        useDemoJobs();
        loadingEl.style.display = 'none';
    }
}

function useDemoJobs() {
    state.jobs = demoJobs;
    usingSampleJobs = false; // Set to false so Apply Now works
    const sampleJobsEl = document.getElementById('sampleJobs');
    sampleJobsEl.style.display = 'none';
    renderJobs(demoJobs);
    console.log('📦 Using demo jobs (API unavailable)');
}

function renderJobs(jobs) {
    const jobsGridEl = document.getElementById('jobsGrid');

    jobsGridEl.innerHTML = jobs.map(job => `
        <div class="job-card" onclick="showJobDetails('${job.id}')" style="cursor: pointer;">
            <button class="save-job-btn ${isJobSaved(job.id) ? 'saved' : ''}" onclick="toggleSaveJob('${job.id}', event)" title="${isJobSaved(job.id) ? 'Remove from saved' : 'Save job'}">
                ${isJobSaved(job.id) ? '❤️' : '🤍'}
            </button>
            <div class="job-header">
                <div class="company-logo" style="background: ${getRandomGradient()}">${job.companyName?.charAt(0) || 'J'}</div>
                <div class="job-meta">
                    <h3 class="job-title">${job.title}</h3>
                    <p class="company-name">${job.companyName}</p>
                </div>
                ${job.isHot ? '<span class="job-badge">Hot 🔥</span>' : ''}
            </div>
            <div class="job-details">
                <span class="job-detail"><span class="detail-icon">📍</span> ${job.location}${job.isRemote ? ' (Remote)' : ''}</span>
                <span class="job-detail"><span class="detail-icon">💼</span> ${job.experienceMin || 0}-${job.experienceMax || 'Any'} years</span>
                ${job.salaryMin ? `<span class="job-detail"><span class="detail-icon">💰</span> ₹${formatSalary(job.salaryMin)}-${formatSalary(job.salaryMax)} LPA</span>` : ''}
            </div>
            <div class="job-skills">
                ${(job.skills || []).slice(0, 3).map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
                ${(job.skills || []).length > 3 ? `<span class="skill-tag">+${job.skills.length - 3}</span>` : ''}
            </div>
            <div class="skill-test-notice">
                <span class="test-required-badge">🧪 Skill Test Required (Valid 7 Days)</span>
            </div>
            <div class="job-footer">
                <div class="job-footer-left">
                    <span class="interview-fee">💳 Pay ₹99 only if interview scheduled</span>
                    <span class="posted-time">📅 ${getTimeAgo(job.postedAt || job.createdAt)}</span>
                </div>
                ${getApplyButtonHtml(job.id, true)}
            </div>
        </div>
    `).join('');
}


// Helper function to format relative time like Naukri.com
function getTimeAgo(dateString) {
    if (!dateString) return 'Recently';

    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
        return 'Just now';
    } else if (diffHours < 24) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// =============================================
// Job Details Modal with Similar Jobs
// =============================================
function showJobDetails(jobId) {
    const job = state.jobs.find(j => j.id === jobId) || demoJobs.find(j => j.id === jobId);
    if (!job) {
        showToast('error', 'Job not found');
        return;
    }

    // Get similar jobs
    const similarJobs = getSimilarJobs(job);

    // Create modal if doesn't exist
    let modal = document.getElementById('jobDetailModal');
    if (!modal) {
        const modalHTML = `
            <div class="modal-overlay" id="jobModalOverlay" onclick="closeJobModal()"></div>
            <div class="modal modal-lg job-detail-modal" id="jobDetailModal">
                <button class="modal-close" onclick="closeJobModal()">×</button>
                <div class="modal-content" id="jobDetailContent"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('jobDetailModal');
    }

    const content = document.getElementById('jobDetailContent');
    content.innerHTML = `
        <div class="job-detail-header">
            <div class="company-logo-lg" style="background: ${getRandomGradient()}">${job.companyName?.charAt(0) || 'J'}</div>
            <div>
                <h2 class="modal-title">${job.title}</h2>
                <p class="modal-subtitle">${job.companyName} • ${job.location}${job.isRemote ? ' (Remote)' : ''}</p>
            </div>
            ${job.isHot ? '<span class="job-badge" style="margin-left: auto;">Hot 🔥</span>' : ''}
        </div>
        
        <div class="job-detail-info">
            <div class="info-item">
                <span class="info-label">Experience</span>
                <span class="info-value">${job.experienceMin || 0}-${job.experienceMax || 'Any'} years</span>
            </div>
            ${job.salaryMin ? `
            <div class="info-item">
                <span class="info-label">Salary Range</span>
                <span class="info-value">₹${formatSalary(job.salaryMin)}-${formatSalary(job.salaryMax)} LPA</span>
            </div>
            ` : ''}
            <div class="info-item">
                <span class="info-label">Interview Fee</span>
                <span class="info-value" style="color: var(--success);">₹99 (only if scheduled)</span>
            </div>
        </div>
        
        <!-- How It Works for This Job -->
        <div class="job-flow-steps">
            <h4>📋 How to Apply</h4>
            <div class="flow-steps-grid">
                <div class="flow-step">
                    <span class="flow-step-icon">🧪</span>
                    <span class="flow-step-text">Pass Skill Test (Valid 7 Days)</span>
                </div>
                <div class="flow-step-arrow">→</div>
                <div class="flow-step">
                    <span class="flow-step-icon">📝</span>
                    <span class="flow-step-text">Submit Application (Free)</span>
                </div>
                <div class="flow-step-arrow">→</div>
                <div class="flow-step">
                    <span class="flow-step-icon">📅</span>
                    <span class="flow-step-text">HR Schedules Interview</span>
                </div>
                <div class="flow-step-arrow">→</div>
                <div class="flow-step">
                    <span class="flow-step-icon">💳</span>
                    <span class="flow-step-text">Pay ₹99 to Unlock Details</span>
                </div>
            </div>
        </div>
        
        <div class="job-detail-skills">
            <h4>Required Skills</h4>
            <div class="skills-list">
                ${(job.skills || []).map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
                ${(!job.skills || job.skills.length === 0) ? '<span class="text-muted">No specific skills listed</span>' : ''}
            </div>
        </div>
        
        ${job.description ? `
        <div class="job-detail-description">
            <h4>Job Description</h4>
            <p>${job.description}</p>
        </div>
        ` : ''}
        
        <div class="job-detail-actions">
            ${getApplyButtonHtml(job.id, false)}
            <button class="btn btn-outline ${isJobSaved(job.id) ? 'saved' : ''}" onclick="toggleSaveJob('${job.id}'); closeJobModal();">
                ${isJobSaved(job.id) ? '❤️ Saved' : '🤍 Save Job'}
            </button>
        </div>

        
        ${similarJobs.length > 0 ? `
        <div class="similar-jobs-section">
            <h4>Similar Jobs You Might Like</h4>
            <div class="similar-jobs-grid">
                ${similarJobs.map(sJob => `
                    <div class="similar-job-card" onclick="closeJobModal(); setTimeout(() => showJobDetails('${sJob.id}'), 300);">
                        <div class="similar-job-header">
                            <div class="company-logo-sm" style="background: ${getRandomGradient()}">${sJob.companyName?.charAt(0) || 'J'}</div>
                            <div>
                                <h5>${sJob.title}</h5>
                                <p>${sJob.companyName}</p>
                            </div>
                        </div>
                        <div class="similar-job-meta">
                            <span>📍 ${sJob.location}</span>
                            <span>💼 ${sJob.experienceMin || 0}-${sJob.experienceMax || 'Any'} yrs</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;

    document.getElementById('jobModalOverlay').classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function getSimilarJobs(currentJob) {
    const allJobs = [...state.jobs, ...demoJobs];
    const currentSkills = (currentJob.skills || []).map(s => s.name.toLowerCase());

    // Score each job by similarity
    const scored = allJobs
        .filter(job => job.id !== currentJob.id)
        .map(job => {
            let score = 0;
            const jobSkills = (job.skills || []).map(s => s.name.toLowerCase());

            // Match skills (2 points per match)
            currentSkills.forEach(skill => {
                if (jobSkills.includes(skill)) score += 2;
            });

            // Match location (1 point)
            if (job.location?.toLowerCase() === currentJob.location?.toLowerCase()) score += 1;

            // Match remote status (1 point)
            if (job.isRemote === currentJob.isRemote) score += 1;

            // Match experience range overlap (1 point)
            const expOverlap = Math.min(job.experienceMax || 10, currentJob.experienceMax || 10) >=
                Math.max(job.experienceMin || 0, currentJob.experienceMin || 0);
            if (expOverlap) score += 1;

            return { job, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.job);

    return scored;
}

function closeJobModal() {
    document.getElementById('jobModalOverlay')?.classList.remove('active');
    document.getElementById('jobDetailModal')?.classList.remove('active');
    document.body.style.overflow = '';
}

// =============================================
// Saved Jobs
// =============================================
let savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
let showingSavedOnly = false;

function toggleSaveJob(jobId, event) {
    if (event) {
        event.stopPropagation();
    }

    const index = savedJobs.indexOf(jobId);
    if (index > -1) {
        savedJobs.splice(index, 1);
        // Heart icon change provides visual feedback - no toast needed
    } else {
        savedJobs.push(jobId);
        // Heart icon change provides visual feedback - no toast needed
    }
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs));

    // Re-render to update heart icon
    if (showingSavedOnly) {
        renderJobs(state.jobs.filter(j => savedJobs.includes(j.id)));
    } else {
        renderJobs(state.jobs);
    }
}

function isJobSaved(jobId) {
    return savedJobs.includes(jobId);
}

function toggleSavedJobsView() {
    showingSavedOnly = !showingSavedOnly;
    const btn = document.getElementById('savedJobsBtn');

    if (showingSavedOnly) {
        btn.classList.add('active');
        const savedJobsList = state.jobs.filter(j => savedJobs.includes(j.id));
        if (savedJobsList.length === 0) {
            document.getElementById('jobsGrid').innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
                    <p style="font-size: 48px; margin-bottom: 16px;">❤️</p>
                    <p style="font-size: 18px; margin-bottom: 8px; color: var(--text-primary);">No saved jobs yet</p>
                    <p style="font-size: 14px; color: var(--text-secondary);">Click the heart icon on jobs to save them</p>
                </div>
            `;
        } else {
            renderJobs(savedJobsList);
        }
    } else {
        btn.classList.remove('active');
        renderJobs(state.jobs);
    }
}

// =============================================
// Advanced Job Search
// =============================================
function searchJobs() {
    showingSavedOnly = false;
    document.getElementById('savedJobsBtn')?.classList.remove('active');

    const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
    const location = document.getElementById('locationFilter').value.toLowerCase();
    const experience = document.getElementById('experienceFilter')?.value;
    const jobType = document.getElementById('jobTypeFilter')?.value;
    const workMode = document.getElementById('workModeFilter')?.value;
    const postedDate = document.getElementById('postedDateFilter')?.value;
    const sortBy = document.getElementById('sortBy')?.value || 'relevance';

    let filteredJobs = [...state.jobs];

    // Text search filter
    if (searchTerm) {
        filteredJobs = filteredJobs.filter(job =>
            job.title.toLowerCase().includes(searchTerm) ||
            job.companyName.toLowerCase().includes(searchTerm) ||
            (job.skills || []).some(s => s.name.toLowerCase().includes(searchTerm))
        );
    }

    // Location filter
    if (location) {
        filteredJobs = filteredJobs.filter(job =>
            job.location.toLowerCase().includes(location) ||
            (location === 'remote' && job.isRemote)
        );
    }

    // Experience filter
    if (experience) {
        filteredJobs = filteredJobs.filter(job => {
            const jobExpMin = job.experienceMin || 0;
            const jobExpMax = job.experienceMax || 20;

            switch (experience) {
                case '0-1': return jobExpMin <= 1;
                case '1-3': return jobExpMin <= 3 && jobExpMax >= 1;
                case '3-5': return jobExpMin <= 5 && jobExpMax >= 3;
                case '5-8': return jobExpMin <= 8 && jobExpMax >= 5;
                case '8+': return jobExpMax >= 8;
                default: return true;
            }
        });
    }

    // Job type filter (demo jobs don't have jobType, so we'll skip if not present)
    if (jobType) {
        filteredJobs = filteredJobs.filter(job => {
            if (!job.jobType) return true; // Include jobs without type set
            return job.jobType === jobType;
        });
    }

    // Work mode filter
    if (workMode) {
        filteredJobs = filteredJobs.filter(job => {
            if (workMode === 'remote') return job.isRemote === true;
            if (workMode === 'hybrid') return job.isHybrid === true;
            if (workMode === 'office') return !job.isRemote && !job.isHybrid;
            return true;
        });
    }

    // Posted date filter
    if (postedDate) {
        const now = new Date();
        filteredJobs = filteredJobs.filter(job => {
            if (!job.createdAt) return true; // Include jobs without date
            const jobDate = new Date(job.createdAt);
            const diffHours = (now - jobDate) / (1000 * 60 * 60);

            switch (postedDate) {
                case '24h': return diffHours <= 24;
                case 'week': return diffHours <= 24 * 7;
                case 'month': return diffHours <= 24 * 30;
                default: return true;
            }
        });
    }

    // Sorting
    switch (sortBy) {
        case 'date':
            filteredJobs.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            break;
        case 'salary':
            filteredJobs.sort((a, b) => {
                const salaryA = a.salaryMax || a.salaryMin || 0;
                const salaryB = b.salaryMax || b.salaryMin || 0;
                return salaryB - salaryA;
            });
            break;
        case 'relevance':
        default:
            // Hot jobs first, then by date
            filteredJobs.sort((a, b) => {
                if (a.isHot && !b.isHot) return -1;
                if (!a.isHot && b.isHot) return 1;
                return 0;
            });
    }

    if (filteredJobs.length > 0) {
        renderJobs(filteredJobs);
        // Removed: showToast - silent filtering is more professional
    } else {
        document.getElementById('jobsGrid').innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
                <p style="font-size: 48px; margin-bottom: 16px;">🔍</p>
                <p style="font-size: 18px; margin-bottom: 8px; color: var(--text-primary);">No jobs found</p>
                <p style="font-size: 14px; color: var(--text-secondary);">Try adjusting your filters</p>
                <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="clearAllFilters()">Clear Filters</button>
            </div>
        `;
    }
}

function clearAllFilters() {
    document.getElementById('jobSearch').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('experienceFilter').value = '';
    document.getElementById('jobTypeFilter').value = '';
    document.getElementById('workModeFilter').value = '';
    document.getElementById('postedDateFilter').value = '';
    document.getElementById('sortBy').value = 'relevance';

    showingSavedOnly = false;
    document.getElementById('savedJobsBtn')?.classList.remove('active');

    renderJobs(state.jobs);
    // Removed: showToast - silent filtering is more professional
}

async function applyForJob(jobId) {
    console.log('🔵 applyForJob called with jobId:', jobId);
    console.log('🔵 Current token:', state.token ? 'EXISTS' : 'NULL');

    if (!state.token) {
        showToast('warning', 'Please login to apply for jobs.');
        showModal('login');
        return;
    }

    // Check profile completion - must be 100% to apply
    const profileCompletion = calculateProfileCompletion();
    if (profileCompletion < 100) {
        const missingFields = getMissingProfileFields();
        const missingList = missingFields.join(', ');

        // Show a detailed warning with incomplete profile modal
        showIncompleteProfileModal(missingFields, profileCompletion);
        return;
    }

    // Sample job data mapping for hardcoded HTML jobs
    const sampleJobsMap = {
        '1': { title: 'Senior Software Engineer', company: 'Google' },
        '2': { title: 'Product Manager', company: 'Microsoft' },
        '3': { title: 'Data Scientist', company: 'Amazon' },
        '4': { title: 'Frontend Developer', company: 'Flipkart' },
        '5': { title: 'DevOps Engineer', company: 'Swiggy' },
        '6': { title: 'Backend Engineer', company: 'Zomato' },
    };

    // Check if this is a demo job or sample job
    const isDemoJob = jobId.startsWith('demo-job-');
    const isSampleJob = sampleJobsMap.hasOwnProperty(jobId);

    console.log('🔵 isDemoJob:', isDemoJob, 'isSampleJob:', isSampleJob);

    if (isDemoJob || isSampleJob) {
        // Find job details
        let jobTitle, company;

        if (isDemoJob) {
            const job = demoJobs.find(j => j.id === jobId);
            if (!job) {
                showToast('error', 'Job not found.');
                return;
            }
            jobTitle = job.title;
            company = job.companyName;
        } else {
            jobTitle = sampleJobsMap[jobId].title;
            company = sampleJobsMap[jobId].company;
        }

        console.log('🔵 Job details:', { jobTitle, company });

        // Check if already applied
        if (demoApplications.find(a => a.jobId === jobId)) {
            console.log('⚠️ Already applied for this job');
            showToast('info', 'You have already applied for this job. Go to Applications to take the test.');
            return;
        }

        // Create application
        const application = {
            id: 'app-' + jobId,
            jobId: jobId,
            jobTitle: jobTitle,
            company: company,
            appliedAt: new Date().toISOString(),
            status: 'TEST_PENDING',
        };

        console.log('✅ Creating application:', application);

        demoApplications.push(application);
        localStorage.setItem('demoApplications', JSON.stringify(demoApplications));

        console.log('✅ Saved to localStorage. Total applications:', demoApplications.length);
        console.log('✅ localStorage content:', localStorage.getItem('demoApplications'));

        // Update dashboard stats
        const statsStr = localStorage.getItem('userStats');
        let stats = statsStr ? JSON.parse(statsStr) : { applications: 0, tests: 0, passed: 0, referrals: 0 };
        stats.applications = demoApplications.length;
        localStorage.setItem('userStats', JSON.stringify(stats));
        loadUserStats();

        // Re-render jobs to update button state
        renderJobs(state.jobs.length > 0 ? state.jobs : demoJobs);

        showToast('success', 'Application submitted! Go to My Applications to take the assessment test.');
        return;
    }


    // Real API call for non-demo jobs
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`,
            },
        });

        // Handle expired token
        if (response.status === 401) {
            handleExpiredToken();
            return;
        }

        const data = await response.json();

        if (data.success) {
            // Find job details for tracking
            const job = state.jobs.find(j => j.id === jobId);
            const jobTitle = job?.title || 'Unknown Position';
            const company = job?.companyName || 'Unknown Company';

            // Track in demoApplications so the button state updates
            const application = {
                id: data.data?.id || 'app-' + jobId,
                jobId: jobId,
                jobTitle: jobTitle,
                company: company,
                appliedAt: new Date().toISOString(),
                status: 'TEST_PENDING',
            };
            demoApplications.push(application);
            localStorage.setItem('demoApplications', JSON.stringify(demoApplications));

            // Update stats
            const statsStr = localStorage.getItem('userStats');
            let stats = statsStr ? JSON.parse(statsStr) : { applications: 0, tests: 0, passed: 0, referrals: 0 };
            stats.applications = demoApplications.length;
            localStorage.setItem('userStats', JSON.stringify(stats));

            // Re-render jobs to update button state
            renderJobs(state.jobs.length > 0 ? state.jobs : demoJobs);

            showToast('success', 'Application submitted! You can now take the assessment test.');
            loadUserStats();
        } else {
            // If already applied, still track it in demoApplications to disable button
            const isAlreadyApplied = data.message && data.message.toLowerCase().includes('already applied');
            if (isAlreadyApplied) {
                // Track this job so the button shows as applied
                if (!demoApplications.some(a => a.jobId === jobId)) {
                    const job = state.jobs.find(j => j.id === jobId);
                    demoApplications.push({
                        id: 'app-' + jobId,
                        jobId: jobId,
                        jobTitle: job?.title || 'Unknown Position',
                        company: job?.companyName || 'Unknown Company',
                        appliedAt: new Date().toISOString(),
                        status: 'TEST_PENDING',
                    });
                    localStorage.setItem('demoApplications', JSON.stringify(demoApplications));
                    renderJobs(state.jobs.length > 0 ? state.jobs : demoJobs);
                }
                showToast('info', 'You have already applied for this job. Go to Applications to take the test.');
            } else {
                showToast('error', data.message || 'Failed to apply. Please try again.');
            }
        }
    } catch (error) {
        console.error('Apply error:', error);
        showToast('error', 'Unable to apply. Please try again.');
    }
}

// Handle expired token - logout and prompt re-login
function handleExpiredToken() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    updateUIForLoggedOutUser();
    showToast('warning', 'Your session has expired. Please login again.');
    showModal('login');
}

// =============================================
// Modal Functions
// =============================================
function showModal(type) {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');

    overlay.classList.add('active');
    modal.classList.add('active');

    // Hide all forms first
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
    if (resetPasswordForm) resetPasswordForm.style.display = 'none';

    // Show the requested form
    if (type === 'login') {
        loginForm.style.display = 'block';
    } else if (type === 'register') {
        registerForm.style.display = 'block';
    } else if (type === 'forgotPassword') {
        if (forgotPasswordForm) {
            forgotPasswordForm.style.display = 'block';
            // Reset the form state
            const formEl = document.getElementById('forgotPasswordFormEl');
            const successEl = document.getElementById('forgotPasswordSuccess');
            if (formEl) formEl.style.display = 'block';
            if (successEl) successEl.style.display = 'none';
        }
    } else if (type === 'resetPassword') {
        if (resetPasswordForm) resetPasswordForm.style.display = 'block';
    } else if (type === 'editProfile') {
        showProfileModal();
        return;
    }

    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('authModal');

    overlay.classList.remove('active');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// =============================================
// Toast Notifications
// =============================================
const MAX_TOASTS = 3; // Maximum toasts shown at once
const activeToasts = new Set(); // Track active toast messages to prevent duplicates

function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Prevent duplicate toasts with same message
    const messageKey = `${type}:${message}`;
    if (activeToasts.has(messageKey)) {
        return; // Don't show duplicate
    }

    // Remove oldest toasts if we're at the limit
    const existingToasts = container.querySelectorAll('.toast');
    while (existingToasts.length >= MAX_TOASTS) {
        const oldestToast = existingToasts[0];
        if (oldestToast) {
            oldestToast.remove();
        }
        break;
    }

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove(); activeToasts.delete('${messageKey}');">×</button>
    `;

    container.appendChild(toast);
    activeToasts.add(messageKey);

    // Auto remove after 4 seconds (reduced from 5 for snappier UX)
    const toastTimeout = setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                toast.remove();
                activeToasts.delete(messageKey);
            }, 300);
        }
    }, 4000);

    // Clear timeout if manually closed
    toast.addEventListener('click', () => {
        clearTimeout(toastTimeout);
    });
}

// =============================================
// Utility Functions
// =============================================
function getRandomGradient() {
    const gradients = [
        'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'linear-gradient(135deg, #00A8E8, #0077B6)',
        'linear-gradient(135deg, #FF6B6B, #EE5A24)',
        'linear-gradient(135deg, #6C5CE7, #A29BFE)',
        'linear-gradient(135deg, #00B894, #00CEC9)',
        'linear-gradient(135deg, #FD79A8, #E84393)',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

function formatSalary(amount) {
    if (!amount) return '0';
    if (amount >= 100000) {
        return (amount / 100000).toFixed(0);
    }
    return amount.toString();
}

function scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// =============================================
// Google Sign-In
// =============================================
async function handleGoogleLogin() {
    // Check if Google API is loaded
    if (typeof google === 'undefined' || !google.accounts) {
        showToast('error', 'Google Sign-In is not configured. Please contact support.');
        console.error('Google API not loaded. Add Google Identity Services script to index.html');
        return;
    }

    try {
        // Initialize Google Sign-In
        google.accounts.id.initialize({
            client_id: window.GOOGLE_CLIENT_ID || '',
            callback: handleGoogleCredential,
            auto_select: false,
        });

        // Prompt one-tap sign in
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
                console.log('Google prompt not displayed:', notification.getNotDisplayedReason());
            }
        });
    } catch (error) {
        console.error('Google Sign-In error:', error);
        showToast('error', 'Google Sign-In failed. Please try again.');
    }
}

async function handleGoogleCredential(response) {
    if (!response.credential) {
        showToast('error', 'Google Sign-In failed. No credential received.');
        return;
    }

    try {
        const apiResponse = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                idToken: response.credential,
                role: 'CANDIDATE',
            }),
        });

        const data = await apiResponse.json();

        if (data.success) {
            state.token = data.data.token.accessToken;
            state.user = data.data.user;

            localStorage.setItem('token', state.token);
            localStorage.setItem('user', JSON.stringify(state.user));

            closeModal();

            if (data.data.isNewUser) {
                showToast('success', 'Welcome to JobRefer! Your account has been created.');
            } else {
                showToast('success', 'Welcome back!');
            }

            // Redirect based on role
            setTimeout(() => {
                if (state.user.role === 'EMPLOYEE') {
                    window.location.href = 'employee-dashboard.html';
                } else if (state.user.role === 'HR') {
                    window.location.href = 'hr-dashboard.html';
                } else if (state.user.role === 'ADMIN') {
                    window.location.href = 'admin.html';
                } else {
                    updateUIForLoggedInUser();
                    scrollToSection('#dashboard');
                }
            }, 500);
        } else {
            showToast('error', data.message || 'Google Sign-In failed.');
        }
    } catch (error) {
        console.error('Google auth error:', error);
        showToast('error', 'Unable to connect to server. Please try again.');
    }
}

// =============================================
// Forgot Password
// =============================================
async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('forgotEmail').value;
    const btn = document.getElementById('forgotPasswordBtn');
    const formEl = document.getElementById('forgotPasswordFormEl');
    const successEl = document.getElementById('forgotPasswordSuccess');

    btn.disabled = true;
    btn.innerHTML = 'Sending...';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        // Always show success to prevent email enumeration
        formEl.style.display = 'none';
        successEl.style.display = 'block';
        showToast('success', 'Check your email for reset instructions!');

    } catch (error) {
        console.error('Forgot password error:', error);
        formEl.style.display = 'none';
        successEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Send Reset Link';
    }
}

// =============================================
// Reset Password (via email link)
// =============================================
async function handleResetPassword(event) {
    event.preventDefault();

    const token = document.getElementById('resetToken').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showToast('error', 'Passwords do not match!');
        return;
    }

    if (newPassword.length < 8) {
        showToast('error', 'Password must be at least 8 characters!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password-with-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
        });

        const data = await response.json();

        if (data.success) {
            showToast('success', 'Password reset successfully! Please login.');
            showModal('login');
        } else {
            showToast('error', data.message || 'Failed to reset password.');
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showToast('error', 'Unable to connect to server. Please try again.');
    }
}

// Check URL hash for reset token on page load
function checkResetPasswordToken() {
    const hash = window.location.hash;
    if (hash.includes('reset-password')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const token = urlParams.get('token');

        if (token) {
            setTimeout(() => {
                const tokenInput = document.getElementById('resetToken');
                if (tokenInput) {
                    tokenInput.value = token;
                    showModal('resetPassword');
                }
            }, 500);
        }
    }
}

// Initialize reset password check
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkResetPasswordToken);
} else {
    checkResetPasswordToken();
}

// =============================================
// Profile Edit Modal
// =============================================
function showProfileModal() {
    const overlay = document.getElementById('profileModalOverlay');
    const modal = document.getElementById('profileModal');

    // Ensure display is set (in case it was set to none by closeProfileModal)
    if (overlay) overlay.style.display = 'flex';
    if (modal) modal.style.display = 'block';

    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Pre-fill form with current user data
    if (state.user) {
        document.getElementById('editFirstName').value = state.user.firstName || '';
        document.getElementById('editLastName').value = state.user.lastName || '';

        // Set phone number (strip +91 for display)
        setPhoneDisplay(state.user.phone || '');

        document.getElementById('editLinkedIn').value = state.user.linkedIn || '';
        document.getElementById('editSkills').value = state.user.skills?.join(', ') || '';

        // Set experience dropdown
        const expSelect = document.getElementById('editExperience');
        if (expSelect && state.user.experience) {
            expSelect.value = state.user.experience;
        }

        // Set location checkboxes
        setSelectedLocations(state.user.preferredLocations || state.user.preferredLocation);

        const initial = getUserDisplayName().charAt(0).toUpperCase();
        document.getElementById('avatarPreview').textContent = initial;

        // Show avatar image if exists
        if (state.user.avatarBase64) {
            const avatarPreview = document.getElementById('avatarPreview');
            avatarPreview.style.backgroundImage = `url(${state.user.avatarBase64})`;
            avatarPreview.style.backgroundSize = 'cover';
            avatarPreview.textContent = '';
        }

        // Show resume filename if exists
        updateResumeDisplay();
    }

    // Update profile completion
    updateProfileCompletion();

    // Close other menus
    document.getElementById('profileMenu')?.classList.remove('active');
}

function closeProfileModal() {
    const overlay = document.getElementById('profileModalOverlay');
    const modal = document.getElementById('profileModal');

    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
    }
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    document.body.style.overflow = '';
}

async function handleProfileUpdate(event) {
    event.preventDefault();

    // Get form values (some may not exist on the form, handle gracefully)
    const firstName = document.getElementById('editFirstName')?.value || '';
    const lastName = document.getElementById('editLastName')?.value || '';
    const phone = getFullPhoneNumber(); // Get phone with +91 prefix
    const linkedIn = document.getElementById('editLinkedIn')?.value || '';
    const skillsValue = document.getElementById('editSkills')?.value || '';
    const experience = document.getElementById('editExperience')?.value || '';
    const selectedLocations = getSelectedLocations(); // Get array of selected locations
    const currentCompany = document.getElementById('editCurrentCompany')?.value || '';
    const currentRole = document.getElementById('editCurrentRole')?.value || '';
    const expectedSalary = document.getElementById('editExpectedSalary')?.value || '';
    const noticePeriod = document.getElementById('editNoticePeriod')?.value || '';
    const headline = document.getElementById('editHeadline')?.value || '';
    const bio = document.getElementById('editBio')?.value || '';

    // Determine city based on selected locations (use first city or empty if pan-india)
    const city = selectedLocations.includes('pan-india') ? '' : (selectedLocations[0] || '');

    // Build profile data matching backend DTO (UpdateCandidateProfileDto)
    const profileData = {
        firstName,
        lastName,
        phone,
        linkedIn,
        headline,
        bio,
        currentCompany,
        currentRole,
        city,
        state: '',
        country: 'India'
    };

    // Add numeric fields only if provided
    if (experience && parseInt(experience) > 0) {
        profileData.totalExperience = parseInt(experience);
    }
    if (expectedSalary && parseInt(expectedSalary) > 0) {
        profileData.expectedSalary = parseInt(expectedSalary);
    }
    if (noticePeriod) {
        profileData.noticePeriod = parseInt(noticePeriod);
    }

    // Store additional fields locally for UI (phone, linkedIn saved locally until backend supports them)
    const localExtras = {
        phone,
        linkedIn,
        skills: skillsValue.split(',').map(s => s.trim()).filter(s => s),
        preferredLocations: selectedLocations,
        preferredLocation: selectedLocations.join(', '),
        experience
    };

    try {
        // Try to update via API using PATCH method (matching backend)
        const response = await fetch(`${API_BASE_URL}/candidates/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(profileData)
        });

        if (response.ok) {
            // Also sync skills to backend
            const skills = skillsValue.split(',').map(s => s.trim()).filter(s => s);
            await syncSkillsToBackend(skills);

            // Update local state with both backend data and local extras
            state.user = { ...state.user, ...profileData, ...localExtras };
            localStorage.setItem('user', JSON.stringify(state.user));

            closeProfileModal();
            showToast('success', 'Profile updated successfully!');
            updateDashboard();
            updateProfileCompletion();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Profile update failed:', errorData);
            // If API fails, just update locally
            state.user = { ...state.user, ...profileData, ...localExtras };
            localStorage.setItem('user', JSON.stringify(state.user));
            closeProfileModal();
            showToast('warning', 'Profile saved locally (sync pending)');
            updateDashboard();
            updateProfileCompletion();
        }
    } catch (error) {
        console.error('Profile update error:', error);
        // API not available, save locally
        state.user = { ...state.user, ...profileData, ...localExtras };
        localStorage.setItem('user', JSON.stringify(state.user));
        closeProfileModal();
        showToast('warning', 'Profile saved locally (sync pending)');
        updateDashboard();
        updateProfileCompletion();
    }
}

// Sync skills to backend
async function syncSkillsToBackend(skills) {
    if (!skills || skills.length === 0 || !state.token) return;

    try {
        // First, get current skills from profile to avoid duplicates
        const profileRes = await fetch(`${API_BASE_URL}/candidates/profile`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        let existingSkills = [];
        if (profileRes.ok) {
            const profile = await profileRes.json();
            existingSkills = (profile.data?.CandidateSkill || profile.CandidateSkill || []).map(s => s.name.toLowerCase());
        }

        // Add new skills that don't exist
        for (const skillName of skills) {
            if (skillName && !existingSkills.includes(skillName.toLowerCase())) {
                await fetch(`${API_BASE_URL}/candidates/skills`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({ name: skillName, level: 3 })
                });
            }
        }
    } catch (error) {
        console.error('Skills sync error:', error);
        // Continue silently - skills will be saved locally
    }
}

// =============================================
// Phone Number Formatting
// =============================================
function formatPhoneNumber(input) {
    // Remove all non-digits
    let value = input.value.replace(/\D/g, '');

    // Limit to 10 digits
    if (value.length > 10) {
        value = value.substring(0, 10);
    }

    // Format with space after 5th digit: XXXXX XXXXX
    if (value.length > 5) {
        value = value.substring(0, 5) + ' ' + value.substring(5);
    }

    input.value = value;
}

// Get phone number with +91 prefix for saving
function getFullPhoneNumber() {
    const phoneInput = document.getElementById('editPhone');
    if (!phoneInput) return '';

    const digits = phoneInput.value.replace(/\D/g, '');
    if (digits.length === 10) {
        return '+91' + digits;
    }
    return digits ? '+91' + digits : '';
}

// Set phone number (strip +91 prefix for display)
function setPhoneDisplay(fullNumber) {
    const phoneInput = document.getElementById('editPhone');
    if (!phoneInput || !fullNumber) return;

    // Remove +91 prefix if present
    let digits = fullNumber.replace(/^\+91/, '').replace(/\D/g, '');

    // Format for display
    if (digits.length > 5) {
        digits = digits.substring(0, 5) + ' ' + digits.substring(5, 10);
    }

    phoneInput.value = digits;
}

// =============================================
// Location Checkbox Handling
// =============================================
function handlePanIndiaChange(checkbox) {
    const locationGrid = document.getElementById('locationGrid');
    const cityCheckboxes = document.querySelectorAll('.city-checkbox');

    if (checkbox.checked) {
        // Disable all city checkboxes when PAN India is selected
        locationGrid.classList.add('disabled');
        cityCheckboxes.forEach(cb => {
            cb.checked = false;
            cb.disabled = true;
        });
        updateLocationHint('PAN India selected - open to all locations');
    } else {
        // Enable city checkboxes when PAN India is deselected
        locationGrid.classList.remove('disabled');
        cityCheckboxes.forEach(cb => {
            cb.disabled = false;
        });
        updateLocationHint('Select your preferred work locations');
    }
}

function checkLocationLimit() {
    const cityCheckboxes = document.querySelectorAll('.city-checkbox:checked');
    const allCityCheckboxes = document.querySelectorAll('.city-checkbox');
    const count = cityCheckboxes.length;

    if (count >= 3) {
        // Disable unchecked checkboxes
        allCityCheckboxes.forEach(cb => {
            if (!cb.checked) {
                cb.disabled = true;
                cb.closest('.location-checkbox').classList.add('disabled');
            }
        });
        updateLocationHint(`${count}/3 locations selected (maximum reached)`);
    } else {
        // Enable all checkboxes
        allCityCheckboxes.forEach(cb => {
            cb.disabled = false;
            cb.closest('.location-checkbox')?.classList.remove('disabled');
        });
        updateLocationHint(count > 0 ? `${count}/3 locations selected` : 'Select your preferred work locations');
    }
}

function updateLocationHint(message) {
    const hint = document.getElementById('locationHint');
    if (hint) {
        hint.textContent = message;
    }
}

function getSelectedLocations() {
    const panIndiaCheckbox = document.querySelector('input[value="pan-india"]');
    if (panIndiaCheckbox?.checked) {
        return ['pan-india'];
    }

    const selectedCheckboxes = document.querySelectorAll('.city-checkbox:checked');
    return Array.from(selectedCheckboxes).map(cb => cb.value);
}

function setSelectedLocations(locations) {
    // Reset all checkboxes first
    const allCheckboxes = document.querySelectorAll('#locationCheckboxes input[type="checkbox"]');
    allCheckboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
    });

    const locationGrid = document.getElementById('locationGrid');
    locationGrid?.classList.remove('disabled');

    if (!locations || locations.length === 0) {
        updateLocationHint('Select your preferred work locations');
        return;
    }

    // Handle array or string
    const locationArray = Array.isArray(locations) ? locations : [locations];

    if (locationArray.includes('pan-india')) {
        const panCheckbox = document.querySelector('input[value="pan-india"]');
        if (panCheckbox) {
            panCheckbox.checked = true;
            handlePanIndiaChange(panCheckbox);
        }
    } else {
        locationArray.forEach(loc => {
            const checkbox = document.querySelector(`input[value="${loc}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        checkLocationLimit();
    }
}

// =============================================
// Resume Upload
// =============================================
function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
        showToast('error', 'Please upload a PDF file only.');
        event.target.value = '';
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'File size must be less than 5MB.');
        event.target.value = '';
        return;
    }

    // Store resume info
    state.user.resume = {
        filename: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString()
    };
    localStorage.setItem('user', JSON.stringify(state.user));

    // Try to upload to API
    tryUploadResumeAPI(file);

    // Update UI
    updateResumeDisplay();
    updateProfileCompletion();
    showToast('success', `Resume "${file.name}" uploaded!`);
}

async function tryUploadResumeAPI(file) {
    if (!state.token) {
        console.log('No token - resume saved locally only');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('resume', file);

        console.log('📤 Uploading resume to Cloudinary...');

        const response = await fetch(`${API_BASE_URL}/candidates/resume`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Resume uploaded to Cloudinary:', result);

            // Update state with server response (handle both response formats)
            const resumeUrl = result.data?.resumeUrl || result.resumeUrl;
            if (resumeUrl) {
                state.user.resumeUrl = resumeUrl;
                state.user.resume = {
                    ...state.user.resume,
                    url: resumeUrl,
                    filename: result.fileName || file.name
                };
                localStorage.setItem('user', JSON.stringify(state.user));
                showToast('success', 'Resume uploaded to server successfully!');
            }

            // Show parsed skills if available
            const skills = result.data?.parsedData?.skills || result.parsedData?.JobSkill || [];
            if (skills.length > 0) {
                showToast('success', `Found ${skills.length} skills in your resume!`);
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Resume upload failed:', errorData);
            showToast('error', errorData.message || 'Failed to upload resume to server');
        }
    } catch (error) {
        console.error('❌ Resume upload error:', error);
        showToast('warning', 'Resume saved locally. Server upload failed.');
    }
}

function updateResumeDisplay() {
    const fileText = document.querySelector('.file-text');
    const fileUploadContent = document.querySelector('.file-upload-content');

    if (state.user?.resume?.filename) {
        if (fileText) {
            fileText.innerHTML = `<span class="resume-uploaded">📄 ${state.user.resume.filename}</span>`;
        }
        if (fileUploadContent) {
            fileUploadContent.classList.add('has-file');
        }
    }
}

function removeResume() {
    if (state.user?.resume) {
        delete state.user.resume;
        localStorage.setItem('user', JSON.stringify(state.user));

        const fileText = document.querySelector('.file-text');
        if (fileText) {
            fileText.textContent = 'Click to upload resume (PDF only)';
        }
        const fileUploadContent = document.querySelector('.file-upload-content');
        if (fileUploadContent) {
            fileUploadContent.classList.remove('has-file');
        }

        document.getElementById('editResume').value = '';
        updateProfileCompletion();
        showToast('info', 'Resume removed');
    }
}

// =============================================
// Profile Completeness
// =============================================
function calculateProfileCompletion() {
    if (!state.user) return 0;

    const fields = [
        { name: 'firstName', weight: 15, filled: !!state.user.firstName },
        { name: 'lastName', weight: 15, filled: !!state.user.lastName },
        { name: 'phone', weight: 10, filled: !!state.user.phone },
        { name: 'linkedIn', weight: 15, filled: !!state.user.linkedIn },
        { name: 'skills', weight: 15, filled: state.user.skills?.length > 0 },
        { name: 'experience', weight: 10, filled: !!state.user.experience },
        { name: 'preferredLocation', weight: 10, filled: (state.user.preferredLocations?.length > 0) || !!state.user.preferredLocation },
        { name: 'resume', weight: 10, filled: !!state.user.resume?.filename }
    ];

    const completedWeight = fields.filter(f => f.filled).reduce((sum, f) => sum + f.weight, 0);
    return completedWeight;
}

function getMissingProfileFields() {
    if (!state.user) return [];

    const fieldLabels = {
        firstName: 'First Name',
        lastName: 'Last Name',
        phone: 'Phone Number',
        linkedIn: 'LinkedIn Profile',
        skills: 'Skills',
        experience: 'Experience',
        preferredLocation: 'Preferred Location',
        resume: 'Resume'
    };

    const missing = [];
    if (!state.user.firstName) missing.push(fieldLabels.firstName);
    if (!state.user.lastName) missing.push(fieldLabels.lastName);
    if (!state.user.phone) missing.push(fieldLabels.phone);
    if (!state.user.linkedIn) missing.push(fieldLabels.linkedIn);
    if (!state.user.skills?.length) missing.push(fieldLabels.skills);
    if (!state.user.experience) missing.push(fieldLabels.experience);
    // Support both preferredLocations (array) and preferredLocation (string)
    const hasLocation = (state.user.preferredLocations?.length > 0) || !!state.user.preferredLocation;
    if (!hasLocation) missing.push(fieldLabels.preferredLocation);
    if (!state.user.resume?.filename) missing.push(fieldLabels.resume);

    return missing;
}

function updateProfileCompletion() {
    const completion = calculateProfileCompletion();
    const missing = getMissingProfileFields() || []; // Safety check

    // Update dashboard progress bar
    const progressFill = document.getElementById('progressFill');
    const profileCompletion = document.getElementById('profileCompletion');
    const progressTip = document.querySelector('.progress-tip');

    if (progressFill) {
        progressFill.style.width = `${completion}%`;
    }
    if (profileCompletion) {
        profileCompletion.textContent = `${completion}%`;
    }
    if (progressTip) {
        if (missing && missing.length > 0) {
            const displayFields = missing.slice(0, 3);
            progressTip.innerHTML = `💡 Add: ${displayFields.join(', ')}${missing.length > 3 ? ` (+${missing.length - 3} more)` : ''}`;
        } else {
            progressTip.innerHTML = '🎉 Profile complete! You\'re all set.';
        }
    }
}

// Show modal when profile is incomplete (blocks job applications)
function showIncompleteProfileModal(missingFields, completion) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'incompleteProfileOverlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.8);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; backdrop-filter: blur(4px);
    `;

    const missingFieldsList = missingFields.map(f => `<li style="margin: 8px 0; color: #fbbf24;">⚠️ ${f}</li>`).join('');

    overlay.innerHTML = `
        <div style="background: linear-gradient(145deg, #1f2937, #111827); border-radius: 20px; padding: 32px; max-width: 480px; width: 90%; border: 1px solid rgba(99, 102, 241, 0.3); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 64px; margin-bottom: 16px;">📋</div>
                <h2 style="color: #f3f4f6; font-size: 24px; margin-bottom: 8px;">Complete Your Profile First</h2>
                <p style="color: #9ca3af; font-size: 14px;">You need to complete 100% of your profile before applying for jobs.</p>
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="color: #f87171; font-weight: 600;">Current Progress</span>
                    <span style="color: #f87171; font-weight: 700; font-size: 20px;">${completion}%</span>
                </div>
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; height: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #ef4444, #f97316); height: 100%; width: ${completion}%; transition: width 0.3s;"></div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="color: #e5e7eb; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Missing Information:</h3>
                <ul style="list-style: none; padding: 0; margin: 0; color: #fbbf24; font-size: 14px;">
                    ${missingFieldsList}
                </ul>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button onclick="document.getElementById('incompleteProfileOverlay').remove()" style="flex: 1; padding: 14px 24px; background: transparent; border: 1px solid #4b5563; color: #9ca3af; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;">
                    Cancel
                </button>
                <button onclick="document.getElementById('incompleteProfileOverlay').remove(); showProfileModal();" style="flex: 2; padding: 14px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;">
                    ✏️ Complete Profile Now
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// =============================================
// Photo Upload
// =============================================
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('error', 'Please upload an image file.');
        event.target.value = '';
        return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'Image size must be less than 2MB.');
        event.target.value = '';
        return;
    }

    // Convert to base64 and store
    const reader = new FileReader();
    reader.onload = function (e) {
        state.user.avatarBase64 = e.target.result;
        localStorage.setItem('user', JSON.stringify(state.user));

        // Update preview
        const avatarPreview = document.getElementById('avatarPreview');
        if (avatarPreview) {
            avatarPreview.style.backgroundImage = `url(${e.target.result})`;
            avatarPreview.style.backgroundSize = 'cover';
            avatarPreview.textContent = '';
        }

        // Update navbar avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.style.backgroundImage = `url(${e.target.result})`;
            userAvatar.style.backgroundSize = 'cover';
            userAvatar.textContent = '';
        }

        // Update profile card avatar
        const profileAvatarLarge = document.getElementById('profileAvatarLarge');
        if (profileAvatarLarge) {
            profileAvatarLarge.style.backgroundImage = `url(${e.target.result})`;
            profileAvatarLarge.style.backgroundSize = 'cover';
            profileAvatarLarge.textContent = '';
        }

        showToast('success', 'Photo updated!');
    };
    reader.readAsDataURL(file);
}

// Update showProfile to use the new modal
function showProfile() {
    showProfileModal();
}

// =============================================
// Page Navigation
// =============================================
let previousPage = null;

function showPage(pageId) {
    // Hide main content sections
    document.querySelector('.hero')?.style.setProperty('display', 'none');
    document.getElementById('dashboard')?.style.setProperty('display', 'none');
    document.getElementById('how-it-works')?.style.setProperty('display', 'none');
    document.getElementById('jobs')?.style.setProperty('display', 'none');
    document.getElementById('pricing')?.style.setProperty('display', 'none');
    document.querySelector('.footer')?.style.setProperty('display', 'none');

    // Hide other page sections
    document.getElementById('applicationsPage')?.style.setProperty('display', 'none');
    document.getElementById('settingsPage')?.style.setProperty('display', 'none');

    // Show requested page
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    previousPage = pageId;
}

function goBack() {
    // Show main content sections
    document.querySelector('.hero')?.style.setProperty('display', 'flex');
    document.getElementById('dashboard')?.style.setProperty('display', state.token ? 'block' : 'none');
    document.getElementById('how-it-works')?.style.setProperty('display', 'block');
    document.getElementById('jobs')?.style.setProperty('display', 'block');
    document.getElementById('pricing')?.style.setProperty('display', 'block');
    document.querySelector('.footer')?.style.setProperty('display', 'block');

    // Hide page sections
    document.getElementById('applicationsPage')?.style.setProperty('display', 'none');
    document.getElementById('settingsPage')?.style.setProperty('display', 'none');

    // Scroll to dashboard if logged in
    if (state.token) {
        setTimeout(() => scrollToSection('#dashboard'), 100);
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showApplications() {
    showPage('applicationsPage');
    document.getElementById('profileMenu')?.classList.remove('active');
    loadApplications();
}

function showSettings() {
    showPage('settingsPage');
    document.getElementById('profileMenu')?.classList.remove('active');
}

// Applications Page
// =============================================
async function loadApplications() {
    console.log('🟢 loadApplications called');

    const tableBody = document.getElementById('applicationsTableBody');
    if (!tableBody) {
        console.log('❌ applicationsTableBody not found');
        return;
    }

    // Show loading state
    tableBody.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
            <p style="font-size: 32px; margin-bottom: 16px;">⏳</p>
            <p style="font-size: 16px; color: var(--text-secondary);">Loading your applications...</p>
        </div>
    `;

    let applications = [];

    // Try to fetch from API if logged in
    if (state.token) {
        try {
            console.log('🟢 Fetching applications from API...');
            const response = await fetch(`${API_BASE_URL}/candidates/applications`, {
                headers: {
                    'Authorization': `Bearer ${state.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                handleExpiredToken();
                return;
            }

            const data = await response.json();
            console.log('🟢 API response:', data);

            if (data.success && Array.isArray(data.data)) {
                // Map API response to our format
                // Note: Prisma returns capitalized relation names (TestSession, Job, etc.)
                applications = data.data.map(app => {
                    // Get job data (handle both lowercase and capitalized Prisma relation names)
                    const job = app.Job || app.job || {};
                    // Get test session (Prisma returns as TestSession array)
                    const testSession = app.TestSession?.[0] || app.testSession?.[0] || app.testSessions?.[0] || null;
                    // Get interview data
                    const interview = app.Interview || app.interview || null;
                    // Get referral data
                    const referral = app.Referral || app.referral || null;
                    // Get payment data
                    const payment = app.Payment || app.payment || null;

                    return {
                        id: app.id,
                        jobId: app.jobId,
                        company: job.companyName || 'Unknown Company',
                        jobTitle: job.title || 'Unknown Position',
                        appliedAt: app.createdAt,
                        status: app.status,
                        testScore: app.testScore,
                        testPassedAt: app.testPassedAt,
                        interview: interview,
                        referral: referral,
                        payment: payment,
                        testSession: testSession
                    };
                });
                console.log('✅ Loaded', applications.length, 'applications from API');
            } else if (Array.isArray(data.data)) {
                // Handle direct array response (same mapping as above)
                applications = data.data.map(app => {
                    const job = app.Job || app.job || {};
                    const testSession = app.TestSession?.[0] || app.testSession?.[0] || app.testSessions?.[0] || null;
                    const interview = app.Interview || app.interview || null;
                    const referral = app.Referral || app.referral || null;
                    const payment = app.Payment || app.payment || null;

                    return {
                        id: app.id,
                        jobId: app.jobId,
                        company: job.companyName || 'Unknown Company',
                        jobTitle: job.title || 'Unknown Position',
                        appliedAt: app.createdAt,
                        status: app.status,
                        testScore: app.testScore,
                        testPassedAt: app.testPassedAt,
                        interview: interview,
                        referral: referral,
                        payment: payment,
                        testSession: testSession
                    };
                });
            }
        } catch (error) {
            console.error('❌ Error fetching applications from API:', error);
        }
    }

    // Also load demo applications from localStorage, but filter out duplicates
    const demoApps = JSON.parse(localStorage.getItem('demoApplications') || '[]');
    if (demoApps.length > 0) {
        // Get set of existing job IDs from API applications to prevent duplicates
        const existingJobIds = new Set(applications.map(app => app.jobId));
        const existingJobCompanyPairs = new Set(
            applications.map(app => `${app.jobTitle?.toLowerCase()}-${app.company?.toLowerCase()}`)
        );

        // Only add demo apps that don't already exist in API applications
        const uniqueDemoApps = demoApps.filter(demoApp => {
            const jobCompanyPair = `${demoApp.jobTitle?.toLowerCase()}-${demoApp.company?.toLowerCase()}`;
            const isDuplicate = existingJobIds.has(demoApp.jobId) || existingJobCompanyPairs.has(jobCompanyPair);
            if (isDuplicate) {
                console.log('⚠️ Skipping duplicate demo app:', demoApp.jobTitle, 'at', demoApp.company);
            }
            return !isDuplicate;
        });

        if (uniqueDemoApps.length > 0) {
            console.log('🟢 Adding', uniqueDemoApps.length, 'unique demo applications from localStorage');
            applications = [...applications, ...uniqueDemoApps];
        }
    }

    // If no applications, show empty state
    if (applications.length === 0) {
        console.log('ℹ️ No applications found - showing empty state');
        tableBody.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
                <p style="font-size: 48px; margin-bottom: 16px;">📭</p>
                <p style="font-size: 18px; margin-bottom: 8px; color: var(--text-primary);">No applications yet</p>
                <p style="font-size: 14px; color: var(--text-secondary);">Browse jobs and apply to get started!</p>
                <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="goBack(); scrollToSection('#jobs')">Browse Jobs</button>
            </div>
        `;
        return;
    }

    console.log('🟢 Rendering', applications.length, 'applications');

    // Render applications using div structure (matching HTML)
    tableBody.innerHTML = applications.map(app => {
        const initial = (app.company || 'U').charAt(0);
        const statusLabel = getStatusLabel(app.status);
        const statusClass = getStatusClass(app.status);
        const appliedDate = new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        let actionButton = '';

        // Check if test was passed (via multiple indicators)
        // 1. testPassedAt is set (most reliable - set by backend on test pass)
        // 2. testSession.isPassed is true
        // 3. testSession.score >= 70
        // 4. app.testScore >= 70
        const testPassed = !!(
            app.testPassedAt ||
            app.testSession?.isPassed === true ||
            (app.testSession?.score && app.testSession.score >= 70) ||
            (app.testScore && app.testScore >= 70)
        );

        // Determine the correct action button based on application state
        // CRITICAL: Only trust API response (database) for payment status
        // Do NOT use localStorage as it can have stale/fake data
        const interviewPaymentDone =
            app.interview?.paymentStatus === 'SUCCESS' ||
            app.interview?.status === 'PAYMENT_SUCCESS' ||
            app.Payment?.status === 'SUCCESS' ||
            app.payment?.status === 'SUCCESS';

        // Check for final outcome statuses FIRST - these take priority over payment status
        if (app.status === 'SELECTED') {
            // Candidate was selected after interview!
            actionButton = `<button class="btn btn-success btn-sm" disabled style="background: linear-gradient(135deg, #10b981, #059669);">🎉 Selected!</button>`;
        } else if (app.status === 'INTERVIEW_REJECTED') {
            // Candidate was not selected after interview
            actionButton = `<button class="btn btn-outline btn-sm" disabled style="border-color: #ef4444; color: #ef4444;">❌ Not Selected</button>`;
        } else if (app.status === 'CANDIDATE_NO_SHOW') {
            // Candidate no-show
            actionButton = `<button class="btn btn-danger btn-sm" disabled>🚫 Missed Interview</button>`;
        } else if (app.status === 'HR_NO_SHOW') {
            // HR no-show
            actionButton = `<button class="btn btn-warning btn-sm" disabled>⚠️ HR No-Show</button>`;
        } else if (interviewPaymentDone || app.status === 'PAYMENT_SUCCESS') {
            // Payment successful - check if interview is scheduled
            const interview = app.interview || app.Interview;
            const isScheduled = interview?.scheduledDate || interview?.scheduledAt;

            if (isScheduled) {
                // Interview is scheduled - show date/time and View Details button
                const schedDate = interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                const schedTime = interview.scheduledTime || '';
                actionButton = `
                    <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                        <span style="font-size: 11px; color: var(--primary); font-weight: 500;">📅 ${schedDate} ${schedTime}</span>
                        <button class="btn btn-primary btn-sm" onclick="viewInterviewDetails('${app.id}')" style="background: linear-gradient(135deg, #10b981, #059669);">View Interview Details</button>
                    </div>
                `;
            } else {
                // Paid but not scheduled yet
                actionButton = `<button class="btn btn-info btn-sm" disabled style="background: linear-gradient(135deg, #6366f1, #4f46e5);">✅ Paid - Waiting for HR to Schedule</button>`;
            }
        } else if (app.status === 'TEST_PENDING' || app.status === 'TEST_REQUIRED') {
            actionButton = `<button class="btn btn-primary btn-sm" onclick="startTest('${app.id}', '${app.company}', '${app.jobTitle}')">Take Test</button>`;
        } else if (app.status === 'TEST_IN_PROGRESS') {
            actionButton = `<button class="btn btn-warning btn-sm" onclick="startTest('${app.id}', '${app.company}', '${app.jobTitle}')">⏳ Resume Test</button>`;
        } else if (app.status === 'TEST_FAILED') {
            actionButton = `<button class="btn btn-outline btn-sm" disabled>❌ Test Failed</button>`;
        } else if (app.status === 'INTERVIEW_CONFIRMED' || app.interview?.status === 'INTERVIEW_CONFIRMED') {
            // Candidate shortlisted - pays to proceed, then HR schedules interview
            actionButton = `<button class="btn btn-primary btn-sm" onclick="payForInterview('${app.id}')" style="background: linear-gradient(135deg, #10b981, #059669);">💳 Pay ₹99 to Proceed</button>`;
        } else if (app.status === 'PAYMENT_PENDING') {
            // Payment in progress
            actionButton = `<button class="btn btn-warning btn-sm" disabled>⏳ Payment Processing...</button>`;
        } else if (app.status === 'SELECTED') {
            // Candidate was selected after interview!
            actionButton = `<button class="btn btn-success btn-sm" disabled style="background: linear-gradient(135deg, #10b981, #059669);">🎉 Selected!</button>`;
        } else if (app.status === 'INTERVIEW_REJECTED') {
            // Candidate was not selected after interview
            actionButton = `<button class="btn btn-outline btn-sm" disabled style="border-color: #ef4444; color: #ef4444;">❌ Not Selected</button>`;
        } else if (app.status === 'INTERVIEW_COMPLETED' || app.interview?.status === 'INTERVIEW_COMPLETED') {
            // Interview completed successfully
            actionButton = `<button class="btn btn-success btn-sm" disabled>✅ Interview Completed</button>`;
        } else if (app.status === 'CANDIDATE_NO_SHOW' || app.status === 'HR_NO_SHOW') {
            // No-show status
            const noShowLabel = app.status === 'CANDIDATE_NO_SHOW' ? 'Missed Interview' : 'HR No-Show';
            actionButton = `<button class="btn btn-danger btn-sm" disabled>⚠️ ${noShowLabel}</button>`;
        } else if (app.status === 'REJECTED') {
            actionButton = `<button class="btn btn-outline btn-sm" disabled>Application Rejected</button>`;
        } else if (app.status === 'APPLIED' && testPassed) {
            // Test passed, waiting for HR to shortlist
            actionButton = `<button class="btn btn-info btn-sm" disabled style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">⏳ Awaiting HR Decision</button>`;
        } else if (app.status === 'APPLIED' && !testPassed && !app.testSession) {
            // Just applied, no test taken yet (shouldn't happen normally)
            actionButton = `<button class="btn btn-outline btn-sm" onclick="showApplicationDetails('${app.id}')">View Details</button>`;
        } else {
            // Default fallback
            actionButton = `<button class="btn btn-outline btn-sm" onclick="showApplicationDetails('${app.id}')">View Details</button>`;
        }

        // Cancel button (only show for cancellable statuses)
        let cancelButton = '';
        const cancellableStatuses = ['TEST_PENDING', 'APPLIED', 'REFERRAL_PENDING'];
        if (cancellableStatuses.includes(app.status)) {
            cancelButton = `<button class="btn btn-danger btn-sm" onclick="cancelApplication('${app.id}')" style="margin-left: 8px;">Cancel</button>`;
        }

        return `
            <div class="table-row" id="app-row-${app.id}">
                <span class="company-cell">
                    <div class="company-logo-sm">${initial}</div>
                    ${app.company}
                </span>
                <span>${app.jobTitle}</span>
                <span>${appliedDate}</span>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
                <span style="display: flex; gap: 8px;">${actionButton}${cancelButton}</span>
            </div>
        `;
    }).join('');

    state.applications = applications;
    console.log('✅ Applications loaded:', applications.length);
}

function getStatusLabel(status) {
    const labels = {
        'TEST_PENDING': 'Test Required',
        'TEST_REQUIRED': 'Test Required',
        'TEST_IN_PROGRESS': 'Test In Progress',
        'TEST_PASSED': 'Test Passed',
        'TEST_FAILED': 'Test Failed',
        'REFERRAL_PENDING': 'Pending Referral',
        'REFERRED': 'Referred',
        'APPLIED': 'Test Passed - Waiting for HR',
        'INTERVIEW_CONFIRMED': '📅 Interview Confirmed - Pay to Unlock',
        'PAYMENT_PENDING': '⏳ Payment Processing',
        'PAYMENT_SUCCESS': '✅ Paid - View Details',
        'INTERVIEW_COMPLETED': '✅ Interview Completed',
        'CANDIDATE_NO_SHOW': '⚠️ Missed Interview',
        'HR_NO_SHOW': '⚠️ HR No-Show',
        'REJECTED': 'Rejected'
    };
    return labels[status] || status;
}

function getStatusClass(status) {
    const classes = {
        'TEST_PENDING': 'status-pending',
        'TEST_REQUIRED': 'status-pending',
        'TEST_IN_PROGRESS': 'status-pending',
        'TEST_PASSED': 'status-passed',
        'TEST_FAILED': 'status-rejected',
        'REFERRAL_PENDING': 'status-pending',
        'REFERRED': 'status-referred',
        'APPLIED': 'status-passed',
        'INTERVIEW_CONFIRMED': 'status-interview',
        'PAYMENT_PENDING': 'status-pending',
        'PAYMENT_SUCCESS': 'status-passed',
        'INTERVIEW_COMPLETED': 'status-passed',
        'CANDIDATE_NO_SHOW': 'status-rejected',
        'HR_NO_SHOW': 'status-rejected',
        'REJECTED': 'status-rejected'
    };
    return classes[status] || 'status-pending';
}

// Cancel/Withdraw an application
function cancelApplication(appId) {
    // Confirm before cancelling
    if (!confirm('Are you sure you want to cancel this application? This action cannot be undone.')) {
        return;
    }

    // Find the application
    const appIndex = demoApplications.findIndex(a => a.id === appId);
    if (appIndex === -1) {
        showToast('error', 'Application not found.');
        return;
    }

    const app = demoApplications[appIndex];

    // Remove from demoApplications
    demoApplications.splice(appIndex, 1);
    localStorage.setItem('demoApplications', JSON.stringify(demoApplications));

    // Update stats
    const statsStr = localStorage.getItem('userStats');
    let stats = statsStr ? JSON.parse(statsStr) : { applications: 0, tests: 0, passed: 0, referrals: 0 };
    stats.applications = Math.max(0, demoApplications.length);
    localStorage.setItem('userStats', JSON.stringify(stats));

    // Re-render jobs to enable Apply button again
    renderJobs(state.jobs.length > 0 ? state.jobs : demoJobs);

    // Reload applications list
    loadApplications();

    // Update dashboard stats
    loadUserStats();

    showToast('success', `Application for ${app.jobTitle} at ${app.company} has been cancelled.`);
}

function filterApplications(status) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter and re-render
    if (status === 'all') {
        loadApplications();
    } else {
        const allApps = [...(state.applications || [])];
        const filtered = allApps.filter(app => {
            if (status === 'test') return app.status === 'TEST_PENDING';
            if (status === 'pending') return app.status === 'APPLIED';
            if (status === 'referred') return app.status === 'REFERRED' || app.status === 'TEST_PASSED';
            if (status === 'rejected') return app.status === 'TEST_FAILED';
            return true;
        });

        const tableBody = document.getElementById('applicationsTableBody');
        if (!tableBody) return;

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px 20px; grid-column: 1 / -1;">
                    <p style="font-size: 32px; margin-bottom: 12px;">📋</p>
                    <p style="color: var(--text-secondary);">No applications in this category</p>
                </div>
            `;
        } else {
            // Re-render with filtered data
            renderApplicationRows(filtered, tableBody);
        }
    }
}

function renderApplicationRows(applications, tableBody) {
    tableBody.innerHTML = applications.map(app => {
        const initial = (app.company || 'U').charAt(0);
        const statusLabel = getStatusLabel(app.status);
        const statusClass = getStatusClass(app.status);
        const appliedDate = new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const hasNote = applicationNotes[app.id] ? '📝' : '';

        // Check if test was passed (via multiple indicators)
        const testPassed = !!(
            app.testPassedAt ||
            app.testSession?.isPassed === true ||
            (app.testSession?.score && app.testSession.score >= 70) ||
            (app.testScore && app.testScore >= 70)
        );

        let actionButton = '';
        if (app.status === 'TEST_PENDING' || app.status === 'TEST_REQUIRED') {
            actionButton = `<button class="btn btn-primary btn-sm" onclick="startTest('${app.id}', '${app.company}', '${app.jobTitle}')">Take Test</button>`;
        } else if (app.status === 'TEST_IN_PROGRESS') {
            actionButton = `<button class="btn btn-warning btn-sm" onclick="startTest('${app.id}', '${app.company}', '${app.jobTitle}')">⏳ Resume Test</button>`;
        } else if (app.status === 'TEST_FAILED') {
            actionButton = `<button class="btn btn-outline btn-sm" disabled>❌ Test Failed</button>`;
        } else if (app.status === 'INTERVIEW_CONFIRMED') {
            actionButton = `<button class="btn btn-primary btn-sm" onclick="payForInterview('${app.id}')" style="background: linear-gradient(135deg, #10b981, #059669);">💳 Pay ₹99 to Unlock Interview</button>`;
        } else if (app.status === 'PAYMENT_PENDING') {
            actionButton = `<button class="btn btn-warning btn-sm" disabled>⏳ Payment Processing...</button>`;
        } else if (app.status === 'SELECTED') {
            actionButton = `<button class="btn btn-success btn-sm" disabled style="background: linear-gradient(135deg, #10b981, #059669);">🎉 Selected!</button>`;
        } else if (app.status === 'INTERVIEW_REJECTED') {
            actionButton = `<button class="btn btn-outline btn-sm" disabled style="border-color: #ef4444; color: #ef4444;">❌ Not Selected</button>`;
        } else if (app.status === 'CANDIDATE_NO_SHOW' || app.status === 'HR_NO_SHOW') {
            const noShowLabel = app.status === 'CANDIDATE_NO_SHOW' ? 'Missed Interview' : 'HR No-Show';
            actionButton = `<button class="btn btn-danger btn-sm" disabled>⚠️ ${noShowLabel}</button>`;
        } else if (app.status === 'INTERVIEW_COMPLETED') {
            actionButton = `<button class="btn btn-success btn-sm" disabled>✅ Interview Completed</button>`;
        } else if (app.status === 'PAYMENT_SUCCESS') {
            actionButton = `<button class="btn btn-primary btn-sm" onclick="viewInterviewDetails('${app.id}')">📅 View Interview Details</button>`;
        } else if (app.status === 'REJECTED') {
            actionButton = `<button class="btn btn-outline btn-sm" disabled>Application Rejected</button>`;
        } else if (app.status === 'APPLIED' && testPassed) {
            actionButton = `<button class="btn btn-info btn-sm" disabled style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">⏳ Waiting for Interview Schedule</button>`;
        } else if (app.interview?.status === 'INTERVIEW_CONFIRMED') {
            actionButton = `<button class="btn btn-primary btn-sm" onclick="payForInterview('${app.id}')" style="background: linear-gradient(135deg, #10b981, #059669);">💳 Pay ₹99 to Unlock Interview</button>`;
        } else if (app.interview?.status === 'PAYMENT_SUCCESS') {
            actionButton = `<button class="btn btn-primary btn-sm" onclick="viewInterviewDetails('${app.id}')">📅 View Interview Details</button>`;
        } else if (app.interview?.status === 'INTERVIEW_COMPLETED') {
            actionButton = `<button class="btn btn-success btn-sm" disabled>✅ Interview Completed</button>`;
        } else {
            actionButton = `<button class="btn btn-outline btn-sm" onclick="showApplicationDetails('${app.id}')">View Details</button>`;
        }

        return `
            <div class="table-row">
                <span class="company-cell">
                    <div class="company-logo-sm">${initial}</div>
                    ${app.company} ${hasNote}
                </span>
                <span>${app.jobTitle}</span>
                <span>${appliedDate}</span>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
                <span>${actionButton}</span>
            </div>
        `;
    }).join('');
}

// =============================================
// Application Notes & Details
// =============================================
let applicationNotes = JSON.parse(localStorage.getItem('applicationNotes') || '{}');
let currentApplicationId = null;

function showApplicationDetails(appId) {
    currentApplicationId = appId;
    const app = state.applications?.find(a => a.id === appId) ||
        demoApplications.find(a => a.id === appId);

    if (!app) {
        showToast('error', 'Application not found');
        return;
    }

    // Build timeline steps
    const timelineSteps = getTimelineSteps(app.status);

    // Create modal if it doesn't exist
    let modal = document.getElementById('applicationDetailModal');
    if (!modal) {
        const modalHTML = `
            <div class="modal-overlay" id="applicationModalOverlay" onclick="closeApplicationModal()"></div>
            <div class="modal modal-lg application-detail-modal" id="applicationDetailModal">
                <button class="modal-close" onclick="closeApplicationModal()">×</button>
                <div class="modal-content" id="applicationDetailContent"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('applicationDetailModal');
    }

    // Render content
    const content = document.getElementById('applicationDetailContent');
    // Pass interview object from application to getInterviewSchedule
    const interview = app.interview || app.Interview || null;
    const interviewSchedule = getInterviewSchedule(appId, app.status, interview);

    content.innerHTML = `
        <h2 class="modal-title">${app.jobTitle}</h2>
        <p class="modal-subtitle">${app.company}</p>
        
        <div class="application-timeline">
            ${timelineSteps.map(step => `
                <div class="timeline-step ${step.state}">
                    <div class="timeline-dot">${step.icon}</div>
                    <span class="timeline-label">${step.label}</span>
                </div>
            `).join('')}
        </div>
        
        ${interviewSchedule ? `
        <div class="interview-schedule">
            <h4>📅 Interview Schedule</h4>
            ${interviewSchedule.map(interview => `
                <div class="interview-item ${interview.completed ? 'completed' : ''} ${interview.needsPayment ? 'needs-payment' : ''}">
                    <div class="interview-date">
                        <span class="day">${interview.day}</span>
                        <span class="month">${interview.month}</span>
                    </div>
                    <div class="interview-details">
                        <span class="interview-type">${interview.type}</span>
                        <span class="interview-time">🕐 ${interview.time}</span>
                        ${interview.interviewer ? `<span class="interviewer">👤 ${interview.interviewer}</span>` : ''}
                    </div>
                    ${interview.needsPayment ?
            `<button class="btn btn-primary btn-sm pay-now-btn" onclick="initiatePayment('${interview.applicationId}', '${interview.interviewId}')">💳 Pay ₹99 to Unlock</button>` :
            interview.isPaid ?
                `<span class="interview-status done">✅ Paid - Details Unlocked</span>` :
                `<span class="interview-status ${interview.completed ? 'done' : 'upcoming'}">${interview.completed ? '✓ Done' : '⏳ Upcoming'}</span>`
        }
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="interview-schedule empty">
            <h4>📅 Interview Schedule</h4>
            <p class="empty-schedule">
                ${app.status === 'INTERVIEW_CONFIRMED' ?
            '💳 Pay ₹99 to unlock your interview details!' :
            app.status === 'TEST_PENDING' || app.status === 'APPLIED' ?
                '📝 Complete your test first to get interview scheduled' :
                app.status === 'TEST_FAILED' ?
                    '❌ Application was not successful' :
                    '🔔 Interview details will appear here once HR schedules it'}
            </p>
        </div>
        `}
        
        <div class="application-notes">
            <h4>📝 My Notes</h4>
            <textarea class="notes-textarea" id="applicationNotesInput" placeholder="Add personal notes about this application...">${applicationNotes[appId] || ''}</textarea>
            <div class="notes-actions">
                <button class="btn btn-primary btn-sm" onclick="saveApplicationNote()">Save Note</button>
            </div>
        </div>
        
        <div class="application-actions">
            ${app.status === 'TEST_PENDING' || app.status === 'APPLIED' ?
            `<button class="btn btn-danger btn-sm" onclick="withdrawApplication('${appId}')">❌ Withdraw Application</button>` :
            `<span style="color: var(--text-muted); font-size: 13px;">This application cannot be withdrawn</span>`
        }
            <button class="btn btn-outline btn-sm" style="margin-left: auto;" onclick="closeApplicationModal()">Close</button>
        </div>
    `;

    // Show modal
    document.getElementById('applicationModalOverlay').classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function getTimelineSteps(status) {
    const steps = [
        { id: 'applied', label: 'Applied', icon: '📝' },
        { id: 'test', label: 'Test', icon: '🧠' },
        { id: 'passed', label: 'Passed', icon: '✅' },
        { id: 'referred', label: 'Referred', icon: '🎉' }
    ];

    // Determine which steps are completed/active
    const statusOrder = {
        'APPLIED': 0,
        'TEST_PENDING': 0,
        'TEST_FAILED': 1,
        'TEST_PASSED': 2,
        'REFERRAL_PENDING': 2,
        'REFERRED': 3
    };

    const currentStep = statusOrder[status] ?? 0;

    return steps.map((step, index) => {
        if (index < currentStep) {
            step.state = 'completed';
        } else if (index === currentStep) {
            step.state = status === 'TEST_FAILED' ? 'failed' : 'active';
            if (status === 'TEST_FAILED' && index === 1) {
                step.icon = '❌';
            }
        } else {
            step.state = '';
        }
        return step;
    });
}

function getInterviewSchedule(appId, status, interview) {
    // If no interview object is passed, return null
    if (!interview) {
        return null;
    }

    // Build interview schedule from real interview data
    const schedule = [];

    // Parse the scheduled date
    let scheduledDate = null;
    if (interview.scheduledDate) {
        scheduledDate = new Date(interview.scheduledDate);
    }

    // Interview mode display
    const modeDisplay = {
        'VIDEO': '📹 Video Call',
        'CALL': '📞 Phone Call',
        'ONSITE': '🏢 On-site Interview'
    };

    // Interview status determines if completed
    const isCompleted = interview.status === 'INTERVIEW_COMPLETED';
    const isPaid = interview.status === 'PAYMENT_SUCCESS' || interview.status === 'INTERVIEW_COMPLETED';
    const needsPayment = interview.status === 'INTERVIEW_CONFIRMED';

    schedule.push({
        type: modeDisplay[interview.mode] || interview.mode,
        day: scheduledDate ? scheduledDate.getDate() : '?',
        month: scheduledDate ? scheduledDate.toLocaleString('en-US', { month: 'short' }).toUpperCase() : '',
        time: isPaid ? (interview.scheduledTime || 'Time TBD') : '🔒 Pay to unlock',
        interviewer: isPaid ? (interview.hrNotes || 'HR Team') : '',
        completed: isCompleted,
        needsPayment: needsPayment,
        isPaid: isPaid,
        interviewId: interview.id,
        applicationId: appId,
        status: interview.status
    });

    return schedule;
}

function closeApplicationModal() {
    document.getElementById('applicationModalOverlay')?.classList.remove('active');
    document.getElementById('applicationDetailModal')?.classList.remove('active');
    document.body.style.overflow = '';
    currentApplicationId = null;
}

// Payment function for unlocking interview details
async function initiatePayment(applicationId, interviewId) {
    if (!state.token) {
        showToast('error', 'Please login to continue');
        return;
    }

    try {
        showToast('info', 'Initiating payment...');

        // Create INTERVIEW payment order (correct endpoint)
        const response = await fetch(`${API_BASE_URL}/payments/interview/create-order`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ applicationId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create payment order');
        }

        const order = data.data || data;

        // Initialize Razorpay
        if (typeof Razorpay === 'undefined') {
            // Load Razorpay script if not loaded
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => openRazorpayForInterview(order, applicationId);
            document.head.appendChild(script);
        } else {
            openRazorpayForInterview(order, applicationId);
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast('error', error.message || 'Payment failed. Please try again.');
    }
}

function openRazorpayCheckout(order, applicationId) {
    const options = {
        key: order.razorpayKeyId || 'rzp_test_placeholder',
        amount: order.amount || 9900,
        currency: order.currency || 'INR',
        name: 'JobRefer',
        description: 'Interview Details Unlock Fee',
        order_id: order.razorpayOrderId,
        handler: async function (response) {
            try {
                // Verify payment on backend
                const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${state.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        applicationId,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    })
                });

                if (!verifyResponse.ok) {
                    throw new Error('Payment verification failed');
                }

                showToast('success', '🎉 Payment successful! Interview details unlocked!');
                closeApplicationModal();

                // Force reload the page to get fresh data from server
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } catch (error) {
                showToast('error', 'Payment verification failed. Please contact support.');
            }
        },
        prefill: {
            email: state.user?.email || '',
            name: state.user?.firstName ? `${state.user.firstName} ${state.user.lastName || ''}` : ''
        },
        theme: {
            color: '#2563eb'
        },
        modal: {
            ondismiss: function () {
                showToast('info', 'Payment cancelled');
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

function saveApplicationNote() {
    if (!currentApplicationId) return;

    const note = document.getElementById('applicationNotesInput')?.value?.trim();

    if (note) {
        applicationNotes[currentApplicationId] = note;
    } else {
        delete applicationNotes[currentApplicationId];
    }

    localStorage.setItem('applicationNotes', JSON.stringify(applicationNotes));
    showToast('success', 'Note saved!');

    // Update the display to show note indicator
    loadApplications();
}

async function withdrawApplication(appId) {
    // Show custom confirmation modal instead of browser's confirm()
    showConfirmModal(
        'Withdraw Application',
        'Are you sure you want to withdraw this application? This action cannot be undone.',
        async () => {
            // User confirmed - proceed with withdrawal
            if (state.token) {
                try {
                    const response = await fetch(`${API_BASE_URL}/applications/${appId}/withdraw`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${state.token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        closeApplicationModal();
                        showToast('success', 'Application withdrawn successfully');
                        loadApplications();
                        return;
                    }
                } catch (error) {
                    console.log('API unavailable, using local withdrawal');
                }
            }

            // Local fallback - remove from demoApplications
            const index = demoApplications.findIndex(a => a.id === appId);
            if (index > -1) {
                demoApplications.splice(index, 1);
                localStorage.setItem('demoApplications', JSON.stringify(demoApplications));

                // Update stats
                const statsStr = localStorage.getItem('userStats');
                let stats = statsStr ? JSON.parse(statsStr) : { applications: 0, tests: 0, passed: 0, referrals: 0 };
                stats.applications = Math.max(0, stats.applications - 1);
                localStorage.setItem('userStats', JSON.stringify(stats));
                loadUserStats();
            }

            // Also remove notes
            if (applicationNotes[appId]) {
                delete applicationNotes[appId];
                localStorage.setItem('applicationNotes', JSON.stringify(applicationNotes));
            }

            closeApplicationModal();
            showToast('success', 'Application withdrawn');
            loadApplications();
        }
    );
}

// =============================================
// Custom Confirmation Modal
// =============================================
function showConfirmModal(title, message, onConfirm, onCancel) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('customConfirmModal');
    if (!modal) {
        const modalHTML = `
            <div class="modal-overlay" id="confirmModalOverlay" style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            "></div>
            <div id="customConfirmModal" style="
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: linear-gradient(145deg, #1e1e2e 0%, #16161d 100%);
                border: 1px solid rgba(99, 102, 241, 0.3);
                border-radius: 16px; padding: 24px; z-index: 10001;
                max-width: 400px; width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <span style="font-size: 28px;">⚠️</span>
                    <h3 id="confirmModalTitle" style="margin: 0; color: #fff; font-size: 18px; font-weight: 600;"></h3>
                </div>
                <p id="confirmModalMessage" style="
                    color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6;
                    margin: 0 0 24px 0;
                "></p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="confirmModalCancel" style="
                        padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;
                        cursor: pointer; border: 1px solid rgba(255,255,255,0.2);
                        background: transparent; color: rgba(255,255,255,0.7);
                        transition: all 0.2s;
                    ">Cancel</button>
                    <button id="confirmModalConfirm" style="
                        padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;
                        cursor: pointer; border: none;
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                        color: #fff; transition: all 0.2s;
                    ">Confirm</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('customConfirmModal');
    }

    // Update content
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;

    // Show modal
    document.getElementById('confirmModalOverlay').style.display = 'flex';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Setup handlers
    const closeModal = () => {
        document.getElementById('confirmModalOverlay').style.display = 'none';
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };

    document.getElementById('confirmModalCancel').onclick = () => {
        closeModal();
        if (onCancel) onCancel();
    };

    document.getElementById('confirmModalConfirm').onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };

    document.getElementById('confirmModalOverlay').onclick = closeModal;
}

// =============================================
// Settings Page
// =============================================
function showChangePasswordModal() {
    showToast('info', 'Password change will be available soon!');
}

function confirmDeleteAccount() {
    showConfirmModal(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
        () => {
            showToast('warning', 'Account deletion will be processed within 24 hours.');
        }
    );
}

// Update the settings link in dropdown
document.addEventListener('DOMContentLoaded', () => {
    // Add click handler for settings link
    const settingsLink = document.querySelector('a[href="#settings"]');
    if (settingsLink) {
        settingsLink.onclick = (e) => {
            e.preventDefault();
            showSettings();
        };
    }
});

// =============================================
// Keyboard Shortcuts
// =============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeProfileModal();
        document.getElementById('profileMenu')?.classList.remove('active');
    }
});

// =============================================
// Test Taking System
// =============================================
let testState = {
    applicationId: null,
    sessionId: null,
    company: '',
    position: '',
    questions: [],
    currentIndex: 0,
    answers: {},
    remainingTime: 0,
    totalTime: 0,
    timerInterval: null,
    tabSwitchCount: 0,
    maxTabSwitches: 3
};

// Sample questions for demo (will be replaced by API data)
const sampleQuestions = [
    {
        id: 'q1',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        points: 1
    },
    {
        id: 'q2',
        question: 'Which data structure uses LIFO (Last In First Out) principle?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        points: 1
    },
    {
        id: 'q3',
        question: 'What does REST stand for?',
        options: ['Representational State Transfer', 'Remote Execution State Transfer', 'Reliable State Transaction', 'Request State Transfer'],
        points: 1
    },
    {
        id: 'q4',
        question: 'Which of the following is NOT a JavaScript framework?',
        options: ['React', 'Angular', 'Django', 'Vue'],
        points: 1
    },
    {
        id: 'q5',
        question: 'What is the purpose of a primary key in a database?',
        options: ['To encrypt data', 'To uniquely identify each record', 'To join tables', 'To sort data'],
        points: 1
    },
    {
        id: 'q6',
        question: 'Which HTTP method is used to update a resource?',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        points: 1
    },
    {
        id: 'q7',
        question: 'What is the output of: console.log(typeof null)?',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        points: 1
    },
    {
        id: 'q8',
        question: 'Which sorting algorithm has the best average-case time complexity?',
        options: ['Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort'],
        points: 1
    },
    {
        id: 'q9',
        question: 'What does SQL stand for?',
        options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'System Query Language'],
        points: 1
    },
    {
        id: 'q10',
        question: 'Which of the following is a NoSQL database?',
        options: ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'],
        points: 1
    }
];

function startTest(applicationId, company, position) {
    if (!state.token) {
        showToast('warning', 'Please login to take the test.');
        showModal('login');
        return;
    }

    testState.applicationId = applicationId;
    testState.company = company;
    testState.position = position;
    testState.currentIndex = 0;
    testState.answers = {};
    testState.tabSwitchCount = 0;

    // Try to start test via API
    tryStartTestAPI(applicationId).then(sessionData => {
        if (sessionData) {
            // Use API data
            testState.sessionId = sessionData.sessionId;
            testState.questions = sessionData.questions;
            testState.remainingTime = sessionData.remainingTime;
            testState.totalTime = sessionData.duration * 60;
            testState.maxTabSwitches = sessionData.maxTabSwitches;

            // Restore any previous answers
            if (sessionData.answers) {
                sessionData.answers.forEach(a => {
                    testState.answers[a.questionId] = a.selectedAnswer;
                });
            }
        } else {
            // Use sample questions for demo
            testState.sessionId = 'demo-session-' + Date.now();
            testState.questions = sampleQuestions;
            testState.remainingTime = 30 * 60; // 30 minutes
            testState.totalTime = 30 * 60;
        }

        showTestPage();
        startTimer();
        setupTabSwitchDetection();
        renderQuestion();
    });
}

async function tryStartTestAPI(applicationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tests/application/${applicationId}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success || data.sessionId) {
                return data.data || data;
            }
        }
    } catch (error) {
        console.log('API not available, using demo mode');
    }
    return null;
}

function showTestPage() {
    // Hide all other sections
    document.querySelector('.hero')?.style.setProperty('display', 'none');
    document.getElementById('dashboard')?.style.setProperty('display', 'none');
    document.getElementById('how-it-works')?.style.setProperty('display', 'none');
    document.getElementById('jobs')?.style.setProperty('display', 'none');
    document.getElementById('pricing')?.style.setProperty('display', 'none');
    document.querySelector('.footer')?.style.setProperty('display', 'none');
    document.getElementById('applicationsPage')?.style.setProperty('display', 'none');
    document.getElementById('settingsPage')?.style.setProperty('display', 'none');
    document.querySelector('.navbar')?.style.setProperty('display', 'none');

    // Show test page
    const testPage = document.getElementById('testPage');
    testPage.style.display = 'block';

    // Update header info
    document.getElementById('testTitle').textContent = 'Pre-Screening Assessment';
    document.getElementById('testCompany').textContent = `${testState.company} - ${testState.position}`;
    document.getElementById('totalQuestions').textContent = testState.questions.length;

    // Create question dots
    renderQuestionDots();

    window.scrollTo({ top: 0 });
}

function hideTestPage() {
    document.getElementById('testPage').style.display = 'none';
    document.querySelector('.navbar')?.style.setProperty('display', 'flex');
    goBack();
}

function startTimer() {
    updateTimerDisplay();

    testState.timerInterval = setInterval(() => {
        testState.remainingTime--;
        updateTimerDisplay();

        if (testState.remainingTime <= 0) {
            clearInterval(testState.timerInterval);
            showToast('warning', 'Time is up! Submitting test...');
            submitTest(true);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(testState.remainingTime / 60);
    const seconds = testState.remainingTime % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const timerEl = document.getElementById('timerDisplay');
    timerEl.textContent = display;

    // Add warning classes
    const timerContainer = timerEl.parentElement;
    timerContainer.classList.remove('timer-warning', 'timer-danger');

    if (testState.remainingTime <= 60) {
        timerContainer.classList.add('timer-danger');
    } else if (testState.remainingTime <= 300) {
        timerContainer.classList.add('timer-warning');
    }
}

function setupTabSwitchDetection() {
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
    if (document.hidden && testState.timerInterval) {
        testState.tabSwitchCount++;

        // Log event to API
        logTestEvent('TAB_SWITCH');

        if (testState.tabSwitchCount >= testState.maxTabSwitches) {
            showToast('error', 'Too many tab switches! Test submitted automatically.');
            submitTest(true);
        } else {
            const remaining = testState.maxTabSwitches - testState.tabSwitchCount;
            showToast('warning', `Warning: Tab switch detected! ${remaining} warning(s) remaining.`);
        }
    }
}

async function logTestEvent(eventType) {
    if (!testState.sessionId || testState.sessionId.startsWith('demo-')) return;

    try {
        await fetch(`${API_BASE_URL}/tests/session/${testState.sessionId}/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ eventType })
        });
    } catch (error) {
        console.log('Failed to log event');
    }
}

function renderQuestion() {
    const question = testState.questions[testState.currentIndex];

    // Update question number and text
    document.querySelector('.question-number').textContent = `Question ${testState.currentIndex + 1}`;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('currentQuestion').textContent = testState.currentIndex + 1;

    // Update progress
    const progress = ((testState.currentIndex + 1) / testState.questions.length) * 100;
    document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
    document.getElementById('testProgressFill').style.width = `${progress}%`;

    // Render options
    const optionsList = document.getElementById('optionsList');
    const markers = ['A', 'B', 'C', 'D', 'E', 'F'];

    optionsList.innerHTML = question.options.map((option, index) => `
        <label class="option-item ${testState.answers[question.id] === index ? 'selected' : ''}">
            <input type="radio" name="answer" value="${index}" 
                ${testState.answers[question.id] === index ? 'checked' : ''}
                onchange="selectAnswer(${index})">
            <span class="option-marker">${markers[index]}</span>
            <span class="option-text">${option}</span>
        </label>
    `).join('');

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = testState.currentIndex === 0;

    const isLastQuestion = testState.currentIndex === testState.questions.length - 1;
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitTestBtn');

    if (isLastQuestion) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }

    // Update question dots
    updateQuestionDots();
}

function renderQuestionDots() {
    const dotsContainer = document.getElementById('questionDots');
    dotsContainer.innerHTML = testState.questions.map((q, i) => `
        <button class="question-dot ${i === 0 ? 'active' : ''} ${testState.answers[q.id] !== undefined ? 'answered' : ''}" 
            onclick="goToQuestion(${i})">${i + 1}</button>
    `).join('');
}

function updateQuestionDots() {
    const dots = document.querySelectorAll('.question-dot');
    dots.forEach((dot, i) => {
        dot.classList.remove('active');
        if (i === testState.currentIndex) {
            dot.classList.add('active');
        }
        if (testState.answers[testState.questions[i].id] !== undefined) {
            dot.classList.add('answered');
        }
    });
}

function selectAnswer(answerIndex) {
    const question = testState.questions[testState.currentIndex];
    testState.answers[question.id] = answerIndex;

    // Update UI
    document.querySelectorAll('.option-item').forEach((item, i) => {
        item.classList.toggle('selected', i === answerIndex);
    });

    updateQuestionDots();

    // Submit answer to API
    submitAnswerToAPI(question.id, answerIndex);
}

async function submitAnswerToAPI(questionId, selectedAnswer) {
    if (!testState.sessionId || testState.sessionId.startsWith('demo-')) return;

    try {
        await fetch(`${API_BASE_URL}/tests/session/${testState.sessionId}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ questionId, selectedAnswer })
        });
    } catch (error) {
        console.log('Failed to save answer');
    }
}

function prevQuestion() {
    if (testState.currentIndex > 0) {
        testState.currentIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (testState.currentIndex < testState.questions.length - 1) {
        testState.currentIndex++;
        renderQuestion();
    }
}

function goToQuestion(index) {
    if (index >= 0 && index < testState.questions.length) {
        testState.currentIndex = index;
        renderQuestion();
    }
}

function endTest() {
    // Clear timer
    if (testState.timerInterval) {
        clearInterval(testState.timerInterval);
        testState.timerInterval = null;
    }

    // Remove tab switch listener
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    // Reset test state
    testState.applicationId = null;
    testState.sessionId = null;
    testState.questions = [];
    testState.currentIndex = 0;
    testState.answers = {};
    testState.remainingTime = 0;
    testState.tabSwitchCount = 0;
}

async function confirmExitTest() {
    const confirmed = await showConfirmModal({
        icon: '🚪',
        title: 'Exit Test?',
        message: 'Are you sure you want to exit? Your progress will be lost and you may not be able to retake this test immediately.',
        confirmText: 'Exit Test',
        cancelText: 'Continue Test',
        variant: 'danger'
    });

    if (confirmed) {
        endTest();
        hideTestPage();
    }
}

async function submitTest(isAutoSubmit = false) {
    // Clear timer temporarily
    if (testState.timerInterval) {
        clearInterval(testState.timerInterval);
    }

    // Remove tab switch listener
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    // Count answers
    const answeredCount = Object.keys(testState.answers).length;

    if (!isAutoSubmit && answeredCount < testState.questions.length) {
        const unanswered = testState.questions.length - answeredCount;

        const confirmed = await showConfirmModal({
            icon: '📝',
            title: 'Incomplete Test',
            message: `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Are you sure you want to submit?`,
            confirmText: 'Submit Anyway',
            cancelText: 'Continue Test',
            variant: 'warning'
        });

        if (!confirmed) {
            // Resume timer
            testState.timerInterval = setInterval(() => {
                testState.remainingTime--;
                updateTimerDisplay();
                if (testState.remainingTime <= 0) {
                    clearInterval(testState.timerInterval);
                    submitTest(true);
                }
            }, 1000);
            return;
        }
    }

    // Try to submit to API
    let result = await submitTestToAPI();

    if (!result) {
        // Demo mode - calculate score locally
        // For demo, simulate 70-90% correct
        const correctCount = Math.floor(answeredCount * (0.7 + Math.random() * 0.2));
        const score = answeredCount > 0 ? (correctCount / testState.questions.length) * 100 : 0;

        result = {
            score: Math.round(score),
            correctAnswers: correctCount,
            totalQuestions: testState.questions.length,
            isPassed: score >= 70
        };
    }

    showTestResult(result);
}

async function submitTestToAPI() {
    if (!testState.sessionId || testState.sessionId.startsWith('demo-')) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/tests/session/${testState.sessionId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.data || data;
        }
    } catch (error) {
        console.log('API submit failed');
    }
    return null;
}

function showTestResult(result) {
    const timeTaken = testState.totalTime - testState.remainingTime;
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;

    // Update demo application status in localStorage
    console.log('🔍 showTestResult - applicationId:', testState.applicationId);
    console.log('🔍 showTestResult - result.isPassed:', result.isPassed);

    if (testState.applicationId && testState.applicationId.startsWith('app-')) {
        demoApplications = JSON.parse(localStorage.getItem('demoApplications') || '[]');
        console.log('🔍 All applications:', demoApplications.map(a => ({ id: a.id, status: a.status })));

        const appIndex = demoApplications.findIndex(a => a.id === testState.applicationId);
        console.log('🔍 Found appIndex:', appIndex);

        if (appIndex !== -1) {
            const newStatus = result.isPassed ? 'TEST_PASSED' : 'TEST_FAILED';
            console.log('✅ Updating status to:', newStatus);
            demoApplications[appIndex].status = newStatus;
            demoApplications[appIndex].testScore = result.score;
            demoApplications[appIndex].testCompletedAt = new Date().toISOString();
            localStorage.setItem('demoApplications', JSON.stringify(demoApplications));
            console.log('✅ Saved to localStorage');
        } else {
            console.log('❌ Application not found in demoApplications!');
        }
    } else {
        console.log('❌ applicationId does not start with app-:', testState.applicationId);
    }

    // Update result modal
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');

    if (result.isPassed) {
        resultIcon.textContent = '🎉';
        resultTitle.textContent = 'Congratulations!';
        resultMessage.innerHTML = `
            You passed the pre-screening test!<br><br>
            <strong>Next Steps:</strong><br>
            • Your profile will be shared with verified referrers at ${testState.company}<br>
            • A referrer will review your application within 2-3 days<br>
            • You'll receive an email when you get referred<br><br>
            <span style="color: var(--primary-color);">Keep an eye on your email! 📧</span>
        `;
    } else {
        resultIcon.textContent = '😔';
        resultTitle.textContent = 'Not Quite There';
        resultMessage.innerHTML = `
            You scored ${Math.round(result.score)}% (passing is 70%).<br><br>
            <strong>Tips for next time:</strong><br>
            • Review data structures and algorithms<br>
            • Practice coding problems on LeetCode<br>
            • You can retry after 7 days
        `;
    }

    document.getElementById('resultScore').textContent = `${result.correctAnswers}/${result.totalQuestions}`;
    document.getElementById('resultTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('resultPercentage').textContent = `${Math.round(result.score)}%`;

    // Show modal
    document.getElementById('testResultOverlay').classList.add('active');
    document.getElementById('testResultModal').classList.add('active');
}

function closeTestResult() {
    document.getElementById('testResultOverlay').classList.remove('active');
    document.getElementById('testResultModal').classList.remove('active');

    endTest();

    // Hide test page
    document.getElementById('testPage').style.display = 'none';
    document.querySelector('.navbar')?.style.setProperty('display', 'flex');

    // Navigate back to applications page (not just goBack which hides everything)
    showApplications();
}

// =============================================
// Professional Confirmation Modal
// =============================================

/**
 * Shows a professional confirmation modal
 * @param {object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.icon - Emoji icon (default: ⚠️)
 * @param {string} options.confirmText - Confirm button text (default: Confirm)
 * @param {string} options.cancelText - Cancel button text (default: Cancel)
 * @param {string} options.variant - 'default', 'danger', or 'warning'
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirmModal(options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const overlay = document.getElementById('confirmModalOverlay');

        // Set content
        document.getElementById('confirmIcon').textContent = options.icon || '⚠️';
        document.getElementById('confirmTitle').textContent = options.title || 'Confirm Action';
        document.getElementById('confirmMessage').textContent = options.message || 'Are you sure you want to proceed?';
        document.getElementById('confirmOkBtn').textContent = options.confirmText || 'Confirm';
        document.getElementById('confirmCancelBtn').textContent = options.cancelText || 'Cancel';

        // Set variant
        modal.classList.remove('danger', 'warning');
        if (options.variant) {
            modal.classList.add(options.variant);
        }

        // Store resolver
        confirmModalResolver = resolve;

        // Show modal
        overlay.classList.add('active');
        modal.classList.add('active');
    });
}

function closeConfirmModal(result) {
    const modal = document.getElementById('confirmModal');
    const overlay = document.getElementById('confirmModalOverlay');

    overlay.classList.remove('active');
    modal.classList.remove('active');

    // Resolve promise
    if (confirmModalResolver) {
        confirmModalResolver(result);
        confirmModalResolver = null;
    }
}

// =============================================
// Interview Payment Functions
// =============================================

/**
 * Pay for interview - opens payment flow for ₹99 interview fee
 */
async function payForInterview(applicationId) {
    if (!state.token) {
        showToast('error', 'Please login to continue.');
        showModal('login');
        return;
    }

    // Show confirmation modal
    const confirmed = await showConfirmModal({
        title: 'Interview Payment',
        message: 'Pay ₹99 to confirm your interview slot. This fee helps verify your commitment and unlock interview scheduling.',
        icon: '💳',
        confirmText: 'Pay ₹99',
        cancelText: 'Maybe Later',
        variant: 'default'
    });

    if (!confirmed) return;

    try {
        showToast('info', 'Initiating payment...');

        // Create payment order for interview
        const response = await fetch(`${API_BASE_URL}/payments/interview/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ applicationId })
        });

        const data = await response.json();

        if (data.success && data.data) {
            // Check if test mode (Razorpay bypassed on backend)
            if (data.data.testMode) {
                console.log('TEST MODE: Payment completed on backend');
                showToast('success', '✅ Payment successful! Interview details unlocked.');
                await loadApplications();
                return;
            }

            // Production mode - open Razorpay checkout
            if (data.data.orderId) {
                openRazorpayForInterview(data.data, applicationId);
            } else {
                showToast('error', 'Failed to create payment order. Please try again.');
            }
        } else {
            // Show actual error to user - do NOT simulate payment
            const errorMessage = data.message || 'Payment service is currently unavailable. Please try again later.';
            console.error('Payment order creation failed:', errorMessage);
            showToast('error', errorMessage);
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast('error', 'Payment service is currently unavailable. Please try again later.');
    }
}

/**
 * View interview details after payment - shows scheduled date, time, meeting link
 */
async function viewInterviewDetails(applicationId) {
    console.log('🔍 viewInterviewDetails called with applicationId:', applicationId);

    if (!applicationId) {
        showToast('error', 'Application ID is missing');
        return;
    }

    try {
        showToast('info', 'Loading interview details...');

        // Fetch application data from API to ensure we have latest details
        const response = await fetch(`${API_BASE_URL}/candidates/applications`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        if (!result.success) {
            showToast('error', 'Could not load application details');
            return;
        }

        // Find the application
        const app = result.data?.find(a => a.id === applicationId);
        if (!app) {
            showToast('error', 'Application not found');
            return;
        }

        const interview = app.interview || app.Interview;
        if (!interview) {
            showToast('error', 'Interview details not found');
            return;
        }

        const schedDate = interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set';
        const schedTime = interview.scheduledTime || 'Not set';
        const meetingLink = interview.interviewLink || interview.callDetails || 'Will be shared soon';
        const mode = interview.mode || 'VIDEO';

        // Create modal content
        const content = `
            <div style="padding: 16px;">
                <h3 style="color: var(--primary); margin-bottom: 16px;">📅 Interview Scheduled!</h3>
                
                <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1)); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                    <div style="display: grid; gap: 12px;">
                        <div>
                            <div style="font-size: 12px; color: var(--text-dim);">Date</div>
                            <div style="font-size: 16px; font-weight: 600; color: var(--text);">📆 ${schedDate}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--text-dim);">Time</div>
                            <div style="font-size: 16px; font-weight: 600; color: var(--text);">⏰ ${schedTime}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--text-dim);">Mode</div>
                            <div style="font-size: 16px; font-weight: 600; color: var(--text);">${mode === 'VIDEO' ? '📹 Video Call' : mode === 'PHONE' || mode === 'CALL' ? '📞 Phone Call' : '🏢 In-Person'}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--text-dim);">Meeting Link / Details</div>
                            <div style="font-size: 14px; color: var(--primary); word-break: break-all;">
                                ${meetingLink.startsWith('http') ? '<a href="' + meetingLink + '" target="_blank" style="color: var(--primary);">' + meetingLink + '</a>' : meetingLink}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 12px; text-align: center;">
                    <p style="color: var(--success); font-size: 14px; margin: 0;">✅ Payment Complete - Interview Details Unlocked</p>
                </div>
            </div>
        `;

        // Show in a modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal active" style="max-width: 450px;">
                <div class="modal-header">
                    <h3 class="modal-title">Interview Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Got It!</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error fetching interview details:', error);
        showToast('error', 'Could not load interview details');
    }
}

/**
 * Simulate payment success for demo purposes
 */
async function simulateInterviewPaymentSuccess(applicationId) {
    showToast('success', '✅ Payment successful! Interview details unlocked.');

    // CRITICAL: Store paid application ID separately so it persists across API refreshes
    const paidAppIds = JSON.parse(localStorage.getItem('paidApplicationIds') || '[]');
    if (!paidAppIds.includes(applicationId)) {
        paidAppIds.push(applicationId);
        localStorage.setItem('paidApplicationIds', JSON.stringify(paidAppIds));
    }

    // Update local application status
    const apps = JSON.parse(localStorage.getItem('demoApplications') || '[]');
    const appIndex = apps.findIndex(a => a.id === applicationId);
    if (appIndex !== -1) {
        apps[appIndex].status = 'PAYMENT_SUCCESS';  // Payment done - details now visible
        apps[appIndex].interview = {
            ...apps[appIndex].interview,
            status: 'PAYMENT_SUCCESS',
            paymentStatus: 'SUCCESS',
            paidAt: new Date().toISOString()
        };
        localStorage.setItem('demoApplications', JSON.stringify(apps));
    }

    // Also update state.applications if it exists
    if (state.applications) {
        const stateAppIndex = state.applications.findIndex(a => a.id === applicationId);
        if (stateAppIndex !== -1) {
            state.applications[stateAppIndex].status = 'PAYMENT_SUCCESS';
            if (state.applications[stateAppIndex].interview || state.applications[stateAppIndex].Interview) {
                const interview = state.applications[stateAppIndex].interview || state.applications[stateAppIndex].Interview;
                interview.status = 'PAYMENT_SUCCESS';
                interview.paymentStatus = 'SUCCESS';
                interview.paidAt = new Date().toISOString();
            }
        }
    }

    // Force reload applications from server
    await loadApplications();

    // Stay on applications page and show updated UI (no page reload needed)
    // The loadApplications call above already updated the UI
    console.log('✅ Payment successful - applications refreshed');
}

/**
 * Open Razorpay checkout for interview payment
 */
function openRazorpayForInterview(orderData, applicationId) {
    const options = {
        key: orderData.keyId,
        amount: 9900, // ₹99 in paise
        currency: 'INR',
        name: 'JobRefer',
        description: 'Interview Confirmation Fee',
        order_id: orderData.orderId,
        handler: async function (response) {
            // Verify payment
            try {
                const verifyResponse = await fetch(`${API_BASE_URL}/payments/interview/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({
                        applicationId,
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature
                    })
                });

                const data = await verifyResponse.json();
                if (data.success) {
                    showToast('success', '✅ Payment successful! Interview details unlocked.');

                    // Force refresh applications list and stay on page
                    await loadApplications();
                    console.log('✅ Payment successful - applications refreshed');
                } else {
                    showToast('error', data.message || 'Payment verification failed.');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                showToast('error', 'Could not verify payment. Please contact support.');
            }
        },
        prefill: {
            name: state.user?.firstName || '',
            email: state.user?.email || ''
        },
        theme: {
            color: '#6366f1'
        }
    };

    if (typeof Razorpay !== 'undefined') {
        const rzp = new Razorpay(options);
        rzp.open();
    } else {
        showToast('error', 'Payment service unavailable. Please try again later.');
    }
}

// Note: viewInterviewDetails is defined earlier in the file (around line 3938)
// and uses local state data instead of making an API call

// Ensure critical functions are globally accessible for onclick handlers in dynamic HTML
window.viewInterviewDetails = viewInterviewDetails;
window.payForInterview = payForInterview;
