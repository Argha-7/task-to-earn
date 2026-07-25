/* ==========================================================================
   REWARD ZOO - ULTRA-PROFESSIONAL MASTER ADMIN PANEL ENGINE
   ========================================================================== */

let globalUsers = [];
let globalPayouts = [];
let globalTasks = [];
let globalTaskLogs = [];
let globalNotifications = [];

document.addEventListener('DOMContentLoaded', () => {
    initAdminListeners();
});

function initAdminListeners() {
    if (typeof DatabaseAPI !== 'undefined') {
        // Listen to live payouts
        DatabaseAPI.listenAllPayouts((payouts) => {
            globalPayouts = payouts || [];
            renderAdminDashboard();
        });

        // Listen to live registered users
        DatabaseAPI.listenAllUsers((users) => {
            globalUsers = users || [];
            updateTargetUserDropdown();
            renderAdminDashboard();
        });

        // Listen to live dynamic tasks
        DatabaseAPI.listenAllTasks((tasks) => {
            globalTasks = tasks || [];
            renderTasksTable();
            renderAdminDashboard();
        });

        // Listen to live user task completion logs
        DatabaseAPI.listenTaskCompletions((logs) => {
            globalTaskLogs = logs || [];
            renderTaskLogsTable();
        });

        // Listen to all sent notifications
        DatabaseAPI.listenAllNotifications((notifications) => {
            globalNotifications = notifications || [];
            renderNotificationsTable();
        });
    } else {
        loadFallbackData();
    }
}

function loadFallbackData() {
    const savedUser = localStorage.getItem('rewardzoo_user');
    const user = savedUser ? JSON.parse(savedUser) : { name: 'DSTechVerse', email: 'DSTechVerse@gmail.com', coins: 50 };
    const savedPayouts = localStorage.getItem('rewardzoo_payouts');
    const savedTasks = localStorage.getItem('rewardzoo_tasks');

    globalUsers = [user];
    globalPayouts = savedPayouts ? JSON.parse(savedPayouts) : [];
    globalTasks = savedTasks ? JSON.parse(savedTasks) : [
        { id: 'task_1', title: 'Watch & Earn', desc: 'Watch short video ads', reward: 15, timer: 15, type: 'watch', icon: 'fa-play', url: '#' },
        { id: 'task_2', title: 'View & Win', desc: 'Visit sponsor website', reward: 10, timer: 15, type: 'view', icon: 'fa-globe', url: '#' },
        { id: 'task_3', title: 'Social Tasks', desc: 'Join official Telegram channel', reward: 30, timer: 10, type: 'social', icon: 'fa-paper-plane', url: '#' }
    ];

    updateTargetUserDropdown();
    renderTasksTable();
    renderAdminDashboard();
}

function switchAdminTab(secId, elem) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    const target = document.getElementById(secId);
    if (target) target.classList.add('active');
    if (elem) elem.classList.add('active');

    const titleMap = {
        'sec-dashboard': 'Dashboard Overview',
        'sec-users': 'Manage Users',
        'sec-tasks': 'Manage Tasks',
        'sec-payouts': 'Payout Requests',
        'sec-alerts': 'Send Alerts',
        'sec-controls': 'App Controls'
    };
    document.getElementById('admin-page-title').textContent = titleMap[secId] || 'Admin Panel';

    renderAdminDashboard();
}

function updateTargetUserDropdown() {
    const select = document.getElementById('alert-target-user');
    if (!select) return;

    select.innerHTML = '<option value="ALL">📢 Broadcast to ALL Users</option>';
    globalUsers.forEach(u => {
        const safeEmail = u.email || 'user@app.com';
        select.innerHTML += `<option value="${safeEmail}">👤 ${u.name || 'User'} (${safeEmail})</option>`;
    });
}

