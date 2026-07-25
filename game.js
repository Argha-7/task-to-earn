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
    try {
        loadStateFromStorage();
        initTelegramUser();
        setupEventListeners();
        setupStorageSyncListener();

        const initialSettings = JSON.parse(localStorage.getItem('todoearn_app_settings') || 'null');
        if (initialSettings) applyAppSettings(initialSettings);

        showMainInterface();
        renderAllViews();
    } catch (err) {
        console.error('App init warning:', err);
    }

    // Splash Screen Transition
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.remove('active');
        
        showMainInterface();
        navigateToTab('home-screen');
    }, 1200);
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

        DatabaseAPI.listenAppSettings((settings) => {
            applyAppSettings(settings);
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

// Dynamic Tasks Rendering & Task Handlers
function renderDynamicTasks(tasks) {
    const container = document.getElementById('dynamic-tasks-container');
    if (!container) return;

    container.innerHTML = '';
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:13px; padding:16px;">No active tasks right now</div>';
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.onclick = () => simulateTaskReward(task);

        card.innerHTML = `
            <div class="task-icon-box icon-purple">
                <i class="${task.icon || 'fa-solid fa-gift'}"></i>
            </div>
            <div class="task-info">
                <div class="task-name">${task.title}</div>
                <div class="task-desc">${task.desc || 'Complete task to earn rewards'}</div>
            </div>
            <div class="task-reward-tag">
                +${task.reward} Coins <i class="fa-solid fa-coins"></i>
            </div>
        `;
        container.appendChild(card);
    });
}

