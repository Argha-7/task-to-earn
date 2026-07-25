/* ==========================================================================
   REWARD ZOO - ULTRA-PROFESSIONAL TELEGRAM MINI APP ENGINE
   ========================================================================== */

// Web Audio API Synthesizer with Haptic Support
class AudioSynth {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }

    triggerHaptic(type = 'light') {
        try {
            if (window.Telegram?.WebApp?.HapticFeedback) {
                if (type === 'success') window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                else if (type === 'warning') window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
                else if (type === 'error') window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                else window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
            }
        } catch (e) {
            // Ignore if unsupported
        }
    }

    playClick() {
        this.triggerHaptic('light');
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playCoin() {
        this.triggerHaptic('success');
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playWin() {
        this.triggerHaptic('success');
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
            gain.gain.setValueAtTime(0.18, now + (idx * 0.08));
            gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.08) + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + (idx * 0.08));
            osc.stop(now + (idx * 0.08) + 0.22);
        });
    }
}

const audio = new AudioSynth();

// Telegram WebApp SDK Setup
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// App State Management
const AppState = {
    user: null,
    coins: 50,
    totalEarned: 50,
    dailyClaimed: false,
    inviteCode: 'NSHK8R',
    invitedCount: 0,
    inviteEarned: 0,
    history: [
        { title: 'Signup Bonus', date: '1 Jun, 11:28 pm', val: 50, positive: true }
    ],
    payouts: [],
    activeTask: null,
    colorGame: {
        timer: null,
        targetColor: '',
        timeLeft: 10
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    initTelegramUser();
    setupEventListeners();
    setupStorageSyncListener();
    renderAllViews();

    // Splash Screen Transition
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.remove('active');
        
        if (AppState.user) {
            showMainInterface();
            navigateToTab('home-screen');
        } else {
            showAuthView('login-screen');
        }
    }, 2000);
});

// Real-Time Cross Window & Firebase Synchronization Listener
function setupStorageSyncListener() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'rewardzoo_coins' || e.key === 'rewardzoo_payouts' || e.key === 'rewardzoo_history') {
            loadStateFromStorage();
            renderAllViews();
        }
    });

    if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.listenAllPayouts((allPayouts) => {
            if (AppState.user && allPayouts) {
                AppState.payouts = allPayouts.filter(p => p.email === AppState.user.email);
                renderAllViews();
            }
        });

        DatabaseAPI.listenAllTasks((tasks) => {
            renderDynamicTasks(tasks);
        });

        let lastNotifTime = 0;
        if (AppState.user && AppState.user.email) {
            DatabaseAPI.listenUserNotification(AppState.user.email, (notif) => {
                if (notif && notif.message && notif.timestamp !== lastNotifTime) {
                    lastNotifTime = notif.timestamp;
                    showNotificationModal(notif.title, notif.message);
                }
            });
        }
    }
}

