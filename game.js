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

// Bulletproof Fail-Safe App Initializer
function initApp() {
    try {
        loadStateFromStorage();
        initTelegramUser();
        setupEventListeners();
        setupStorageSyncListener();
        renderAllViews();
    } catch (e) {
        console.error("App Initialization non-fatal notice:", e);
    }

    // Ensure Header & Bottom Navigation Bar are always active & visible
    showMainInterface();

    // Instant Fail-Safe Splash Dismissal (150ms)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.remove('active');
            splash.style.display = 'none';
        }
        showMainInterface();
        navigateToTab('home-screen');
    }, 150);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Interface Navigation Engine
function showMainInterface() {
    const header = document.getElementById('main-app-header');
    const nav = document.getElementById('main-bottom-nav');
    if (header) header.style.display = 'flex';
    if (nav) nav.style.display = 'flex';
}

function navigateToTab(tabId) {
    audio.playClick();

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        if (screen.id !== tabId) {
            screen.style.display = 'none';
        }
    });

    const targetScreen = document.getElementById(tabId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.style.display = 'flex';
    }

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    if (tabId === 'battle-screen') {
        const item = document.getElementById('nav-battle');
        if (item) item.classList.add('active');
    } else if (tabId === 'wallet-screen') {
        const item = document.getElementById('nav-wallet');
        if (item) item.classList.add('active');
    } else if (tabId === 'home-screen') {
        const item = document.getElementById('nav-home');
        if (item) item.classList.add('active');
    } else if (tabId === 'refer-screen') {
        const item = document.getElementById('nav-refer');
        if (item) item.classList.add('active');
    } else if (tabId === 'profile-screen') {
        const item = document.getElementById('nav-profile');
        if (item) item.classList.add('active');
    }

    showMainInterface();
}

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

        let knownNotifIds = new Set();
        let isFirstLoad = true;

        const handleNotifUpdate = (userNotifs) => {
            AppState.notificationsList = userNotifs || [];
            
            if (userNotifs && userNotifs.length > 0) {
                const latest = userNotifs[0];
                if (!knownNotifIds.has(latest.id)) {
                    knownNotifIds.add(latest.id);
                    if (!isFirstLoad) {
                        showNotificationModal(latest.title, latest.message);
                    }
                }
            }
            isFirstLoad = false;
            
            updateNotifDot();
            const drawerModal = document.getElementById('notif-drawer-modal');
            if (drawerModal && drawerModal.classList.contains('active')) {
                renderNotificationDrawerList();
            }
        };

        const userEmail = AppState.user ? AppState.user.email : 'DSTechVerse@gmail.com';
        DatabaseAPI.listenUserNotification(userEmail, (userNotifs) => {
            handleNotifUpdate(userNotifs);
        });
    }
}

function showNotificationModal(title, msg) {
    const modal = document.getElementById('notification-modal');
    if (!modal) return;
    document.getElementById('modal-notif-title').textContent = title || 'Admin Alert';
    document.getElementById('modal-notif-msg').textContent = msg || '';
    modal.classList.add('active');
    audio.playWin();
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

    const notifs = AppState.notificationsList || [];

    list.innerHTML = '';
    if (notifs.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">No active notifications</div>`;
        return;
    }

    notifs.forEach(n => {
        const item = document.createElement('div');
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.border = '1px solid rgba(255,255,255,0.1)';
        item.style.borderRadius = '12px';
        item.style.padding = '12px 14px';
        item.style.marginBottom = '10px';

        const dateStr = n.dateStr || (n.timestamp ? new Date(n.timestamp).toLocaleString() : '');

        item.innerHTML = `
            <div style="font-weight: 800; font-size: 14px; color: var(--text-main); margin-bottom: 4px;">📢 ${n.title}</div>
            <div style="font-size: 13px; color: var(--text-muted); line-height: 1.4;">${n.message}</div>
            <div style="font-size: 11px; color: var(--accent-magenta); margin-top: 6px; text-align: right;">${dateStr}</div>
        `;
        list.appendChild(item);
    });
}

