/**
 * @file ensureDemoAccounts.js
 * @description Idempotently ensures all quick-demo accounts exist in MongoDB
 * with active status, verified email, proper role profiles, and matching passwords.
 */

const User = require("../models/User");
const Student = require("../models/Student");
const { Admin, Warden } = require("../models/Support");
const Hostel = require("../models/Hostel");
const Block = require("../models/Block");
const Floor = require("../models/Floor");
const Room = require("../models/Room");
const Application = require("../models/Application");
const Allocation = require("../models/Allocation");
const logger = require("./logger");

async function ensureDemoAccounts() {
  try {
    logger.info("Verifying demo accounts existence and credentials...");

    // ── Clean up any orphaned admin or warden records whose users were deleted
    const allAdmins = await Admin.find({});
    for (const adm of allAdmins) {
      const u = await User.findById(adm.user);
      if (!u) {
        await Admin.deleteOne({ _id: adm._id });
        logger.info(`Cleaned up orphaned admin profile: ${adm.employeeId}`);
      }
    }

    const allWardens = await Warden.find({});
    for (const w of allWardens) {
      const u = await User.findById(w.user);
      if (!u) {
        await Warden.deleteOne({ _id: w._id });
        logger.info(`Cleaned up orphaned warden profile: ${w.employeeId}`);
      }
    }

    // ── 1. Admin: admin@bitsathy.ac.in / Admin@2026 ───────────────────────────
    let adminUser = await User.findOne({ email: "admin@bitsathy.ac.in" }).select("+password");
    if (!adminUser) {
      adminUser = await User.create({
        name: "Dr. S. Ramachandran",
        email: "admin@bitsathy.ac.in",
        password: "Admin@2026",
        role: "admin",
        isVerified: true,
        isActive: true,
      });
      logger.info("Created demo admin account: admin@bitsathy.ac.in");
    } else {
      let isMatch = await adminUser.comparePassword("Admin@2026");
      if (!isMatch || !adminUser.isActive || !adminUser.isVerified) {
        adminUser.password = "Admin@2026";
        adminUser.isActive = true;
        adminUser.isVerified = true;
        adminUser.role = "admin";
        await adminUser.save();
        logger.info("Updated demo admin password & status: admin@bitsathy.ac.in");
      }
    }

    let adminProfile = await Admin.findOne({ user: adminUser._id });
    if (!adminProfile) {
      // Check if employeeId is used
      let empId = "ADMIN-001";
      const existingAdm = await Admin.findOne({ employeeId: empId });
      if (existingAdm) empId = `ADMIN-${Date.now().toString().slice(-4)}`;

      await Admin.create({
        user: adminUser._id,
        employeeId: empId,
        isSuperAdmin: true,
        permissions: [
          "manage_students",
          "manage_wardens",
          "manage_rooms",
          "manage_fees",
          "view_analytics",
          "export_reports",
          "manage_settings",
          "super_admin",
        ],
        department: "Hostel Administration",
        phone: "+91 98765 43210",
        joiningDate: new Date("2018-06-01"),
      });
      logger.info("Created Admin profile for admin@bitsathy.ac.in");
    }

    // ── Also ensure virat@bitsathy.ac.in has valid password ───────────────────
    let viratUser = await User.findOne({ email: "virat@bitsathy.ac.in" }).select("+password");
    if (viratUser) {
      let matches = (await viratUser.comparePassword("Password@123")) || (await viratUser.comparePassword("Admin@2026"));
      if (!matches) {
        viratUser.password = "Password@123";
        viratUser.isActive = true;
        viratUser.isVerified = true;
        await viratUser.save();
      }
    }

    // ── Ensure Hostels & Blocks exist ────────────────────────────────────────
    let boysHostel = await Hostel.findOne({ type: "boys" }) || await Hostel.findOne({ name: /boys/i });
    if (!boysHostel) {
      boysHostel = await Hostel.create({
        name: "Emerald Boys Hostel",
        type: "boys",
        description: "Premier residential hall for engineering students with modern study rooms.",
        totalCapacity: 450,
        currentOccupancy: 0,
        contactPhone: "+91 94433 11223",
        contactEmail: "emerald.hostel@bitsathy.ac.in",
        address: "North Quadrangle, Bannari Amman Institute of Technology, Sathyamangalam",
        amenities: ["High-speed Wi-Fi", "RO Filtered Water", "Recreation Hall", "Gymnasium", "Laundromat"],
        rules: ["Curfew at 21:30", "ID card required at turnstiles", "Quiet hours after 22:00"],
        isActive: true,
        establishedYear: 2012,
      });
      logger.info("Created Emerald Boys Hostel");
    }

    let girlsHostel = await Hostel.findOne({ type: "girls" }) || await Hostel.findOne({ name: /girls/i });
    if (!girlsHostel) {
      girlsHostel = await Hostel.create({
        name: "Bhavani Girls Hostel",
        type: "girls",
        description: "Secure, modern residence with solar-heated water and 24/7 security.",
        totalCapacity: 350,
        currentOccupancy: 0,
        contactPhone: "+91 94433 44556",
        contactEmail: "bhavani.hostel@bitsathy.ac.in",
        address: "East Campus Gardens, Bannari Amman Institute of Technology, Sathyamangalam",
        amenities: ["24/7 Security", "Wi-Fi Hubs", "Reading Room", "Badminton Court", "Health Clinic"],
        rules: ["Curfew at 20:30", "Biometric verification required"],
        isActive: true,
        establishedYear: 2015,
      });
      logger.info("Created Bhavani Girls Hostel");
    }

    let blockA = await Block.findOne({ hostel: boysHostel._id, $or: [{ blockCode: "BLK-A" }, { blockName: /A/i }] });
    if (!blockA) {
      blockA = await Block.create({
        hostel: boysHostel._id,
        blockName: "Block A",
        blockCode: "BLK-A",
        totalFloors: 3,
        totalRooms: 40,
        gender: "boys",
        isActive: true,
        description: "Double sharing rooms",
      });
      logger.info("Created Block A");
    }

    let blockB = await Block.findOne({ hostel: boysHostel._id, $or: [{ blockCode: "BLK-B" }, { blockName: /B/i }] });
    if (!blockB) {
      blockB = await Block.create({
        hostel: boysHostel._id,
        blockName: "Block B",
        blockCode: "BLK-B",
        totalFloors: 3,
        totalRooms: 40,
        gender: "boys",
        isActive: true,
        description: "Triple sharing rooms",
      });
      logger.info("Created Block B");
    }

    let blockC = await Block.findOne({ hostel: girlsHostel._id, $or: [{ blockCode: "BLK-C" }, { blockName: /C/i }] });
    if (!blockC) {
      blockC = await Block.create({
        hostel: girlsHostel._id,
        blockName: "Block C",
        blockCode: "BLK-C",
        totalFloors: 3,
        totalRooms: 40,
        gender: "girls",
        isActive: true,
        description: "Double sharing rooms",
      });
      logger.info("Created Block C");
    }

    let blockD = await Block.findOne({ hostel: girlsHostel._id, $or: [{ blockCode: "BLK-D" }, { blockName: /D/i }] });
    if (!blockD) {
      blockD = await Block.create({
        hostel: girlsHostel._id,
        blockName: "Block D",
        blockCode: "BLK-D",
        totalFloors: 3,
        totalRooms: 40,
        gender: "girls",
        isActive: true,
        description: "Four sharing rooms",
      });
      logger.info("Created Block D");
    }

    // Ensure sample Floors and Rooms for auto-allocation
    const ensureFloorAndRooms = async (hostel, block, floorNum, roomPrefix) => {
      let fl = await Floor.findOne({ block: block._id, floorNumber: floorNum });
      if (!fl) {
        fl = await Floor.create({
          hostel: hostel._id,
          block: block._id,
          floorNumber: floorNum,
          floorName: floorNum === 1 ? "Ground Floor" : `Floor ${floorNum}`,
        });
      }
      for (let r = 1; r <= 3; r++) {
        const roomNum = `${roomPrefix}-${floorNum}0${r}`;
        let rm = await Room.findOne({ hostel: hostel._id, roomNumber: roomNum });
        if (!rm) {
          await Room.create({
            hostel: hostel._id,
            block: block._id,
            floor: fl._id,
            roomNumber: roomNum,
            floorNumber: floorNum,
            roomType: r === 1 ? "double" : r === 2 ? "triple" : "single",
            capacity: r === 1 ? 2 : r === 2 ? 3 : 1,
            currentOccupancy: 0,
            status: "available",
            monthlyFee: 4500,
            securityDeposit: 5000,
          });
        }
      }
    };

    try {
      await ensureFloorAndRooms(boysHostel, blockA, 1, "A");
      await ensureFloorAndRooms(boysHostel, blockA, 2, "A");
      await ensureFloorAndRooms(boysHostel, blockB, 1, "B");
      await ensureFloorAndRooms(girlsHostel, blockC, 1, "C");
      await ensureFloorAndRooms(girlsHostel, blockD, 1, "D");
    } catch (flErr) {
      logger.warn(`Notice during sample floor/room init: ${flErr.message}`);
    }

    // ── 2. Warden: warden.boysa@bitsathy.ac.in / Warden@2026 ──────────────────

    let wardenUser = await User.findOne({ email: "warden.boysa@bitsathy.ac.in" }).select("+password");
    if (!wardenUser) {
      wardenUser = await User.create({
        name: "Mr. P. Selvakumar",
        email: "warden.boysa@bitsathy.ac.in",
        password: "Warden@2026",
        role: "warden",
        isVerified: true,
        isActive: true,
      });
      logger.info("Created demo warden account: warden.boysa@bitsathy.ac.in");
    } else {
      let isMatch = await wardenUser.comparePassword("Warden@2026");
      if (!isMatch || !wardenUser.isActive || !wardenUser.isVerified) {
        wardenUser.password = "Warden@2026";
        wardenUser.isActive = true;
        wardenUser.isVerified = true;
        wardenUser.role = "warden";
        await wardenUser.save();
        logger.info("Updated demo warden password & status: warden.boysa@bitsathy.ac.in");
      }
    }

    let wardenProfile = await Warden.findOne({ user: wardenUser._id });
    if (!wardenProfile) {
      let empId = "WRD-001";
      const existingWrd = await Warden.findOne({ employeeId: empId });
      if (existingWrd) empId = `WRD-${Date.now().toString().slice(-4)}`;

      await Warden.create({
        user: wardenUser._id,
        employeeId: empId,
        designation: "Chief Warden",
        department: "Hostel Management",
        assignedHostel: boysHostel?._id,
        assignedBlock: blockA?._id,
        phone: "+91 98765 43211",
        joiningDate: new Date("2020-01-15"),
      });
      logger.info("Created Warden profile for warden.boysa@bitsathy.ac.in");
    }

    // ── 3. Student: student1@bitsathy.ac.in / Student@2026 ─────────────────────
    let studentUser = await User.findOne({ email: "student1@bitsathy.ac.in" }).select("+password");
    if (!studentUser) {
      studentUser = await User.create({
        name: "Arjun Kumar",
        email: "student1@bitsathy.ac.in",
        password: "Student@2026",
        role: "student",
        isVerified: true,
        isActive: true,
      });
      logger.info("Created demo student account: student1@bitsathy.ac.in");
    } else {
      let isMatch = await studentUser.comparePassword("Student@2026");
      if (!isMatch || !studentUser.isActive || !studentUser.isVerified) {
        studentUser.password = "Student@2026";
        studentUser.isActive = true;
        studentUser.isVerified = true;
        studentUser.role = "student";
        await studentUser.save();
        logger.info("Updated demo student password & status: student1@bitsathy.ac.in");
      }
    }

    let studentProfile = await Student.findOne({ user: studentUser._id });
    if (!studentProfile) {
      let regNo = "7376221CS001";
      const existingReg = await Student.findOne({ registerNumber: regNo });
      if (existingReg) regNo = `7376221CS${Math.floor(100 + Math.random() * 899)}`;

      studentProfile = await Student.create({
        user: studentUser._id,
        registerNumber: regNo,
        rollNumber: "21CSE001",
        department: "CSE",
        year: 3,
        semester: 5,
        section: "A",
        cgpa: 8.75,
        admissionYear: 2022,
        gender: "male",
        phone: "+91 98765 43212",
        parentPhone: "+91 98765 43213",
        nativeState: "Tamil Nadu",
        nativeCity: "Coimbatore",
        homeAddress: "12, College Road, Coimbatore",
        pincode: "641001",
        distanceFromCollege: 75,
        isHostelStudent: false,
        hostelStatus: "not_applied",
        emergencyContact: {
          name: "R. Kumar",
          relation: "Father",
          phone: "+91 98765 43213",
        },
      });
      logger.info("Created Student profile for student1@bitsathy.ac.in");
    }

    // Do not force pre-allocated room on demo student so the full application -> warden/admin approval -> allocation flow can be tested
    // Demo student can apply for a hostel and get approved by warden or admin

    // Seed sample leaves for demo student & warden dashboard if none exist
    const LeaveRequest = require("../models/LeaveRequest");
    const leaveCount = await LeaveRequest.countDocuments();
    if (leaveCount === 0 && studentProfile) {
      await LeaveRequest.create([
        {
          student: studentProfile._id,
          user: studentUser._id,
          leaveNumber: "LVR-2026-0001",
          leaveType: "home_visit",
          fromDate: new Date(Date.now() + 1 * 864e5),
          toDate: new Date(Date.now() + 4 * 864e5),
          reason: "Attending sister's wedding ceremony in Coimbatore",
          destination: "12, College Road, Coimbatore",
          status: "pending",
          emergencyPhone: "+91 98765 01234",
        },
        {
          student: studentProfile._id,
          user: studentUser._id,
          leaveNumber: "LVR-2026-0002",
          leaveType: "educational",
          fromDate: new Date(Date.now() + 6 * 864e5),
          toDate: new Date(Date.now() + 8 * 864e5),
          reason: "Inter-collegiate Hackathon at IIT Madras",
          destination: "IIT Madras, Chennai",
          status: "pending",
          emergencyPhone: "+91 98765 01234",
        },
      ]);
      logger.info("Seeded demo leave requests");
    }

    const Complaint = require("../models/Complaint");
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0 && studentProfile) {
      let room = await Room.findOne({ hostel: boysHostel?._id });
      await Complaint.create([
        {
          student: studentProfile._id,
          user: studentUser._id,
          room: room?._id,
          complaintNumber: "CMP-2026-0001",
          type: "internet",
          priority: "high",
          title: "Wi-Fi access point in Emerald Block A corridor intermittent",
          description: "Signal drops frequently during study hours between 8 PM and 11 PM.",
          status: "in_progress",
        },
        {
          student: studentProfile._id,
          user: studentUser._id,
          room: room?._id,
          complaintNumber: "CMP-2026-0002",
          type: "maintenance",
          priority: "medium",
          title: "Water geyser indicator light repair",
          description: "2nd floor bathroom geyser turns on but indicator bulb is fused.",
          status: "pending",
        },
      ]);
      logger.info("Seeded demo complaints");
    }

    const Visitor = require("../models/Visitor");
    const visitorCount = await Visitor.countDocuments();
    if (visitorCount === 0 && studentProfile) {
      await Visitor.create([
        {
          student: studentProfile._id,
          user: studentUser._id,
          name: "R. Kumar",
          visitorName: "R. Kumar",
          relationship: "Father",
          phone: "+91 98765 01234",
          idProofType: "Aadhaar",
          idProofNumber: "XXXX-XXXX-8492",
          visitDate: new Date(),
          expectedTimeIn: "10:00 AM",
          expectedTimeOut: "04:00 PM",
          purpose: "Family visit & term review",
          status: "approved",
        },
      ]);
      logger.info("Seeded demo visitors");
    }

    logger.info("✅ All demo accounts verified successfully: Admin, Warden, Student.");
  } catch (err) {
    logger.error(`Error ensuring demo accounts: ${err.message}`);
  }
}

module.exports = ensureDemoAccounts;