function showNotificationModal(title, msg) {
    const modal = document.getElementById('notification-modal');
    if (!modal) return;
    document.getElementById('modal-notif-title').textContent = title || 'Admin Alert';
    document.getElementById('modal-notif-msg').textContent = msg;
    modal.classList.add('active');
    audio.playWin();

    // Store in notification history list
    AppState.notificationsList = AppState.notificationsList || [];
    AppState.notificationsList.unshift({
        title: title || 'Admin Alert',
        message: msg,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('rewardzoo_notifs', JSON.stringify(AppState.notificationsList));
    updateNotifDot();
}

function closeNotificationModal() {
    audio.playClick();
    const modal = document.getElementById('notification-modal');
    if (modal) modal.classList.remove('active');
}

function openNotificationDrawer() {
    audio.playClick();
    const modal = document.getElementById('notif-drawer-modal');
    if (!modal) return;
    renderNotificationDrawerList();
    modal.classList.add('active');

    const dot = document.getElementById('notif-bell-dot');
    if (dot) dot.style.display = 'none';
}

function closeNotificationDrawer() {
    audio.playClick();
    const modal = document.getElementById('notif-drawer-modal');
    if (modal) modal.classList.remove('active');
}

function renderNotificationDrawerList() {
    const list = document.getElementById('notif-drawer-list');
    if (!list) return;

    AppState.notificationsList = AppState.notificationsList || JSON.parse(localStorage.getItem('rewardzoo_notifs') || '[]');

    list.innerHTML = '';
    if (AppState.notificationsList.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">No notification history</div>`;
        return;
    }

    AppState.notificationsList.forEach(n => {
        const item = document.createElement('div');
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.border = '1px solid rgba(255,255,255,0.1)';
        item.style.borderRadius = '12px';
        item.style.padding = '12px 14px';

        item.innerHTML = `
            <div style="font-weight: 800; font-size: 14px; color: var(--text-main); margin-bottom: 4px;">📢 ${n.title}</div>
            <div style="font-size: 13px; color: var(--text-muted); line-height: 1.4;">${n.message}</div>
            <div style="font-size: 11px; color: var(--accent-magenta); margin-top: 6px; text-align: right;">${n.date}</div>
        `;
        list.appendChild(item);
    });
}

function updateNotifDot() {
    const dot = document.getElementById('notif-bell-dot');
    if (dot) dot.style.display = 'block';
}

// Load State from LocalStorage
function loadStateFromStorage() {
    const savedUser = localStorage.getItem('rewardzoo_user');
    const savedCoins = localStorage.getItem('rewardzoo_coins');
    const savedEarned = localStorage.getItem('rewardzoo_earned');
    const savedHistory = localStorage.getItem('rewardzoo_history');
    const savedPayouts = localStorage.getItem('rewardzoo_payouts');
    const savedDaily = localStorage.getItem('rewardzoo_daily_claimed');

    if (savedUser) AppState.user = JSON.parse(savedUser);
    if (savedCoins !== null) AppState.coins = parseInt(savedCoins, 10);
    if (savedEarned !== null) AppState.totalEarned = parseInt(savedEarned, 10);
    if (savedHistory) AppState.history = JSON.parse(savedHistory);
    if (savedPayouts) AppState.payouts = JSON.parse(savedPayouts);
    if (savedDaily) AppState.dailyClaimed = (savedDaily === 'true');
}

function saveStateToStorage() {
    if (AppState.user) {
        localStorage.setItem('rewardzoo_user', JSON.stringify(AppState.user));
        if (typeof DatabaseAPI !== 'undefined') {
            DatabaseAPI.saveUser({
                name: AppState.user.name,
                email: AppState.user.email,
                coins: AppState.coins,
                totalEarned: AppState.totalEarned
            });
        }
    }
    localStorage.setItem('rewardzoo_coins', AppState.coins.toString());
    localStorage.setItem('rewardzoo_earned', AppState.totalEarned.toString());
    localStorage.setItem('rewardzoo_history', JSON.stringify(AppState.history));
    localStorage.setItem('rewardzoo_payouts', JSON.stringify(AppState.payouts));
    localStorage.setItem('rewardzoo_daily_claimed', AppState.dailyClaimed.toString());
}

// Auto-Detect Telegram Profile & Sync Firebase
function initTelegramUser() {
    if (tg?.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        AppState.user = {
            name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
            email: tgUser.username ? `@${tgUser.username}` : `tg_${tgUser.id}@telegram.user`,
            telegramId: tgUser.id || null
        };
    } else if (!AppState.user) {
        AppState.user = {
            name: 'DSTechVerse',
            email: 'DSTechVerse@gmail.com'
        };
    }

    if (AppState.user && typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.saveUser({
            name: AppState.user.name,
            email: AppState.user.email,
            coins: AppState.coins,
            totalEarned: AppState.totalEarned
        });
        DatabaseAPI.listenUserCoins(AppState.user.email, (liveCoins) => {
            if (liveCoins !== undefined && liveCoins !== null) {
                AppState.coins = liveCoins;
                renderAllViews();
            }
        });
    }
}

function setupEventListeners() {
    // Login Form Submit
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            audio.playClick();
            const email = document.getElementById('login-email').value;
            AppState.user = {
                name: email.split('@')[0] || 'DSTechVerse',
                email: email
            };
            saveStateToStorage();
            showToast('Login successful!');
            showMainInterface();
            navigateToTab('home-screen');
        });
    }

    // Register Form Submit
    const regForm = document.getElementById('form-register');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            audio.playClick();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;

            if (pass !== confirm) {
                audio.triggerHaptic('error');
                showToast('Passwords do not match!');
                return;
            }

            AppState.user = { name, email };
            saveStateToStorage();
            showToast('Account created successfully!');
            showMainInterface();
            navigateToTab('home-screen');
        });
    }

    // Close app button
    const closeBtn = document.getElementById('btn-close-app');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (tg) tg.close();
            else showToast('Telegram Mini App closed');
        });
    }
}

