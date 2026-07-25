/* ==========================================================================
   TASK TODO EARN - FIREBASE REALTIME DATABASE CONFIGURATION & INTEGRATION
   ========================================================================== */

// Your Firebase Project Configuration
// Replace the values below with your Firebase Console Project Settings:
const firebaseConfig = {
    apiKey: "AIzaSyDTvpR4W_gKa4e2iX5ruQc01_721-v5IZk",
    authDomain: "task-todo-earn.firebaseapp.com",
    databaseURL: "https://task-todo-earn-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "task-todo-earn",
    storageBucket: "task-todo-earn.firebasestorage.app",
    messagingSenderId: "437234550210",
    appId: "1:437234550210:web:d73a458e40d351c808c25b",
    measurementId: "G-S4M4C851EP"
};

let db = null;
let isFirebaseConnected = false;

// Initialize Firebase if available
try {
    if (window.firebase) {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();
        isFirebaseConnected = true;
        console.log("🔥 Firebase initialized successfully!");
    }
} catch (e) {
    console.warn("⚠️ Firebase connection pending configuration. Using LocalStorage fallback.", e);
    isFirebaseConnected = false;
}

// Helper DB API for App & Admin Panel
const DatabaseAPI = {
    // Save or Update User in Database
    saveUser: function(userData, callback) {
        if (isFirebaseConnected && db && userData.email) {
            const safeKey = userData.email.replace(/[.#$\[\]]/g, "_");
            db.ref('users/' + safeKey).set(userData).then(() => {
                if (callback) callback(true);
            }).catch(err => {
                console.error("Firebase write error:", err);
                if (callback) callback(false);
            });
        } else {
            localStorage.setItem('todoearn_user', JSON.stringify(userData));
            if (callback) callback(true);
        }
    },

    // Listen to Real-Time User Balance Changes
    listenUserCoins: function(userEmail, callback) {
        if (isFirebaseConnected && db && userEmail) {
            const safeKey = userEmail.replace(/[.#$\[\]]/g, "_");
            db.ref('users/' + safeKey + '/coins').on('value', (snapshot) => {
                const val = snapshot.val();
                if (val !== null && callback) callback(val);
            });
        }
    },

    // Save Payout Request
    createPayout: function(payoutData, callback) {
        if (isFirebaseConnected && db) {
            db.ref('payouts/' + payoutData.id).set(payoutData).then(() => {
                if (callback) callback(true);
            });
        } else {
            let payouts = JSON.parse(localStorage.getItem('rewardzoo_payouts') || '[]');
            payouts.unshift(payoutData);
            localStorage.setItem('rewardzoo_payouts', JSON.stringify(payouts));
            if (callback) callback(true);
        }
    },

    // Admin: Listen to all live payout requests
    listenAllPayouts: function(callback) {
        if (isFirebaseConnected && db) {
            db.ref('payouts').on('value', (snapshot) => {
                const data = snapshot.val();
                const list = data ? Object.values(data) : [];
                if (callback) callback(list);
            });
        } else {
            const list = JSON.parse(localStorage.getItem('rewardzoo_payouts') || '[]');
            if (callback) callback(list);
        }
    },

    // Admin: Update Payout Status (Approve / Reject)
    updatePayoutStatus: function(payoutId, newStatus, userEmail, amount, callback) {
        if (isFirebaseConnected && db) {
            db.ref('payouts/' + payoutId + '/status').set(newStatus).then(() => {
                if (newStatus === 'Rejected' && userEmail) {
                    // Refund coins
                    const safeKey = userEmail.replace(/[.#$\[\]]/g, "_");
                    db.ref('users/' + safeKey + '/coins').transaction((currentCoins) => {
                        return (currentCoins || 0) + amount;
                    });
                }
                if (callback) callback(true);
            });
        } else {
            let payouts = JSON.parse(localStorage.getItem('rewardzoo_payouts') || '[]');
            const index = payouts.findIndex(p => p.id === payoutId);
            if (index !== -1) {
                payouts[index].status = newStatus;
                if (newStatus === 'Rejected') {
                    let coins = parseInt(localStorage.getItem('rewardzoo_coins') || '0', 10);
                    coins += amount;
                    localStorage.setItem('rewardzoo_coins', coins.toString());
                }
                localStorage.setItem('rewardzoo_payouts', JSON.stringify(payouts));
            }
            if (callback) callback(true);
        }
    },

    // Admin: Listen to all registered users
    listenAllUsers: function(callback) {
        if (isFirebaseConnected && db) {
            db.ref('users').on('value', (snapshot) => {
                const data = snapshot.val();
                const list = data ? Object.values(data) : [];
                if (callback) callback(list);
            });
        } else {
            const savedUser = localStorage.getItem('rewardzoo_user');
            const user = savedUser ? JSON.parse(savedUser) : { name: 'DSTechVerse', email: 'DSTechVerse@gmail.com', coins: 50 };
            if (callback) callback([user]);
        }
    },

    // Admin & App: Dynamic Tasks Management
    saveTask: function(taskData, callback) {
        if (isFirebaseConnected && db) {
            const taskId = taskData.id || 'TASK_' + Date.now();
            taskData.id = taskId;
            db.ref('tasks/' + taskId).set(taskData).then(() => {
                if (callback) callback(true);
            }).catch(err => {
                console.error("Task save error:", err);
                if (callback) callback(false);
            });
        } else {
            let tasks = JSON.parse(localStorage.getItem('rewardzoo_tasks') || '[]');
            const idx = tasks.findIndex(t => t.id === taskData.id);
            if (idx !== -1) tasks[idx] = taskData;
            else {
                taskData.id = taskData.id || 'TASK_' + Date.now();
                tasks.push(taskData);
            }
            localStorage.setItem('rewardzoo_tasks', JSON.stringify(tasks));
            if (callback) callback(true);
        }
    },

    deleteTask: function(taskId, callback) {
        if (isFirebaseConnected && db) {
            db.ref('tasks/' + taskId).remove().then(() => {
                if (callback) callback(true);
            });
        } else {
            let tasks = JSON.parse(localStorage.getItem('rewardzoo_tasks') || '[]');
            tasks = tasks.filter(t => t.id !== taskId);
            localStorage.setItem('rewardzoo_tasks', JSON.stringify(tasks));
            if (callback) callback(true);
        }
    },

    listenAllTasks: function(callback) {
        if (isFirebaseConnected && db) {
            db.ref('tasks').on('value', (snapshot) => {
                let data = snapshot.val();
                if (!data) {
                    // Seed default tasks into Firebase
                    const defaultSeed = {
                        'task_watch': { id: 'task_watch', title: 'Watch & Earn', desc: 'Watch short ads for coins', reward: 15, timer: 15, type: 'watch', icon: 'fa-regular fa-circle-play', url: '#' },
                        'task_color': { id: 'task_color', title: 'Color Game', desc: 'Guess the right color', reward: 25, timer: 10, type: 'game_color', icon: 'fa-solid fa-palette', url: '#' },
                        'task_view': { id: 'task_view', title: 'View & Win', desc: 'Visit websites & earn', reward: 10, timer: 15, type: 'view', icon: 'fa-solid fa-globe', url: '#' },
                        'task_social': { id: 'task_social', title: 'Social Tasks', desc: 'Join channels & groups', reward: 30, timer: 10, type: 'social', icon: 'fa-regular fa-thumbs-up', url: '#' }
                    };
                    db.ref('tasks').set(defaultSeed);
                    data = defaultSeed;
                }
                const list = data ? Object.values(data) : [];
                if (callback) callback(list);
            });
        } else {
            let list = JSON.parse(localStorage.getItem('rewardzoo_tasks') || '[]');
            if (list.length === 0) {
                list = [
                    { id: 'task_watch', title: 'Watch & Earn', desc: 'Watch short ads for coins', reward: 15, timer: 15, type: 'watch', icon: 'fa-regular fa-circle-play', url: '#' },
                    { id: 'task_color', title: 'Color Game', desc: 'Guess the right color', reward: 25, timer: 10, type: 'game_color', icon: 'fa-solid fa-palette', url: '#' },
                    { id: 'task_view', title: 'View & Win', desc: 'Visit websites & earn', reward: 10, timer: 15, type: 'view', icon: 'fa-solid fa-globe', url: '#' },
                    { id: 'task_social', title: 'Social Tasks', desc: 'Join channels & groups', reward: 30, timer: 10, type: 'social', icon: 'fa-regular fa-thumbs-up', url: '#' }
                ];
                localStorage.setItem('rewardzoo_tasks', JSON.stringify(list));
            }
            if (callback) callback(list);
        }
    },

    // Admin: Block / Unblock User
    updateUserStatus: function(userEmail, isBlocked, callback) {
        if (isFirebaseConnected && db && userEmail) {
            const safeKey = userEmail.replace(/[.#$\[\]]/g, "_");
            db.ref('users/' + safeKey + '/isBlocked').set(isBlocked).then(() => {
                if (callback) callback(true);
            });
        } else {
            localStorage.setItem('rewardzoo_blocked_' + userEmail, isBlocked.toString());
            if (callback) callback(true);
        }
    },

    // Admin & App: Targeted User Notifications
    saveNotification: function(notifData, callback) {
        if (isFirebaseConnected && db) {
            const notifId = notifData.id || 'NOTIF_' + Date.now();
            notifData.id = notifId;
            notifData.timestamp = notifData.timestamp || Date.now();
            notifData.dateStr = notifData.dateStr || new Date().toLocaleString();
            db.ref('notifications/' + notifId).set(notifData).then(() => {
                if (callback) callback(true);
            }).catch(err => {
                console.error("Notification save error:", err);
                if (callback) callback(false);
            });
        } else {
            let list = JSON.parse(localStorage.getItem('todoearn_notifications') || '[]');
            notifData.id = notifData.id || 'NOTIF_' + Date.now();
            notifData.timestamp = notifData.timestamp || Date.now();
            notifData.dateStr = notifData.dateStr || new Date().toLocaleString();
            const idx = list.findIndex(n => n.id === notifData.id);
            if (idx !== -1) {
                list[idx] = notifData;
            } else {
                list.unshift(notifData);
            }
            localStorage.setItem('todoearn_notifications', JSON.stringify(list));
            if (callback) callback(true);
        }
    },

    sendUserNotification: function(userEmail, notificationObj, callback) {
        const notifData = {
            id: notificationObj.id || 'NOTIF_' + Date.now(),
            target: userEmail,
            title: notificationObj.title,
            message: notificationObj.message,
            timestamp: Date.now(),
            dateStr: new Date().toLocaleString()
        };
        this.saveNotification(notifData, callback);
    },

    deleteNotification: function(notifId, callback) {
        if (isFirebaseConnected && db) {
            db.ref('notifications/' + notifId).remove().then(() => {
                if (callback) callback(true);
            });
        } else {
            let list = JSON.parse(localStorage.getItem('todoearn_notifications') || '[]');
            list = list.filter(n => n.id !== notifId);
            localStorage.setItem('todoearn_notifications', JSON.stringify(list));
            if (callback) callback(true);
        }
    },

    listenAllNotifications: function(callback) {
        if (isFirebaseConnected && db) {
            db.ref('notifications').on('value', (snapshot) => {
                const data = snapshot.val();
                const list = data ? Object.values(data) : [];
                list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                if (callback) callback(list);
            });
        } else {
            const list = JSON.parse(localStorage.getItem('todoearn_notifications') || '[]');
            list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            if (callback) callback(list);
        }
    },

    listenUserNotification: function(userEmail, callback) {
        if (isFirebaseConnected && db && userEmail) {
            db.ref('notifications').on('value', (snapshot) => {
                const data = snapshot.val();
                const list = data ? Object.values(data) : [];
                const userNotifs = list.filter(n => n.target === 'ALL' || n.target === userEmail);
                userNotifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                if (callback) callback(userNotifs);
            });
        } else {
            const list = JSON.parse(localStorage.getItem('todoearn_notifications') || '[]');
            const userNotifs = list.filter(n => n.target === 'ALL' || n.target === userEmail);
            userNotifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            if (callback) callback(userNotifs);
        }
    },

    // Task Completion Audit Logging
    logTaskCompletion: function(logObj, callback) {
        if (isFirebaseConnected && db) {
            const claimId = 'CLAIM_' + Date.now();
            db.ref('task_claims/' + claimId).set(logObj).then(() => {
                if (callback) callback(true);
            });
        } else {
            let logs = JSON.parse(localStorage.getItem('rewardzoo_task_logs') || '[]');
            logs.unshift(logObj);
            localStorage.setItem('rewardzoo_task_logs', JSON.stringify(logs));
            if (callback) callback(true);
        }
    },

    listenTaskCompletions: function(callback) {
        if (isFirebaseConnected && db) {
            db.ref('task_claims').on('value', (snapshot) => {
                const data = snapshot.val();
                const list = data ? Object.values(data) : [];
                if (callback) callback(list);
            });
        } else {
            const list = JSON.parse(localStorage.getItem('rewardzoo_task_logs') || '[]');
            if (callback) callback(list);
        }
    },

    // Battle Stats & Live Leaderboard
    saveBattleStats: function(userEmail, statsObj, callback) {
        if (isFirebaseConnected && db && userEmail) {
            const safeKey = userEmail.replace(/[.#$\[\]]/g, "_");
            db.ref('leaderboard/' + safeKey).set({
                email: userEmail,
                name: statsObj.name || userEmail.split('@')[0],
                battlesWon: statsObj.battlesWon || 0,
                battlesPlayed: statsObj.battlesPlayed || 0,
                coinsEarned: statsObj.coinsEarned || 0,
                updatedAt: Date.now()
            }).then(() => {
                if (callback) callback(true);
            });
        } else {
            let leaderboard = JSON.parse(localStorage.getItem('todoearn_leaderboard') || '[]');
            const idx = leaderboard.findIndex(u => u.email === userEmail);
            const userEntry = {
                email: userEmail,
                name: statsObj.name || userEmail.split('@')[0],
                battlesWon: statsObj.battlesWon || 0,
                battlesPlayed: statsObj.battlesPlayed || 0,
                coinsEarned: statsObj.coinsEarned || 0,
                updatedAt: Date.now()
            };
            if (idx !== -1) leaderboard[idx] = userEntry;
            else leaderboard.push(userEntry);
            localStorage.setItem('todoearn_leaderboard', JSON.stringify(leaderboard));
            if (callback) callback(true);
        }
    },

    listenLeaderboard: function(callback) {
        if (isFirebaseConnected && db) {
            db.ref('leaderboard').on('value', (snapshot) => {
                const data = snapshot.val();
                let list = data ? Object.values(data) : [];
                list.sort((a, b) => (b.battlesWon || 0) - (a.battlesWon || 0) || (b.coinsEarned || 0) - (a.coinsEarned || 0));
                if (callback) callback(list);
            });
        } else {
            let list = JSON.parse(localStorage.getItem('todoearn_leaderboard') || '[]');
            if (list.length === 0) {
                list = [
                    { name: 'ProGamer99', battlesWon: 42, coinsEarned: 2100 },
                    { name: 'CryptoKing', battlesWon: 28, coinsEarned: 1400 },
                    { name: 'DSTechVerse', battlesWon: 15, coinsEarned: 750 },
                    { name: 'StarPlayer', battlesWon: 9, coinsEarned: 450 }
                ];
            }
            list.sort((a, b) => (b.battlesWon || 0) - (a.battlesWon || 0) || (b.coinsEarned || 0) - (a.coinsEarned || 0));
            if (callback) callback(list);
        }
    },

    // Real-Time Global App Controls & Game Active/Disabled Status Listener
    listenAppSettings: function(callback) {
        if (isFirebaseConnected && db) {
            db.ref('app_settings').on('value', (snapshot) => {
                const settings = snapshot.val();
                if (callback) callback(settings);
            });
        } else {
            const settings = JSON.parse(localStorage.getItem('todoearn_app_settings') || 'null');
            if (callback) callback(settings);
        }
    }
};
