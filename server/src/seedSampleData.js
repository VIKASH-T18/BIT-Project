/**
 * @file seedSampleData.js
 * @description Robust Sample Data Seeder for BIT Hostel Management System.
 * Populates realistic data across all operational collections while preserving
 * administrative accounts.
 */

const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./models/User");
const Student = require("./models/Student");
const Hostel = require("./models/Hostel");
const Block = require("./models/Block");
const Floor = require("./models/Floor");
const Room = require("./models/Room");
const Application = require("./models/Application");
const Allocation = require("./models/Allocation");
const Complaint = require("./models/Complaint");
const LeaveRequest = require("./models/LeaveRequest");
const Visitor = require("./models/Visitor");
const Payment = require("./models/Payment");
const Notification = require("./models/Notification");
const { ChatRoom, Message } = require("./models/Chat");
const { Notice, Document, Warden, Admin } = require("./models/Support");
const { Event } = require("./models/Extra");

const ago = (days) => new Date(Date.now() - days * 864e5);
const ahead = (days) => new Date(Date.now() + days * 864e5);

async function runSeeder() {
  console.log("🚀 Starting BIT Hostel Sample Data Seeder...");

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "bit_hostel",
    serverSelectionTimeoutMS: 15000,
  });
  console.log("✅ Connected to MongoDB Atlas:", mongoose.connection.host);

  // 1. Ensure Admin Account (virat@bitsathy.ac.in and admin@bitsathy.ac.in)
  const ensureDemoAccounts = require("./utils/ensureDemoAccounts");
  await ensureDemoAccounts();

  let viratUser = await User.findOne({ email: "virat@bitsathy.ac.in" });
  if (!viratUser) {
    viratUser = await User.create({
      name: "Virat Kohli",
      email: "virat@bitsathy.ac.in",
      password: "Password@123",
      role: "admin",
      isVerified: true,
      isActive: true,
    });
    console.log("Created admin user virat@bitsathy.ac.in");
  } else {
    viratUser.role = "admin";
    viratUser.isVerified = true;
    viratUser.isActive = true;
    await viratUser.save();
    console.log("Updated admin user virat@bitsathy.ac.in");
  }

  // 2. Ensure Hostels
  let emeraldHostel = await Hostel.findOne({ name: "Emerald Boys Hostel" });
  if (!emeraldHostel) {
    emeraldHostel = await Hostel.create({
      name: "Emerald Boys Hostel",
      type: "boys",
      description: "Premier residential hall for engineering students with air-conditioned study suites.",
      totalCapacity: 450,
      currentOccupancy: 280,
      contactPhone: "+91 94433 11223",
      contactEmail: "emerald.hostel@bitsathy.ac.in",
      address: "North Quadrangle, Bannari Amman Institute of Technology, Sathyamangalam",
      amenities: ["High-speed Wi-Fi", "RO Filtered Water", "Recreation Hall", "Gymnasium", "Laundromat"],
      rules: ["Curfew at 21:30", "ID card required at turnstiles", "Quiet hours after 22:00"],
      isActive: true,
      establishedYear: 2012,
    });
  }

  let bhavaniHostel = await Hostel.findOne({ name: "Bhavani Girls Hostel" });
  if (!bhavaniHostel) {
    bhavaniHostel = await Hostel.create({
      name: "Bhavani Girls Hostel",
      type: "girls",
      description: "Secure, modern residence with solar-heated water, reading library, and round-the-clock wardens.",
      totalCapacity: 350,
      currentOccupancy: 210,
      contactPhone: "+91 94433 44556",
      contactEmail: "bhavani.hostel@bitsathy.ac.in",
      address: "East Campus Gardens, Bannari Amman Institute of Technology, Sathyamangalam",
      amenities: ["24/7 Security", "Wi-Fi Hubs", "Reading Room", "Badminton Court", "Health Clinic"],
      rules: ["Curfew at 20:30", "Biometric verification required", "Parent notification for overnight leaves"],
      isActive: true,
      establishedYear: 2015,
    });
  }

  // 3. Ensure Blocks
  let blockA = await Block.findOne({ blockCode: "BLK-A" });
  if (!blockA) {
    blockA = await Block.create({
      hostel: emeraldHostel._id,
      blockName: "Block A (Newton Wing)",
      blockCode: "BLK-A",
      totalFloors: 3,
      totalRooms: 30,
      gender: "boys",
      isActive: true,
    });
  }

  let blockB = await Block.findOne({ blockCode: "BLK-B" });
  if (!blockB) {
    blockB = await Block.create({
      hostel: emeraldHostel._id,
      blockName: "Block B (Einstein Wing)",
      blockCode: "BLK-B",
      totalFloors: 3,
      totalRooms: 30,
      gender: "boys",
      isActive: true,
    });
  }

  let blockC = await Block.findOne({ blockCode: "BLK-C" });
  if (!blockC) {
    blockC = await Block.create({
      hostel: bhavaniHostel._id,
      blockName: "Block C (Kalpana Chawla Wing)",
      blockCode: "BLK-C",
      totalFloors: 3,
      totalRooms: 30,
      gender: "girls",
      isActive: true,
    });
  }

  // 4. Ensure Floors
  async function getOrCreateFloor(hostel, block, floorNum) {
    let fl = await Floor.findOne({ block: block._id, floorNumber: floorNum });
    if (!fl) {
      fl = await Floor.create({
        hostel: hostel._id,
        block: block._id,
        floorNumber: floorNum,
        floorName: floorNum === 1 ? "Ground Floor" : `Floor ${floorNum}`,
      });
    }
    return fl;
  }

  const fA1 = await getOrCreateFloor(emeraldHostel, blockA, 1);
  const fA2 = await getOrCreateFloor(emeraldHostel, blockA, 2);
  const fB1 = await getOrCreateFloor(emeraldHostel, blockB, 1);
  const fB2 = await getOrCreateFloor(emeraldHostel, blockB, 2);
  const fC1 = await getOrCreateFloor(bhavaniHostel, blockC, 1);
  const fC2 = await getOrCreateFloor(bhavaniHostel, blockC, 2);

  // 5. Ensure Sample Rooms
  const sampleRooms = [
    { num: "A-101", block: blockA, hostel: emeraldHostel, floorObj: fA1, floor: 1, cap: 2, occ: 2, status: "fully_occupied", type: "double" },
    { num: "A-102", block: blockA, hostel: emeraldHostel, floorObj: fA1, floor: 1, cap: 2, occ: 0, status: "available", type: "double" },
    { num: "A-103", block: blockA, hostel: emeraldHostel, floorObj: fA1, floor: 1, cap: 3, occ: 1, status: "partially_occupied", type: "triple" },
    { num: "A-104", block: blockA, hostel: emeraldHostel, floorObj: fA1, floor: 1, cap: 2, occ: 0, status: "maintenance", type: "double" },
    { num: "A-201", block: blockA, hostel: emeraldHostel, floorObj: fA2, floor: 2, cap: 2, occ: 0, status: "available", type: "double" },
    { num: "A-202", block: blockA, hostel: emeraldHostel, floorObj: fA2, floor: 2, cap: 2, occ: 2, status: "fully_occupied", type: "double" },
    { num: "B-101", block: blockB, hostel: emeraldHostel, floorObj: fB1, floor: 1, cap: 3, occ: 0, status: "available", type: "triple" },
    { num: "B-102", block: blockB, hostel: emeraldHostel, floorObj: fB1, floor: 1, cap: 3, occ: 3, status: "fully_occupied", type: "triple" },
    { num: "B-201", block: blockB, hostel: emeraldHostel, floorObj: fB2, floor: 2, cap: 4, occ: 0, status: "available", type: "four_sharing" },
    { num: "C-101", block: blockC, hostel: bhavaniHostel, floorObj: fC1, floor: 1, cap: 2, occ: 2, status: "fully_occupied", type: "double" },
    { num: "C-102", block: blockC, hostel: bhavaniHostel, floorObj: fC1, floor: 1, cap: 2, occ: 0, status: "available", type: "double" },
    { num: "C-201", block: blockC, hostel: bhavaniHostel, floorObj: fC2, floor: 2, cap: 3, occ: 1, status: "partially_occupied", type: "triple" },
  ];

  const createdRooms = [];
  for (const r of sampleRooms) {
    let room = await Room.findOne({ roomNumber: r.num, block: r.block._id });
    if (!room) {
      room = await Room.create({
        hostel: r.hostel._id,
        block: r.block._id,
        floor: r.floorObj._id,
        roomNumber: r.num,
        floorNumber: r.floor,
        roomType: r.type,
        capacity: r.cap,
        currentOccupancy: r.occ,
        status: r.status,
        monthlyFee: 4500,
        securityDeposit: 5000,
      });
    }
    createdRooms.push(room);
  }
  console.log(`✅ Ensured ${createdRooms.length} rooms across blocks`);

  // 6. Ensure Students
  const studentData = [
    { name: "Arjun Kumar", email: "arjun.cs22@bitsathy.ac.in", reg: "7376221CS101", dept: "CSE", yr: 3, gen: "male", room: createdRooms[0] },
    { name: "Karthik Raja", email: "karthik.ec22@bitsathy.ac.in", reg: "7376221EC104", dept: "ECE", yr: 3, gen: "male", room: createdRooms[0] },
    { name: "Praveen Kumar", email: "praveen.it23@bitsathy.ac.in", reg: "7376231IT120", dept: "IT", yr: 2, gen: "male", room: createdRooms[2] },
    { name: "Suresh Balaji", email: "suresh.me21@bitsathy.ac.in", reg: "7376211ME150", dept: "MECH", yr: 4, gen: "male", room: createdRooms[5] },
    { name: "Vikash Sharma", email: "vikash.ad22@bitsathy.ac.in", reg: "7376221AD115", dept: "AIDS", yr: 3, gen: "male", room: createdRooms[5] },
    { name: "Priya Ramesh", email: "priya.cs22@bitsathy.ac.in", reg: "7376221CS201", dept: "CSE", yr: 3, gen: "female", room: createdRooms[9] },
    { name: "Divya Krishnan", email: "divya.ec22@bitsathy.ac.in", reg: "7376221EC205", dept: "ECE", yr: 3, gen: "female", room: createdRooms[9] },
    { name: "Sneha Suresh", email: "sneha.it23@bitsathy.ac.in", reg: "7376231IT210", dept: "IT", yr: 2, gen: "female", room: createdRooms[11] },
  ];

  const students = [];
  for (const s of studentData) {
    let u = await User.findOne({ email: s.email });
    if (!u) {
      u = await User.create({
        name: s.name,
        email: s.email,
        password: "Password@123",
        role: "student",
        isVerified: true,
        isActive: true,
        phone: "+91 98765 43210",
        emergencyContact: "+91 98765 01234",
      });
    }

    let st = await Student.findOne({ user: u._id });
    if (!st) {
      st = await Student.create({
        user: u._id,
        registerNumber: s.reg,
        department: s.dept,
        year: s.yr,
        gender: s.gen,
        bloodGroup: "O+",
        currentRoom: s.room._id,
        currentBlock: s.room.block,
        currentHostel: s.room.hostel,
        hostelStatus: "allocated",
        cgpa: 8.4,
      });
    }
    students.push({ user: u, student: st, room: s.room });
  }
  console.log(`✅ Ensured ${students.length} students`);

  // 7. Ensure Document Verification Records
  const docTypes = [
    { type: "aadhaar", name: "Aadhaar_Card_Verified.pdf", status: "approved" },
    { type: "college_id", name: "BIT_College_ID_Scan.png", status: "pending" },
    { type: "medical_certificate", name: "Fitness_Medical_Cert.pdf", status: "approved" },
    { type: "income_certificate", name: "Annual_Income_Certificate.pdf", status: "rejected", reason: "Expired tax year certificate. Please re-upload for current fiscal year." },
    { type: "tc", name: "Transfer_Certificate_HSC.pdf", status: "pending" },
  ];

  let docCount = await Document.countDocuments();
  if (docCount < 10) {
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const docDef = docTypes[i % docTypes.length];
      await Document.create({
        student: s.student._id,
        user: s.user._id,
        docType: docDef.type,
        fileName: docDef.name,
        fileUrl: `https://res.cloudinary.com/demo/image/upload/sample.pdf`,
        status: docDef.status,
        rejectionReason: docDef.reason,
        verifiedBy: docDef.status === "approved" ? viratUser._id : undefined,
        verifiedAt: docDef.status === "approved" ? ago(2) : undefined,
      });
    }
    console.log("✅ Seeded student verification documents");
  }

  // 8. Ensure Official Notices
  let noticeCount = await Notice.countDocuments();
  if (noticeCount < 5) {
    const notices = [
      {
        title: "Important: Even Semester 2025-26 Room Retention and Allotment Schedule",
        content: `All hostel residents are hereby notified that the room renewal portal will open from October 15th.\nResidents wishing to retain their current room or request roommate swaps must submit their preferences before October 25th, 18:00 hrs.\n\nLate submissions will automatically be reassigned based on system algorithm vacancy.`,
        category: "academic",
        priority: "urgent",
        isPinned: true,
        author: viratUser._id,
      },
      {
        title: "Hostel Fee Installment Payment Deadline Notice",
        content: `Mess and maintenance dues for the current cycle must be cleared on or before October 28th.\nLate fees of ₹50 per day will apply post-deadline.\nPayments can be completed online via the Fee Management tab.`,
        category: "fees",
        priority: "high",
        isPinned: true,
        author: viratUser._id,
      },
      {
        title: "Scheduled High-Speed Wi-Fi Router Upgrades (Block A & B)",
        content: `Please note that network maintenance and access point firmware upgrades will take place this Saturday between 02:00 AM and 05:00 AM.\nInternet connectivity may experience intermittent downtime during this window.`,
        category: "maintenance",
        priority: "normal",
        isPinned: false,
        author: viratUser._id,
      },
      {
        title: "Inter-Hostel Sports Gala & Badminton Tournament Registrations",
        content: `Annual Inter-Hostel Tournament registrations are now open for Cricket, Badminton (Doubles), Table Tennis, and Volleyball.\nInterested players should register in the Activities tab before Friday.`,
        category: "events",
        priority: "normal",
        isPinned: false,
        author: viratUser._id,
      },
      {
        title: "Strict Advisory: Night Turnstile Verification & Gate Timings",
        content: `Residents are reminded that institutional curfew is strictly 21:30 for Boys Hostel and 20:30 for Girls Hostel.\nFailure to punch in before curfew will trigger an automated SMS notification to registered guardians.`,
        category: "rules",
        priority: "urgent",
        isPinned: false,
        author: viratUser._id,
      },
    ];

    for (const n of notices) {
      await Notice.create({
        ...n,
        views: Math.floor(Math.random() * 80) + 20,
        likes: [viratUser._id, students[0].user._id, students[1].user._id],
        isActive: true,
      });
    }
    console.log("✅ Seeded official notices");
  }

  // 9. Ensure Events
  let eventCount = await Event.countDocuments();
  if (eventCount < 4) {
    const events = [
      {
        title: "BIT Premier Cricket League 2026",
        description: "Inter-block knockout cricket tournament between Emerald and Bhavani wings. Trophies and cash prizes for champions.",
        type: "sports",
        eventDate: ahead(5),
        location: "BIT Main Sports Complex",
        organizer: viratUser._id,
        maxCapacity: 120,
        isPublished: true,
      },
      {
        title: "Hostel Cultural Evening & DJ Night",
        description: "Live musical performances, stand-up acts by residents, and open dance floor in celebration of Diwali festivities.",
        type: "cultural",
        eventDate: ahead(12),
        location: "North Quadrangle Open Stage",
        organizer: viratUser._id,
        maxCapacity: 300,
        isPublished: true,
      },
      {
        title: "Hands-on Full-Stack AI & Cloud Workshop",
        description: "Intensive 3-hour weekend code sprint covering MERN stack architecture, containerization, and OpenAI APIs.",
        type: "workshop",
        eventDate: ahead(8),
        location: "Block A Seminar Suite",
        organizer: viratUser._id,
        maxCapacity: 60,
        isPublished: true,
      },
      {
        title: "Hostel Welfare Council Monthly Meeting",
        description: "Discussion on mess menu revision, laundry machine timings, and common room gym equipment proposals.",
        type: "meeting",
        eventDate: ahead(2),
        location: "Chief Warden Conference Room",
        organizer: viratUser._id,
        maxCapacity: 30,
        isPublished: true,
      },
    ];

    for (const ev of events) {
      await Event.create({
        ...ev,
        registrations: students.slice(0, 4).map((s) => ({
          student: s.student._id,
          registeredAt: ago(1),
        })),
      });
    }
    console.log("✅ Seeded campus events");
  }

  // 10. Ensure Chat Rooms & Messages
  let roomChatCount = await ChatRoom.countDocuments();
  if (roomChatCount < 2) {
    const communityRoom = await ChatRoom.create({
      type: "group",
      name: "Hostel Community Lounge",
      description: "Official interactive community hub for all BIT Hostel residents.",
      participants: [
        { user: viratUser._id, role: "admin" },
        ...students.map((s) => ({ user: s.user._id, role: "member" })),
      ],
      isActive: true,
    });

    const m1 = await Message.create({
      chatRoom: communityRoom._id,
      sender: viratUser._id,
      content: "Welcome everyone to the BIT Hostel Digital Portal! Please feel free to raise inquiries here.",
    });

    const m2 = await Message.create({
      chatRoom: communityRoom._id,
      sender: students[0].user._id,
      content: "Hello Dr. Ramachandran, could you please confirm when the badminton court floodlights turn off?",
    });

    const m3 = await Message.create({
      chatRoom: communityRoom._id,
      sender: viratUser._id,
      content: "Courts stay lit until 22:00 every evening. Please ensure equipment is returned afterwards.",
    });

    communityRoom.lastMessage = m3._id;
    communityRoom.lastMessageAt = new Date();
    await communityRoom.save();

    // Direct message between admin and Arjun Kumar
    const dmRoom = await ChatRoom.create({
      type: "dm",
      participants: [
        { user: viratUser._id, role: "admin" },
        { user: students[0].user._id, role: "member" },
      ],
      isActive: true,
    });

    const dmMsg = await Message.create({
      chatRoom: dmRoom._id,
      sender: students[0].user._id,
      content: "Respected Warden, my room transfer document has been re-uploaded as requested.",
    });
    dmRoom.lastMessage = dmMsg._id;
    dmRoom.lastMessageAt = new Date();
    await dmRoom.save();

    console.log("✅ Seeded chat channels and message logs");
  }

  // 11. Ensure Fee Payments
  let payCount = await Payment.countDocuments();
  if (payCount < 6) {
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const isPaid = i % 3 !== 0;
      await Payment.create({
        student: s.student._id,
        user: s.user._id,
        amount: isPaid ? 45000 : 42000,
        feeType: i % 2 === 0 ? "hostel_fee" : "mess_fee",
        status: isPaid ? "paid" : "pending",
        transactionId: isPaid ? `TXN_${Date.now()}_${i}` : undefined,
        paymentMethod: isPaid ? "upi" : undefined,
        paidAt: isPaid ? ago(i * 3 + 1) : undefined,
        academicYear: "2025-2026",
        semester: 5,
        dueDate: ahead(15),
      });
    }
    console.log("✅ Seeded fee payment ledgers");
  }

  // 12. Ensure Complaints & Triage
  let compCount = await Complaint.countDocuments();
  if (compCount < 4) {
    const complaints = [
      {
        title: "Low Wi-Fi Signal in Room A-101",
        category: "wifi",
        description: "The ceiling router in corridor 1 has intermittent signal dropouts during evening study hours.",
        status: "in_progress",
        priority: "medium",
        student: students[0].student._id,
        room: createdRooms[0]._id,
        block: blockA._id,
      },
      {
        title: "Washroom Tap Leakage on Ground Floor",
        category: "plumbing",
        description: "Water tap in stall 2 continues dripping after shutoff. Needs new washer.",
        status: "resolved",
        priority: "high",
        student: students[1].student._id,
        room: createdRooms[0]._id,
        block: blockA._id,
      },
      {
        title: "Study Lamp Socket Not Powering On",
        category: "electrical",
        description: "Desk power outlet tripped and has no voltage output.",
        status: "pending",
        priority: "high",
        student: students[2].student._id,
        room: createdRooms[2]._id,
        block: blockA._id,
      },
      {
        title: "Floor Cleaning Request for Balcony Area",
        category: "cleanliness",
        description: "Dust and leaf accumulation after heavy rain outside window sill.",
        status: "pending",
        priority: "low",
        student: students[5].student._id,
        room: createdRooms[9]._id,
        block: blockC._id,
      },
    ];

    for (const c of complaints) {
      await Complaint.create({
        ...c,
        complaintNumber: `CMP-${Date.now().toString().slice(-6)}`,
        createdAt: ago(2),
      });
    }
    console.log("✅ Seeded maintenance grievance tickets");
  }

  // 13. Ensure Visitor Records
  let visCount = await Visitor.countDocuments();
  if (visCount < 3) {
    const visitors = [
      { name: "K. Ramesh (Father)", relation: "Father", student: students[0].student._id, host: viratUser._id, purpose: "Academic Fee Payment & Document Submission" },
      { name: "M. Krishnan (Parent)", relation: "Father", student: students[1].student._id, host: viratUser._id, purpose: "Weekend Leave Pickup" },
      { name: "S. Anitha (Mother)", relation: "Mother", student: students[5].student._id, host: viratUser._id, purpose: "Medical Health Kit Delivery" },
    ];

    for (const v of visitors) {
      await Visitor.create({
        visitorName: v.name,
        relationship: v.relation,
        student: v.student,
        purpose: v.purpose,
        checkIn: ago(0),
        status: "checked_in",
        contactNumber: "+91 98422 12345",
      });
    }
    console.log("✅ Seeded visitor check-in records");
  }

  // 14. Ensure Notifications
  let notifCount = await Notification.countDocuments();
  if (notifCount < 4) {
    const notifs = [
      {
        user: viratUser._id,
        title: "System Telemetry Active",
        message: "BIT Hostel Management System is operating normally across all blocks.",
        type: "success",
        isRead: false,
      },
      {
        user: viratUser._id,
        title: "New Document Pending Verification",
        message: "Student Arjun Kumar has uploaded College ID for onboarding verification.",
        type: "info",
        isRead: false,
      },
      {
        user: viratUser._id,
        title: "Gate Check-In Alert",
        message: "3 visitors logged through security turnstiles today.",
        type: "info",
        isRead: true,
      },
      {
        user: viratUser._id,
        title: "Maintenance Ticket Assigned",
        message: "Electrical socket repair assigned to facility engineering team.",
        type: "alert",
        isRead: true,
      },
    ];

    for (const n of notifs) {
      await Notification.create({ ...n, createdAt: ago(1) });
    }
    console.log("✅ Seeded user notifications");
  }

  console.log("\n🎉 ALL SAMPLE DATA RECORDS GENERATED SUCCESSFULLY!");
  await mongoose.disconnect();
  process.exit(0);
}

runSeeder().catch((err) => {
  console.error("❌ Seeder Error:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