// Interface Views Navigation
function showMainInterface() {
    document.getElementById('main-app-header').style.display = 'flex';
    document.getElementById('main-bottom-nav').style.display = 'flex';
}

function showAuthView(screenId) {
    document.getElementById('main-app-header').style.display = 'none';
    document.getElementById('main-bottom-nav').style.display = 'none';
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

function switchAuthView(screenId) {
    audio.playClick();
    showAuthView(screenId);
}

function togglePasswordVisibility(inputId) {
    audio.playClick();
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

function handleForgotPassword() {
    audio.playClick();
    showToast('Password reset link sent to email');
}

function handleLogout() {
    audio.playClick();
    AppState.user = null;
    localStorage.removeItem('rewardzoo_user');
    showAuthView('login-screen');
    showToast('Logged out');
}

function navigateToTab(screenId) {
    audio.playClick();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    // Update Bottom Nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    if (screenId === 'refer-screen') document.getElementById('nav-refer')?.classList.add('active');
    else if (screenId === 'wallet-screen') document.getElementById('nav-wallet')?.classList.add('active');
    else if (screenId === 'home-screen') document.getElementById('nav-home')?.classList.add('active');
    else if (screenId === 'history-screen') document.getElementById('nav-history')?.classList.add('active');
    else if (screenId === 'profile-screen') document.getElementById('nav-profile')?.classList.add('active');

    renderAllViews();
}

// Render All UI Elements
function renderAllViews() {
    if (AppState.user) {
        document.getElementById('display-user-name').textContent = AppState.user.name;
        document.getElementById('profile-name-val').textContent = AppState.user.name;
        document.getElementById('profile-email-val').textContent = AppState.user.email;
    }

    document.getElementById('user-coin-balance').textContent = AppState.coins;
    document.getElementById('wallet-balance-val').textContent = AppState.coins;
    document.getElementById('profile-total-earned').textContent = AppState.totalEarned;
    document.getElementById('invite-code-val').textContent = AppState.inviteCode;
    document.getElementById('refer-count').textContent = AppState.invitedCount;
    document.getElementById('refer-earned').textContent = AppState.inviteEarned;

    // Daily Claim Button State
    const claimBtn = document.getElementById('btn-claim-daily');
    if (claimBtn) {
        if (AppState.dailyClaimed) {
            claimBtn.textContent = 'Claimed Today';
            claimBtn.disabled = true;
            claimBtn.style.opacity = '0.6';
        } else {
            claimBtn.textContent = 'Claim Daily Reward';
            claimBtn.disabled = false;
            claimBtn.style.opacity = '1';
        }
    }

    renderHistory();
    renderPayouts();
}

// Daily Reward Claiming
function claimDailyReward() {
    if (AppState.dailyClaimed) return;
    
    audio.playCoin();
    AppState.coins += 20;
    AppState.totalEarned += 20;
    AppState.dailyClaimed = true;

    addHistoryItem('Daily Check-in', '+20', true);
    saveStateToStorage();
    renderAllViews();
    showToast('+20 Coins claimed successfully!');
}

// Transaction History
function addHistoryItem(title, valStr, isPositive) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ', ' + 
                    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase();

    AppState.history.unshift({
        title: title,
        date: dateStr,
        val: valStr,
        positive: isPositive
    });
    saveStateToStorage();
}

function renderHistory() {
    const list = document.getElementById('transaction-history-list');
    if (!list) return;
    list.innerHTML = '';

    AppState.history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-item-left">
                <div class="history-icon ${item.positive ? '' : 'out'}">
                    <i class="fa-solid ${item.positive ? 'fa-arrow-down-left' : 'fa-arrow-up-right'}"></i>
                </div>
                <div class="history-item-info">
                    <div class="history-item-title">${item.title}</div>
                    <div class="history-item-date">${item.date}</div>
                </div>
            </div>
            <div class="history-item-val ${item.positive ? '' : 'negative'}">${item.val}</div>
        `;
        list.appendChild(div);
    });
}

// Withdrawal Payout Handler
function handleWithdrawal(event) {
    event.preventDefault();
    audio.playClick();
    
    const amount = parseInt(document.getElementById('withdraw-amount').value, 10);
    const method = document.getElementById('withdraw-method').value;
    const account = document.getElementById('withdraw-account').value;

    if (amount > AppState.coins) {
        audio.triggerHaptic('error');
        showToast('Insufficient coin balance!');
        return;
    }

    if (amount < 100) {
        audio.triggerHaptic('warning');
        showToast('Minimum withdrawal is 100 coins!');
        return;
    }

    audio.playCoin();
    AppState.coins -= amount;
    
    const payout = {
        id: 'REQ_' + Math.floor(100000 + Math.random() * 900000),
        user: AppState.user.name,
        email: AppState.user.email,
        amount: amount,
        method: method,
        account: account,
        status: 'Pending',
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    };

    AppState.payouts.unshift(payout);
    addHistoryItem(`Withdrawal (${method})`, `-${amount}`, false);
    saveStateToStorage();
    if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.createPayout(payout);
    }
    renderAllViews();
    
    document.getElementById('withdraw-amount').value = '';
    document.getElementById('withdraw-account').value = '';
    showToast('Payout request submitted!');
}

function renderPayouts() {
    const list = document.getElementById('payout-requests-list');
    if (!list) return;
    list.innerHTML = '';

    if (AppState.payouts.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 10px;">No payout requests yet</div>`;
        return;
    }

    AppState.payouts.forEach(p => {
        const div = document.createElement('div');
        div.className = 'history-item';
        let statusColor = '#ffc107';
        if (p.status === 'Approved') statusColor = '#00e676';
        if (p.status === 'Rejected') statusColor = '#ff3d71';

        div.innerHTML = `
            <div class="history-item-left">
                <div class="history-icon out"><i class="fa-solid fa-wallet"></i></div>
                <div class="history-item-info">
                    <div class="history-item-title">Payout to ${p.method}</div>
                    <div class="history-item-date">${p.date} • <span style="color: ${statusColor}; font-weight:800;">${p.status}</span></div>
                </div>
            </div>
            <div class="history-item-val negative">-${p.amount}</div>
        `;
        list.appendChild(div);
    });
}