function applyAppSettings(settings) {
    if (!settings) return;

    // Carrom Control
    const carromCard = document.getElementById('card-battle-carrom');
    const carromDesc = document.getElementById('desc-battle-carrom');
    if (carromCard) {
        if (settings.carromStatus === 'disabled') {
            carromCard.style.display = 'none';
        } else {
            carromCard.style.display = 'flex';
        }
    }
    if (carromDesc && carromCard) {
        carromDesc.textContent = `Entry: ${settings.carromFee || 20} Coins | Win: ${settings.carromWin || 50} Coins`;
        carromCard.setAttribute('onclick', `startBattle('carrom', ${settings.carromFee || 20}, ${settings.carromWin || 50})`);
    }

    // Tic-Tac-Toe Control
    const tttCard = document.getElementById('card-battle-tictactoe');
    const tttDesc = document.getElementById('desc-battle-tictactoe');
    if (tttCard) {
        if (settings.tttStatus === 'disabled') {
            tttCard.style.display = 'none';
        } else {
            tttCard.style.display = 'flex';
        }
    }
    if (tttDesc && tttCard) {
        tttDesc.textContent = `Entry: ${settings.tttFee || 10} Coins | Win: ${settings.tttWin || 25} Coins`;
        tttCard.setAttribute('onclick', `startBattle('tictactoe', ${settings.tttFee || 10}, ${settings.tttWin || 25})`);
    }

    // Color Game Control
    const colorCard = document.getElementById('card-battle-color');
    const colorDesc = document.getElementById('desc-battle-color');
    if (colorCard) {
        if (settings.colorStatus === 'disabled') {
            colorCard.style.display = 'none';
        } else {
            colorCard.style.display = 'flex';
        }
    }
    if (colorDesc && colorCard) {
        colorDesc.textContent = `Entry: ${settings.colorFee || 15} Coins | Win: ${settings.colorWin || 35} Coins`;
        colorCard.setAttribute('onclick', `startBattle('color', ${settings.colorFee || 15}, ${settings.colorWin || 35})`);
    }

    // Lucky Spin Control
    const spinCard = document.getElementById('card-battle-spin');
    const spinDesc = document.getElementById('desc-battle-spin');
    if (spinCard) {
        if (settings.spinStatus === 'disabled') {
            spinCard.style.display = 'none';
        } else {
            spinCard.style.display = 'flex';
        }
    }
    if (spinDesc && spinCard) {
        spinDesc.textContent = `Entry: ${settings.spinFee || 25} Coins | Win: ${settings.spinWin || 60} Coins`;
        spinCard.setAttribute('onclick', `startBattle('spin', ${settings.spinFee || 25}, ${settings.spinWin || 60})`);
}

function showTelegramRewardedAd() {
    audio.playClick();
    if (window.Adsgram) {
        // Adsgram Block ID - Replace 'block-1234' with your real block ID from Adsgram dashboard
        const AdController = window.Adsgram.init({ blockId: "block-1234" });
        
        showToast("🎬 Loading Telegram Video Ad...");
        AdController.show().then((result) => {
            audio.playCoin();
            showToast("🎉 Video Ad Finished! +50 Coins Awarded!");
            if (AppState.user) {
                const newCoins = (AppState.user.coins || 0) + 50;
                if (typeof DatabaseAPI !== 'undefined') {
                    DatabaseAPI.saveUserCoins(AppState.user.email, newCoins, () => {
                        AppState.user.coins = newCoins;
                        renderAllViews();
                    });
                } else {
                    AppState.user.coins = newCoins;
                    renderAllViews();
                }
            }
        }).catch((error) => {
            console.warn("Adsgram Ad status:", error);
            showToast("ℹ️ Demo Mode: Ad simulated (+50 Coins)");
            if (AppState.user) {
                const newCoins = (AppState.user.coins || 0) + 50;
                if (typeof DatabaseAPI !== 'undefined') {
                    DatabaseAPI.saveUserCoins(AppState.user.email, newCoins, () => {
                        AppState.user.coins = newCoins;
                        renderAllViews();
                    });
                }
            }
        });
    } else {
        showToast("📺 Demo Ad Simulated: +50 Coins Awarded!");
        if (AppState.user) {
            const newCoins = (AppState.user.coins || 0) + 50;
            if (typeof DatabaseAPI !== 'undefined') {
                DatabaseAPI.saveUserCoins(AppState.user.email, newCoins, () => {
                    AppState.user.coins = newCoins;
                    renderAllViews();
                });
            }
        }
    }
}

function simulateTaskReward(task) {
    if (!task) return;
    audio.playClick();

    if (task.url && task.url !== '#') {
        try { window.open(task.url, '_blank'); } catch(e) {}
    }

    const modal = document.getElementById('task-modal');
    if (!modal) {
        AppState.coins += (task.reward || 10);
        AppState.totalEarned += (task.reward || 10);
        addHistoryItem(task.title || 'Task Completed', `+${task.reward || 10}`, true);
        saveStateToStorage();
        renderAllViews();
        showToast(`🎉 Claimed +${task.reward || 10} Coins!`);
        return;
    }

    const titleEl = document.getElementById('modal-task-title');
    const descEl = document.getElementById('modal-task-desc');
    if (titleEl) titleEl.textContent = task.title || 'Task Simulation';
    if (descEl) descEl.textContent = task.desc || 'Please wait for the timer to finish.';
    
    let timerVal = task.timer || 10;
    const timerBox = document.getElementById('modal-timer-box');
    const claimBtn = document.getElementById('btn-claim-task-reward');

    if (timerBox) timerBox.textContent = `${timerVal}s`;
    if (claimBtn) {
        claimBtn.disabled = true;
        claimBtn.textContent = 'Please Wait...';
    }

    modal.classList.add('active');
    AppState.activeTask = task;

    const interval = setInterval(() => {
        timerVal--;
        if (timerBox) timerBox.textContent = `${timerVal}s`;

        if (timerVal <= 0) {
            clearInterval(interval);
            if (timerBox) timerBox.textContent = 'Ready!';
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.textContent = `Claim +${task.reward} Coins`;
            }
        }
    }, 1000);
}

