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

    // Ensure main interface header & bottom navigation bar are always visible
    showMainInterface();
    renderAllViews();

    // Splash Screen Transition
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.remove('active');
        
        showMainInterface();
        navigateToTab('home-screen');
    }, 1500);
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

// Interactive Carrom Board Mini-Game Engine
let carromState = {
    userScore: 0,
    oppScore: 0,
    pucks: [],
    striker: { x: 150, y: 250, radius: 12, vx: 0, vy: 0 }
};

function startCarromBattleGame() {
    audio.playClick();
    carromState.userScore = 0;
    carromState.oppScore = 0;
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const carromScreen = document.getElementById('carrom-game-screen');
    if (carromScreen) carromScreen.classList.add('active');

    const uScore = document.getElementById('carrom-user-score');
    const oScore = document.getElementById('carrom-opp-score');
    if (uScore) uScore.textContent = '0';
    if (oScore) oScore.textContent = '0';

    initCarromBoard();
}

function initCarromBoard() {
    const canvas = document.getElementById('carrom-canvas');
    if (!canvas) return;
    
    carromState.pucks = [
        { x: 150, y: 150, radius: 10, color: '#ff3d71', pts: 30, type: 'queen', pocketed: false },
        { x: 135, y: 140, radius: 9, color: '#ffffff', pts: 10, type: 'white', pocketed: false },
        { x: 165, y: 140, radius: 9, color: '#ffffff', pts: 10, type: 'white', pocketed: false },
        { x: 135, y: 160, radius: 9, color: '#111122', pts: 5, type: 'black', pocketed: false },
        { x: 165, y: 160, radius: 9, color: '#111122', pts: 5, type: 'black', pocketed: false },
        { x: 150, y: 130, radius: 9, color: '#ffffff', pts: 10, type: 'white', pocketed: false },
        { x: 150, y: 170, radius: 9, color: '#111122', pts: 5, type: 'black', pocketed: false }
    ];

    carromState.striker = { x: 150, y: 250, radius: 13, vx: 0, vy: 0 };
    drawCarromBoard();
}

function drawCarromBoard() {
    const canvas = document.getElementById('carrom-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#e4c49f';
    ctx.fillRect(0, 0, 300, 300);

    const pockets = [{x: 20, y: 20}, {x: 280, y: 20}, {x: 20, y: 280}, {x: 280, y: 280}];
    ctx.fillStyle = '#111111';
    pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(150, 150, 35, 0, Math.PI * 2);
    ctx.stroke();

    carromState.pucks.forEach(puck => {
        if (!puck.pocketed) {
            ctx.fillStyle = puck.color;
            ctx.beginPath();
            ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });

    const st = carromState.striker;
    ctx.fillStyle = '#e03bff';
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function strikeCarromPuck() {
    audio.playClick();
    const st = carromState.striker;
    if (st.vx !== 0 || st.vy !== 0) return;

    const angle = (Math.random() * 0.8 - 0.4) - Math.PI / 2;
    const speed = 11 + Math.random() * 5;
    st.vx = Math.cos(angle) * speed;
    st.vy = Math.sin(angle) * speed;

    runCarromPhysics();
}

function runCarromPhysics() {
    const canvas = document.getElementById('carrom-canvas');
    if (!canvas) return;

    function update() {
        const st = carromState.striker;
        
        st.x += st.vx;
        st.y += st.vy;
        st.vx *= 0.96;
        st.vy *= 0.96;

        if (st.x - st.radius < 10 || st.x + st.radius > 290) st.vx *= -1;
        if (st.y - st.radius < 10 || st.y + st.radius > 290) st.vy *= -1;

        carromState.pucks.forEach(p => {
            if (p.pocketed) return;
            const dx = p.x - st.x;
            const dy = p.y - st.y;
            const dist = Math.hypot(dx, dy);
            if (dist < st.radius + p.radius) {
                audio.playClick();
                p.x += st.vx * 0.7;
                p.y += st.vy * 0.7;
                
                const pockets = [{x: 20, y: 20}, {x: 280, y: 20}, {x: 20, y: 280}, {x: 280, y: 280}];
                pockets.forEach(pkt => {
                    if (Math.hypot(p.x - pkt.x, p.y - pkt.y) < 24) {
                        p.pocketed = true;
                        carromState.userScore += p.pts;
                        audio.playCoin();
                        const uVal = document.getElementById('carrom-user-score');
                        if (uVal) uVal.textContent = carromState.userScore;
                    }
                });
            }
        });

        drawCarromBoard();

        if (Math.hypot(st.vx, st.vy) > 0.2) {
            requestAnimationFrame(update);
        } else {
            st.vx = 0;
            st.vy = 0;
            st.x = 150;
            st.y = 250;
            drawCarromBoard();

            setTimeout(() => {
                carromState.oppScore += Math.floor(Math.random() * 12);
                const oVal = document.getElementById('carrom-opp-score');
                if (oVal) oVal.textContent = carromState.oppScore;

                if (carromState.userScore >= 25 || carromState.oppScore >= 25 || carromState.pucks.every(p => p.pocketed)) {
                    completeBattleResult(carromState.userScore >= carromState.oppScore);
                }
            }, 500);
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