// Tasks System & Simulation Modal
function openTaskModal(type) {
    audio.playClick();
    AppState.activeTask = type;
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('modal-task-title');
    const desc = document.getElementById('modal-task-desc');
    const timerBox = document.getElementById('modal-timer-box');
    const btn = document.getElementById('btn-claim-task-reward');

    btn.disabled = true;
    btn.textContent = 'Please Wait...';

    if (type === 'watch') {
        title.textContent = 'Watch & Earn';
        desc.textContent = 'Watch short video advertisement to earn +15 coins.';
    } else if (type === 'view') {
        title.textContent = 'View & Win';
        desc.textContent = 'Browse sponsor website for 15 seconds to win +10 coins.';
    } else if (type === 'social') {
        title.textContent = 'Social Tasks';
        desc.textContent = 'Join our Telegram Channel to unlock +30 coins.';
    }

    modal.classList.add('active');
    
    let count = 15;
    timerBox.textContent = count + 's';
    
    const interval = setInterval(() => {
        count--;
        timerBox.textContent = count + 's';
        if (count <= 0) {
            clearInterval(interval);
            timerBox.textContent = 'Ready!';
            btn.disabled = false;
            btn.textContent = 'Claim Reward';
            audio.triggerHaptic('success');
        }
    }, 1000);
}

