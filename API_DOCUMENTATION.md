# 📑 BIT Hostel System — API Documentation

This document outlines the REST API endpoints and Socket.IO events available in the **BIT Hostel Management System**.

Interactive Swagger Documentation is accessible at `http://localhost:5000/api/docs`.

---

## 🔒 Authentication API (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new student/user account. |
| `POST` | `/api/auth/verify-email` | Public | Verify account email using 6-digit OTP. |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT + HTTP-only refresh cookie. |
| `POST` | `/api/auth/refresh` | Public | Issue new access token using refresh token cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate refresh token and clear cookies. |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset token to email. |
| `POST` | `/api/auth/reset-password` | Public | Reset password using token from email. |
| `GET`  | `/api/auth/me` | Authenticated | Fetch current logged-in user profile & role data. |

---

## 🤖 AI Compatibility API (`/api/compatibility`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET`  | `/api/compatibility/profile` | Student | Fetch student lifestyle compatibility profile. |
| `POST` | `/api/compatibility/profile` | Student | Create/Update lifestyle parameters (sleep, study, hygiene). |
| `GET`  | `/api/compatibility/recommendations` | Student | Get ranked list of compatible roommates with percentage score. |
| `POST` | `/api/compatibility/compare` | Student | Compute compatibility score between 2 specific students. |

---

## 🏠 Room & Allocation API (`/api/allocations` & `/api/rooms`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/applications` | Student | Submit new hostel room application with room/AC preferences. |
| `GET`  | `/api/allocations/my` | Student | Get current active room allocation details and QR pass. |
| `POST` | `/api/allocations/auto` | Warden/Admin | Trigger automated priority + compatibility smart room allocation. |
| `GET`  | `/api/rooms/hostel/:hostelId` | Authenticated | Fetch all rooms and floor layout for interactive hostel map. |

---

## 📊 Analytics API (`/api/analytics`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET`  | `/api/analytics/overview` | Admin/Warden | Live KPI counters, block occupancy, and revenue overview. |
| `GET`  | `/api/analytics/complaints` | Admin | Complaint resolution timeline & department breakdown. |
| `GET`  | `/api/analytics/occupancy` | Admin | Historical occupancy rates by hostel and block. |

---

## ⚡ Socket.IO Real-Time Events

### Client → Server Events
- `join_chat_rooms`: Joins socket rooms for user's active chats.
- `send_message`: Sends real-time message `{ chatRoomId, content, type }`.
- `typing_start` / `typing_stop`: Broadcasts typing status indicator.
- `mark_seen`: Updates message seen status and notifies sender.
- `sos_alert`: Broadcasts high-priority emergency alert to all connected wardens.

### Server → Client Events
- `new_message`: Pushes incoming message to room participants.
- `notification`: Pushes real-time notification alert.
- `online_users`: Emits list of currently connected online user IDs.
- `sos_received`: Delivers emergency alert to warden/admin dashboards.
