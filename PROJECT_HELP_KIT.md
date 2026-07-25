# 🛠️ Task ToDo Earn - Complete Project Help Kit & Architectural Guide

> **Project Name:** Task ToDo Earn (Telegram Mini App & Web Application)  
> **Repository:** `https://github.com/Argha-7/task-to-earn.git`  
> **Last Updated:** 2026-07-25  

---

## 📁 1. Project Directory & File Map

| File Path | Description |
| :--- | :--- |
| [`index.html`](file:///c:/Users/Argha/Downloads/To%20do%20Games/index.html) | Main User Application Interface (Telegram Mini App container, Screens, Modals, Bottom Navigation) |
| [`styles.css`](file:///c:/Users/Argha/Downloads/To%20do%20Games/styles.css) | Core Design System, HSL Color Palettes, Responsive Flexbox Layouts, Animations & Modals |
| [`game.js`](file:///c:/Users/Argha/Downloads/To%20do%20Games/game.js) | App State Engine, Matchmaking, Mini-Games (Carrom & Tic-Tac-Toe), Audio Synth, Telegram Ads Hook |
| [`admin.html`](file:///c:/Users/Argha/Downloads/To%20do%20Games/admin.html) | Admin Management Dashboard (Tasks, Notifications, App Controls, Payout Approvals, User List) |
| [`admin.js`](file:///c:/Users/Argha/Downloads/To%20do%20Games/admin.js) | Admin State Engine, Real-Time Firebase Sync, Notification CRUD, Arena Fee & Game Active Toggles |
| [`firebase-config.js`](file:///c:/Users/Argha/Downloads/To%20do%20Games/firebase-config.js) | Firebase Realtime Database API & LocalStorage fallback synchronization layer |

---

## ⚙️ 2. Core Features & Architectural Modules

### 2.1. Home Dashboard & Dynamic Reward Tasks
- **Home Screen (`#home-screen`):** Only displays Daily Check-in (+20 Coins) and **Dynamic Reward Tasks** managed dynamically from the Admin Panel.
- Static featured cards have been removed from Home as per user preference.

### 2.2. Battle Arena, Missions & Live Leaderboard
- **Battle Tab (`#battle-screen`):**
  - **Daily Battle Mission Card:** Complete 3 battles daily to claim +20 Bonus Coins.
  - **Live Leaderboard:** Real-time top player rankings synced with Firebase (`/leaderboard`).
  - **Battle Games:**
    1. 🏆 **Carrom Board Arena:** Interactive 2D Canvas Carrom game (`#carrom-game-screen`). Pocket White/Black/Queen pucks using Striker to score points against opponent!
    2. ⚔️ **Tic-Tac-Toe (Tik Tak):** Interactive 3x3 Grid game (`#tictactoe-game-screen`). Get 3 in a row (X) to win!
    3. 🎨 **Color Guess Arena:** Match target color to win coins.
    4. 🎡 **Lucky Spin Battle:** Spin wheel for up to +100 bonus coins.

### 2.3. Online Matchmaking & AI Bot System
- **Matchmaking Screen (`#battle-matchmaking-modal`):**
  - Pulsing VS badge and avatar glowing rings.
  - Searches for **Real Online Players** via Firebase.
  - If no online player is found within 1.5 seconds, automatically pairs with an **AI Bot Opponent** (`Viper_Pro99`, `AlphaGamer`, `ShadowRider`, etc.).

### 2.4. Victory / Defeat Modal & Telegram Ads Integration
- **Victory Modal (`#battle-victory-modal`):**
  - Celebration Trophy 🏆, sound synthesis, winning coins counter (+50 Coins), and opponent defeated display.
- **Telegram Ads Hook (`triggerTelegramAd()`):**
  - Integrates with **Adsgram** and Telegram WebApp Ads API before/after battles and victory screens.

### 2.5. Floating Center HOME Bottom Navigation Bar
- **Navigation Bar (`#main-bottom-nav`):**
  - **Positions (5 Items):** 🎮 `Battle` | 👛 `Wallet` | 🏠 **`HOME` (Center Floating Button)** | 👥 `Refer` | 👤 `Profile`
- **Flexbox Layout Rules (`#app-container`):**
  - Container is a vertical flexbox (`height: 100vh; overflow: hidden; display: flex; flex-direction: column;`).
  - Screens have `flex: 1; overflow-y: auto; padding-bottom: 85px;`.
  - Nav Bar has `position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 1000;`.
  - Modals have `position: fixed; inset: 0; z-index: 2000;`.

### 2.6. Admin Panel Controls (`admin.html`)
- **Task Management:** Create, edit, delete dynamic tasks with custom links and coin rewards.
- **Notification Center CRUD:** Send broadcast or user-specific alerts, edit existing alerts, or delete alerts in real time.
- **Game Arena Controls (`sec-controls`):**
  - Configure Entry Fee & Winning Prizes for Carrom, Tic-Tac-Toe, Color Guess, and Lucky Spin.
  - **Game Active/Disabled Toggles:** Enable or Disable any game from Admin Panel; disabled games get hidden from the User Panel.

---

## 🛠️ 3. Troubleshooting & Layout Integrity Checklist

When adding new features or modifying code, always verify:
1. **HTML Div Nesting Check:** Ensure all `<div class="modal-overlay">` and `.screen` elements have matching closing `</div>` tags. Never leave a modal overlay unclosed!
2. **Z-Index Layering:**
   - Base UI / Screens: `z-index: 1`
   - Headers: `z-index: 100`
   - Bottom Nav Bar: `z-index: 1000`
   - Modals / Popups: `z-index: 2000`
3. **Real-time Sync:** Ensure all state changes update both `AppState`, `localStorage`, and Firebase Database via `DatabaseAPI`.

---

## 📝 4. Revision History

- **2026-07-25:** Created `PROJECT_HELP_KIT.md`. Added interactive 2D Carrom Board mini-game physics engine (`startCarromBattleGame`), full Battle Arena, Tic-Tac-Toe, Online/Bot matchmaking, Telegram Ads hook, Admin Game status toggles, centered floating HOME navigation bar, bulletproof fail-safe splash screen dismissal, and removed deprecated duplicate Carrom script functions in `game.js` to ensure 100% error-free execution and instant app launch!
