// Admin Panel JavaScript
// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/v1'
    : `${window.location.origin}/api/v1`;

// State Management
const adminState = {
    token: null,
    user: null,
    currentPage: 'dashboard',
    dashboardStats: {},
    jobs: [],
    users: [],
    candidates: [],
    payments: [],
    refunds: [],
    auditLogs: [],
    questions: [],
    questionStats: {},
    skillBuckets: [],
    roleTests: [],
    interviews: [],
    interviewStats: {},
    analytics: {},
    revenueReport: {},
    currentJobId: null,
    currentQuestionId: null,
    currentSkillBucketId: null,
    currentRoleTestId: null,
    currentInterviewId: null,
};

// ==========================================
// MODAL REQUIRED FIELD MANAGEMENT
// Fix: Hidden modal forms have required fields that block submission
// ==========================================

/**
 * Disable required attributes on all modal form fields
 * Store original required state in data-required attribute
 */
function disableAllModalRequirements() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.querySelectorAll('[required]').forEach(field => {
            field.setAttribute('data-required', 'true');
            field.removeAttribute('required');
        });
    });
}

/**
 * Enable required attributes only for a specific modal
 * @param {string} modalId - The ID of the modal to enable required fields for
 */
function enableModalRequirements(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.querySelectorAll('[data-required="true"]').forEach(field => {
        field.setAttribute('required', '');
    });
}

/**
 * Disable required attributes for a specific modal
 * @param {string} modalId - The ID of the modal to disable required fields for
 */
function disableModalRequirements(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.querySelectorAll('[required]').forEach(field => {
        field.setAttribute('data-required', 'true');
        field.removeAttribute('required');
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Disable all modal required fields initially to prevent hidden form validation issues
    disableAllModalRequirements();

    // Check if already logged in
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
        adminState.token = savedToken;
        // Verify token is still valid by loading dashboard
        verifyTokenAndLoad();
    } else {
        showLoginPage();
    }

    // Setup navigation
    setupNavigation();

    // Setup filters
    setupFilters();
});

async function verifyTokenAndLoad() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${adminState.token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showDashboard();
                adminState.dashboardStats = data.data;
                updateDashboardUI();
                return;
            }
        }
        // Token invalid or expired - try to re-login silently or show login
        console.log('Token expired or invalid, showing login page');
        logout();
    } catch (error) {
        console.error('Token verification failed:', error);
        logout();
    }
}

