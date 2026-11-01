# 🗄️ BIT Hostel System — Database Architecture & Schema Documentation

The system uses **MongoDB** with **Mongoose ODM**. Below is the entity relationships and schema definitions for the 27 models.

---

## 📐 ER Diagram Overview

```
 [User] ◄────── (1:1) ──────► [Student] ◄───── (1:1) ─────► [CompatibilityProfile]
   ▲                             ▲                                 │
   │                             │                                 ▼
   │                             ├─────────────── (1:N) ───► [CompatibilityResult]
   ├─────────── (1:1) ──────────► [Warden]
   │                             │
   ├─────────── (1:1) ──────────► [Admin]
   │
   ├─────────── (1:N) ──────────► [Application]
   │                                 │
   │                                 ▼
   ├─────────── (1:N) ──────────► [Allocation] ◄─── (N:1) ─── [Room] ◄─── (N:1) ─── [Block] ◄─── (N:1) ─── [Hostel]
   │
   ├─────────── (1:N) ──────────► [Complaint]
   ├─────────── (1:N) ──────────► [LeaveRequest]
   ├─────────── (1:N) ──────────► [Visitor]
   ├─────────── (1:N) ──────────► [Payment]
   └─────────── (1:N) ──────────► [Notification]
```

---

## 📁 Schema Summary Table

| Schema Name | File Path | Key Fields & Purpose |
| :--- | :--- | :--- |
| **`User`** | `server/src/models/User.js` | Core authentication model with hashed password, role (`student`, `warden`, `admin`), email verification status, and refresh token hash. |
| **`Student`** | `server/src/models/Student.js` | Academic & hostel status for students: `registerNumber`, `department`, `year`, `cgpa`, `hostelStatus`, `isHostelStudent`. |
| **`CompatibilityProfile`** | `server/src/models/CompatibilityProfile.js` | 20+ lifestyle parameters: `sleepTime`, `studyHabit`, `cleanlinessLevel` (1-5), `foodPreference`, `smoking`, `drinking`, `introvertExtrovert`. |
| **`CompatibilityResult`** | `server/src/models/CompatibilityResult.js` | Persisted pair-wise score records: `overallScore` (0-100), `dimensionScores`, `matchReasons`, `conflictReasons`, `suggestions`. |
| **`Hostel`** | `server/src/models/Hostel.js` | Hostel building definition: `name`, `code`, `genderType` (`boys`/`girls`), `capacity`, `currentOccupancy`. |
| **`Block`** | `server/src/models/Block.js` | Block building sub-division: `name`, `hostel`, `totalFloors`, `totalRooms`. |
| **`Room`** | `server/src/models/Room.js` | Individual hostel room: `roomNumber`, `floor`, `roomType` (`single`, `double`, `triple`, `quad`), `isAC`, `capacity`, `occupants` array. |
| **`Application`** | `server/src/models/Application.js` | Hostel application record: preferences, priority score breakdown, approval status (`pending`, `approved`, `allocated`, `waitlisted`). |
| **`Allocation`** | `server/src/models/Allocation.js` | Active room allocation mapping: `student`, `room`, `bedNumber`, `academicYear`, `qrCode` data URL, `status`. |
| **`Complaint`** | `server/src/models/Complaint.js` | Issue ticket: `category` (`plumbing`, `electrical`, `cleanliness`, `wifi`), `priority`, `status` (`pending`, `in_progress`, `resolved`), audit log. |
| **`LeaveRequest`** | `server/src/models/LeaveRequest.js` | Outing/Leave application: `leaveType`, `fromDate`, `toDate`, `reason`, `wardenApproval`, `gatePassQr`. |
| **`Visitor`** | `server/src/models/Visitor.js` | Visitor registration pass: `visitorName`, `relation`, `visitDate`, `checkInTime`, `checkOutTime`, `passQrCode`. |
| **`Payment`** | `server/src/models/Payment.js` | Fee transaction: `feeType` (`rent`, `mess`, `laundry`, `fine`), `amount`, `paymentStatus`, `razorpayOrderId`, `receiptUrl`. |
| **`ChatRoom` & `Message`** | `server/src/models/Chat.js` | Real-time chat: 1-on-1 DM / group rooms, `sender`, `type` (`text`, `image`, `file`), `seenBy`, `reactions`. |
| **`Notification`** | `server/src/models/Notification.js` | Push notification item: `recipient`, `title`, `message`, `type`, `actionUrl`, `isRead`. |
| **`Warden` & `Admin`** | `server/src/models/Support.js` | Staff management schemas with `employeeId`, `permissions`, and assigned blocks/hostels. |
| **`Notice` & `Document`** | `server/src/models/Support.js` | Broadcast notices with attachments, and student document verification tracking (`college_id`, `medical_certificate`). |
| **`Extra Models`** | `server/src/models/Extra.js` | `Event`, `MarketplaceItem`, `LostFoundItem`, `LaundryBooking`, `Inventory`, `Survey`. |
