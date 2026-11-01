/**
 * @file fee.controller.js
 * @description Fee & payment management controller for admin portal.
 */
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const User    = require("../models/User");

// GET /api/payments/stats — aggregate fee statistics
exports.getFeeStats = async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalCollected, totalPending, monthCollected, byType, recentPayments] = await Promise.all([
    Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([{ $match: { status: "pending" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([
      { $match: { status: "paid", paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $group: { _id: "$paymentType", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: "student", populate: { path: "user", select: "name email avatar" } })
      .populate("user", "name"),
  ]);

  res.json({
    success: true,
    data: {
      totalCollected: totalCollected[0]?.total || 0,
      totalPending:   totalPending[0]?.total   || 0,
      monthCollected: monthCollected[0]?.total  || 0,
      byType,
      recentPayments,
    },
  });
};

// GET /api/payments/list — paginated payments with filters
exports.getPayments = async (req, res) => {
  const { page = 1, limit = 20, status, paymentType, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (status)      filter.status = status;
  if (paymentType) filter.paymentType = paymentType;

  let query = Payment.find(filter)
    .populate({ path: "student", populate: { path: "user", select: "name email avatar profileUrl" } })
    .populate("collectedBy", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const [payments, total] = await Promise.all([query, Payment.countDocuments(filter)]);

  res.json({
    success: true,
    data: {
      payments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    },
  });
};
