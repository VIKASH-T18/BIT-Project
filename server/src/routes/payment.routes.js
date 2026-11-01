/**
 * @file payment.routes.js
 * @description Payment & fee management API routes for students and staff.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const Payment = require("../models/Payment");
const Student = require("../models/Student");

// GET /api/payments/my — get current student's payments & dues summary
router.get("/my", authenticate, async (req, res) => {
  try {
    let payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });

    if (!payments) {
      payments = [];
    }

    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalPending = payments
      .filter((p) => p.status === "pending")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalFee: totalPaid + totalPending,
          totalPaid,
          pendingDues: totalPending,
          nextDueDate: new Date(Date.now() + 15 * 864e5),
        },
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/payments/pay — pay dues simulation
router.post("/pay", authenticate, async (req, res) => {
  try {
    const { paymentId, paymentType = "mess_fee", amount = 4500, gateway = "upi" } = req.body;
    const student = await Student.findOne({ user: req.user._id });

    let payment;
    if (paymentId) {
      payment = await Payment.findByIdAndUpdate(
        paymentId,
        {
          status: "paid",
          paidAt: new Date(),
          gateway,
          transactionId: `TXN${Date.now()}`,
        },
        { new: true }
      );
    } else {
      const count = await Payment.countDocuments();
      payment = await Payment.create({
        user: req.user._id,
        student: student?._id || req.user._id,
        paymentNumber: `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`,
        paymentType,
        amount,
        status: "paid",
        paidAt: new Date(),
        gateway,
        transactionId: `UPI/BIT/${Date.now().toString().slice(-8)}`,
        description: "Online payment cleared",
        academicYear: "2025-26",
      });
    }

    res.json({
      success: true,
      message: `Payment of ₹${amount.toLocaleString()} processed successfully!`,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin stats
router.get("/stats", authenticate, authorize("admin", "warden"), async (req, res) => {
  res.json({
    success: true,
    data: {
      totalCollected: 1250000,
      totalPending: 84000,
      collectionRate: 93.7,
    },
  });
});

module.exports = router;
