/**
 * @file CompatibilityResult.js
 * @description Stores AI compatibility results between two students.
 */
const mongoose = require("mongoose");

const compatibilityResultSchema = new mongoose.Schema({
  student1: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  student2: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },

  // ── Scores ────────────────────────────────────────────────
  overallScore:      { type: Number, min: 0, max: 100, required: true },
  overallPercentage: { type: Number, min: 0, max: 100, required: true },

  // ── Dimension Scores ──────────────────────────────────────
  dimensionScores: {
    sleepSchedule:  { type: Number },
    studyHabits:    { type: Number },
    cleanliness:    { type: Number },
    foodPreference: { type: Number },
    noiseTolerance: { type: Number },
    personality:    { type: Number },
    lifestyle:      { type: Number },
    interests:      { type: Number },
    social:         { type: Number },
  },

  // ── Match/Conflict Reasons ────────────────────────────────
  matchReasons:    [{ type: String }],
  conflictReasons: [{ type: String }],
  suggestions:     [{ type: String }],

  // ── Classification ────────────────────────────────────────
  compatibilityLevel: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
  },

  calculatedAt: { type: Date, default: Date.now },
  isValid:      { type: Boolean, default: true }, // Invalidated on profile update
}, { timestamps: true });

// Ensure unique pair (unordered)
compatibilityResultSchema.index(
  { student1: 1, student2: 1 },
  { unique: true }
);
compatibilityResultSchema.index({ student1: 1, overallScore: -1 });
compatibilityResultSchema.index({ student2: 1, overallScore: -1 });

module.exports = mongoose.model("CompatibilityResult", compatibilityResultSchema);
