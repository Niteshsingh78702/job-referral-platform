// =============================================
// Configuration
// =============================================
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/v1'
    : `${window.location.origin}/api/v1`;

// =============================================
// State Management
// =============================================
let currentSection = 'dashboard';
let employeeData = null;
let dashboardStats = null;
let currentTier = null;
let myReferralsStatus = 'ALL';
let earningsStatus = 'ALL';
let selectedReferralForConfirm = null;

// Badge definitions
const BADGE_DEFINITIONS = {
    'first-referral': { icon: '🎯', name: 'First Referral', description: 'Made your first referral' },
    'referral-pro': { icon: '⭐', name: 'Referral Pro', description: '5 referrals made' },
    'super-referrer': { icon: '🌟', name: 'Super Referrer', description: '10 referrals made' },
    'referral-champion': { icon: '🏆', name: 'Referral Champion', description: '25 referrals made' },
    'first-hire': { icon: '✅', name: 'First Hire', description: 'First successful hire' },
    'hiring-hero': { icon: '🦸', name: 'Hiring Hero', description: '5 successful hires' },
};

const TIER_BADGES = {
    'Bronze': '🥉',
    'Silver': '🥈',
    'Gold': '🥇',
    'Platinum': '💎',
    'Base': '🥉',
};

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html#login';
        return;
    }

    try {
        // Verify token and load employee data
        await loadEmployeeProfile();
        await loadDashboardData();
    } catch (error) {
        console.error('Auth check failed:', error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            localStorage.removeItem('token');
            window.location.href = 'index.html#login';
        }
    }
}

// =============================================
// API Helpers
// =============================================
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
}

// =============================================
// Data Loading
// =============================================
async function loadEmployeeProfile() {
    try {
        const result = await apiCall('/employees/profile');
        employeeData = result.data || result;

        // Update UI with employee info
        updateEmployeeUI();
    } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load profile', 'error');
    }
}