function renderAdminDashboard() {
    // Stats Counters
    const totalUsersCount = globalUsers.length || 0;
    let totalCoinsEarned = 0;
    globalUsers.forEach(u => {
        totalCoinsEarned += (u.coins || 0);
    });

    const pendingCount = globalPayouts.filter(p => p.status === 'Pending').length;
    const taskCount = globalTasks.length || 0;

    if (document.getElementById('stat-total-users')) document.getElementById('stat-total-users').textContent = totalUsersCount;
    if (document.getElementById('stat-total-coins')) document.getElementById('stat-total-coins').textContent = totalCoinsEarned;
    if (document.getElementById('stat-pending-payouts')) document.getElementById('stat-pending-payouts').textContent = pendingCount;
    if (document.getElementById('stat-total-tasks')) document.getElementById('stat-total-tasks').textContent = taskCount;

    // Render Users Table
    renderUsersTable();

    // Render Recent Payouts on Dashboard
    const recentPayoutBody = document.getElementById('dashboard-recent-payouts');
    if (recentPayoutBody) {
        recentPayoutBody.innerHTML = '';
        if (globalPayouts.length === 0) {
            recentPayoutBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No payout requests submitted yet</td></tr>`;
        } else {
            globalPayouts.slice(0, 5).forEach(p => {
                let badgeClass = 'status-pending';
                if (p.status === 'Approved') badgeClass = 'status-approved';
                if (p.status === 'Rejected') badgeClass = 'status-rejected';

                recentPayoutBody.innerHTML += `
                    <tr>
                        <td><strong>${p.user || 'User'}</strong></td>
                        <td>${p.method}</td>
                        <td>${p.account}</td>
                        <td><span style="color: var(--warning-yellow); font-weight: 800;">${p.amount}</span></td>
                        <td><span class="badge-status ${badgeClass}">${p.status}</span></td>
                    </tr>
                `;
            });
        }
    }

    // Render Payout Requests Table
    const payoutTableBody = document.getElementById('admin-payouts-table');
    if (payoutTableBody) {
        payoutTableBody.innerHTML = '';
        if (globalPayouts.length === 0) {
            payoutTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No withdrawal requests pending</td></tr>`;
        } else {
            globalPayouts.forEach((p) => {
                let badgeClass = 'status-pending';
                if (p.status === 'Approved') badgeClass = 'status-approved';
                if (p.status === 'Rejected') badgeClass = 'status-rejected';

                const actions = p.status === 'Pending' ? `
                    <button class="btn-act btn-approve" onclick="handlePayoutAction('${p.id}', 'Approved', '${p.email}', ${p.amount})">Approve</button>
                    <button class="btn-act btn-reject" onclick="handlePayoutAction('${p.id}', 'Rejected', '${p.email}', ${p.amount})">Reject</button>
                ` : `<span style="font-size:12px; color: var(--text-muted);">${p.status}</span>`;

                payoutTableBody.innerHTML += `
                    <tr>
                        <td><code>${p.id}</code></td>
                        <td><strong>${p.user || 'User'}</strong></td>
                        <td>${p.method}</td>
                        <td>${p.account}</td>
                        <td><span style="color: var(--warning-yellow); font-weight: 800;">${p.amount}</span></td>
                        <td><span class="badge-status ${badgeClass}">${p.status}</span></td>
                        <td>${actions}</td>
                    </tr>
                `;
            });
        }
    }
}