function completeTaskReward() {
    // Anti-Cheat 1: Blocked check
    if (AppState.user && AppState.user.isBlocked) {
        audio.triggerHaptic('error');
        showToast('⚠️ Your account is blocked by Admin!');
        document.getElementById('task-modal').classList.remove('active');
        return;
    }

    // Anti-Cheat 2: Time Elapsed Verification
    if (AppState.taskStartTime && AppState.requiredTaskDuration) {
        const elapsed = Date.now() - AppState.taskStartTime;
        if (elapsed < AppState.requiredTaskDuration - 1500) {
            audio.triggerHaptic('error');
            showToast('⚠️ Cheating attempt detected! Stay on page until timer ends.');
            document.getElementById('task-modal').classList.remove('active');
            return;
        }
    }

    audio.playWin();
    let reward = 15;
    let name = 'Watch & Earn';
    let taskId = null;

    if (typeof AppState.activeTask === 'object' && AppState.activeTask !== null) {
        reward = AppState.activeTask.reward || 15;
        name = AppState.activeTask.title || 'Dynamic Task';
        taskId = AppState.activeTask.id;
    } else {
        if (AppState.activeTask === 'view') { reward = 10; name = 'View & Win'; }
        if (AppState.activeTask === 'social') { reward = 30; name = 'Social Tasks'; }
    }

    // Anti-Cheat 3: Duplicate claim lock
    AppState.completedTasks = AppState.completedTasks || [];
    if (taskId && AppState.completedTasks.includes(taskId)) {
        showToast('⚠️ Task already claimed!');
        document.getElementById('task-modal').classList.remove('active');
        return;
    }

    if (taskId) AppState.completedTasks.push(taskId);

    AppState.coins += reward;
    AppState.totalEarned += reward;
    addHistoryItem(name, `+${reward}`, true);
    saveStateToStorage();

    if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.logTaskCompletion({
            user: AppState.user ? AppState.user.name : 'User',
            email: AppState.user ? AppState.user.email : 'user@app.com',
            taskTitle: name,
            reward: reward,
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            status: 'Verified'
        });
    }

    renderAllViews();

    document.getElementById('task-modal').classList.remove('active');
    showToast(`+${reward} Coins Earned!`);
}

// Color Game Mini-Game Logic
function startColorGame() {
    audio.playClick();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('color-game-screen').classList.add('active');
    
    const colors = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'];
    AppState.colorGame.targetColor = colors[Math.floor(Math.random() * colors.length)];
    
    const targetBox = document.getElementById('game-target-color');
    targetBox.style.backgroundColor = AppState.colorGame.targetColor;

    AppState.colorGame.timeLeft = 10;
    const timerDisplay = document.getElementById('game-timer');
    timerDisplay.textContent = 'Time: 10s';

    if (AppState.colorGame.timer) clearInterval(AppState.colorGame.timer);
    AppState.colorGame.timer = setInterval(() => {
        AppState.colorGame.timeLeft--;
        timerDisplay.textContent = `Time: ${AppState.colorGame.timeLeft}s`;
        if (AppState.colorGame.timeLeft <= 0) {
            clearInterval(AppState.colorGame.timer);
            audio.triggerHaptic('error');
            showToast('Time up! Try again.');
            navigateToTab('home-screen');
        }
    }, 1000);
}

function checkColorChoice(selectedColor) {
    if (AppState.colorGame.timer) clearInterval(AppState.colorGame.timer);

    if (selectedColor === AppState.colorGame.targetColor) {
        audio.playWin();
        AppState.coins += 25;
        AppState.totalEarned += 25;
        addHistoryItem('Color Game Win', '+25', true);
        saveStateToStorage();
        showToast('Correct Guess! +25 Coins won!');
    } else {
        audio.playClick();
        audio.triggerHaptic('warning');
        showToast('Wrong choice! Try again.');
    }

    navigateToTab('home-screen');
}

// Refer & Share Helpers
function copyInviteCode() {
    audio.playClick();
    navigator.clipboard.writeText(AppState.inviteCode);
    showToast('Invite code copied: ' + AppState.inviteCode);
}

function shareReferralLink() {
    audio.playClick();
    const shareUrl = `https://t.me/share/url?url=https://t.me/RewardZooBot?start=${AppState.inviteCode}&text=Join%20RewardZoo%20and%20earn%20free%20coins!`;
    if (tg) tg.openTelegramLink(shareUrl);
    else window.open(shareUrl, '_blank');
}