async function loadDashboardData() {
    try {
        // Load stats
        const statsResult = await apiCall('/employees/dashboard/stats');
        dashboardStats = statsResult.data || statsResult;
        updateStatsUI();

        // Load available referrals preview
        await loadAvailableReferralsPreview();
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

async function loadAvailableReferralsPreview() {
    const container = document.getElementById('dashboardAvailableReferrals');
    try {
        const result = await apiCall('/employees/available-referrals');
        const referrals = result.data || result || [];

        if (referrals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Available Referrals</h3>
                    <p>There are no candidates awaiting referral at your company right now.</p>
                </div>
            `;
            return;
        }

        // Show first 3
        container.innerHTML = referrals.slice(0, 3).map(ref => createReferralCard(ref, true)).join('');
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Unable to Load</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function loadAvailableReferrals(search = '') {
    const container = document.getElementById('availableReferralsList');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const endpoint = search
            ? `/employees/available-referrals?search=${encodeURIComponent(search)}`
            : '/employees/available-referrals';
        const result = await apiCall(endpoint);
        const referrals = result.data || result || [];

        if (referrals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Available Referrals</h3>
                    <p>There are no candidates awaiting referral at your company right now.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = referrals.map(ref => createReferralCard(ref, true)).join('');
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Unable to Load</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function loadMyReferrals(status = 'ALL') {
    const container = document.getElementById('myReferralsList');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const endpoint = status !== 'ALL'
            ? `/employees/referrals?status=${status}`
            : '/employees/referrals';
        const result = await apiCall(endpoint);
        const referrals = result.data?.data || result.data || [];

        if (referrals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No Referrals Found</h3>
                    <p>You haven't made any referrals${status !== 'ALL' ? ' with this status' : ''} yet.</p>
                    <button class="btn btn-primary" onclick="showSection('available')">Browse Available Referrals</button>
                </div>
            `;
            return;
        }

        container.innerHTML = referrals.map(ref => createMyReferralCard(ref)).join('');
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Unable to Load</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function loadEarnings(status = 'ALL') {
    const tbody = document.getElementById('earningsTableBody');
    tbody.innerHTML = '<tr><td colspan="5"><div class="loading"><div class="spinner"></div></div></td></tr>';

    try {
        const endpoint = status !== 'ALL'
            ? `/employees/earnings?status=${status}`
            : '/employees/earnings';
        const result = await apiCall(endpoint);
        const data = result.data || result;
        const earnings = data.data || [];
        const summary = data.summary || {};

        // Update summary cards
        document.getElementById('earningsTotal').textContent = `₹${(summary.totalAmount || 0).toLocaleString()}`;
        document.getElementById('earningsPaid').textContent = `₹${(summary.byStatus?.PAID?.amount || 0).toLocaleString()}`;
        document.getElementById('earningsPending').textContent = `₹${((summary.byStatus?.PENDING?.amount || 0) + (summary.byStatus?.ELIGIBLE?.amount || 0)).toLocaleString()}`;

        if (earnings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            <div class="empty-state-icon">💰</div>
                            <h3>No Earnings Yet</h3>
                            <p>Your earnings will appear here once your referrals result in successful hires.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = earnings.map(earning => createEarningRow(earning)).join('');
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <h3>Unable to Load</h3>
                        <p>${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

async function loadLeaderboard(period = 'all') {
    const tbody = document.getElementById('leaderboardTableBody');
    tbody.innerHTML = '<tr><td colspan="5"><div class="loading"><div class="spinner"></div></div></td></tr>';

    // Update tab styling
    document.querySelectorAll('#section-leaderboard .tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event?.target?.classList.add('active');

    try {
        const result = await apiCall(`/employees/leaderboard?period=${period}`);
        const data = result.data || result;
        const leaderboard = data.leaderboard || [];

        if (leaderboard.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            <div class="empty-state-icon">🏆</div>
                            <h3>Leaderboard Empty</h3>
                            <p>Be the first to make referrals and top the leaderboard!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = leaderboard.map(entry => createLeaderboardRow(entry)).join('');
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <h3>Unable to Load</h3>
                        <p>${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

async function loadBadges() {
    const earnedContainer = document.getElementById('badgesContainer');
    const lockedContainer = document.getElementById('lockedBadgesContainer');

    const earnedBadges = employeeData?.badges || [];
    const allBadges = Object.keys(BADGE_DEFINITIONS);

    // Earned badges
    if (earnedBadges.length === 0) {
        earnedContainer.innerHTML = `
            <div class="empty-state" style="width: 100%;">
                <div class="empty-state-icon">🎖️</div>
                <h3>No Badges Yet</h3>
                <p>Start making referrals to earn your first badge!</p>
            </div>
        `;
    } else {
        earnedContainer.innerHTML = earnedBadges.map(badge => {
            const def = BADGE_DEFINITIONS[badge] || { icon: '🏅', name: badge, description: '' };
            return `
                <div class="user-badge">
                    <span class="user-badge-icon">${def.icon}</span>
                    <span class="user-badge-name">${def.name}</span>
                </div>
            `;
        }).join('');
    }

    // Locked badges
    const lockedBadges = allBadges.filter(b => !earnedBadges.includes(b));
    lockedContainer.innerHTML = lockedBadges.map(badge => {
        const def = BADGE_DEFINITIONS[badge];
        return `
            <div class="user-badge" style="opacity: 0.5;">
                <span class="user-badge-icon">🔒</span>
                <span class="user-badge-name">${def.name}</span>
            </div>
        `;
    }).join('');
}

// =============================================
// UI Updates
// =============================================
function updateEmployeeUI() {
    if (!employeeData) return;

    // User info
    const firstName = employeeData.user?.email?.split('@')[0] || 'Employee';
    document.getElementById('userName').textContent = firstName;
    document.getElementById('userAvatar').textContent = firstName.charAt(0).toUpperCase();
    document.getElementById('userCompany').textContent = employeeData.companyName || 'Company';

    // Verification status
    if (employeeData.isVerified) {
        document.getElementById('verifiedBadge').classList.remove('hidden');
        document.getElementById('verificationBanner').classList.add('hidden');
    } else {
        document.getElementById('verifiedBadge').classList.add('hidden');
        document.getElementById('verificationBanner').classList.remove('hidden');
    }

    // Profile form
    document.getElementById('profileEmail').value = employeeData.user?.email || '';
    document.getElementById('profileCompany').value = employeeData.companyName || '';
    document.getElementById('profileDesignation').value = employeeData.designation || '';
    document.getElementById('profileEmployeeId').value = employeeData.employeeId || '';
    document.getElementById('profileLinkedin').value = employeeData.linkedinUrl || '';
}

function updateStatsUI() {
    if (!dashboardStats) return;

    document.getElementById('statTotalReferrals').textContent = dashboardStats.totalReferrals || 0;
    document.getElementById('statSuccessful').textContent = dashboardStats.successfulReferrals || 0;
    document.getElementById('statPending').textContent = dashboardStats.pendingReferrals || 0;
    document.getElementById('statEarnings').textContent = `₹${(dashboardStats.totalEarnings || 0).toLocaleString()}`;
    document.getElementById('statPoints').textContent = dashboardStats.points || 0;
    document.getElementById('statThisMonth').textContent = `+${dashboardStats.thisMonthReferrals || 0} this month`;

    // Tier progress
    const tier = dashboardStats.currentTier;
    if (tier?.current) {
        document.getElementById('tierBadge').textContent = TIER_BADGES[tier.current.name] || '🥉';
        document.getElementById('tierName').textContent = tier.current.name;
        document.getElementById('tierCommission').textContent = `${tier.current.commissionPercent}% commission per referral`;
    }

    if (tier?.next) {
        document.getElementById('nextTierName').textContent = tier.next.name;
        document.getElementById('tierProgressText').textContent =
            `${tier.referralsToNextTier} more successful referrals to reach ${tier.next.name}`;

        // Calculate progress percentage
        const currentReferrals = dashboardStats.successfulReferrals || 0;
        const minForCurrent = tier.current?.minReferrals || 0;
        const minForNext = tier.next.minReferrals;
        const progress = ((currentReferrals - minForCurrent) / (minForNext - minForCurrent)) * 100;
        document.getElementById('tierProgressBar').style.width = `${Math.min(progress, 100)}%`;
    } else {
        document.getElementById('nextTierName').textContent = 'Max Level';
        document.getElementById('tierProgressText').textContent = 'You\'ve reached the highest tier!';
        document.getElementById('tierProgressBar').style.width = '100%';
    }
}

// =============================================
// HTML Generators
// =============================================
function createReferralCard(ref, showConfirmButton = false) {
    const candidate = ref.application?.candidate || {};
    const job = ref.application?.job || {};
    const testScore = ref.candidateTestScore || ref.application?.testSessions?.[0]?.score;

    return `
        <div class="referral-card">
            <div class="referral-header">
                <div class="candidate-info">
                    <div class="candidate-avatar">${(candidate.firstName || 'C').charAt(0)}</div>
                    <div class="candidate-details">
                        <h4>${candidate.firstName || ''} ${candidate.lastName || ''}</h4>
                        <p>${candidate.headline || 'Candidate'}</p>
                    </div>
                </div>
            </div>
            <div class="referral-meta">
                <div class="meta-item">
                    💼 <span>${job.title || 'Position'}</span>
                </div>
                <div class="meta-item">
                    🏢 <span>${job.companyName || 'Company'}</span>
                </div>
                <div class="meta-item">
                    📍 <span>${job.location || 'Location'}</span>
                </div>
                ${candidate.totalExperience ? `
                    <div class="meta-item">
                        ⏱️ <span>${candidate.totalExperience} years exp</span>
                    </div>
                ` : ''}
                ${testScore ? `
                    <div class="meta-item">
                        📊 <span>Test Score: ${testScore}%</span>
                    </div>
                ` : ''}
            </div>
            ${candidate.skills?.length ? `
                <div class="skills-list">
                    ${candidate.skills.slice(0, 5).map(s => `<span class="skill-tag">${s.name}</span>`).join('')}
                </div>
            ` : ''}
            <div class="referral-footer">
                <div class="potential-earning">
                    Potential Earning: <span>₹${(ref.potentialEarning || 0).toLocaleString()}</span>
                </div>
                ${showConfirmButton ? `
                    <button class="btn btn-success" onclick="openConfirmModal('${ref.application?.id}', ${JSON.stringify(ref).replace(/"/g, '&quot;')})">
                        Refer This Candidate
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function createMyReferralCard(ref) {
    const candidate = ref.application?.candidate || {};
    const job = ref.application?.job || {};
    const earning = ref.earning;

    const statusBadge = {
        'PENDING': '<span class="badge badge-pending">⏳ Pending</span>',
        'CONFIRMED': '<span class="badge badge-confirmed">✓ Confirmed</span>',
        'CONTACTED': '<span class="badge badge-contacted">📞 Contacted</span>',
        'CLOSED': '<span class="badge badge-closed">✅ Closed</span>',
        'EXPIRED': '<span class="badge badge-expired">⏰ Expired</span>',
    }[ref.status] || `<span class="badge">${ref.status}</span>`;

    return `
        <div class="referral-card">
            <div class="referral-header">
                <div class="candidate-info">
                    <div class="candidate-avatar">${(candidate.firstName || 'C').charAt(0)}</div>
                    <div class="candidate-details">
                        <h4>${candidate.firstName || ''} ${candidate.lastName || ''}</h4>
                        <p>${job.title || 'Position'} at ${job.companyName || 'Company'}</p>
                    </div>
                </div>
                ${statusBadge}
            </div>
            <div class="referral-meta">
                <div class="meta-item">
                    📅 Referred on <span>${new Date(ref.createdAt).toLocaleDateString()}</span>
                </div>
                ${ref.confirmedAt ? `
                    <div class="meta-item">
                        ✅ Confirmed on <span>${new Date(ref.confirmedAt).toLocaleDateString()}</span>
                    </div>
                ` : ''}
                ${ref.expiresAt ? `
                    <div class="meta-item">
                        ⏰ Expires <span>${new Date(ref.expiresAt).toLocaleDateString()}</span>
                    </div>
                ` : ''}
            </div>
            <div class="referral-footer">
                ${earning ? `
                    <div class="potential-earning">
                        Earning: <span>₹${(earning.amount || 0).toLocaleString()}</span>
                        ${earning.status === 'PAID' ? '<span class="badge badge-paid">Paid</span>' :
                earning.status === 'ELIGIBLE' ? '<span class="badge badge-eligible">Eligible</span>' :
                    '<span class="badge badge-pending">Pending</span>'}
                    </div>
                ` : `
                    <div class="potential-earning">
                        Potential: <span>₹${(job.referralFee * 0.1).toLocaleString()}</span>
                    </div>
                `}
            </div>
        </div>
    `;
}

function createEarningRow(earning) {
    const candidate = earning.referral?.application?.candidate || {};
    const job = earning.referral?.application?.job || {};
    const totalAmount = (earning.amount || 0) + (earning.bonusAmount || 0);

    const statusBadge = {
        'PENDING': '<span class="badge badge-pending">Pending</span>',
        'ELIGIBLE': '<span class="badge badge-eligible">Eligible</span>',
        'PROCESSING': '<span class="badge badge-pending">Processing</span>',
        'PAID': '<span class="badge badge-paid">Paid</span>',
        'CANCELLED': '<span class="badge badge-expired">Cancelled</span>',
    }[earning.status] || `<span class="badge">${earning.status}</span>`;

    return `
        <tr>
            <td>${new Date(earning.createdAt).toLocaleDateString()}</td>
            <td>${candidate.firstName || ''} ${candidate.lastName || ''}</td>
            <td>${job.title || 'Position'}</td>
            <td class="amount-cell">₹${totalAmount.toLocaleString()}</td>
            <td>${statusBadge}</td>
        </tr>
    `;
}

function createLeaderboardRow(entry) {
    const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
    const rankDisplay = entry.rank <= 3
        ? ['🥇', '🥈', '🥉'][entry.rank - 1]
        : entry.rank;

    return `
        <tr class="${entry.isCurrentUser ? 'current-user' : ''}">
            <td><span class="rank-badge ${rankClass}">${rankDisplay}</span></td>
            <td>
                ${entry.email}
                ${entry.isCurrentUser ? '<span style="color: var(--primary);">(You)</span>' : ''}
                ${entry.designation ? `<br><small style="color: var(--text-dim);">${entry.designation}</small>` : ''}
            </td>
            <td>${entry.referralCount}</td>
            <td>${entry.successfulReferrals}</td>
            <td>⭐ ${entry.points}</td>
        </tr>
    `;
}

// =============================================
// Navigation
// =============================================
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));

    // Show target section
    document.getElementById(`section-${section}`).classList.remove('hidden');

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });

    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'available': 'Available Referrals',
        'my-referrals': 'My Referrals',
        'earnings': 'Earnings',
        'leaderboard': 'Leaderboard',
        'badges': 'My Badges',
        'profile': 'Profile',
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    // Load section data
    currentSection = section;
    switch (section) {
        case 'available':
            loadAvailableReferrals();
            break;
        case 'my-referrals':
            loadMyReferrals(myReferralsStatus);
            break;
        case 'earnings':
            loadEarnings(earningsStatus);
            break;
        case 'leaderboard':
            loadLeaderboard('all');
            break;
        case 'badges':
            loadBadges();
            break;
    }
}

// =============================================
// Filters
// =============================================
function filterMyReferrals(status) {
    myReferralsStatus = status;

    // Update tabs
    document.querySelectorAll('#section-my-referrals .tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.status === status) {
            tab.classList.add('active');
        }
    });

    loadMyReferrals(status);
}

function filterEarnings(status) {
    earningsStatus = status;

    // Update tabs
    document.querySelectorAll('#section-earnings .tabs .tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.status === status) {
            tab.classList.add('active');
        }
    });

    loadEarnings(status);
}

let searchTimeout;
function searchAvailableReferrals() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const search = document.getElementById('searchAvailable').value;
        loadAvailableReferrals(search);
    }, 300);
}

