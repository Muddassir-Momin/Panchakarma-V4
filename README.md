# 🌿 Panchakarma Management Software v4.0

## 📁 Folder Structure

```
pkms-v4/
├── frontend/                    ← Open frontend/index.html in any browser
│   ├── index.html               ← STANDALONE SPA (single file — no dependencies)
│   ├── app.html                 ← COMPONENT-WISE entry (loads all separate files)
│   ├── css/
│   │   ├── all.css              ← All styles in one file (used by app.html)
│   │   ├── variables.css        ← Design tokens
│   │   ├── reset.css            ← CSS reset + animations
│   │   └── mobile.css           ← Responsive breakpoints
│   └── js/
│       ├── core/
│       │   ├── db.js            ← In-memory DB + date helpers
│       │   ├── constants.js     ← CLINIC config, ROLES, NAV items
│       │   ├── app.js           ← Auth, login, signup, logout
│       │   ├── router.js        ← bootApp, showPage, buildNav
│       │   └── session.js       ← 30-min timeout + CSV/Excel/PDF/Word export
│       ├── utils/
│       │   ├── helpers.js       ← getUser, genId, capacity, duplicates
│       │   ├── toast.js         ← showToast()
│       │   ├── modal.js         ← openModal(), closeMod()
│       │   └── charts.js        ← Chart.js v4 wrappers
│       └── components/
│           ├── patient/
│           │   ├── dashboard.js
│           │   ├── schedule.js  ← Booking + auto-reallocation on cancel
│           │   ├── progress.js
│           │   ├── notifications.js
│           │   ├── feedback.js  ← Submit + Edit feedback
│           │   ├── shop.js      ← Prescribed-not-in-shop warning strip
│           │   └── orders.js
│           ├── doctor/
│           │   ├── dashboard.js
│           │   ├── patients.js  ← Add patient with password + credential modal
│           │   ├── schedule.js  ← 7-day heatmap + clinical notes
│           │   ├── treatments.js← Prescriptions with shop availability check
│           │   ├── notifications.js ← NEW: doctor notification page
│           │   ├── reports.js
│           │   └── shop.js      ← Products + read-only order history (NO Collected btn)
│           ├── admin/
│           │   ├── dashboard.js
│           │   ├── users.js     ← Doctor verification + self-delete guard
│           │   ├── therapies.js
│           │   ├── appointments.js ← Paginated + Mark Collected (admin-only)
│           │   ├── reports.js   ← Export panel (7 reports × 4 formats)
│           │   ├── shop.js      ← Inventory + Mark Collected button (admin only)
│           │   └── announcements.js
│           └── shared/
│               ├── profile.js
│               └── settings.js
│
├── backend/                     ← Node.js Microservices
│   ├── package.json             ← npm workspaces root
│   ├── .env.example             ← Copy to .env and configure
│   ├── gateway/
│   │   └── src/index.js         ← API Gateway :4000
│   └── services/
│       ├── auth-service/        ← :4001 — JWT, signup, login
│       ├── patient-service/     ← :4002 — PKM IDs, duplicate detection
│       ├── doctor-service/      ← :4003 — verification, capacity, audit
│       ├── session-service/     ← :4004 — booking, auto-reallocation
│       ├── shop-service/        ← :4005 — atomic stock, pickup codes
│       ├── notification-service/← :4006 — in-app, email, SMS, cron
│       └── report-service/      ← :4007 — live analytics
│   └── shared/                  ← models, validators, utils (shared by all)
│
├── database/
│   ├── migrate.js               ← Run all SQL migrations in order
│   ├── migrations/              ← 11 SQL files (001 → 011)
│   └── seeds/                   ← Demo data + bcrypt seed runner
│
└── infrastructure/
    ├── docker/
    │   ├── docker-compose.yml   ← 9 containers: gateway + 7 services + MySQL + Redis
    │   └── Dockerfile.service   ← Multi-stage Alpine build
    └── nginx/
        └── nginx.conf           ← TLS, rate limiting, HTTP→HTTPS

```

---

## 🚀 Quick Start

### Option 1 — Standalone (no install, just open in browser)
```
Open: frontend/index.html
```

### Option 2 — Component-wise (needs a local server due to JS modules)
```bash
cd frontend
npx serve .          # or: python3 -m http.server 3000
# Open: http://localhost:3000/app.html
```

### Option 3 — Full Microservices
```bash
cd backend
cp .env.example .env
docker-compose -f ../infrastructure/docker/docker-compose.yml up -d
node ../database/migrate.js
node ../database/seeds/run.js
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 🧘 Patient (PKM-0001) | priya@demo.com | demo123 |
| 🧘 Patient (PKM-0002) | arjun@demo.com | demo123 |
| 👨‍⚕️ Doctor (Approved) | doctor@demo.com | demo123 |
| 👨‍⚕️ Doctor (Pending) | ravi@demo.com | demo123 |
| ⚙️ Admin | admin@demo.com | admin123 |

---

## ✅ All Fixes in v4.0

| Feature | Change |
|---------|--------|
| **Doctor Notifications** | New 🔔 Notifications page in doctor nav with unread badge |
| **Doctor notifications data** | Low stock alerts, new bookings, patient feedback, auto-reallocation alerts |
| **Doctor Shop — no Collected** | Removed "✓ Collected" button. Doctor sees read-only order history only |
| **Collected — Admin only** | Only Admin Shop page has "Mark Collected" button |
| **Add Patient — password** | Password field with auto-generate button. Default: `Welcome@123` |
| **Add Patient — credentials** | After registration, modal shows Patient ID + temp password to share |
| **Prescription → shop check** | When doctor saves prescription, each medicine is checked against shop products |
| **Not in shop → notify** | If prescribed medicine not in shop → patient gets notification |
| **Out of stock → notify** | If in shop but out of stock → patient AND doctor both notified |
| **Shop — unavailable strip** | Patient shop shows "⚠️ Prescribed — Not Available in Shop" warning strip |
| **Calendar compact** | 220px column, 26px fixed height cells (no aspect-ratio) |
| **Product cards larger** | 5rem emoji, 1.05rem name, 180px image, bigger cart button |
| **Cart qty** | Cannot go below 1; pressing minus at qty=1 shows Remove confirm |
| **Export** | 7 report types × 4 formats (Excel, PDF, Word, CSV) |
# Panchakarma-V4