// User Table & Search Filter
function renderUsersTable(filterTerm = '') {
    const userBody = document.getElementById('admin-users-list');
    if (!userBody) return;
    userBody.innerHTML = '';

    const filtered = globalUsers.filter(u => {
        const query = filterTerm.toLowerCase();
        return (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        userBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No users found</td></tr>`;
        return;
    }

    filtered.forEach(u => {
        const uCoins = u.coins !== undefined ? u.coins : 50;
        const safeEmail = u.email || 'user@app.com';
        const isBlocked = !!u.isBlocked;
        const statusBadge = isBlocked ? 
            `<span class="badge-status status-blocked">Blocked</span>` : 
            `<span class="badge-status status-approved">Active</span>`;

        userBody.innerHTML += `
            <tr>
                <td><strong>${u.name || 'User'}</strong></td>
                <td>${safeEmail}</td>
                <td><span style="color: var(--warning-yellow); font-weight: 800;">${uCoins} Coins</span></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-act btn-approve" onclick="openUserEditModal('${safeEmail}', ${uCoins})">Edit Coins</button>
                    <button class="btn-act ${isBlocked ? 'btn-approve' : 'btn-reject'}" onclick="toggleUserBlock('${safeEmail}', ${!isBlocked})">
                        ${isBlocked ? 'Unblock' : 'Block User'}
                    </button>
                </td>
            </tr>
        `;
    });
}

function filterUserTable() {
    const term = document.getElementById('user-search-input').value;
    renderUsersTable(term);
}

// User Block / Unblock Toggle
function toggleUserBlock(userEmail, shouldBlock) {
    if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.updateUserStatus(userEmail, shouldBlock, (success) => {
            if (success) {
                alert(`User ${userEmail} is now ${shouldBlock ? 'BLOCKED' : 'UNBLOCKED'}`);
            }
        });
    } else {
        alert(`User status updated to ${shouldBlock ? 'Blocked' : 'Active'}`);
    }
}

// Edit User Coins Modal
function openUserEditModal(email, currentCoins) {
    document.getElementById('user-edit-email').value = email;
    document.getElementById('user-edit-display-email').value = email;
    document.getElementById('user-edit-new-coins').value = currentCoins;
    document.getElementById('modal-user-edit').classList.add('active');
}

function closeUserEditModal() {
    document.getElementById('modal-user-edit').classList.remove('active');
}

function saveUserCoinsSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('user-edit-email').value;
    const newCoins = parseInt(document.getElementById('user-edit-new-coins').value, 10);

    const userObj = globalUsers.find(u => u.email === email) || { name: 'User', email: email };
    userObj.coins = newCoins;

    if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.saveUser(userObj, () => {
            alert(`Updated balance for ${email} to ${newCoins} coins!`);
            closeUserEditModal();
        });
    } else {
        alert(`Balance updated for ${email}`);
        closeUserEditModal();
    }
}

// Dynamic Task Management Functions
function renderTasksTable() {
    const taskBody = document.getElementById('admin-tasks-table');
    if (!taskBody) return;

    taskBody.innerHTML = '';
    if (globalTasks.length === 0) {
        taskBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No reward tasks added yet</td></tr>`;
        return;
    }

    globalTasks.forEach(t => {
        let iconHtml = `<i class="${t.icon || 'fa-solid fa-gift'}" style="font-size:24px; color: var(--accent-magenta);"></i>`;
        if (t.icon && (t.icon.startsWith('http://') || t.icon.startsWith('https://'))) {
            iconHtml = `<img src="${t.icon}" class="task-icon-preview">`;
        }

        taskBody.innerHTML += `
            <tr>
                <td>${iconHtml}</td>
                <td><strong>${t.title}</strong></td>
                <td>${t.desc}</td>
                <td><span style="color: var(--warning-yellow); font-weight: 800;">+${t.reward} Coins</span></td>
                <td><code>${t.type} (${t.timer || 0}s)</code></td>
                <td><a href="${t.url || '#'}" target="_blank" style="color: var(--accent-magenta); font-size:12px;">Link</a></td>
                <td>
                    <button class="btn-act btn-approve" onclick="openTaskModal('${t.id}')">Edit</button>
                    <button class="btn-act btn-reject" onclick="deleteTaskClick('${t.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

function renderTaskLogsTable() {
    const logBody = document.getElementById('admin-task-logs-table');
    if (!logBody) return;

    logBody.innerHTML = '';
    if (globalTaskLogs.length === 0) {
        logBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No task completions logged yet</td></tr>`;
        return;
    }

    globalTaskLogs.forEach(log => {
        logBody.innerHTML += `
            <tr>
                <td><strong>${log.user || 'User'}</strong></td>
                <td>${log.email || 'user@app.com'}</td>
                <td>${log.taskTitle || 'Dynamic Task'}</td>
                <td><span style="color: var(--warning-yellow); font-weight: 800;">+${log.reward} Coins</span></td>
                <td><span style="font-size:12px; color: var(--text-muted);">${log.date}</span></td>
                <td><span class="badge-status status-approved">${log.status || 'Verified'}</span></td>
            </tr>
        `;
    });
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('modal-task-editor');
    const title = document.getElementById('modal-editor-title');
    
    if (taskId) {
        const task = globalTasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('task-edit-id').value = task.id;
            document.getElementById('task-edit-title').value = task.title;
            document.getElementById('task-edit-desc').value = task.desc;
            document.getElementById('task-edit-coins').value = task.reward;
            document.getElementById('task-edit-timer').value = task.timer || 15;
            document.getElementById('task-edit-type').value = task.type || 'social';
            document.getElementById('task-edit-icon').value = task.icon || '';
            document.getElementById('task-edit-url').value = task.url || '';
        }
    } else {
        title.textContent = 'Add New Task';
        document.getElementById('form-task-editor').reset();
        document.getElementById('task-edit-id').value = '';
    }

    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('modal-task-editor').classList.remove('active');
}

function saveTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-edit-id').value;
    const taskData = {
        id: id || 'TASK_' + Date.now(),
        title: document.getElementById('task-edit-title').value,
        desc: document.getElementById('task-edit-desc').value,
        reward: parseInt(document.getElementById('task-edit-coins').value, 10),
        timer: parseInt(document.getElementById('task-edit-timer').value, 10),
        type: document.getElementById('task-edit-type').value,
        icon: document.getElementById('task-edit-icon').value,
        url: document.getElementById('task-edit-url').value
    };

    if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.saveTask(taskData, (success) => {
            if (success) {
                alert('Task saved successfully to Firebase!');
                closeTaskModal();
            }
        });
    } else {
        alert('Task saved locally!');
        closeTaskModal();
    }
}