// Helper to check token before API calls
async function apiCall(url, options = {}) {
    const defaultHeaders = {
        'Authorization': `Bearer ${adminState.token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });

    // Check for token expiration
    if (response.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        logout();
        throw new Error('Unauthorized');
    }

    return response;
}

// ==========================================
// AUTH FUNCTIONS
// ==========================================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        // Check if response is successful and has expected structure
        if (!response.ok) {
            showToast(data.message || 'Login failed', 'error');
            return;
        }

        if (!data.success || !data.data || !data.data.user) {
            showToast(data.message || 'Login failed', 'error');
            return;
        }

        const user = data.data.user;

        if (user.role !== 'ADMIN') {
            showToast('Access denied. Admin role required.', 'error');
            return;
        }

        // Success - store token and show dashboard
        adminState.token = data.data.token?.accessToken || data.data.accessToken;
        adminState.user = user;
        localStorage.setItem('adminToken', adminState.token);

        showToast('Login successful!', 'success');
        showDashboard();
        loadDashboardData();

    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please check if the server is running.', 'error');
    }
});

function logout() {
    adminState.token = null;
    adminState.user = null;
    localStorage.removeItem('adminToken');
    showLoginPage();
}

function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
}

// ==========================================
// NAVIGATION
// ==========================================

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
        });
    });
}

function navigateToPage(page) {
    // Update active link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Hide all pages
    document.querySelectorAll('.page-content').forEach(pageEl => {
        pageEl.classList.add('hidden');
    });

    // Show selected page
    const pageMap = {
        'dashboard': 'dashboardPage',
        'jobs': 'jobsPage',
        'skillBuckets': 'skillBucketsPage',
        'roleTests': 'roleTestsPage',
        'interviews': 'interviewsPage',
        'questions': 'questionsPage',
        'users': 'usersPage',
        'candidates': 'candidatesPage',
        'hr': 'hrPage',
        'payments': 'paymentsPage',
        'refunds': 'refundsPage',
        'analytics': 'analyticsPage',
        'audit': 'auditPage',
    };

    const pageTitles = {
        'dashboard': 'Dashboard',
        'jobs': 'Jobs',
        'skillBuckets': 'Skill Clusters',
        'roleTests': 'Role Tests',
        'interviews': 'Interviews',
        'questions': 'Question Bank',
        'users': 'Users',
        'candidates': 'Candidates',
        'hr': 'HR Approvals',
        'payments': 'Payments',
        'refunds': 'Refunds',
        'analytics': 'Analytics',
        'audit': 'Audit Logs',
    };

    const pageId = pageMap[page];
    if (pageId) {
        document.getElementById(pageId).classList.remove('hidden');
        document.getElementById('pageTitle').textContent = pageTitles[page] || page.charAt(0).toUpperCase() + page.slice(1);
    }

    adminState.currentPage = page;

    // Load data for the page
    loadPageData(page);
}

async function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'jobs':
            await loadJobs();
            break;
        case 'skillBuckets':
            await loadSkillBuckets();
            break;
        case 'roleTests':
            await loadRoleTests();
            break;
        case 'interviews':
            await loadInterviews();
            break;
        case 'questions':
            await loadQuestions();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'candidates':
            await loadCandidates();
            break;
        case 'hr':
            await loadPendingHRs();
            break;
        case 'payments':
            await loadPayments();
            break;
        case 'refunds':
            await loadRefunds();
            break;
        case 'analytics':
            await loadAnalytics();
            break;
        case 'audit':
            await loadAuditLogs();
            break;
    }
}

// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${adminState.token}`,
            },
        });

        const data = await response.json();

        if (data.success) {
            adminState.dashboardStats = data.data;
            updateDashboardUI();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

function updateDashboardUI() {
    const stats = adminState.dashboardStats;

    document.getElementById('statTotalUsers').textContent = stats.users?.total || 0;
    document.getElementById('statActiveJobs').textContent = stats.jobs?.active || 0;
    document.getElementById('statRevenue').textContent = `₹${formatNumber(stats.revenue?.totalAmount || 0)}`;
    document.getElementById('statApplications').textContent = stats.activity?.todayApplications || 0;
}

// ==========================================
// JOBS MANAGEMENT
// ==========================================

async function loadJobs(page = 1, status = '') {
    try {
        let url = `${API_BASE_URL}/admin/jobs?page=${page}&limit=10`;
        if (status) url += `&status=${status}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success && data.data) {
            adminState.jobs = data.data.data || data.data;
            renderJobsTable();
            if (data.data.meta) {
                renderPagination('jobsPagination', data.data.meta, (p) => loadJobs(p, status));
            }
        } else {
            console.error('Failed to load jobs:', data);
            showToast('Failed to load jobs', 'error');
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        showToast('Failed to load jobs', 'error');
    }
}

function renderJobsTable() {
    const container = document.getElementById('jobsTableContainer');

    if (!adminState.jobs || adminState.jobs.length === 0) {
        container.innerHTML = '<p class="loading">No jobs found</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Applications</th>
                    <th>Posted</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.jobs.map(job => {
        const appCount = job._count?.applications || 0;
        return `
                    <tr>
                        <td>${job.title}</td>
                        <td>${job.companyName || job.hr?.companyName || 'N/A'}</td>
                        <td>${job.location || 'N/A'}</td>
                        <td><span class="badge badge-${getStatusBadge(job.status)}">${job.status}</span></td>
                        <td>${appCount}</td>
                        <td>${formatDate(job.postedAt || job.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editJob('${job.id}')">Edit</button>
                            ${job.status === 'PENDING' ? `<button class="btn btn-sm btn-success" onclick="approveJob('${job.id}')">Approve</button>` : ''}
                            ${job.status === 'ACTIVE' ? `<button class="btn btn-sm btn-warning" onclick="expireJob('${job.id}')">Expire</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="deleteJob('${job.id}')">Delete</button>
                        </td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

function showCreateJobModal() {
    adminState.currentJobId = null;
    document.getElementById('jobModalTitle').textContent = 'Create New Job';
    document.getElementById('jobForm').reset();
    enableModalRequirements('jobModal'); // Enable required fields for this modal
    document.getElementById('jobModal').classList.add('active');
}

function closeJobModal() {
    disableModalRequirements('jobModal'); // Disable required fields when closing
    document.getElementById('jobModal').classList.remove('active');
}

async function editJob(jobId) {
    const job = adminState.jobs.find(j => j.id === jobId);
    if (!job) return;

    adminState.currentJobId = jobId;
    document.getElementById('jobModalTitle').textContent = 'Edit Job';

    document.getElementById('jobTitle').value = job.title;
    document.getElementById('jobCompany').value = job.companyName;
    document.getElementById('jobLocation').value = job.location;
    document.getElementById('jobDescription').value = job.description;
    document.getElementById('jobSalaryMin').value = job.salaryMin || '';
    document.getElementById('jobSalaryMax').value = job.salaryMax || '';
    document.getElementById('jobExpMin').value = job.experienceMin || '';
    document.getElementById('jobExpMax').value = job.experienceMax || '';
    document.getElementById('jobFee').value = job.referralFee || 499;

    enableModalRequirements('jobModal'); // Enable required fields for this modal
    document.getElementById('jobModal').classList.add('active');
}

document.getElementById('jobForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if token exists
    if (!adminState.token) {
        showToast('Session expired. Please login again.', 'error');
        logout();
        return;
    }

    const jobData = {
        title: document.getElementById('jobTitle').value,
        companyName: document.getElementById('jobCompany').value,
        location: document.getElementById('jobLocation').value,
        description: document.getElementById('jobDescription').value,
        salaryMin: parseInt(document.getElementById('jobSalaryMin').value) || null,
        salaryMax: parseInt(document.getElementById('jobSalaryMax').value) || null,
        experienceMin: parseInt(document.getElementById('jobExpMin').value) || 0,
        experienceMax: parseInt(document.getElementById('jobExpMax').value) || null,
        referralFee: parseInt(document.getElementById('jobFee').value) || 499,
    };

    try {
        let url = `${API_BASE_URL}/admin/jobs/create`;
        let method = 'POST';

        if (adminState.currentJobId) {
            url = `${API_BASE_URL}/admin/jobs/${adminState.currentJobId}/update`;
            method = 'PATCH';
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminState.token}`,
            },
            body: JSON.stringify(jobData),
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success) {
            showToast(data.message || 'Job saved successfully!', 'success');
            closeJobModal();
            loadJobs();
        } else {
            showToast(data.message || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving job:', error);
        showToast('Failed to save job. Please try again.', 'error');
    }
});

async function approveJob(jobId) {
    if (!confirm('Approve this job?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        const data = await response.json();

        if (data.success) {
            showToast('Job approved successfully', 'success');
            loadJobs();
        } else {
            showToast(data.message || 'Failed to approve job', 'error');
        }
    } catch (error) {
        console.error('Error approving job:', error);
        showToast('Failed to approve job', 'error');
    }
}

async function expireJob(jobId) {
    const confirmed = await showConfirmModal({
        icon: '⏰',
        title: 'Expire Job',
        message: 'This job will no longer be visible to candidates. Continue?',
        confirmText: 'Yes, Expire',
        confirmClass: 'btn-warning'
    });

    if (!confirmed) return;

    // Check token
    if (!adminState.token) {
        showToast('Session expired. Please login again.', 'error');
        logout();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/expire`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminState.token}`,
                'Content-Type': 'application/json'
            },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success) {
            showToast('Job expired successfully', 'success');
            loadJobs();
        } else {
            showToast(data.message || 'Failed to expire job', 'error');
        }
    } catch (error) {
        console.error('Error expiring job:', error);
        showToast('Failed to expire job', 'error');
    }
}

async function deleteJob(jobId) {
    const confirmed = await showConfirmModal({
        icon: '🗑️',
        title: 'Delete Job',
        message: 'This action cannot be undone. Are you sure?',
        confirmText: 'Yes, Delete',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    // Check token
    if (!adminState.token) {
        showToast('Session expired. Please login again.', 'error');
        logout();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminState.token}`,
                'Content-Type': 'application/json'
            },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success) {
            showToast('Job deleted successfully', 'success');
            loadJobs();
        } else {
            showToast(data.message || 'Failed to delete job', 'error');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        showToast('Failed to delete job', 'error');
    }
}

// ==========================================
// USERS MANAGEMENT
// ==========================================

async function loadUsers(page = 1, role = '', status = '') {
    try {
        let url = `${API_BASE_URL}/admin/users?page=${page}&limit=10`;
        if (role) url += `&role=${role}`;
        if (status) url += `&status=${status}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success && data.data) {
            adminState.users = data.data.data || data.data;
            renderUsersTable();
            if (data.data.meta) {
                renderPagination('usersPagination', data.data.meta, (p) => loadUsers(p, role, status));
            }
        } else {
            console.error('Failed to load users:', data);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}

function renderUsersTable() {
    const container = document.getElementById('usersTableContainer');

    if (!adminState.users || adminState.users.length === 0) {
        container.innerHTML = '<p class="loading">No users found</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.users.map(user => `
                    <tr>
                        <td>${user.email}</td>
                        <td><span class="badge badge-info">${user.role}</span></td>
                        <td>${getUserName(user)}</td>
                        <td><span class="badge badge-${user.status === 'ACTIVE' ? 'success' : 'danger'}">${user.status}</span></td>
                        <td>${formatDate(user.createdAt)}</td>
                        <td>
                            ${user.status === 'ACTIVE' && user.role !== 'ADMIN' ?
            `<button class="btn btn-sm btn-danger" onclick="blockUser('${user.id}')">Block</button>` : ''}
                            ${user.status === 'BLOCKED' ?
            `<button class="btn btn-sm btn-success" onclick="unblockUser('${user.id}')">Unblock</button>` : ''}
                            ${user.role !== 'ADMIN' ?
            `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">Delete</button>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

async function blockUser(userId) {
    const confirmed = await showConfirmModal({
        icon: '🚫',
        title: 'Block User',
        message: 'This user will no longer be able to access their account.',
        confirmText: 'Yes, Block',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/block`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        const data = await response.json();

        if (data.success) {
            showToast('User blocked successfully', 'success');
            loadUsers();
        } else {
            showToast(data.message || 'Failed to block user', 'error');
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        showToast('Failed to block user', 'error');
    }
}

async function unblockUser(userId) {
    const confirmed = await showConfirmModal({
        icon: '✅',
        title: 'Unblock User',
        message: 'This user will regain access to their account.',
        confirmText: 'Yes, Unblock',
        confirmClass: 'btn-success'
    });

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unblock`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        const data = await response.json();

        if (data.success) {
            showToast('User unblocked successfully', 'success');
            loadUsers();
        } else {
            showToast(data.message || 'Failed to unblock user', 'error');
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        showToast('Failed to unblock user', 'error');
    }
}

async function deleteUser(userId) {
    const confirmed = await showConfirmModal({
        icon: '🗑️',
        title: 'Delete User',
        message: 'This action cannot be undone. All user data will be permanently removed.',
        confirmText: 'Yes, Delete',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        const data = await response.json();

        if (data.success) {
            showToast('User deleted successfully', 'success');
            loadUsers();
        } else {
            showToast(data.message || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user', 'error');
    }
}

// ==========================================
// CANDIDATES MANAGEMENT
// ==========================================

async function loadCandidates(page = 1, search = '') {
    try {
        let url = `${API_BASE_URL}/admin/candidates?page=${page}&limit=10`;
        if (search) url += `&search=${search}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success && data.data) {
            adminState.candidates = data.data.data || data.data;
            renderCandidatesTable();
            if (data.data.meta) {
                renderPagination('candidatesPagination', data.data.meta, (p) => loadCandidates(p, search));
            }
        } else {
            console.error('Failed to load candidates:', data);
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        showToast('Failed to load candidates', 'error');
    }
}

function renderCandidatesTable() {
    const container = document.getElementById('candidatesTableContainer');

    if (!adminState.candidates || adminState.candidates.length === 0) {
        container.innerHTML = '<p class="loading">No candidates found</p>';
        return;
    }

    // Get shortlisted candidates from localStorage
    const shortlisted = JSON.parse(localStorage.getItem('shortlistedCandidates') || '[]');

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Experience</th>
                    <th>Skills</th>
                    <th>Resume</th>
                    <th>Applications</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.candidates.map(user => {
        const candidate = user.candidate;
        const skills = candidate?.skills || [];
        const experiences = candidate?.experiences || [];
        const totalExp = experiences.length > 0
            ? Math.round((new Date() - new Date(experiences[experiences.length - 1]?.startDate || new Date())) / (365.25 * 24 * 60 * 60 * 1000))
            : 0;
        const isShortlisted = shortlisted.includes(candidate?.id);
        const resumeUrl = candidate?.resumeUrl;

        return `
                        <tr>
                            <td>
                                <div style="font-weight: 600;">${candidate?.firstName || ''} ${candidate?.lastName || ''}</div>
                                <div style="font-size: 12px; color: var(--text-dim);">${user.email}</div>
                                <div style="font-size: 12px; color: var(--text-dim);">${candidate?.phone || ''}</div>
                            </td>
                            <td>
                                <span class="badge badge-info">${totalExp} years</span>
                            </td>
                            <td>
                                <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 200px;">
                                    ${skills.slice(0, 3).map(s => `<span class="badge badge-success" style="font-size: 11px;">${s.name}</span>`).join('')}
                                    ${skills.length > 3 ? `<span class="badge" style="font-size: 11px;">+${skills.length - 3}</span>` : ''}
                                </div>
                            </td>
                            <td>
                                ${resumeUrl
                ? `<div style="display: flex; gap: 4px;">
                                        <button class="btn btn-primary btn-sm" onclick="previewResume('${resumeUrl}')" title="Preview">👁️</button>
                                        <button class="btn btn-success btn-sm" onclick="downloadResume('${resumeUrl}', '${candidate?.firstName || 'resume'}')" title="Download">📄</button>
                                       </div>`
                : '<span class="badge badge-warning">No Resume</span>'
            }
                            </td>
                            <td>${candidate?.applications?.length || 0}</td>
                            <td>
                                <div style="display: flex; gap: 4px;">
                                    <button class="btn ${isShortlisted ? 'btn-warning' : 'btn-primary'} btn-sm" 
                                            onclick="toggleShortlist('${candidate?.id}')" 
                                            title="${isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}">
                                        ${isShortlisted ? '⭐' : '☆'}
                                    </button>
                                    <button class="btn btn-success btn-sm" onclick="viewCandidateProfile('${user.id}')" title="View Profile">👤</button>
                                </div>
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// Resume preview in new tab
function previewResume(url) {
    if (!url) {
        showToast('No resume URL available', 'error');
        return;
    }
    // Open Cloudinary URL directly - PDFs will display in browser
    window.open(url, '_blank');
}

// Resume download - for Cloudinary raw files
function downloadResume(url, name) {
    if (!url) {
        showToast('No resume URL available', 'error');
        return;
    }

    // For Cloudinary URLs, add fl_attachment to force download
    let downloadUrl = url;
    if (url.includes('cloudinary.com')) {
        // Insert fl_attachment flag before the file path
        // Cloudinary URL format: .../raw/upload/v123456/folder/file.pdf
        // We need: .../raw/upload/fl_attachment/v123456/folder/file.pdf
        downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
    }

    // Open in new tab - browser will download due to fl_attachment
    window.open(downloadUrl, '_blank');
}

// Toggle shortlist for candidate
function toggleShortlist(candidateId) {
    if (!candidateId) return;

    let shortlisted = JSON.parse(localStorage.getItem('shortlistedCandidates') || '[]');

    if (shortlisted.includes(candidateId)) {
        shortlisted = shortlisted.filter(id => id !== candidateId);
        showToast('Removed from shortlist', 'info');
    } else {
        shortlisted.push(candidateId);
        showToast('Added to shortlist ⭐', 'success');
    }

    localStorage.setItem('shortlistedCandidates', JSON.stringify(shortlisted));
    renderCandidatesTable();
}

// View candidate profile modal
function viewCandidateProfile(userId) {
    showToast('Profile view coming soon!', 'info');
}

// ==========================================
// HR APPROVALS
// ==========================================

async function loadPendingHRs() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/hr/pending`, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success) {
            renderHRTable(data.data || []);
        }
    } catch (error) {
        console.error('Error loading HRs:', error);
        showToast('Failed to load HR approvals', 'error');
    }
}

function renderHRTable(hrs) {
    const container = document.getElementById('hrTableContainer');

    if (!hrs || hrs.length === 0) {
        container.innerHTML = '<p class="loading">No pending HR approvals</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Website</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${hrs.map(hr => `
                    <tr>
                        <td>${hr.companyName}</td>
                        <td>${hr.user?.email || 'N/A'}</td>
                        <td>${hr.companyWebsite || 'N/A'}</td>
                        <td>${formatDate(hr.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-success" onclick="approveHR('${hr.id}')">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="rejectHR('${hr.id}')">Reject</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

async function approveHR(hrId) {
    if (!confirm('Approve this HR?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/hr/${hrId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        const data = await response.json();

        if (data.success) {
            showToast('HR approved successfully', 'success');
            loadPendingHRs();
        } else {
            showToast(data.message || 'Failed to approve HR', 'error');
        }
    } catch (error) {
        console.error('Error approving HR:', error);
        showToast('Failed to approve HR', 'error');
    }
}

async function rejectHR(hrId) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/hr/${hrId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminState.token}`,
            },
            body: JSON.stringify({ reason }),
        });

        const data = await response.json();

        if (data.success) {
            showToast('HR rejected successfully', 'success');
            loadPendingHRs();
        } else {
            showToast(data.message || 'Failed to reject HR', 'error');
        }
    } catch (error) {
        console.error('Error rejecting HR:', error);
        showToast('Failed to reject HR', 'error');
    }
}

// ==========================================
// PAYMENTS
// ==========================================

async function loadPayments(page = 1, status = '') {
    try {
        let url = `${API_BASE_URL}/admin/payments?page=${page}&limit=10`;
        if (status) url += `&status=${status}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success && data.data) {
            adminState.payments = data.data.data || data.data;
            renderPaymentsTable();
            if (data.data.meta) {
                renderPagination('paymentsPagination', data.data.meta, (p) => loadPayments(p, status));
            }
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Failed to load payments', 'error');
    }
}

function renderPaymentsTable() {
    const container = document.getElementById('paymentsTableContainer');

    if (!adminState.payments || adminState.payments.length === 0) {
        container.innerHTML = '<p class="loading">No payments found</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.payments.map(payment => {
        const app = payment.application;
        return `
                        <tr>
                            <td>${payment.razorpayPaymentId || 'N/A'}</td>
                            <td>₹${payment.amount}</td>
                            <td>${app?.candidate?.firstName || ''} ${app?.candidate?.lastName || ''}</td>
                            <td>${app?.job?.title || 'N/A'}</td>
                            <td><span class="badge badge-${getStatusBadge(payment.status)}">${payment.status}</span></td>
                            <td>${formatDate(payment.createdAt)}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// ==========================================
// REFUNDS
// ==========================================

async function loadRefunds() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/refunds/pending`, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success) {
            renderRefundsTable(data.data || []);
        }
    } catch (error) {
        console.error('Error loading refunds:', error);
        showToast('Failed to load refunds', 'error');
    }
}

function renderRefundsTable(refunds) {
    const container = document.getElementById('refundsTableContainer');

    if (!refunds || refunds.length === 0) {
        container.innerHTML = '<p class="loading">No pending refunds</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Amount</th>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Reason</th>
                    <th>Requested</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${refunds.map(refund => {
        const app = refund.payment?.application;
        return `
                        <tr>
                            <td>₹${refund.amount}</td>
                            <td>${app?.candidate?.firstName || ''} ${app?.candidate?.lastName || ''}</td>
                            <td>${app?.job?.title || 'N/A'}</td>
                            <td>${refund.reason || 'N/A'}</td>
                            <td>${formatDate(refund.createdAt)}</td>
                            <td>
                                <button class="btn btn-sm btn-success" onclick="approveRefund('${refund.id}')">Approve</button>
                                <button class="btn btn-sm btn-danger" onclick="rejectRefund('${refund.id}')">Reject</button>
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

async function approveRefund(refundId) {
    const notes = prompt('Enter approval notes (optional):');

    try {
        const response = await fetch(`${API_BASE_URL}/admin/refunds/${refundId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminState.token}`,
            },
            body: JSON.stringify({ notes }),
        });

        const data = await response.json();

        if (data.success) {
            showToast('Refund approved successfully', 'success');
            loadRefunds();
        } else {
            showToast(data.message || 'Failed to approve refund', 'error');
        }
    } catch (error) {
        console.error('Error approving refund:', error);
        showToast('Failed to approve refund', 'error');
    }
}

async function rejectRefund(refundId) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/refunds/${refundId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminState.token}`,
            },
            body: JSON.stringify({ reason }),
        });

        const data = await response.json();

        if (data.success) {
            showToast('Refund rejected successfully', 'success');
            loadRefunds();
        } else {
            showToast(data.message || 'Failed to reject refund', 'error');
        }
    } catch (error) {
        console.error('Error rejecting refund:', error);
        showToast('Failed to reject refund', 'error');
    }
}

// ==========================================
// AUDIT LOGS
// ==========================================

async function loadAuditLogs(page = 1, action = '') {
    try {
        let url = `${API_BASE_URL}/admin/audit-logs?page=${page}&limit=20`;
        if (action) url += `&action=${action}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success && data.data) {
            adminState.auditLogs = data.data.data || data.data;
            renderAuditLogsTable();
            if (data.data.meta) {
                renderPagination('auditPagination', data.data.meta, (p) => loadAuditLogs(p, action));
            }
        }
    } catch (error) {
        console.error('Error loading audit logs:', error);
        showToast('Failed to load audit logs', 'error');
    }
}

function renderAuditLogsTable() {
    const container = document.getElementById('auditTableContainer');

    if (!adminState.auditLogs || adminState.auditLogs.length === 0) {
        container.innerHTML = '<p class="loading">No audit logs found</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>User</th>
                    <th>Metadata</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.auditLogs.map(log => `
                    <tr>
                        <td><span class="badge badge-info">${log.action}</span></td>
                        <td>${log.entityType} (${log.entityId.substring(0, 8)}...)</td>
                        <td>${log.user?.email || 'N/A'}</td>
                        <td><small>${JSON.stringify(log.metadata).substring(0, 50)}...</small></td>
                        <td>${formatDateTime(log.createdAt)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// ==========================================
// FILTERS
// ==========================================

function setupFilters() {
    // Job filters
    document.getElementById('jobStatusFilter')?.addEventListener('change', (e) => {
        loadJobs(1, e.target.value);
    });

    document.getElementById('jobSearch')?.addEventListener('input', debounce((e) => {
        // Implement search if backend supports it
        loadJobs();
    }, 500));

    // User filters
    document.getElementById('userRoleFilter')?.addEventListener('change', () => {
        const role = document.getElementById('userRoleFilter').value;
        const status = document.getElementById('userStatusFilter').value;
        loadUsers(1, role, status);
    });

    document.getElementById('userStatusFilter')?.addEventListener('change', () => {
        const role = document.getElementById('userRoleFilter').value;
        const status = document.getElementById('userStatusFilter').value;
        loadUsers(1, role, status);
    });

    // Candidate search
    document.getElementById('candidateSearch')?.addEventListener('input', debounce((e) => {
        loadCandidates(1, e.target.value);
    }, 500));

    // Payment filter
    document.getElementById('paymentStatusFilter')?.addEventListener('change', (e) => {
        loadPayments(1, e.target.value);
    });

    // Audit filter
    document.getElementById('auditActionFilter')?.addEventListener('change', (e) => {
        loadAuditLogs(1, e.target.value);
    });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function renderPagination(containerId, meta, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || !meta) return;

    const { page, totalPages } = meta;

    // Clear existing content
    container.innerHTML = '';

    // Create Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = page === 1;
    prevBtn.addEventListener('click', () => loadFunction(page - 1));
    container.appendChild(prevBtn);

    // Create page number buttons
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === page ? 'active' : '';
        pageBtn.addEventListener('click', () => loadFunction(i));
        container.appendChild(pageBtn);
    }

    // Create Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = page === totalPages || totalPages === 0;
    nextBtn.addEventListener('click', () => loadFunction(page + 1));
    container.appendChild(nextBtn);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Custom confirmation modal - returns a Promise
function showConfirmModal(options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const icon = document.getElementById('confirmIcon');
        const title = document.getElementById('confirmTitle');
        const message = document.getElementById('confirmMessage');
        const yesBtn = document.getElementById('confirmYes');
        const noBtn = document.getElementById('confirmNo');

        // Set content
        icon.textContent = options.icon || '⚠️';
        title.textContent = options.title || 'Confirm Action';
        message.textContent = options.message || 'Are you sure you want to proceed?';
        yesBtn.textContent = options.confirmText || 'Yes, Confirm';
        yesBtn.className = `btn ${options.confirmClass || 'btn-danger'}`;

        // Show modal
        modal.classList.add('active');

        // Handle clicks
        const handleYes = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(true);
        };

        const handleNo = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
        };

        yesBtn.addEventListener('click', handleYes);
        noBtn.addEventListener('click', handleNo);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return getTimeAgo(dateString);
}

function getTimeAgo(dateString) {
    if (!dateString) return 'N/A';

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

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

function getStatusBadge(status) {
    const statusMap = {
        'ACTIVE': 'success',
        'PENDING': 'warning',
        'EXPIRED': 'danger',
        'SUCCESS': 'success',
        'FAILED': 'danger',
        'REFUNDED': 'info',
    };
    return statusMap[status] || 'info';
}

function getUserName(user) {
    if (user.candidate) {
        return `${user.candidate.firstName || ''} ${user.candidate.lastName || ''}`.trim() || 'N/A';
    }
    if (user.hr) {
        return user.hr.companyName || 'N/A';
    }
    if (user.employee) {
        return user.employee.companyName || 'N/A';
    }
    return 'N/A';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==========================================
// QUESTION BANK MANAGEMENT
// ==========================================

async function loadQuestions(page = 1) {
    try {
        // Load stats first
        await loadQuestionStats();

        const difficulty = document.getElementById('questionDifficultyFilter')?.value || '';
        const category = document.getElementById('questionCategoryFilter')?.value || '';
        const search = document.getElementById('questionSearch')?.value || '';

        let url = `${API_BASE_URL}/admin/questions?page=${page}&limit=10`;
        if (difficulty) url += `&difficulty=${difficulty}`;
        if (category) url += `&category=${category}`;
        if (search) url += `&search=${search}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success && data.data) {
            adminState.questions = data.data.data || data.data;
            renderQuestionsTable();
            if (data.data.meta) {
                renderPagination('questionsPagination', data.data.meta, (p) => loadQuestions(p));
            }
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        showToast('Failed to load questions', 'error');
    }
}

async function loadQuestionStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/questions/stats`, {
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });
        const data = await response.json();

        if (data.success && data.data) {
            adminState.questionStats = data.data;
            document.getElementById('statTotalQuestions').textContent = data.data.total || 0;

            const byDifficulty = data.data.byDifficulty || [];
            const easy = byDifficulty.find(d => d.difficulty === 'EASY')?._count || 0;
            const medium = byDifficulty.find(d => d.difficulty === 'MEDIUM')?._count || 0;
            const hard = byDifficulty.find(d => d.difficulty === 'HARD')?._count || 0;

            document.getElementById('statEasyQuestions').textContent = easy;
            document.getElementById('statMediumQuestions').textContent = medium;
            document.getElementById('statHardQuestions').textContent = hard;
        }
    } catch (error) {
        console.error('Error loading question stats:', error);
    }
}

function renderQuestionsTable() {
    const container = document.getElementById('questionsTableContainer');

    if (!adminState.questions || adminState.questions.length === 0) {
        container.innerHTML = '<p class="loading">No questions found. Click "Add Question" to create one.</p>';
        return;
    }

    const diffBadge = (diff) => {
        const colors = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' };
        return `<span class="badge badge-${colors[diff] || 'info'}">${diff}</span>`;
    };

    const table = `
        <table>
            <thead>
                <tr>
                    <th style="max-width: 300px;">Question</th>
                    <th>Difficulty</th>
                    <th>Category</th>
                    <th>Role Type</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.questions.map(q => `
                    <tr>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${q.question}
                        </td>
                        <td>${diffBadge(q.difficulty)}</td>
                        <td><span class="badge badge-info">${q.category}</span></td>
                        <td>${q.roleType || 'General'}</td>
                        <td>${formatDate(q.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewQuestion('${q.id}')">View</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteQuestion('${q.id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

function showCreateQuestionModal() {
    adminState.currentQuestionId = null;
    document.getElementById('questionModalTitle').textContent = 'Add New Question';
    document.getElementById('questionForm').reset();
    enableModalRequirements('questionModal'); // Enable required fields for this modal
    document.getElementById('questionModal').classList.add('active');
}

function closeQuestionModal() {
    disableModalRequirements('questionModal'); // Disable required fields when closing
    document.getElementById('questionModal').classList.remove('active');
}

function viewQuestion(questionId) {
    const q = adminState.questions.find(q => q.id === questionId);
    if (!q) return;

    adminState.currentQuestionId = questionId;
    document.getElementById('questionModalTitle').textContent = 'View Question';

    document.getElementById('questionText').value = q.question;
    document.getElementById('optionA').value = q.options?.[0] || '';
    document.getElementById('optionB').value = q.options?.[1] || '';
    document.getElementById('optionC').value = q.options?.[2] || '';
    document.getElementById('optionD').value = q.options?.[3] || '';
    document.getElementById('correctAnswer').value = q.correctAnswer?.toString() || '0';
    document.getElementById('questionDifficulty').value = q.difficulty;
    document.getElementById('questionCategory').value = q.category;
    document.getElementById('roleType').value = q.roleType || '';
    document.getElementById('questionTags').value = (q.tags || []).join(', ');
    document.getElementById('questionExplanation').value = q.explanation || '';

    enableModalRequirements('questionModal'); // Enable required fields for this modal
    document.getElementById('questionModal').classList.add('active');
}

document.getElementById('questionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const questionData = {
        question: document.getElementById('questionText').value,
        options: [
            document.getElementById('optionA').value,
            document.getElementById('optionB').value,
            document.getElementById('optionC').value,
            document.getElementById('optionD').value,
        ],
        correctAnswer: parseInt(document.getElementById('correctAnswer').value),
        difficulty: document.getElementById('questionDifficulty').value,
        category: document.getElementById('questionCategory').value,
        roleType: document.getElementById('roleType').value || undefined,
        tags: document.getElementById('questionTags').value.split(',').map(t => t.trim()).filter(t => t),
        explanation: document.getElementById('questionExplanation').value || undefined,
    };

    try {
        const url = `${API_BASE_URL}/admin/questions`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminState.token}`,
            },
            body: JSON.stringify(questionData),
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            logout();
            return;
        }

        const data = await response.json();

        if (data.success) {
            showToast('Question saved successfully!', 'success');
            closeQuestionModal();
            loadQuestions();
        } else {
            showToast(data.message || 'Failed to save question', 'error');
        }
    } catch (error) {
        console.error('Error saving question:', error);
        showToast('Failed to save question', 'error');
    }
});

async function deleteQuestion(questionId) {
    const confirmed = await showConfirmModal({
        icon: '🗑️',
        title: 'Delete Question',
        message: 'Are you sure you want to delete this question?',
        confirmText: 'Yes, Delete',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/questions/${questionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

        const data = await response.json();

        if (data.success) {
            showToast('Question deleted successfully', 'success');
            loadQuestions();
        } else {
            showToast(data.message || 'Failed to delete question', 'error');
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        showToast('Failed to delete question', 'error');
    }
}

// Setup filters for questions
document.getElementById('questionDifficultyFilter')?.addEventListener('change', () => loadQuestions());
document.getElementById('questionCategoryFilter')?.addEventListener('change', () => loadQuestions());
document.getElementById('questionSearch')?.addEventListener('input', debounce(() => loadQuestions(), 500));

// ==========================================
// SKILL BUCKETS MANAGEMENT
// ==========================================

async function loadSkillBuckets() {
    try {
        const response = await apiCall(`${API_BASE_URL}/admin/skill-buckets?includeInactive=true`);
        const data = await response.json();

        if (data) {
            adminState.skillBuckets = Array.isArray(data) ? data : (data.data || []);
            renderSkillBucketsTable();
        }
    } catch (error) {
        console.error('Error loading skill buckets:', error);
        showToast('Failed to load skill clusters', 'error');
    }
}

function renderSkillBucketsTable() {
    const container = document.getElementById('skillBucketsTableContainer');

    if (!adminState.skillBuckets || adminState.skillBuckets.length === 0) {
        container.innerHTML = '<p class="loading">No skill clusters found</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Experience</th>
                    <th>Jobs Using</th>
                    <th>Test Attempts</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.skillBuckets.map(bucket => `
                    <tr>
                        <td><code>${bucket.code}</code></td>
                        <td>${bucket.displayName || bucket.name}</td>
                        <td>${bucket.experienceMin}-${bucket.experienceMax} yrs</td>
                        <td>${(bucket._count?.jobs || 0) + (bucket._count?.jobRequirements || 0)}</td>
                        <td>${bucket._count?.attempts || 0}</td>
                        <td><span class="badge badge-${bucket.isActive ? 'success' : 'danger'}">${bucket.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editSkillBucket('${bucket.id}')">Edit</button>
                            ${bucket.isActive ? `<button class="btn btn-sm btn-warning" onclick="toggleSkillBucketStatus('${bucket.id}', false)">Deactivate</button>` :
            `<button class="btn btn-sm btn-success" onclick="toggleSkillBucketStatus('${bucket.id}', true)">Activate</button>`}
                            <button class="btn btn-sm btn-danger" onclick="deleteSkillBucket('${bucket.id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

function showCreateSkillBucketModal() {
    adminState.currentSkillBucketId = null;
    document.getElementById('skillBucketModalTitle').textContent = 'Create Skill Cluster';
    document.getElementById('skillBucketForm').reset();
    document.getElementById('skillBucketId').value = '';
    enableModalRequirements('skillBucketModal'); // Enable required fields for this modal
    document.getElementById('skillBucketModal').classList.add('active');
}

function closeSkillBucketModal() {
    disableModalRequirements('skillBucketModal'); // Disable required fields when closing
    document.getElementById('skillBucketModal').classList.remove('active');
}

function editSkillBucket(bucketId) {
    const bucket = adminState.skillBuckets.find(b => b.id === bucketId);
    if (!bucket) return;

    adminState.currentSkillBucketId = bucketId;
    document.getElementById('skillBucketModalTitle').textContent = 'Edit Skill Cluster';
    document.getElementById('skillBucketId').value = bucket.id;
    document.getElementById('skillBucketCode').value = bucket.code;
    document.getElementById('skillBucketName').value = bucket.name;
    document.getElementById('skillBucketDisplayName').value = bucket.displayName || '';
    document.getElementById('skillBucketDescription').value = bucket.description || '';
    document.getElementById('skillBucketExpMin').value = bucket.experienceMin;
    document.getElementById('skillBucketExpMax').value = bucket.experienceMax;

    enableModalRequirements('skillBucketModal'); // Enable required fields for this modal
    document.getElementById('skillBucketModal').classList.add('active');
}

document.getElementById('skillBucketForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        code: document.getElementById('skillBucketCode').value,
        name: document.getElementById('skillBucketName').value,
        displayName: document.getElementById('skillBucketDisplayName').value || undefined,
        description: document.getElementById('skillBucketDescription').value || undefined,
        experienceMin: parseInt(document.getElementById('skillBucketExpMin').value) || 0,
        experienceMax: parseInt(document.getElementById('skillBucketExpMax').value) || 3,
    };

    try {
        let url = `${API_BASE_URL}/admin/skill-buckets`;
        let method = 'POST';

        if (adminState.currentSkillBucketId) {
            url = `${API_BASE_URL}/admin/skill-buckets/${adminState.currentSkillBucketId}`;
            method = 'PATCH';
        }

        const response = await apiCall(url, {
            method,
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message || 'Skill cluster saved!', 'success');
            closeSkillBucketModal();
            loadSkillBuckets();
        } else {
            showToast(result.message || 'Failed to save skill cluster', 'error');
        }
    } catch (error) {
        console.error('Error saving skill bucket:', error);
        showToast('Failed to save skill cluster', 'error');
    }
});

async function toggleSkillBucketStatus(bucketId, activate) {
    try {
        const response = await apiCall(`${API_BASE_URL}/admin/skill-buckets/${bucketId}`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: activate }),
        });

        const data = await response.json();

        if (data.success) {
            showToast(`Skill cluster ${activate ? 'activated' : 'deactivated'}`, 'success');
            loadSkillBuckets();
        } else {
            showToast(data.message || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error toggling skill bucket status:', error);
        showToast('Failed to update status', 'error');
    }
}

async function deleteSkillBucket(bucketId) {
    const confirmed = await showConfirmModal({
        icon: '🗑️',
        title: 'Delete Skill Cluster',
        message: 'This action cannot be undone. Are you sure?',
        confirmText: 'Yes, Delete',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        const response = await apiCall(`${API_BASE_URL}/admin/skill-buckets/${bucketId}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message || 'Skill cluster deleted', 'success');
            loadSkillBuckets();
        } else {
            showToast(data.message || 'Failed to delete skill cluster', 'error');
        }
    } catch (error) {
        console.error('Error deleting skill bucket:', error);
        showToast('Failed to delete skill cluster', 'error');
    }
}

// ==========================================
// INTERVIEWS MANAGEMENT
// ==========================================

async function loadInterviews(page = 1, status = '') {
    try {
        // Load both interviews and stats
        await Promise.all([
            loadInterviewsList(page, status),
            loadInterviewStats(),
        ]);
    } catch (error) {
        console.error('Error loading interviews:', error);
    }
}

async function loadInterviewStats() {
    try {
        const response = await apiCall(`${API_BASE_URL}/admin/interviews/stats`);
        const data = await response.json();

        if (data) {
            adminState.interviewStats = data;
            updateInterviewStatsUI();
        }
    } catch (error) {
        console.error('Error loading interview stats:', error);
    }
}

function updateInterviewStatsUI() {
    const stats = adminState.interviewStats;
    document.getElementById('statTotalInterviews').textContent = stats.total || 0;
    document.getElementById('statScheduledInterviews').textContent = stats.byStatus?.scheduled || 0;
    document.getElementById('statCompletedInterviews').textContent = stats.byStatus?.completed || 0;
    document.getElementById('statNoShowRate').textContent = stats.noShowRate || '0%';
}

async function loadInterviewsList(page = 1, status = '') {
    try {
        let url = `${API_BASE_URL}/admin/interviews?page=${page}&limit=10`;
        if (status) url += `&status=${status}`;

        const response = await apiCall(url);
        const data = await response.json();

        if (data.success && data.data) {
            adminState.interviews = data.data.data || data.data;
            renderInterviewsTable();
            if (data.data.meta) {
                renderPagination('interviewsPagination', data.data.meta, (p) => loadInterviewsList(p, status));
            }
        }
    } catch (error) {
        console.error('Error loading interviews list:', error);
        showToast('Failed to load interviews', 'error');
    }
}

function renderInterviewsTable() {
    const container = document.getElementById('interviewsTableContainer');

    if (!adminState.interviews || adminState.interviews.length === 0) {
        container.innerHTML = '<p class="loading">No interviews found</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Scheduled</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.interviews.map(interview => {
        const candidate = interview.application?.candidate;
        const job = interview.application?.job;
        return `
                        <tr>
                            <td>${candidate?.firstName || ''} ${candidate?.lastName || 'N/A'}</td>
                            <td>${job?.title || 'N/A'}</td>
                            <td>${job?.companyName || 'N/A'}</td>
                            <td><span class="badge badge-${getInterviewStatusBadge(interview.status)}">${formatInterviewStatus(interview.status)}</span></td>
                            <td>${interview.scheduledDate ? formatDateTime(interview.scheduledDate) : '-'}</td>
                            <td>${formatDate(interview.createdAt)}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="showInterviewActionModal('${interview.id}')">Actions</button>
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

function getInterviewStatusBadge(status) {
    const badges = {
        'PAYMENT_PENDING': 'warning',
        'INTERVIEW_CONFIRMED': 'info',
        'PAYMENT_SUCCESS': 'success',
        'READY_TO_SCHEDULE': 'info',
        'INTERVIEW_SCHEDULED': 'primary',
        'INTERVIEW_COMPLETED': 'success',
        'COMPLETED': 'success',
        'CANDIDATE_NO_SHOW': 'danger',
        'HR_NO_SHOW': 'danger',
        'CANCELLED': 'danger',
    };
    return badges[status] || 'info';
}

function formatInterviewStatus(status) {
    const labels = {
        'PAYMENT_PENDING': 'Payment Pending',
        'INTERVIEW_CONFIRMED': '📅 Confirmed - Awaiting Payment',
        'PAYMENT_SUCCESS': '✅ Paid - Details Unlocked',
        'READY_TO_SCHEDULE': 'Ready to Schedule',
        'INTERVIEW_SCHEDULED': 'Scheduled',
        'INTERVIEW_COMPLETED': '✅ Completed',
        'COMPLETED': '✅ Completed',
        'CANDIDATE_NO_SHOW': '❌ Candidate No-Show',
        'HR_NO_SHOW': '❌ HR No-Show',
        'CANCELLED': 'Cancelled',
    };
    return labels[status] || status;
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function showInterviewActionModal(interviewId) {
    const interview = adminState.interviews.find(i => i.id === interviewId);
    if (!interview) return;

    adminState.currentInterviewId = interviewId;

    const candidate = interview.application?.candidate;
    const job = interview.application?.job;

    document.getElementById('interviewDetails').innerHTML = `
        <p><strong>Candidate:</strong> ${candidate?.firstName || ''} ${candidate?.lastName || 'N/A'}</p>
        <p><strong>Job:</strong> ${job?.title || 'N/A'}</p>
        <p><strong>Company:</strong> ${job?.companyName || 'N/A'}</p>
        <p><strong>Current Status:</strong> <span class="badge badge-${getInterviewStatusBadge(interview.status)}">${formatInterviewStatus(interview.status)}</span></p>
        ${interview.scheduledDate ? `<p><strong>Scheduled:</strong> ${formatDateTime(interview.scheduledDate)}</p>` : ''}
    `;

    document.getElementById('interviewAction').value = '';
    document.getElementById('interviewActionNotes').value = '';
    document.getElementById('interviewActionModal').classList.add('active');
}

function closeInterviewActionModal() {
    document.getElementById('interviewActionModal').classList.remove('active');
    adminState.currentInterviewId = null;
}

async function submitInterviewAction() {
    const action = document.getElementById('interviewAction').value;
    const notes = document.getElementById('interviewActionNotes').value;

    if (!action) {
        showToast('Please select an action', 'error');
        return;
    }

    if (!adminState.currentInterviewId) {
        showToast('No interview selected', 'error');
        return;
    }

    try {
        let endpoint, body;

        if (action === 'COMPLETED') {
            endpoint = `${API_BASE_URL}/admin/interviews/${adminState.currentInterviewId}/mark-completed`;
            body = { notes };
        } else if (action === 'NO_SHOW_CANDIDATE') {
            endpoint = `${API_BASE_URL}/admin/interviews/${adminState.currentInterviewId}/mark-no-show`;
            body = { noShowType: 'CANDIDATE', notes };
        } else if (action === 'NO_SHOW_HR') {
            endpoint = `${API_BASE_URL}/admin/interviews/${adminState.currentInterviewId}/mark-no-show`;
            body = { noShowType: 'HR', notes };
        } else {
            endpoint = `${API_BASE_URL}/admin/interviews/${adminState.currentInterviewId}/status`;
            body = { status: action, reason: notes };
        }

        const response = await apiCall(endpoint, {
            method: action === 'COMPLETED' || action.startsWith('NO_SHOW') ? 'POST' : 'PATCH',
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message || 'Interview updated', 'success');
            closeInterviewActionModal();
            loadInterviews();
        } else {
            showToast(data.message || 'Failed to update interview', 'error');
        }
    } catch (error) {
        console.error('Error updating interview:', error);
        showToast('Failed to update interview', 'error');
    }
}

// Setup interview filter
document.getElementById('interviewStatusFilter')?.addEventListener('change', (e) => {
    loadInterviewsList(1, e.target.value);
});

// ==========================================
// ANALYTICS
// ==========================================

async function loadAnalytics() {
    try {
        await Promise.all([
            loadEnhancedAnalytics(),
            loadRevenueReport(),
        ]);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

async function loadEnhancedAnalytics() {
    try {
        const response = await apiCall(`${API_BASE_URL}/admin/analytics`);
        const data = await response.json();

        if (data) {
            adminState.analytics = data;
            updateAnalyticsUI();
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

async function loadRevenueReport() {
    try {
        const response = await apiCall(`${API_BASE_URL}/admin/revenue-report`);
        const data = await response.json();

        if (data) {
            adminState.revenueReport = data;
            updateRevenueUI();
        }
    } catch (error) {
        console.error('Error loading revenue report:', error);
    }
}

function updateAnalyticsUI() {
    const analytics = adminState.analytics;

    // Users
    document.getElementById('analyticsCandidates').textContent = analytics.users?.totalCandidates || 0;
    document.getElementById('analyticsHRs').textContent = analytics.users?.totalHRs || 0;
    document.getElementById('analyticsActiveUsers').textContent = analytics.users?.activeUsers || 0;
    document.getElementById('analyticsBlockedUsers').textContent = analytics.users?.blockedUsers || 0;

    // Tests
    document.getElementById('analyticsTestAttempts').textContent = analytics.tests?.totalAttempts || 0;
    document.getElementById('analyticsTestsPassed').textContent = analytics.tests?.passed || 0;
    document.getElementById('analyticsTestsFailed').textContent = analytics.tests?.failed || 0;
    document.getElementById('analyticsPassRate').textContent = analytics.tests?.passRate || '0%';
    document.getElementById('statTestPassRate').textContent = analytics.tests?.passRate || '0%';

    // Interviews
    document.getElementById('statInterviewCompletion').textContent = analytics.interviews?.completionRate || '0%';

    // Payments
    document.getElementById('analyticsPaymentsTotal').textContent = analytics.payments?.total || 0;
    document.getElementById('analyticsPaymentsSuccess').textContent = analytics.payments?.successful || 0;
    document.getElementById('analyticsPaymentsRefunded').textContent = analytics.payments?.refunded || 0;
}

function updateRevenueUI() {
    const revenue = adminState.revenueReport;
    const summary = revenue.summary || {};

    document.getElementById('statNetRevenue').textContent = `₹${formatNumber(summary.netRevenue || 0)}`;
    document.getElementById('statTotalRefunds').textContent = `₹${formatNumber(summary.totalRefunds || 0)}`;
}

// ==========================================
// ROLE TESTS MANAGEMENT
// ==========================================

async function loadRoleTests() {
    try {
        const response = await apiCall(`${API_BASE_URL}/tests/role-tests/all`);
        const data = await response.json();

        if (data) {
            // data is an array of role tests
            adminState.roleTests = Array.isArray(data) ? data : (data.data || []);
            renderRoleTestsTable();
            updateRoleTestsStats();
        }
    } catch (error) {
        console.error('Error loading role tests:', error);
        showToast('Failed to load role tests', 'error');
    }
}

function updateRoleTestsStats() {
    const tests = adminState.roleTests;

    const totalTests = tests.filter(t => t.test).length;
    const activeTests = tests.filter(t => t.test?.isActive).length;
    const rolesWithoutTests = tests.filter(t => !t.test).length;
    const testsWithoutQuestions = tests.filter(t => t.test && t.test.questionsCount === 0).length;

    document.getElementById('statTotalRoleTests').textContent = totalTests;
    document.getElementById('statActiveRoleTests').textContent = activeTests;
    document.getElementById('statRolesWithoutTests').textContent = rolesWithoutTests;
    document.getElementById('statTestsWithoutQuestions').textContent = testsWithoutQuestions;
}

function renderRoleTestsTable() {
    const container = document.getElementById('roleTestsTableContainer');

    if (!adminState.roleTests || adminState.roleTests.length === 0) {
        container.innerHTML = '<p class="loading">No role tests found</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Role</th>
                    <th>Test Title</th>
                    <th>Duration</th>
                    <th>Passing Score</th>
                    <th>Questions</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.roleTests.map(rt => {
        if (!rt.test) {
            return `
                            <tr style="opacity: 0.6;">
                                <td><strong>${rt.skillBucketName}</strong><br><small style="color: var(--text-dim);">${rt.skillBucketCode}</small></td>
                                <td colspan="6" style="color: var(--warning);">No test configured</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="showCreateRoleTestModal('${rt.skillBucketId}', '${rt.skillBucketName}')">+ Create Test</button>
                                </td>
                            </tr>
                        `;
        }
        const test = rt.test;
        return `
                        <tr>
                            <td><strong>${rt.skillBucketName}</strong><br><small style="color: var(--text-dim);">${rt.skillBucketCode}</small></td>
                            <td>${test.title}</td>
                            <td>${test.duration} min</td>
                            <td>${test.passingScore}%</td>
                            <td>${test.questionsCount} <small style="color: var(--text-dim);">/ ${test.totalQuestions}</small></td>
                            <td>${test.validityDays} days</td>
                            <td>
                                <span class="badge badge-${test.isActive ? 'success' : 'warning'}">${test.isActive ? 'Active' : 'Inactive'}</span>
                                ${test.questionsCount === 0 ? '<br><small style="color: var(--danger);">⚠️ No questions</small>' : ''}
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editRoleTest('${test.id}')">Edit</button>
                                ${test.isActive
                ? `<button class="btn btn-sm btn-warning" onclick="toggleRoleTestStatus('${test.id}', false)">Deactivate</button>`
                : `<button class="btn btn-sm btn-success" onclick="toggleRoleTestStatus('${test.id}', true)" ${test.questionsCount === 0 ? 'disabled title="Add questions first"' : ''}>Activate</button>`
            }
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

async function showCreateRoleTestModal(skillBucketId = null, skillBucketName = null) {
    adminState.currentRoleTestId = null;
    document.getElementById('roleTestModalTitle').textContent = 'Create Role Test';
    document.getElementById('roleTestForm').reset();

    // Populate skill bucket dropdown with roles that don't have tests
    const select = document.getElementById('roleTestSkillBucket');
    select.innerHTML = '<option value="">Select Role</option>';

    adminState.roleTests
        .filter(rt => !rt.test) // Only show roles without tests
        .forEach(rt => {
            const option = document.createElement('option');
            option.value = rt.skillBucketId;
            option.textContent = `${rt.skillBucketName} (${rt.skillBucketCode})`;
            select.appendChild(option);
        });

    // If specific skill bucket was provided, select it
    if (skillBucketId) {
        select.value = skillBucketId;
        // Add the option if it doesn't exist (in case this role already has a test)
        if (!select.value && skillBucketName) {
            const option = document.createElement('option');
            option.value = skillBucketId;
            option.textContent = skillBucketName;
            select.appendChild(option);
            select.value = skillBucketId;
        }
    }

    enableModalRequirements('roleTestModal');
    document.getElementById('roleTestModal').classList.add('active');
}

function closeRoleTestModal() {
    disableModalRequirements('roleTestModal');
    document.getElementById('roleTestModal').classList.remove('active');
}

async function saveRoleTest(event) {
    event.preventDefault();

    const testData = {
        skillBucketId: document.getElementById('roleTestSkillBucket').value,
        title: document.getElementById('roleTestTitle').value,
        description: document.getElementById('roleTestDescription').value || null,
        duration: parseInt(document.getElementById('roleTestDuration').value) || 30,
        passingScore: parseInt(document.getElementById('roleTestPassingScore').value) || 70,
        totalQuestions: parseInt(document.getElementById('roleTestTotalQuestions').value) || 20,
        validityDays: parseInt(document.getElementById('roleTestValidityDays').value) || 7,
    };

    try {
        let url, method;
        if (adminState.currentRoleTestId) {
            // Update existing test
            url = `${API_BASE_URL}/tests/${adminState.currentRoleTestId}`;
            method = 'PATCH';
            delete testData.skillBucketId; // Can't change skill bucket on update
        } else {
            // Create new test
            url = `${API_BASE_URL}/tests/role-tests`;
            method = 'POST';
        }

        const response = await apiCall(url, {
            method,
            body: JSON.stringify(testData),
        });

        const data = await response.json();

        if (response.ok) {
            showToast(adminState.currentRoleTestId ? 'Test updated successfully' : 'Role test created successfully', 'success');
            closeRoleTestModal();
            await loadRoleTests();
        } else {
            showToast(data.message || 'Failed to save test', 'error');
        }
    } catch (error) {
        console.error('Error saving role test:', error);
        showToast('Failed to save role test', 'error');
    }

    return false;
}

async function editRoleTest(testId) {
    // Find the test in our state
    const roleTest = adminState.roleTests.find(rt => rt.test?.id === testId);
    if (!roleTest || !roleTest.test) {
        showToast('Test not found', 'error');
        return;
    }

    const test = roleTest.test;
    adminState.currentRoleTestId = testId;

    document.getElementById('roleTestModalTitle').textContent = 'Edit Role Test';

    // Populate form
    const select = document.getElementById('roleTestSkillBucket');
    select.innerHTML = `<option value="${roleTest.skillBucketId}">${roleTest.skillBucketName} (${roleTest.skillBucketCode})</option>`;
    select.value = roleTest.skillBucketId;
    select.disabled = true; // Can't change skill bucket on edit

    document.getElementById('roleTestTitle').value = test.title;
    document.getElementById('roleTestDescription').value = test.description || '';
    document.getElementById('roleTestDuration').value = test.duration;
    document.getElementById('roleTestPassingScore').value = test.passingScore;
    document.getElementById('roleTestTotalQuestions').value = test.totalQuestions;
    document.getElementById('roleTestValidityDays').value = test.validityDays;

    enableModalRequirements('roleTestModal');
    document.getElementById('roleTestModal').classList.add('active');
}

async function toggleRoleTestStatus(testId, activate) {
    const action = activate ? 'activate' : 'deactivate';
    const confirmed = await showConfirmModal({
        icon: activate ? '✅' : '⏸️',
        title: `${activate ? 'Activate' : 'Deactivate'} Test`,
        message: activate
            ? 'Candidates will be able to take this test.'
            : 'Candidates will no longer be able to take this test.',
        confirmText: `Yes, ${activate ? 'Activate' : 'Deactivate'}`,
        confirmClass: activate ? 'btn-success' : 'btn-warning'
    });

    if (!confirmed) return;

    try {
        const response = await apiCall(`${API_BASE_URL}/tests/${testId}/${action}`, {
            method: 'PATCH',
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`Test ${activate ? 'activated' : 'deactivated'} successfully`, 'success');
            await loadRoleTests();
        } else {
            showToast(data.message || `Failed to ${action} test`, 'error');
        }
    } catch (error) {
        console.error(`Error ${action}ing test:`, error);
        showToast(`Failed to ${action} test`, 'error');
    }
}

// Add loadSkillBuckets function if it doesn't exist
async function loadSkillBuckets() {
    try {
        const response = await apiCall(`${API_BASE_URL}/skill-buckets`);
        const data = await response.json();

        if (data) {
            adminState.skillBuckets = Array.isArray(data) ? data : (data.data || []);
            renderSkillBucketsTable();
        }
    } catch (error) {
        console.error('Error loading skill buckets:', error);
        showToast('Failed to load skill buckets', 'error');
    }
}

function renderSkillBucketsTable() {
    const container = document.getElementById('skillBucketsTableContainer');

    if (!adminState.skillBuckets || adminState.skillBuckets.length === 0) {
        container.innerHTML = '<p class="loading">No skill clusters found</p>';
        return;
    }

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Display Name</th>
                    <th>Experience Range</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.skillBuckets.map(sb => `
                    <tr>
                        <td>${sb.name}</td>
                        <td><code>${sb.code}</code></td>
                        <td>${sb.displayName || sb.name}</td>
                        <td>${sb.experienceMin || 0} - ${sb.experienceMax || '∞'} years</td>
                        <td><span class="badge badge-${sb.isActive ? 'success' : 'warning'}">${sb.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editSkillBucket('${sb.id}')">Edit</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

function showCreateSkillBucketModal() {
    adminState.currentSkillBucketId = null;
    document.getElementById('skillBucketModalTitle').textContent = 'Create Skill Cluster';
    document.getElementById('skillBucketForm').reset();
    enableModalRequirements('skillBucketModal');
    document.getElementById('skillBucketModal').classList.add('active');
}

function closeSkillBucketModal() {
    disableModalRequirements('skillBucketModal');
    document.getElementById('skillBucketModal').classList.remove('active');
}

async function editSkillBucket(id) {
    const skillBucket = adminState.skillBuckets.find(sb => sb.id === id);
    if (!skillBucket) return;

    adminState.currentSkillBucketId = id;
    document.getElementById('skillBucketModalTitle').textContent = 'Edit Skill Cluster';

    document.getElementById('skillBucketName').value = skillBucket.name;
    document.getElementById('skillBucketCode').value = skillBucket.code;
    document.getElementById('skillBucketDisplayName').value = skillBucket.displayName || '';
    document.getElementById('skillBucketDescription').value = skillBucket.description || '';
    document.getElementById('skillBucketExpMin').value = skillBucket.experienceMin || 0;
    document.getElementById('skillBucketExpMax').value = skillBucket.experienceMax || 3;

    enableModalRequirements('skillBucketModal');
    document.getElementById('skillBucketModal').classList.add('active');
}

// Setup skill bucket form listener
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('skillBucketForm');
    if (form) {
        form.addEventListener('submit', saveSkillBucket);
    }
});

async function saveSkillBucket(event) {
    event.preventDefault();

    const code = document.getElementById('skillBucketCode').value.trim().toUpperCase().replace(/\s+/g, '_');
    const name = document.getElementById('skillBucketName').value.trim();
    const displayName = document.getElementById('skillBucketDisplayName').value.trim();
    const description = document.getElementById('skillBucketDescription').value.trim();
    const experienceMin = parseInt(document.getElementById('skillBucketExpMin').value) || 0;
    const experienceMax = parseInt(document.getElementById('skillBucketExpMax').value) || 3;

    if (!code || !name) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    const payload = {
        code,
        name,
        displayName: displayName || `HR Shortlisting Check - ${name}`,
        description,
        experienceMin,
        experienceMax,
    };

    try {
        let response;
        if (adminState.currentSkillBucketId) {
            // Update existing
            response = await apiCall(`${API_BASE_URL}/skill-buckets/${adminState.currentSkillBucketId}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        } else {
            // Create new
            response = await apiCall(`${API_BASE_URL}/skill-buckets`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        }

        const data = await response.json();

        if (response.ok && data.success) {
            showToast(data.message || 'Skill cluster saved successfully', 'success');
            closeSkillBucketModal();
            loadSkillBuckets();
        } else {
            showToast(data.message || 'Failed to save skill cluster', 'error');
        }
    } catch (error) {
        console.error('Error saving skill cluster:', error);
        showToast('Failed to save skill cluster', 'error');
    }
}