// Toast Helper
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Render Dynamic Tasks from Firebase Realtime Database
function renderDynamicTasks(tasks) {
    const grid = document.getElementById('dynamic-tasks-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        grid.innerHTML = '<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No additional tasks currently available.</div>';
        return;
    }

    tasks.forEach(t => {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.onclick = () => triggerDynamicTaskModal(t);

        let iconContent = `<i class="${t.icon || 'fa-solid fa-gift'}" style="font-size:20px; color:var(--accent-magenta);"></i>`;
        if (t.icon && (t.icon.startsWith('http://') || t.icon.startsWith('https://'))) {
            iconContent = `<img src="${t.icon}" style="width:24px; height:24px; border-radius:6px; object-fit:cover;">`;
        }

        div.innerHTML = `
            <div class="task-icon-box icon-purple">
                ${iconContent}
            </div>
            <div class="task-info">
                <div class="task-name">${t.title}</div>
                <div class="task-desc">${t.desc}</div>
            </div>
            <div class="task-reward-tag">
                +${t.reward} <i class="fa-solid fa-coins"></i>
            </div>
        `;
        grid.appendChild(div);
    });
}

function triggerDynamicTaskModal(task) {
    if (AppState.user && AppState.user.isBlocked) {
        audio.triggerHaptic('error');
        showToast('⚠️ Your account is blocked by Admin!');
        return;
    }

    if (task.type === 'game_color') {
        startColorGame();
        return;
    }

    // Anti-Cheat: Check if task already completed
    AppState.completedTasks = AppState.completedTasks || [];
    if (AppState.completedTasks.includes(task.id)) {
        audio.triggerHaptic('warning');
        showToast('⚠️ You have already claimed this task!');
        return;
    }

    audio.playClick();
    if (task.url && task.url !== '#') {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.openLink(task.url);
        else window.open(task.url, '_blank');
    }

    AppState.activeTask = task;
    AppState.taskStartTime = Date.now(); // Anti-Cheat: Record exact server/system start timestamp
    AppState.requiredTaskDuration = (task.timer || 15) * 1000;

    const modal = document.getElementById('task-modal');
    const title = document.getElementById('modal-task-title');
    const desc = document.getElementById('modal-task-desc');
    const timerBox = document.getElementById('modal-timer-box');
    const btn = document.getElementById('btn-claim-task-reward');

    title.textContent = task.title;
    desc.textContent = task.desc + ' (Stay on target page until timer finishes)';
    btn.disabled = true;
    btn.textContent = 'Verifying Visit...';

    modal.classList.add('active');

    let count = task.timer || 15;
    timerBox.textContent = count + 's';

    if (AppState.taskTimerInterval) clearInterval(AppState.taskTimerInterval);
    AppState.taskTimerInterval = setInterval(() => {
        count--;
        timerBox.textContent = count + 's';
        if (count <= 0) {
            clearInterval(AppState.taskTimerInterval);
            timerBox.textContent = 'Verified!';
            btn.disabled = false;
            btn.textContent = 'Claim Reward';
            audio.triggerHaptic('success');
        }
    }, 1000);
}


/* ==========================================================================
   CARROM BATTLE MINI-GAME PHYSICS ENGINE
   ========================================================================== */

let carromCanvas = null;
let carromCtx = null;
let carromScore = 0;
let isCarromRunning = false;

const carromState = {
    striker: { x: 150, y: 240, r: 12, vx: 0, vy: 0, color: '#f39c12' },
    aiming: false,
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 0, y: 0 },
    coins: [],
    pockets: [
        { x: 25, y: 25, r: 16 },
        { x: 275, y: 25, r: 16 },
        { x: 25, y: 275, r: 16 },
        { x: 275, y: 275, r: 16 }
    ]
};

function startCarromGame() {
    audio.playClick();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('carrom-game-screen').classList.add('active');

    setTimeout(() => {
        initCarromBoard();
    }, 100);
}