function deleteTaskClick(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        if (typeof DatabaseAPI !== 'undefined') {
            DatabaseAPI.deleteTask(taskId, () => {
                alert('Task deleted!');
            });
        } else {
            alert('Task deleted!');
        }
    }
}

function renderNotificationsTable() {
    const tableBody = document.getElementById('admin-notifications-table');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    if (globalNotifications.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No sent notifications yet</td></tr>`;
        return;
    }

    globalNotifications.forEach(notif => {
        const targetLabel = notif.target === 'ALL' ? '📢 ALL Users' : (notif.target || 'User');
        const dateDisplay = notif.dateStr || (notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Recent');
        const safeTitle = (notif.title || 'Alert').replace(/'/g, "\\'");
        const safeMsg = (notif.message || '').replace(/'/g, "\\'");

        tableBody.innerHTML += `
            <tr>
                <td><span style="font-size: 12px; color: var(--text-muted);">${dateDisplay}</span></td>
                <td><span class="badge-status status-approved">${targetLabel}</span></td>
                <td><strong>${notif.title || 'Alert'}</strong></td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${notif.message || ''}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="editNotification('${notif.id}')" title="Edit Notification"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="btn-action btn-delete" onclick="deleteNotificationClick('${notif.id}')" title="Delete Notification"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            </tr>
        `;
    });
}

function handleNotificationSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('alert-edit-id').value;
    const target = document.getElementById('alert-target-user').value;
    const title = document.getElementById('alert-title').value;
    const msg = document.getElementById('alert-msg').value;

    const notifObj = {
        id: editId || ('NOTIF_' + Date.now()),
        target: target,
        title: title,
        message: msg,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString()
    };

    if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.saveNotification(notifObj, (success) => {
            if (success) {
                alert(editId ? 'Notification updated successfully!' : `Notification sent successfully to ${target === 'ALL' ? 'ALL Users' : target}!`);
                resetNotificationForm();
            }
        });
    } else {
        let list = JSON.parse(localStorage.getItem('todoearn_notifications') || '[]');
        const idx = list.findIndex(n => n.id === notifObj.id);
        if (idx !== -1) list[idx] = notifObj;
        else list.unshift(notifObj);
        localStorage.setItem('todoearn_notifications', JSON.stringify(list));
        globalNotifications = list;
        renderNotificationsTable();
        alert(editId ? 'Notification updated!' : `Notification sent to ${target}!`);
        resetNotificationForm();
    }
}

function editNotification(notifId) {
    const notif = globalNotifications.find(n => n.id === notifId);
    if (!notif) return;

    document.getElementById('alert-edit-id').value = notif.id;
    document.getElementById('alert-target-user').value = notif.target || 'ALL';
    document.getElementById('alert-title').value = notif.title || '';
    document.getElementById('alert-msg').value = notif.message || '';

    const heading = document.getElementById('alert-form-heading');
    if (heading) heading.textContent = 'Edit Sent Notification';
    const btnSubmit = document.getElementById('btn-submit-alert');
    if (btnSubmit) btnSubmit.textContent = 'Update Notification';
    const btnCancel = document.getElementById('btn-cancel-alert-edit');
    if (btnCancel) btnCancel.style.display = 'inline-block';

    const alertsSec = document.getElementById('sec-alerts');
    if (alertsSec) alertsSec.scrollIntoView({ behavior: 'smooth' });
}

function resetNotificationForm() {
    const form = document.getElementById('form-send-alert');
    if (form) form.reset();
    document.getElementById('alert-edit-id').value = '';
    const heading = document.getElementById('alert-form-heading');
    if (heading) heading.textContent = 'Send Targeted / Broadcast Notification';
    const btnSubmit = document.getElementById('btn-submit-alert');
    if (btnSubmit) btnSubmit.textContent = 'Send Notification';
    const btnCancel = document.getElementById('btn-cancel-alert-edit');
    if (btnCancel) btnCancel.style.display = 'none';
}

function deleteNotificationClick(notifId) {
    if (confirm('Are you sure you want to delete this notification? It will be removed for users as well.')) {
        if (typeof DatabaseAPI !== 'undefined') {
            DatabaseAPI.deleteNotification(notifId, (success) => {
                if (success) {
                    alert('Notification deleted successfully!');
                }
            });
        } else {
            globalNotifications = globalNotifications.filter(n => n.id !== notifId);
            localStorage.setItem('todoearn_notifications', JSON.stringify(globalNotifications));
            renderNotificationsTable();
            alert('Notification deleted!');
        }
    }
}


function handlePayoutAction(payoutId, status, userEmail, amount) {
    if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.updatePayoutStatus(payoutId, status, userEmail, amount, (success) => {
            if (success) {
                alert(`Payout ${status.toLowerCase()} successfully!`);
            }
        });
    } else {
        alert(`Payout status updated to ${status}`);
    }
}

function saveAppControls(e) {
    e.preventDefault();
    const carromFee = document.getElementById('ctrl-carrom-fee').value;
    const carromWin = document.getElementById('ctrl-carrom-win').value;

    if (typeof DatabaseAPI !== 'undefined' && db) {
        db.ref('app_settings').set({
            carromEntryFee: parseInt(carromFee, 10),
            carromReward: parseInt(carromWin, 10),
            dailyReward: parseInt(document.getElementById('ctrl-daily-reward').value, 10),
            minWithdraw: parseInt(document.getElementById('ctrl-min-withdraw').value, 10)
        });
    }

    alert('App & Game Configuration saved successfully!');
}
