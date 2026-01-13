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
    currentJobId: null,
    currentQuestionId: null,
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
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
        'questions': 'questionsPage',
        'users': 'usersPage',
        'candidates': 'candidatesPage',
        'hr': 'hrPage',
        'payments': 'paymentsPage',
        'refunds': 'refundsPage',
        'audit': 'auditPage',
    };

    const pageId = pageMap[page];
    if (pageId) {
        document.getElementById(pageId).classList.remove('hidden');
        document.getElementById('pageTitle').textContent = page.charAt(0).toUpperCase() + page.slice(1);
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
    document.getElementById('jobModal').classList.add('active');
}

function closeJobModal() {
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

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Applications</th>
                    <th>Joined</th>
                </tr>
            </thead>
            <tbody>
                ${adminState.candidates.map(user => {
        const candidate = user.candidate;
        return `
                        <tr>
                            <td>${candidate?.firstName || ''} ${candidate?.lastName || ''}</td>
                            <td>${user.email}</td>
                            <td>${candidate?.phone || 'N/A'}</td>
                            <td>${candidate?.applications?.length || 0}</td>
                            <td>${formatDate(user.createdAt)}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
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
    document.getElementById('questionModal').classList.add('active');
}

function closeQuestionModal() {
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