function initCarromBoard() {
    carromCanvas = document.getElementById('carromCanvas');
    if (!carromCanvas) return;
    carromCtx = carromCanvas.getContext('2d');

    carromScore = 0;
    document.getElementById('carrom-score').textContent = '0';

    carromState.striker = { x: 150, y: 240, r: 12, vx: 0, vy: 0, color: '#e74c3c' };
    carromState.aiming = false;

    carromState.coins = [
        { id: 1, x: 150, y: 140, r: 9, vx: 0, vy: 0, color: '#ffffff' },
        { id: 2, x: 138, y: 155, r: 9, vx: 0, vy: 0, color: '#2c3e50' },
        { id: 3, x: 162, y: 155, r: 9, vx: 0, vy: 0, color: '#f1c40f' },
        { id: 4, x: 150, y: 170, r: 9, vx: 0, vy: 0, color: '#ffffff' }
    ];

    setupCarromControls();

    if (!isCarromRunning) {
        isCarromRunning = true;
        requestAnimationFrame(runCarromLoop);
    }
}

function setupCarromControls() {
    if (!carromCanvas) return;

    function getCanvasPos(e) {
        const rect = carromCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (carromCanvas.width / rect.width),
            y: (clientY - rect.top) * (carromCanvas.height / rect.height)
        };
    }

    carromCanvas.onmousedown = carromCanvas.ontouchstart = (e) => {
        const pos = getCanvasPos(e);
        const dist = Math.hypot(pos.x - carromState.striker.x, pos.y - carromState.striker.y);
        if (dist <= carromState.striker.r + 10 && carromState.striker.vx === 0 && carromState.striker.vy === 0) {
            carromState.aiming = true;
            carromState.dragStart = pos;
            carromState.dragCurrent = pos;
        }
    };

    carromCanvas.onmousemove = carromCanvas.ontouchmove = (e) => {
        if (carromState.aiming) {
            carromState.dragCurrent = getCanvasPos(e);
        }
    };

    carromCanvas.onmouseup = carromCanvas.ontouchend = () => {
        if (carromState.aiming) {
            carromState.aiming = false;
            const dx = carromState.dragStart.x - carromState.dragCurrent.x;
            const dy = carromState.dragStart.y - carromState.dragCurrent.y;
            carromState.striker.vx = dx * 0.18;
            carromState.striker.vy = dy * 0.18;
            audio.playClick();
        }
    };
}

function runCarromLoop() {
    if (!isCarromRunning) return;
    updateCarromPhysics();
    drawCarromBoard();
    requestAnimationFrame(runCarromLoop);
}

function updateCarromPhysics() {
    const allPieces = [carromState.striker, ...carromState.coins];

    // Move pieces and apply friction
    allPieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;

        if (Math.abs(p.vx) < 0.05) p.vx = 0;
        if (Math.abs(p.vy) < 0.05) p.vy = 0;

        // Bounce off board walls (margin 15px)
        if (p.x - p.r < 15) { p.x = 15 + p.r; p.vx *= -0.8; }
        if (p.x + p.r > 285) { p.x = 285 - p.r; p.vx *= -0.8; }
        if (p.y - p.r < 15) { p.y = 15 + p.r; p.vy *= -0.8; }
        if (p.y + p.r > 285) { p.y = 285 - p.r; p.vy *= -0.8; }
    });

    // Elastic Collisions between pieces
    for (let i = 0; i < allPieces.length; i++) {
        for (let j = i + 1; j < allPieces.length; j++) {
            const p1 = allPieces[i];
            const p2 = allPieces[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = p1.r + p2.r;

            if (dist < minDist && dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                const kx = p1.vx - p2.vx;
                const ky = p1.vy - p2.vy;
                const p = 2 * (nx * kx + ny * ky) / 2;

                p1.vx -= p * nx;
                p1.vy -= p * ny;
                p2.vx += p * nx;
                p2.vy += p * ny;

                // Push apart to prevent overlap
                const overlap = minDist - dist;
                p1.x -= nx * overlap * 0.5;
                p1.y -= ny * overlap * 0.5;
                p2.x += nx * overlap * 0.5;
                p2.y += ny * overlap * 0.5;
            }
        }
    }

    // Check Pockets
    carromState.coins.forEach((c, idx) => {
        carromState.pockets.forEach(pkt => {
            const d = Math.hypot(c.x - pkt.x, c.y - pkt.y);
            if (d < pkt.r + 2) {
                // Coin Pocketed!
                carromState.coins.splice(idx, 1);
                carromScore++;
                document.getElementById('carrom-score').textContent = carromScore;
                audio.playCoin();

                if (carromScore >= 3) {
                    // Win Match!
                    setTimeout(() => {
                        audio.playWin();
                        AppState.coins += 50;
                        AppState.totalEarned += 50;
                        addHistoryItem('Carrom Victory Reward', '+50', true);
                        saveStateToStorage();

                        if (typeof DatabaseAPI !== 'undefined') {
                            DatabaseAPI.logTaskCompletion({
                                user: AppState.user ? AppState.user.name : 'User',
                                email: AppState.user ? AppState.user.email : 'user@app.com',
                                taskTitle: 'Carrom Battle Match Win',
                                reward: 50,
                                date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                                status: 'Match Won (Score 3/3)'
                            });
                        }

                        showToast('🎉 Victory! +50 Coins Won!');
                        navigateToTab('home-screen');
                    }, 500);
                }
            }
        });
    });

    // Reset striker if it drops in pocket
    carromState.pockets.forEach(pkt => {
        const d = Math.hypot(carromState.striker.x - pkt.x, carromState.striker.y - pkt.y);
        if (d < pkt.r) {
            carromState.striker.x = 150;
            carromState.striker.y = 240;
            carromState.striker.vx = 0;
            carromState.striker.vy = 0;
            audio.triggerHaptic('error');
        }
    });
}