function updateNotifDot() {
    const dot = document.getElementById('notif-bell-dot');
    if (dot) {
        if (AppState.notificationsList && AppState.notificationsList.length > 0) {
            dot.style.display = 'block';
        } else {
            dot.style.display = 'none';
        }
    }
}

// Load State from LocalStorage
function loadStateFromStorage() {
    const savedUser = localStorage.getItem('rewardzoo_user');
    const savedCoins = localStorage.getItem('rewardzoo_coins');
    const savedEarned = localStorage.getItem('rewardzoo_earned');
    const savedHistory = localStorage.getItem('rewardzoo_history');
    const savedPayouts = localStorage.getItem('rewardzoo_payouts');
    const savedDaily = localStorage.getItem('rewardzoo_daily_claimed');
    const savedBattles = localStorage.getItem('todoearn_battles_played');
    const savedWon = localStorage.getItem('todoearn_battles_won');
    const savedMission = localStorage.getItem('todoearn_mission3_claimed');

    if (savedUser) AppState.user = JSON.parse(savedUser);
    if (savedCoins !== null) AppState.coins = parseInt(savedCoins, 10);
    if (savedEarned !== null) AppState.totalEarned = parseInt(savedEarned, 10);
    if (savedHistory) AppState.history = JSON.parse(savedHistory);
    if (savedPayouts) AppState.payouts = JSON.parse(savedPayouts);
    if (savedDaily) AppState.dailyClaimed = (savedDaily === 'true');
    if (savedBattles) AppState.battlesPlayedToday = parseInt(savedBattles, 10);
    if (savedWon) AppState.battlesWonTotal = parseInt(savedWon, 10);
    if (savedMission) AppState.mission3BattlesClaimed = (savedMission === 'true');
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
    localStorage.setItem('todoearn_battles_played', (AppState.battlesPlayedToday || 0).toString());
    localStorage.setItem('todoearn_battles_won', (AppState.battlesWonTotal || 0).toString());
    localStorage.setItem('todoearn_mission3_claimed', (AppState.mission3BattlesClaimed || false).toString());
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
    const header = document.getElementById('main-app-header');
    const nav = document.getElementById('main-bottom-nav');
    if (header) header.style.display = 'flex';
    if (nav) nav.style.display = 'flex';
}

