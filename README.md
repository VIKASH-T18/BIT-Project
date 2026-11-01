# 🏨 BIT Hostel Room Allocation System & AI-Powered Roommate Compatibility Matchmaking Portal

> A Smart, Scalable, Production-Ready MERN Stack Hostel Management Web Application built for Bannari Amman Institute of Technology (BIT Sathy).

---

## 🌟 Key Features

### 1. 🤖 AI Roommate Compatibility Matchmaking Engine
- Multi-dimensional weighted scoring algorithm evaluating **20+ lifestyle parameters** (sleep schedule, study habits, cleanliness, noise tolerance, smoking/drinking, social style, food preference, room temperature, etc.).
- Cosine similarity + ordinal distance matrix calculation returning 0–100% compatibility scores.
- Real-time compatibility recommendations, match highlights, conflict warnings, and actionable AI advice.

### 2. 🏠 Smart Room Allocation System
- Automated priority-based allocation considering academic year (final year priority), medical/disability needs, distance from home, scholarship status, and CGPA.
- Roommate compatibility integration — allocates room with compatible existing occupants.
- Automatic waitlist positioning and auto-promotion upon cancellation.

### 3. 💬 Real-Time Communication & Notifications
- Socket.IO web-sockets for instant 1-on-1 and group chat.
- Live typing indicators, message delivery/read receipts, emoji reactions, and media attachment upload via Cloudinary.
- Automated real-time push notifications for allocations, leave status, complaints, and notices.

### 4. 📱 QR Code Access Control & Security
- Dynamic QR code generation for room pass, hostel gate check-in/out, and visitor authorization.
- Warden/Security scan interface for instant validity verification.
- One-click Emergency SOS alert system notifying wardens immediately.

### 5. 📊 Analytics, Reports & Dashboards
- Executive dashboard for admins and wardens powered by **Recharts**.
- Live KPI cards: occupancy rates, department breakdown, complaint status, fee collection revenue trends, and visitor traffic.
- Report export functionality.

### 6. 🛠️ Comprehensive Student Services
- Student Marketplace (buy/sell textbooks, electronics, furniture).
- Lost & Found portal with image proof and claims verification.
- Mess menu schedule & attendance tracker.
- Online laundry slot booking system.
- Student achievements and rewards leaderboard.

---

## 🛠️ Tech Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS v4, Framer Motion, Redux Toolkit, React Query, React Hook Form, Recharts, Lucide Icons, React Hot Toast |
| **Backend** | Node.js, Express.js, Socket.IO, Express-Validator, Winston Logger |
| **Database** | MongoDB, Mongoose ODM (27 Schema Models) |
| **Security** | JWT (Access & Refresh Cookies), Helmet, Rate Limiting, Mongo Sanitize, XSS Clean, HPP |
| **Storage & Email**| Cloudinary, Nodemailer |
| **Documentation**| Swagger UI, OpenAPI 3.0 |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally at `mongodb://localhost:27017` or Atlas connection string)
- npm or yarn

### 1. Database Setup & Seeding
```bash
cd server
npm install
npm run seed
```

### 2. Start Backend Server
```bash
npm run dev
# Server running at http://localhost:5000
# API Docs available at http://localhost:5000/api/docs
```

### 3. Start Frontend Client
```bash
cd ../client
npm install
npm run dev
# Frontend running at http://localhost:5173
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access / Features |
| :--- | :--- | :--- | :--- |
| **Student** | `student@bit.edu.in` | `Student@123` | Room Allocation, AI Compatibility, Chat, Complaints, Leave, Payments |
| **Warden** | `warden@bit.edu.in` | `Warden@123` | Approval Portal, Room Allocation, Complaint Management, Visitor Passes |
| **Admin** | `admin@bit.edu.in` | `Admin@123` | Analytics, Fee Records, User Management, Document Verification, Reports |

---

## 📁 Project Architecture

```
BIT Project/
├── server/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, Nodemailer setups
│   │   ├── controllers/     # Controller handlers (Auth, Student, Warden, etc.)
│   │   ├── middleware/      # Auth, RBAC, Rate-limit, Express-validator
│   │   ├── models/          # 27 Mongoose Schemas (User, Student, Room, etc.)
│   │   ├── routes/          # Express Route definitions
│   │   ├── services/        # AI Compatibility & Allocation Engine logic
│   │   ├── sockets/         # Socket.IO event handlers
│   │   ├── utils/           # JWT, Logger, Helper utilities
│   │   ├── app.js           # Express App configuration
│   │   └── server.js        # Server entry point
│   ├── .env.example
│   └── package.json
└── client/
    ├── src/
    │   ├── assets/          # Static assets
    │   ├── components/      # Common UI, Layout, Topbar, Sidebar components
    │   ├── layouts/         # Auth & Dashboard Layouts
    │   ├── pages/           # Student, Warden, Admin, Shared & Auth Pages
    │   ├── redux/           # Store & Slices (Auth, UI, Chat, Notification)
    │   ├── routes/          # ProtectedRoute & Navigation
    │   ├── services/        # Axios API & Socket.IO client singleton
    │   ├── App.jsx          # Root App with Routes
    │   └── main.jsx         # React DOM Entry with Providers
    ├── index.html
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 📄 License
This project is developed for Bannari Amman Institute of Technology (BIT Sathy). All rights reserved.