function drawCarromBoard() {
    if (!carromCtx) return;
    carromCtx.clearRect(0, 0, 300, 300);

    // Board background & frame
    carromCtx.fillStyle = '#2a1b0c';
    carromCtx.fillRect(0, 0, 300, 300);
    carromCtx.strokeStyle = '#5a3d1e';
    carromCtx.lineWidth = 12;
    carromCtx.strokeRect(6, 6, 288, 288);

    // Center circle
    carromCtx.beginPath();
    carromCtx.arc(150, 150, 25, 0, Math.PI * 2);
    carromCtx.strokeStyle = '#8a5a2b';
    carromCtx.lineWidth = 2;
    carromCtx.stroke();

    // 4 Corner Pockets
    carromState.pockets.forEach(pkt => {
        carromCtx.beginPath();
        carromCtx.arc(pkt.x, pkt.y, pkt.r, 0, Math.PI * 2);
        carromCtx.fillStyle = '#0a0502';
        carromCtx.fill();
        carromCtx.strokeStyle = '#4a2e12';
        carromCtx.stroke();
    });

    // Baseline for striker
    carromCtx.beginPath();
    carromCtx.moveTo(50, 240);
    carromCtx.lineTo(250, 240);
    carromCtx.strokeStyle = '#8a5a2b';
    carromCtx.lineWidth = 1.5;
    carromCtx.stroke();

    // Draw Aiming Line
    if (carromState.aiming) {
        carromCtx.beginPath();
        carromCtx.moveTo(carromState.striker.x, carromState.striker.y);
        const aimX = carromState.striker.x + (carromState.dragStart.x - carromState.dragCurrent.x);
        const aimY = carromState.striker.y + (carromState.dragStart.y - carromState.dragCurrent.y);
        carromCtx.lineTo(aimX, aimY);
        carromCtx.strokeStyle = '#e03bff';
        carromCtx.lineWidth = 3;
        carromCtx.setLineDash([4, 4]);
        carromCtx.stroke();
        carromCtx.setLineDash([]);
    }

    // Draw Coins
    carromState.coins.forEach(c => {
        carromCtx.beginPath();
        carromCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        carromCtx.fillStyle = c.color;
        carromCtx.fill();
        carromCtx.strokeStyle = '#000';
        carromCtx.lineWidth = 1;
        carromCtx.stroke();
    });

    // Draw Striker
    carromCtx.beginPath();
    carromCtx.arc(carromState.striker.x, carromState.striker.y, carromState.striker.r, 0, Math.PI * 2);
    carromCtx.fillStyle = carromState.striker.color;
    carromCtx.fill();
    carromCtx.strokeStyle = '#fff';
    carromCtx.lineWidth = 2;
    carromCtx.stroke();
}