// =============================================
// Referral Confirmation
// =============================================
function openConfirmModal(applicationId, referralData) {
    selectedReferralForConfirm = { applicationId, ...referralData };

    const candidate = referralData.application?.candidate || {};
    const job = referralData.application?.job || {};

    document.getElementById('confirmReferralDetails').innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div class="candidate-avatar" style="width: 64px; height: 64px; font-size: 24px; margin: 0 auto 12px;">
                ${(candidate.firstName || 'C').charAt(0)}
            </div>
            <h3>${candidate.firstName || ''} ${candidate.lastName || ''}</h3>
            <p style="color: var(--text-dim);">${candidate.headline || ''}</p>
        </div>
        <div style="background: var(--bg-input); padding: 16px; border-radius: 10px; margin-bottom: 16px;">
            <p style="margin-bottom: 8px;"><strong>Position:</strong> ${job.title || 'N/A'}</p>
            <p style="margin-bottom: 8px;"><strong>Company:</strong> ${job.companyName || 'N/A'}</p>
            <p><strong>Location:</strong> ${job.location || 'N/A'}</p>
        </div>
        <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 10px; text-align: center;">
            <p style="color: var(--text-dim); margin-bottom: 4px;">You will earn</p>
            <p style="font-size: 24px; font-weight: 700; color: var(--success);">₹${(referralData.potentialEarning || 0).toLocaleString()}</p>
            <p style="font-size: 12px; color: var(--text-dim);">upon successful hire</p>
        </div>
    `;

    document.getElementById('confirmReferralModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmReferralModal').classList.remove('active');
    selectedReferralForConfirm = null;
}

async function submitReferralConfirmation() {
    if (!selectedReferralForConfirm) return;

    const btn = document.getElementById('confirmReferralBtn');
    btn.disabled = true;
    btn.textContent = 'Confirming...';

    try {
        await apiCall(`/employees/referrals/${selectedReferralForConfirm.applicationId}/confirm`, {
            method: 'POST',
        });

        showToast('Referral confirmed successfully!', 'success');
        closeConfirmModal();

        // Refresh data
        await loadDashboardData();
        if (currentSection === 'available') {
            loadAvailableReferrals();
        }
    } catch (error) {
        showToast(error.message || 'Failed to confirm referral', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirm Referral';
    }
}

// =============================================
// Profile Update
// =============================================
async function updateProfile(event) {
    event.preventDefault();

    const data = {
        designation: document.getElementById('profileDesignation').value,
        employeeId: document.getElementById('profileEmployeeId').value,
        linkedinUrl: document.getElementById('profileLinkedin').value,
    };

    try {
        await apiCall('/employees/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        showToast('Profile updated successfully!', 'success');
        await loadEmployeeProfile();
    } catch (error) {
        showToast(error.message || 'Failed to update profile', 'error');
    }
}

// =============================================
// Export
// =============================================
function exportEarnings() {
    // Create CSV content
    const table = document.getElementById('earningsTable');
    const rows = table.querySelectorAll('tr');
    let csv = '';

    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`).join(',');
        csv += rowData + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Earnings exported!', 'success');
}

// =============================================
// Notifications
// =============================================
function toggleNotifications() {
    // For now, just show a message
    showToast('Notifications panel coming soon!', 'success');
}

// =============================================
// Auth
// =============================================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// =============================================
// Toast
// =============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');

    icon.textContent = type === 'success' ? '✅' : '❌';
    msg.textContent = message;

    toast.classList.remove('success', 'error');
    toast.classList.add(type, 'show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