function showAuthView(screenId) {
    const header = document.getElementById('main-app-header');
    const nav = document.getElementById('main-bottom-nav');
    if (header) header.style.display = 'none';
    if (nav) nav.style.display = 'none';
    
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
    showMainInterface();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    // Update Bottom Nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    if (screenId === 'refer-screen') document.getElementById('nav-refer')?.classList.add('active');
    else if (screenId === 'battle-screen') document.getElementById('nav-battle')?.classList.add('active');
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
    renderBattleMissions();
    renderLeaderboard();
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

// Carrom Game Alias
function startCarromGame() {
    startCarromBattleGame();
}

/* ==========================================================================
   BATTLE ARENA, MISSIONS & LEADERBOARD LOGIC
   ========================================================================== */

function startBattle(gameType, entryFee, winReward) {
    if (AppState.coins < entryFee) {
        audio.triggerHaptic('error');
        showToast(`⚠️ Insufficient coins! Need ${entryFee} coins to enter.`);
        return;
    }

    audio.playClick();
    AppState.coins -= entryFee;
    addHistoryItem(`${gameType.toUpperCase()} Battle Fee`, `-${entryFee}`, false);
    
    AppState.battlesPlayedToday = (AppState.battlesPlayedToday || 0) + 1;
    saveStateToStorage();
    renderAllViews();

    showToast(`Entered ${gameType} Battle (-${entryFee} Coins)`);

    AppState.currentBattle = {
        type: gameType,
        entryFee: entryFee,
        winReward: winReward
    };

    openMatchmaking(gameType);
}

// Telegram Ads Integration Function
function triggerTelegramAd(slotName = 'matchmaking') {
    console.log(`📢 Triggering Telegram Ad for slot: ${slotName}`);
    if (window.Adsgram) {
        window.Adsgram.show().then((result) => {
            console.log("Telegram Ad completed:", result);
        }).catch((err) => {
            console.warn("Telegram Ad skipped/error:", err);
        });
    } else {
        const statusText = document.getElementById('tg-ad-status-text');
        if (statusText) statusText.textContent = 'Telegram Adsgram SDK Ready';
    }
}

function openMatchmaking(gameType) {
    const modal = document.getElementById('battle-matchmaking-modal');
    if (!modal) return;
    modal.classList.add('active');

    document.getElementById('mm-player1-name').textContent = AppState.user ? AppState.user.name : 'YOU';
    document.getElementById('mm-player2-name').textContent = 'Searching...';
    document.getElementById('mm-player2-status').textContent = 'Online Players...';
    document.getElementById('mm-player2-icon').className = 'fa-solid fa-spinner fa-spin';
    document.getElementById('mm-status-text').textContent = 'Finding online player...';

    triggerTelegramAd('matchmaking');

    const botNames = ['Viper_Pro99', 'AlphaGamer', 'ShadowRider', 'CyberKing_X', 'StarGamer77', 'ProSniper_007'];

    setTimeout(() => {
        let opponentName = 'Online Player';
        let isBot = false;

        if (typeof globalUsers !== 'undefined' && globalUsers.length > 1) {
            const otherUsers = globalUsers.filter(u => !AppState.user || u.email !== AppState.user.email);
            if (otherUsers.length > 0) {
                opponentName = otherUsers[Math.floor(Math.random() * otherUsers.length)].name || 'Online Player';
            } else {
                isBot = true;
                opponentName = botNames[Math.floor(Math.random() * botNames.length)];
            }
        } else {
            isBot = true;
            opponentName = botNames[Math.floor(Math.random() * botNames.length)];
        }

        AppState.currentOpponent = { name: opponentName, isBot: isBot };

        document.getElementById('mm-player2-name').textContent = opponentName;
        document.getElementById('mm-player2-status').textContent = isBot ? '🤖 AI Bot Opponent' : '⚡ Online Real Player';
        document.getElementById('mm-player2-icon').className = isBot ? 'fa-solid fa-robot' : 'fa-solid fa-user-astronaut';
        document.getElementById('mm-status-text').textContent = `Match Found vs ${opponentName}! Starting...`;

        audio.playCoin();

        setTimeout(() => {
            modal.classList.remove('active');

            if (gameType === 'color') {
                startColorGame();
            } else if (gameType === 'carrom') {
                startCarromBattleGame();
            } else if (gameType === 'spin') {
                startSpinBattleGame();
            } else if (gameType === 'tictactoe') {
                startTicTacToeBattleGame();
            }
        }, 1400);
    }, 1400);
}

function completeBattleResult(won) {
    const battle = AppState.currentBattle || { winReward: 50, entryFee: 20, type: 'carrom' };
    const opponent = AppState.currentOpponent || { name: 'Opponent' };
    
    if (won) {
        AppState.coins += battle.winReward;
        AppState.totalEarned += battle.winReward;
        AppState.battlesWonTotal = (AppState.battlesWonTotal || 0) + 1;
        addHistoryItem(`${battle.type.toUpperCase()} Battle Win`, `+${battle.winReward}`, true);
    }

    if (typeof DatabaseAPI !== 'undefined' && AppState.user) {
        DatabaseAPI.saveBattleStats(AppState.user.email, {
            name: AppState.user.name,
            battlesWon: AppState.battlesWonTotal,
            battlesPlayed: AppState.battlesPlayedToday,
            coinsEarned: AppState.totalEarned
        });
    }

    saveStateToStorage();
    renderAllViews();

    triggerTelegramAd('victory');
    showVictoryModal(won, battle.winReward, opponent.name);
}

function showVictoryModal(won, coinsReward, opponentName) {
    const modal = document.getElementById('battle-victory-modal');
    if (!modal) return;

    const icon = document.getElementById('victory-icon-container');
    const title = document.getElementById('victory-title');
    const sub = document.getElementById('victory-subtitle');
    const coinsVal = document.getElementById('victory-coins-val');

    if (won) {
        audio.playWin();
        if (icon) icon.textContent = '🏆';
        if (title) { title.textContent = 'VICTORY!'; title.style.color = '#ffb800'; }
        if (sub) sub.textContent = `You defeated ${opponentName} in battle!`;
        if (coinsVal) coinsVal.textContent = `+${coinsReward}`;
    } else {
        audio.triggerHaptic('error');
        if (icon) icon.textContent = '💔';
        if (title) { title.textContent = 'DEFEAT!'; title.style.color = '#ff5252'; }
        if (sub) sub.textContent = `${opponentName} won this match. Try again!`;
        if (coinsVal) coinsVal.textContent = `0`;
    }

    modal.classList.add('active');
}

function closeVictoryModal() {
    audio.playClick();
    const modal = document.getElementById('battle-victory-modal');
    if (modal) modal.classList.remove('active');
    navigateToTab('battle-screen');
}

// Interactive Carrom Board Mini-Game Engine (Real 2D Physics)
let carromState = {
    userScore: 0,
    oppScore: 0,
    isUserTurn: true,
    isShooting: false,
    pucks: [],
    striker: { x: 150, y: 250, radius: 13, vx: 0, vy: 0 },
    dragAim: { isDragging: false, startX: 0, startY: 0, currX: 0, currY: 0 }
};

function startCarromBattleGame() {
    audio.playClick();
    carromState.userScore = 0;
    carromState.oppScore = 0;
    carromState.isUserTurn = true;
    carromState.isShooting = false;
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const carromScreen = document.getElementById('carrom-game-screen');
    if (carromScreen) carromScreen.classList.add('active');

    const uScore = document.getElementById('carrom-user-score');
    const oScore = document.getElementById('carrom-opp-score');
    if (uScore) uScore.textContent = '0';
    if (oScore) oScore.textContent = '0';

    const turnInd = document.getElementById('carrom-turn-indicator');
    if (turnInd) {
        turnInd.textContent = 'YOUR TURN';
        turnInd.style.color = '#00d2d3';
    }

    initCarromBoard();
}

function initCarromBoard() {
    const canvas = document.getElementById('carrom-canvas');
    if (!canvas) return;
    
    carromState.pucks = [
        { x: 150, y: 150, radius: 10, color: '#ff3d71', pts: 30, type: 'queen', vx: 0, vy: 0, pocketed: false },
        { x: 132, y: 138, radius: 9, color: '#ffffff', pts: 10, type: 'white', vx: 0, vy: 0, pocketed: false },
        { x: 168, y: 138, radius: 9, color: '#ffffff', pts: 10, type: 'white', vx: 0, vy: 0, pocketed: false },
        { x: 132, y: 162, radius: 9, color: '#111122', pts: 5, type: 'black', vx: 0, vy: 0, pocketed: false },
        { x: 168, y: 162, radius: 9, color: '#111122', pts: 5, type: 'black', vx: 0, vy: 0, pocketed: false },
        { x: 150, y: 125, radius: 9, color: '#ffffff', pts: 10, type: 'white', vx: 0, vy: 0, pocketed: false },
        { x: 150, y: 175, radius: 9, color: '#111122', pts: 5, type: 'black', vx: 0, vy: 0, pocketed: false }
    ];

    carromState.striker = { x: 150, y: 250, radius: 13, vx: 0, vy: 0 };
    setupCarromCanvasEvents(canvas);
    drawCarromBoard();
}

function updateCarromStrikerPos(val) {
    if (carromState.isShooting || !carromState.isUserTurn) return;
    const num = parseInt(val, 10);
    carromState.striker.x = num;
    const posLabel = document.getElementById('carrom-pos-val');
    if (posLabel) {
        if (num < 100) posLabel.textContent = 'Left';
        else if (num > 200) posLabel.textContent = 'Right';
        else posLabel.textContent = 'Center';
    }
    drawCarromBoard();
}

function drawCarromBoard() {
    const canvas = document.getElementById('carrom-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Board Base
    ctx.fillStyle = '#e4c49f';
    ctx.fillRect(0, 0, 300, 300);

    // 4 Corner Pockets
    const pockets = [{x: 22, y: 22}, {x: 278, y: 22}, {x: 22, y: 278}, {x: 278, y: 278}];
    ctx.fillStyle = '#111111';
    pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fill();
    });

    // Center Circle & Outer Circles
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(150, 150, 35, 0, Math.PI * 2);
    ctx.stroke();

    // Baseline for Striker
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 250);
    ctx.lineTo(250, 250);
    ctx.stroke();

    // Draw Pucks
    carromState.pucks.forEach(puck => {
        if (!puck.pocketed) {
            ctx.fillStyle = puck.color;
            ctx.beginPath();
            ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    });

    // Draw Striker
    const st = carromState.striker;
    ctx.fillStyle = '#e03bff';
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Aim Target Line if dragging or ready
    if (!carromState.isShooting && carromState.isUserTurn) {
        ctx.strokeStyle = 'rgba(224, 59, 255, 0.6)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(st.x, st.y - 80);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function shootCarromStriker() {
    if (carromState.isShooting || !carromState.isUserTurn) return;
    audio.playClick();
    carromState.isShooting = true;

    const st = carromState.striker;
    const angle = (Math.random() * 0.6 - 0.3) - Math.PI / 2;
    const speed = 12 + Math.random() * 4;
    st.vx = Math.cos(angle) * speed;
    st.vy = Math.sin(angle) * speed;

    runCarromPhysicsEngine();
}

function setupCarromCanvasEvents(canvas) {
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    canvas.onmousedown = (e) => {
        if (carromState.isShooting || !carromState.isUserTurn) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if (Math.hypot(mouseX - carromState.striker.x, mouseY - carromState.striker.y) < 25) {
            isDragging = true;
            dragStart = { x: mouseX, y: mouseY };
        }
    };

    canvas.onmouseup = (e) => {
        if (isDragging) {
            isDragging = false;
            shootCarromStriker();
        }
    };

    canvas.ontouchstart = (e) => {
        if (carromState.isShooting || !carromState.isUserTurn || !e.touches[0]) return;
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;
        if (Math.hypot(touchX - carromState.striker.x, touchY - carromState.striker.y) < 25) {
            isDragging = true;
        }
    };

    canvas.ontouchend = () => {
        if (isDragging) {
            isDragging = false;
            shootCarromStriker();
        }
    };
}

function runCarromPhysicsEngine() {
    function update() {
        const st = carromState.striker;
        
        // Move Striker & Pucks
        st.x += st.vx;
        st.y += st.vy;
        st.vx *= 0.97;
        st.vy *= 0.97;

        // Bounce Striker off Board Walls
        if (st.x - st.radius < 12 || st.x + st.radius > 288) st.vx *= -1;
        if (st.y - st.radius < 12 || st.y + st.radius > 288) st.vy *= -1;

        // Puck Physics & Collision Damping
        carromState.pucks.forEach(p => {
            if (p.pocketed) return;

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;

            // Puck Wall Bounces
            if (p.x - p.radius < 12 || p.x + p.radius > 288) p.vx *= -1;
            if (p.y - p.radius < 12 || p.y + p.radius > 288) p.vy *= -1;

            // Collision: Striker with Puck
            const dx = p.x - st.x;
            const dy = p.y - st.y;
            const dist = Math.hypot(dx, dy);
            if (dist < st.radius + p.radius) {
                audio.playClick();
                p.vx += st.vx * 0.75;
                p.vy += st.vy * 0.75;
                st.vx *= 0.6;
                st.vy *= 0.6;
            }

            // Pocket Check (4 Corners)
            const pockets = [{x: 22, y: 22}, {x: 278, y: 22}, {x: 22, y: 278}, {x: 278, y: 278}];
            pockets.forEach(pkt => {
                if (Math.hypot(p.x - pkt.x, p.y - pkt.y) < 22) {
                    p.pocketed = true;
                    p.vx = 0;
                    p.vy = 0;
                    audio.playCoin();

                    if (carromState.isUserTurn) {
                        carromState.userScore += p.pts;
                        const uVal = document.getElementById('carrom-user-score');
                        if (uVal) uVal.textContent = carromState.userScore;
                    } else {
                        carromState.oppScore += p.pts;
                        const oVal = document.getElementById('carrom-opp-score');
                        if (oVal) oVal.textContent = carromState.oppScore;
                    }
                }
            });
        });

        drawCarromBoard();

        const activeMotion = Math.hypot(st.vx, st.vy) > 0.25 || carromState.pucks.some(p => Math.hypot(p.vx, p.vy) > 0.25);

        if (activeMotion) {
            requestAnimationFrame(update);
        } else {
            st.vx = 0;
            st.vy = 0;
            st.x = parseInt(document.getElementById('carrom-striker-slider')?.value || '150', 10);
            st.y = 250;
            carromState.isShooting = false;
            drawCarromBoard();

            // Check Win Condition
            if (carromState.userScore >= 30 || carromState.oppScore >= 30 || carromState.pucks.every(p => p.pocketed)) {
                completeBattleResult(carromState.userScore >= carromState.oppScore);
                return;
            }

            // Bot Turn Trigger
            if (carromState.isUserTurn) {
                carromState.isUserTurn = false;
                const turnInd = document.getElementById('carrom-turn-indicator');
                if (turnInd) {
                    turnInd.textContent = "BOT'S TURN";
                    turnInd.style.color = "#ff5252";
                }

                setTimeout(() => {
                    const botScoreGain = Math.random() > 0.4 ? (Math.random() > 0.6 ? 10 : 5) : 0;
                    carromState.oppScore += botScoreGain;
                    const oVal = document.getElementById('carrom-opp-score');
                    if (oVal) oVal.textContent = carromState.oppScore;

                    carromState.isUserTurn = true;
                    if (turnInd) {
                        turnInd.textContent = "YOUR TURN";
                        turnInd.style.color = "#00d2d3";
                    }
                    drawCarromBoard();

                    if (carromState.userScore >= 30 || carromState.oppScore >= 30) {
                        completeBattleResult(carromState.userScore >= carromState.oppScore);
                    }
                }, 1000);
            }
        }
    }

    update();
}

// Tic-Tac-Toe Interactive Battle Logic
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttGameActive = true;

function startTicTacToeBattleGame() {
    audio.playClick();
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttGameActive = true;
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('tictactoe-game-screen').classList.add('active');

    const status = document.getElementById('ttt-status');
    if (status) status.textContent = 'Your Turn (X)';

    document.querySelectorAll('.ttt-cell').forEach(cell => {
        cell.textContent = '';
        cell.className = 'ttt-cell';
    });
}

function makeTTTMove(index) {
    if (!tttGameActive || tttBoard[index] !== '') return;

    audio.playClick();
    tttBoard[index] = 'X';
    const cells = document.querySelectorAll('.ttt-cell');
    cells[index].textContent = 'X';
    cells[index].classList.add('x-mark');

    if (checkTTTWin('X')) {
        tttGameActive = false;
        document.getElementById('ttt-status').textContent = '🎉 You Won!';
        setTimeout(() => completeBattleResult(true), 1200);
        return;
    }

    if (!tttBoard.includes('')) {
        tttGameActive = false;
        document.getElementById('ttt-status').textContent = 'Draw Game!';
        setTimeout(() => completeBattleResult(false), 1200);
        return;
    }

    document.getElementById('ttt-status').textContent = 'Bot Thinking... (O)';
    setTimeout(() => {
        if (!tttGameActive) return;
        const emptyIndices = tttBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
        if (emptyIndices.length > 0) {
            const botChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            tttBoard[botChoice] = 'O';
            cells[botChoice].textContent = 'O';
            cells[botChoice].classList.add('o-mark');

            if (checkTTTWin('O')) {
                tttGameActive = false;
                document.getElementById('ttt-status').textContent = 'Bot Won!';
                setTimeout(() => completeBattleResult(false), 1200);
                return;
            }
            document.getElementById('ttt-status').textContent = 'Your Turn (X)';
        }
    }, 600);
}

function checkTTTWin(player) {
    const winCombos = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return winCombos.some(combo => combo.every(idx => tttBoard[idx] === player));
}

function startCarromBattleGame() {
    showToast('⚔️ Carrom Battle Match Started!');
    setTimeout(() => {
        const win = Math.random() > 0.35; // 65% win rate for engaging gameplay
        completeBattleResult(win);
    }, 2000);
}

function startSpinBattleGame() {
    showToast('⚔️ Lucky Spin Battle Wheel Spinning!');
    setTimeout(() => {
        const win = Math.random() > 0.4;
        completeBattleResult(win);
    }, 2000);
}

function claim3BattlesMission() {
    if ((AppState.battlesPlayedToday || 0) < 3) {
        showToast('Complete 3 battles first!');
        return;
    }
    if (AppState.mission3BattlesClaimed) {
        showToast('Already claimed today!');
        return;
    }

    audio.playWin();
    AppState.coins += 20;
    AppState.totalEarned += 20;
    AppState.mission3BattlesClaimed = true;
    addHistoryItem('3 Battles Mission Bonus', '+20', true);
    saveStateToStorage();
    renderAllViews();
    showToast('🎉 Bonus +20 Coins Claimed!');
}

function renderBattleMissions() {
    const bar = document.getElementById('mission-3battles-bar');
    const text = document.getElementById('mission-3battles-text');
    const status = document.getElementById('mission-3battles-status');
    const btn = document.getElementById('btn-claim-mission-3');

    if (!bar) return;

    const count = AppState.battlesPlayedToday || 0;
    const pct = Math.min(100, Math.round((count / 3) * 100));
    bar.style.width = pct + '%';
    if (text) text.textContent = `${Math.min(3, count)} / 3 Battles`;

    if (AppState.mission3BattlesClaimed) {
        if (status) { status.textContent = 'Claimed ✔'; status.style.color = '#2ecc71'; }
        if (btn) { btn.textContent = 'Claimed ✔'; btn.disabled = true; }
    } else if (count >= 3) {
        if (status) { status.textContent = 'Ready to Claim! 🎁'; status.style.color = '#ffc107'; }
        if (btn) { btn.textContent = 'Claim +20 Coins'; btn.disabled = false; }
    } else {
        if (status) { status.textContent = 'In Progress'; status.style.color = '#ffc107'; }
        if (btn) { btn.textContent = 'Claim +20 Coins'; btn.disabled = true; }
    }
}

function renderLeaderboard(customList = null) {
    const listEl = document.getElementById('battle-leaderboard-list');
    if (!listEl) return;

    const renderList = (data) => {
        listEl.innerHTML = '';
        if (!data || data.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; color: var(--text-muted); font-size: 13px; padding: 16px;">No battle rankings yet</div>';
            return;
        }

        data.forEach((player, index) => {
            const rank = index + 1;
            let rankClass = '';
            let rankIcon = `#${rank}`;
            if (rank === 1) { rankClass = 'rank-gold'; rankIcon = '🥇 1'; }
            else if (rank === 2) { rankClass = 'rank-silver'; rankIcon = '🥈 2'; }
            else if (rank === 3) { rankClass = 'rank-bronze'; rankIcon = '🥉 3'; }

            const isUser = AppState.user && player.email === AppState.user.email;

            const div = document.createElement('div');
            div.className = 'leaderboard-item' + (isUser ? ' user-self' : '');
            div.innerHTML = `
                <div class="leaderboard-rank ${rankClass}">${rankIcon}</div>
                <div class="leaderboard-user-info">
                    <div class="leaderboard-name">${player.name || 'Player'} ${isUser ? '(You)' : ''}</div>
                    <div class="leaderboard-stats">${player.battlesWon || 0} Wins | ${player.coinsEarned || 0} Coins</div>
                </div>
            `;
            listEl.appendChild(div);
        });
    };

    if (customList) {
        renderList(customList);
    } else if (typeof DatabaseAPI !== 'undefined') {
        DatabaseAPI.listenLeaderboard((list) => {
            renderList(list);
        });
    }
}
