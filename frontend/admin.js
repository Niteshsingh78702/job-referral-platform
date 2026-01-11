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
    currentJobId: null,
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
        // Token invalid or expired
        logout();
    } catch (error) {
        console.error('Token verification failed:', error);
        logout();
    }
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

        const data = await response.json();

        if (data.success) {
            adminState.jobs = data.data.data;
            renderJobsTable();
            renderPagination('jobsPagination', data.data.meta, (p) => loadJobs(p, status));
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        showToast('Failed to load jobs', 'error');
    }
}

function renderJobsTable() {
    const container = document.getElementById('jobsTableContainer');

    if (adminState.jobs.length === 0) {
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
                ${adminState.jobs.map(job => `
                    <tr>
                        <td>${job.title}</td>
                        <td>${job.companyName || job.hr?.companyName || 'N/A'}</td>
                        <td>${job.location || 'N/A'}</td>
                        <td><span class="badge badge-${getStatusBadge(job.status)}">${job.status}</span></td>
                        <td>${job._count?.applications || 0}</td>
                        <td>${formatDate(job.postedAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editJob('${job.id}')">Edit</button>
                            ${job.status === 'PENDING' ? `<button class="btn btn-sm btn-success" onclick="approveJob('${job.id}')">Approve</button>` : ''}
                            ${job.status === 'ACTIVE' ? `<button class="btn btn-sm btn-danger" onclick="expireJob('${job.id}')">Expire</button>` : ''}
                            ${job._count?.applications === 0 ? `<button class="btn btn-sm btn-danger" onclick="deleteJob('${job.id}')">Delete</button>` : ''}
                        </td>
                    </tr>
                `).join('')}
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

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            closeJobModal();
            loadJobs();
        } else {
            showToast(data.message || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving job:', error);
        showToast('Failed to save job', 'error');
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
    if (!confirm('Expire this job?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/expire`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

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
    if (!confirm('Delete this job? This cannot be undone.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminState.token}` },
        });

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

        const data = await response.json();

        if (data.success) {
            adminState.users = data.data.data;
            renderUsersTable();
            renderPagination('usersPagination', data.data.meta, (p) => loadUsers(p, role, status));
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}

function renderUsersTable() {
    const container = document.getElementById('usersTableContainer');

    if (adminState.users.length === 0) {
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
    if (!confirm('Block this user?')) return;

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
    if (!confirm('Unblock this user?')) return;

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
    if (!confirm('Delete this user? This cannot be undone.')) return;

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

        const data = await response.json();

        if (data.success) {
            adminState.candidates = data.data.data;
            renderCandidatesTable();
            renderPagination('candidatesPagination', data.data.meta, (p) => loadCandidates(p, search));
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        showToast('Failed to load candidates', 'error');
    }
}

function renderCandidatesTable() {
    const container = document.getElementById('candidatesTableContainer');

    if (adminState.candidates.length === 0) {
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

        const data = await response.json();

        if (data.success) {
            renderHRTable(data.data);
        }
    } catch (error) {
        console.error('Error loading HRs:', error);
        showToast('Failed to load HR approvals', 'error');
    }
}

function renderHRTable(hrs) {
    const container = document.getElementById('hrTableContainer');

    if (hrs.length === 0) {
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

        const data = await response.json();

        if (data.success) {
            adminState.payments = data.data.data;
            renderPaymentsTable();
            renderPagination('paymentsPagination', data.data.meta, (p) => loadPayments(p, status));
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Failed to load payments', 'error');
    }
}

function renderPaymentsTable() {
    const container = document.getElementById('paymentsTableContainer');

    if (adminState.payments.length === 0) {
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

        const data = await response.json();

        if (data.success) {
            renderRefundsTable(data.data);
        }
    } catch (error) {
        console.error('Error loading refunds:', error);
        showToast('Failed to load refunds', 'error');
    }
}

function renderRefundsTable(refunds) {
    const container = document.getElementById('refundsTableContainer');

    if (refunds.length === 0) {
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

        const data = await response.json();

        if (data.success) {
            adminState.auditLogs = data.data.data;
            renderAuditLogsTable();
            renderPagination('auditPagination', data.data.meta, (p) => loadAuditLogs(p, action));
        }
    } catch (error) {
        console.error('Error loading audit logs:', error);
        showToast('Failed to load audit logs', 'error');
    }
}

function renderAuditLogsTable() {
    const container = document.getElementById('auditTableContainer');

    if (adminState.auditLogs.length === 0) {
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

    let html = '';

    // Previous button
    html += `<button ${page === 1 ? 'disabled' : ''} onclick="() => ${loadFunction(page - 1)}">Previous</button>`;

    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="${i === page ? 'active' : ''}" onclick="() => ${loadFunction(i)}">${i}</button>`;
    }

    // Next button
    html += `<button ${page === totalPages ? 'disabled' : ''} onclick="() => ${loadFunction(page + 1)}">Next</button>`;

    container.innerHTML = html;
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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