function completeTaskReward() {
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.remove('active');

    const task = AppState.activeTask;
    const reward = task ? (task.reward || 15) : 15;

    audio.playWin();
    AppState.coins += reward;
    AppState.totalEarned += reward;
    addHistoryItem(task ? task.title : 'Task Completed', `+${reward}`, true);
    saveStateToStorage();
    renderAllViews();
    showToast(`🎉 Task Completed! +${reward} Coins Earned!`);
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

// Render All UI Elements Safely
function renderAllViews() {
    if (AppState.user) {
        const uName = document.getElementById('display-user-name');
        if (uName) uName.textContent = AppState.user.name;
        const pName = document.getElementById('profile-name-val');
        if (pName) pName.textContent = AppState.user.name;
        const pEmail = document.getElementById('profile-email-val');
        if (pEmail) pEmail.textContent = AppState.user.email;
    }

    const uCoin = document.getElementById('user-coin-balance');
    if (uCoin) uCoin.textContent = AppState.coins;

    const wBal = document.getElementById('wallet-balance-val');
    if (wBal) wBal.textContent = AppState.coins;

    const pEarned = document.getElementById('profile-total-earned');
    if (pEarned) pEarned.textContent = AppState.totalEarned;

    const invCode = document.getElementById('invite-code-val');
    if (invCode) invCode.textContent = AppState.inviteCode || 'TODO123';

    const refCount = document.getElementById('refer-count');
    if (refCount) refCount.textContent = AppState.invitedCount || 0;

    const refEarned = document.getElementById('refer-earned');
    if (refEarned) refEarned.textContent = AppState.inviteEarned || 0;

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

// Tic-Tac-Toe Interactive Battle Logic
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttGameActive = true;

function startTicTacToeBattleGame() {
    audio.playClick();
    showMainInterface();
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

// Proper Interactive 2D Carrom Physics Engine
let carromState = {
    canvas: null,
    ctx: null,
    width: 320,
    height: 320,
    striker: { x: 160, y: 260, vx: 0, vy: 0, r: 12, isMoving: false },
    pieces: [],
    pockets: [
        { x: 25, y: 25, r: 16 },
        { x: 295, y: 25, r: 16 },
        { x: 25, y: 295, r: 16 },
        { x: 295, y: 295, r: 16 }
    ],
    playerScore: 0,
    botScore: 0,
    targetScore: 3,
    isPlayerTurn: true,
    lastTurnScored: false,
    aimAngle: -Math.PI / 2,
    gameActive: false,
    animFrame: null
};

function startCarromBattleGame() {
    audio.playClick();
    showMainInterface();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const carromScreen = document.getElementById('carrom-game-screen');
    if (carromScreen) carromScreen.classList.add('active');

    initCarromBoard();
}

function autoScrollToCarromTurn() {
    setTimeout(() => {
        const turnEl = document.getElementById('carrom-turn-status');
        if (turnEl) {
            turnEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 150);
}

function initCarromBoard() {
    const canvas = document.getElementById('carromCanvas');
    if (!canvas) return;

    carromState.canvas = canvas;
    carromState.ctx = canvas.getContext('2d');
    carromState.playerScore = 0;
    carromState.botScore = 0;
    carromState.isPlayerTurn = true;
    carromState.lastTurnScored = false;
    carromState.gameActive = true;
    carromState.aimAngle = -Math.PI / 2;

    const pScoreEl = document.getElementById('carrom-player-score');
    if (pScoreEl) pScoreEl.textContent = '0';
    const bScoreEl = document.getElementById('carrom-bot-score');
    if (bScoreEl) bScoreEl.textContent = '0';

    const statusEl = document.getElementById('carrom-turn-status');
    if (statusEl) {
        statusEl.textContent = '🎯 YOUR TURN';
        statusEl.style.color = '#ffffff';
        statusEl.style.background = 'rgba(224,59,255,0.3)';
    }

    const cx = 160, cy = 140;
    carromState.pieces = [
        // Red Queen Piece
        { x: cx, y: cy, vx: 0, vy: 0, r: 10, color: '#e74c3c', type: 'red', val: 3 },
        // White Pieces (Player Target)
        { x: cx - 18, y: cy, vx: 0, vy: 0, r: 9, color: '#ffffff', type: 'white', val: 1 },
        { x: cx + 18, y: cy, vx: 0, vy: 0, r: 9, color: '#ffffff', type: 'white', val: 1 },
        { x: cx, y: cy - 18, vx: 0, vy: 0, r: 9, color: '#ffffff', type: 'white', val: 1 },
        { x: cx, y: cy + 18, vx: 0, vy: 0, r: 9, color: '#ffffff', type: 'white', val: 1 },
        // Black Pieces (Opponent/Bot Target)
        { x: cx - 13, y: cy - 13, vx: 0, vy: 0, r: 9, color: '#2c3e50', type: 'black', val: 1 },
        { x: cx + 13, y: cy + 13, vx: 0, vy: 0, r: 9, color: '#2c3e50', type: 'black', val: 1 },
        { x: cx + 13, y: cy - 13, vx: 0, vy: 0, r: 9, color: '#2c3e50', type: 'black', val: 1 },
        { x: cx - 13, y: cy + 13, vx: 0, vy: 0, r: 9, color: '#2c3e50', type: 'black', val: 1 }
    ];

    resetStrikerPosition();
    setupCarromCanvasEvents();
    drawCarromFrame();
    autoScrollToCarromTurn();
}

function resetStrikerPosition() {
    const posSlider = document.getElementById('carrom-slider-pos');
    const posX = posSlider ? parseInt(posSlider.value, 10) : 160;
    carromState.striker = {
        x: posX,
        y: 260,
        vx: 0,
        vy: 0,
        r: 12,
        isMoving: false
    };
}

function updateStrikerSliderPos(val) {
    if (carromState.striker.isMoving) return;
    carromState.striker.x = parseInt(val, 10);
    drawCarromFrame();
}

function updateStrikerAimAngle(degVal) {
    if (carromState.striker.isMoving) return;
    const rad = (parseInt(degVal, 10) * Math.PI) / 180;
    carromState.aimAngle = rad;
    drawCarromFrame();
}

let isDraggingStriker = false;
let dragTouchPos = { x: 160, y: 260 };

function setupCarromCanvasEvents() {
    const canvas = carromState.canvas;
    if (!canvas || canvas.dataset.hasListeners) return;

    canvas.dataset.hasListeners = 'true';

    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        if (clientX === null || clientY === null) return null;
        return {
            x: (clientX - rect.left) * (320 / rect.width),
            y: (clientY - rect.top) * (320 / rect.height)
        };
    }

    const startAim = (e) => {
        if (e.cancelable) e.preventDefault();
        if (!carromState.gameActive || carromState.striker.isMoving || !carromState.isPlayerTurn) return;
        const pos = getCanvasCoords(e);
        if (!pos) return;

        isDraggingStriker = true;
        dragTouchPos = pos;

        const dx = pos.x - carromState.striker.x;
        const dy = pos.y - carromState.striker.y;

        carromState.aimAngle = Math.atan2(dy, dx);
        drawCarromFrame();
    };

    const moveAim = (e) => {
        if (e.cancelable) e.preventDefault();
        if (!isDraggingStriker || carromState.striker.isMoving) return;
        const pos = getCanvasCoords(e);
        if (!pos) return;

        dragTouchPos = pos;
        const dx = pos.x - carromState.striker.x;
        const dy = pos.y - carromState.striker.y;

        carromState.aimAngle = Math.atan2(dy, dx);

        const pullDist = Math.hypot(dx, dy);
        const calcPower = Math.min(28, Math.max(10, Math.round(pullDist / 4)));
        const powerSlider = document.getElementById('carrom-slider-power');
        const powerVal = document.getElementById('carrom-power-val');
        if (powerSlider) powerSlider.value = calcPower;
        if (powerVal) powerVal.textContent = calcPower;

        drawCarromFrame();
    };

    const endAim = (e) => {
        if (isDraggingStriker && !carromState.striker.isMoving) {
            isDraggingStriker = false;
            const pullDist = Math.hypot(dragTouchPos.x - carromState.striker.x, dragTouchPos.y - carromState.striker.y);
            if (pullDist > 12) {
                shootCarromStriker();
            }
        }
    };

    canvas.addEventListener('mousedown', startAim);
    canvas.addEventListener('mousemove', moveAim);
    window.addEventListener('mouseup', endAim);

    canvas.addEventListener('touchstart', startAim, { passive: false });
    canvas.addEventListener('touchmove', moveAim, { passive: false });
    window.addEventListener('touchend', endAim);
}

function drawCarromFrame() {
    const ctx = carromState.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, 320, 320);

    // 1. Board 3D Mahogany Wooden Frame
    const woodGrad = ctx.createLinearGradient(0, 0, 320, 320);
    woodGrad.addColorStop(0, '#4a2c13');
    woodGrad.addColorStop(0.5, '#2e1908');
    woodGrad.addColorStop(1, '#4a2c13');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, 320, 320);

    // Inner Playing Field (Polished Wood Surface)
    const boardGrad = ctx.createRadialGradient(160, 160, 20, 160, 160, 180);
    boardGrad.addColorStop(0, '#2d1c0e');
    boardGrad.addColorStop(1, '#1b0f06');
    ctx.fillStyle = boardGrad;
    ctx.fillRect(16, 16, 288, 288);
    ctx.strokeStyle = '#6e4520';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 288, 288);

    // 2. Draw 4 Corner Pockets with 3D Shadow Net
    carromState.pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2);
        ctx.fillStyle = '#7a542b';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = '#060302';
        ctx.fill();
        ctx.strokeStyle = '#1a0d04';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // 3. Center Circle & Baselines
    ctx.beginPath();
    ctx.arc(160, 140, 32, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(160, 140, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
    ctx.fill();

    // Baseline Line
    ctx.beginPath();
    ctx.moveTo(40, 260);
    ctx.lineTo(280, 260);
    ctx.strokeStyle = 'rgba(224, 59, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Foul Circles at Baseline Ends
    [40, 280].forEach(bx => {
        ctx.beginPath();
        ctx.arc(bx, 260, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(224, 59, 255, 0.2)';
        ctx.strokeStyle = 'rgba(224, 59, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
    });

    // 4. Draw Carrom Pieces with 3D Shading
    carromState.pieces.forEach(p => {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        if (p.type === 'white') {
            const grad = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, p.r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, '#d0d0d5');
            ctx.fillStyle = grad;
        } else if (p.type === 'black') {
            const grad = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, p.r);
            grad.addColorStop(0, '#3a4a5a');
            grad.addColorStop(1, '#111822');
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, p.r);
            grad.addColorStop(0, '#ff5252');
            grad.addColorStop(1, '#b71c1c');
            ctx.fillStyle = grad;
        }

        ctx.fill();
        ctx.strokeStyle = '#050505';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    });

    // 5. Draw 3D Metallic Golden Striker
    const s = carromState.striker;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 193, 7, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    const strikerGrad = ctx.createRadialGradient(s.x - 4, s.y - 4, 3, s.x, s.y, s.r);
    strikerGrad.addColorStop(0, '#fff3b0');
    strikerGrad.addColorStop(0.5, '#ffc107');
    strikerGrad.addColorStop(1, '#b78103');
    ctx.fillStyle = strikerGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 6. Draw Aim Guidelines (Forward Trajectory Arrow + Backward Slingshot Line) 🎯
    if (!s.isMoving && carromState.gameActive) {
        const aimLen = 75;
        const targetX = s.x + Math.cos(carromState.aimAngle) * aimLen;
        const targetY = s.y + Math.sin(carromState.aimAngle) * aimLen;

        // Forward Aim Guideline Line
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = '#e03bff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sharp Arrowhead Pointer 🎯
        const headLen = 14;
        const angle = carromState.aimAngle;
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - headLen * Math.cos(angle - Math.PI / 6), targetY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(targetX - headLen * Math.cos(angle + Math.PI / 6), targetY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = '#e03bff';
        ctx.fill();

        // Backward Slingshot Pull Line (When dragging touch)
        if (isDraggingStriker) {
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(dragTouchPos.x, dragTouchPos.y);
            ctx.strokeStyle = '#ff9f43';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(dragTouchPos.x, dragTouchPos.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ff9f43';
            ctx.fill();
        }
    }
}

function shootCarromStriker() {
    if (!carromState.canvas || !carromState.pieces || carromState.pieces.length === 0) {
        initCarromBoard();
    }

    carromState.gameActive = true;
    if (carromState.striker.isMoving) return;

    carromState.lastTurnScored = false; // Reset turn scored flag on new shot!
    audio.playClick();
    const powerSlider = document.getElementById('carrom-slider-power');
    const power = powerSlider ? parseInt(powerSlider.value, 10) : 16;

    if (!carromState.aimAngle || isNaN(carromState.aimAngle)) {
        carromState.aimAngle = -Math.PI / 2;
    }

    carromState.striker.vx = Math.cos(carromState.aimAngle) * power;
    carromState.striker.vy = Math.sin(carromState.aimAngle) * power;
    carromState.striker.isMoving = true;

    runCarromPhysicsLoop();
}

function runCarromPhysicsLoop() {
    cancelAnimationFrame(carromState.animFrame);

    let isMoving = false;

    // 1. Striker Physics & Border Bounce
    const s = carromState.striker;
    if (Math.abs(s.vx) > 0.08 || Math.abs(s.vy) > 0.08) {
        isMoving = true;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.97;
        s.vy *= 0.97;

        if (s.x - s.r < 18) { s.x = 18 + s.r; s.vx *= -0.85; }
        if (s.x + s.r > 302) { s.x = 302 - s.r; s.vx *= -0.85; }
        if (s.y - s.r < 18) { s.y = 18 + s.r; s.vy *= -0.85; }
        if (s.y + s.r > 302) { s.y = 302 - s.r; s.vy *= -0.85; }

        carromState.pockets.forEach(p => {
            const dist = Math.hypot(s.x - p.x, s.y - p.y);
            if (dist < p.r) {
                s.vx = 0; s.vy = 0;
                resetStrikerPosition();
                audio.triggerHaptic('error');
                showToast('Foul! Striker pocketed!');
            }
        });
    } else {
        s.vx = 0; s.vy = 0;
        s.isMoving = false;
    }

    // 2. Move Carrom Pieces & Apply Friction + Check Pockets
    for (let i = carromState.pieces.length - 1; i >= 0; i--) {
        const p = carromState.pieces[i];
        if (Math.abs(p.vx) > 0.08 || Math.abs(p.vy) > 0.08) {
            isMoving = true;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;

            // Border Bounce
            if (p.x - p.r < 18) { p.x = 18 + p.r; p.vx *= -0.85; }
            if (p.x + p.r > 302) { p.x = 302 - p.r; p.vx *= -0.85; }
            if (p.y - p.r < 18) { p.y = 18 + p.r; p.vy *= -0.85; }
            if (p.y + p.r > 302) { p.y = 302 - p.r; p.vy *= -0.85; }

            // Pocketing Check
            let pocketed = false;
            carromState.pockets.forEach(pkt => {
                const dist = Math.hypot(p.x - pkt.x, p.y - pkt.y);
                if (dist < pkt.r + 2) {
                    pocketed = true;
                    audio.playCoin();
                    if (p.type === 'white' || p.type === 'red') {
                        carromState.playerScore += p.val;
                        if (carromState.isPlayerTurn) carromState.lastTurnScored = true;
                        const pScoreEl = document.getElementById('carrom-player-score');
                        if (pScoreEl) pScoreEl.textContent = carromState.playerScore;
                        showToast(`🎉 Pocketed ${p.type.toUpperCase()} piece! +${p.val} Score`);
                    } else {
                        carromState.botScore += p.val;
                        if (!carromState.isPlayerTurn) carromState.lastTurnScored = true;
                        const bScoreEl = document.getElementById('carrom-bot-score');
                        if (bScoreEl) bScoreEl.textContent = carromState.botScore;
                        showToast('Black piece pocketed for Bot!');
                    }
                }
            });

            if (pocketed) {
                carromState.pieces.splice(i, 1);
                continue;
            }
        } else {
            p.vx = 0; p.vy = 0;
        }
    }

    // 3. Collision Check: Striker <-> ALL Pieces (Stationary & Moving!)
    carromState.pieces.forEach(p => {
        const dx = p.x - s.x;
        const dy = p.y - s.y;
        const dist = Math.hypot(dx, dy);
        const minDist = s.r + p.r;

        if (dist < minDist && dist > 0) {
            isMoving = true;
            const angle = Math.atan2(dy, dx);
            const speed = Math.hypot(s.vx, s.vy);

            // Transfer velocity to piece
            p.vx = Math.cos(angle) * Math.max(speed, 8) * 0.85;
            p.vy = Math.sin(angle) * Math.max(speed, 8) * 0.85;

            // Bounce striker back
            s.vx *= -0.35;
            s.vy *= -0.35;

            // Push piece out of overlap to prevent sticking
            const overlap = minDist - dist;
            p.x += Math.cos(angle) * overlap;
            p.y += Math.sin(angle) * overlap;

            audio.playClick();
        }
    });

    // 4. Collision Check: Piece <-> Piece
    for (let i = 0; i < carromState.pieces.length; i++) {
        for (let j = i + 1; j < carromState.pieces.length; j++) {
            const p1 = carromState.pieces[i];
            const p2 = carromState.pieces[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = p1.r + p2.r;

            if (dist < minDist && dist > 0) {
                isMoving = true;
                const angle = Math.atan2(dy, dx);
                const p1Speed = Math.hypot(p1.vx, p1.vy);
                const p2Speed = Math.hypot(p2.vx, p2.vy);
                const maxSpeed = Math.max(p1Speed, p2Speed, 6);

                p2.vx = Math.cos(angle) * maxSpeed * 0.75;
                p2.vy = Math.sin(angle) * maxSpeed * 0.75;
                p1.vx = -Math.cos(angle) * maxSpeed * 0.4;
                p1.vy = -Math.sin(angle) * maxSpeed * 0.4;

                const overlap = minDist - dist;
                p2.x += Math.cos(angle) * overlap * 0.5;
                p2.y += Math.sin(angle) * overlap * 0.5;
                p1.x -= Math.cos(angle) * overlap * 0.5;
                p1.y -= Math.sin(angle) * overlap * 0.5;
            }
        }
    }

    drawCarromFrame();

    if (isMoving) {
        carromState.animFrame = requestAnimationFrame(runCarromPhysicsLoop);
    } else {
        checkCarromWinCondition();
    }
}

function checkCarromWinCondition() {
    if (!carromState.gameActive) return;

    if (carromState.playerScore >= carromState.targetScore) {
        carromState.gameActive = false;
        showToast('🎉 Carrom Victory! Reached Target Score!');
        setTimeout(() => completeBattleResult(true), 1200);
    } else if (carromState.botScore >= carromState.targetScore) {
        carromState.gameActive = false;
        showToast('💔 Defeat! Bot pocketed target score!');
        setTimeout(() => completeBattleResult(false), 1200);
    } else if (carromState.pieces.filter(p => p.type === 'white' || p.type === 'red').length === 0) {
        carromState.gameActive = false;
        completeBattleResult(carromState.playerScore > carromState.botScore);
    } else {
        resetStrikerPosition();
        drawCarromFrame();

        // If player scored, give Extra Turn! Otherwise trigger Bot turn
        if (carromState.isPlayerTurn) {
            if (carromState.lastTurnScored) {
                const turnEl = document.getElementById('carrom-turn-status');
                if (turnEl) {
                    turnEl.textContent = '🔥 EXTRA TURN!';
                    turnEl.style.color = '#00d2d3';
                }
            } else {
                triggerCarromBotShot();
            }
        } else {
            if (carromState.lastTurnScored) {
                triggerCarromBotShot(); // Bot scored, bot gets another turn!
            } else {
                carromState.isPlayerTurn = true;
                const turnEl = document.getElementById('carrom-turn-status');
                if (turnEl) {
                    turnEl.textContent = '🎯 YOUR TURN';
                    turnEl.style.color = '#ffffff';
                    turnEl.style.background = 'rgba(224,59,255,0.3)';
                }
                autoScrollToCarromTurn();
            }
        }
    }
}

function triggerCarromBotShot() {
    if (!carromState.gameActive || carromState.striker.isMoving) return;

    carromState.isPlayerTurn = false;
    carromState.lastTurnScored = false;

    const turnEl = document.getElementById('carrom-turn-status');
    if (turnEl) {
        turnEl.textContent = '🤖 BOT THINKING...';
        turnEl.style.color = '#ff9f43';
        turnEl.style.background = 'rgba(255,159,67,0.2)';
    }
    autoScrollToCarromTurn();

    setTimeout(() => {
        if (!carromState.gameActive) return;

        const targetPieces = carromState.pieces.filter(p => p.type === 'black' || p.type === 'red');
        const target = targetPieces.length > 0 ? targetPieces[Math.floor(Math.random() * targetPieces.length)] : carromState.pieces[0];

        if (target) {
            const angle = Math.atan2(target.y - carromState.striker.y, target.x - carromState.striker.x);
            carromState.aimAngle = angle;
            const power = Math.floor(12 + Math.random() * 8);

            carromState.striker.vx = Math.cos(angle) * power;
            carromState.striker.vy = Math.sin(angle) * power;
            carromState.striker.isMoving = true;

            audio.playClick();
            runCarromPhysicsLoop();
        }
    }, 1000);
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
