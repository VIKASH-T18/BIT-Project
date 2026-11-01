/**
 * @file CompatibilityProfile.js
 * @description Lifestyle compatibility profile for AI roommate matching.
 * 20+ parameters used in weighted cosine similarity algorithm.
 */

const mongoose = require("mongoose");

const compatibilityProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },

    // ── Sleep & Wake Schedule ──────────────────────────────
    sleepTime: {
      type: String,
      enum: ["before_9pm", "9pm_11pm", "11pm_1am", "after_1am"],
    },
    wakeTime: {
      type: String,
      enum: ["before_5am", "5am_7am", "7am_9am", "after_9am"],
    },

    // ── Study Habits ───────────────────────────────────────
    studyHabit: {
      type: String,
      enum: ["early_morning", "daytime", "evening", "night_owl", "irregular"],
    },
    studyIntensity: {
      type: String,
      enum: ["very_intense", "moderate", "casual", "minimal"],
    },

    // ── Cleanliness ────────────────────────────────────────
    cleanlinessLevel: {
      type: Number,
      min: 1,
      max: 5, // 1 = messy, 5 = very clean
    },

    // ── Food Preference ────────────────────────────────────
    foodPreference: {
      type: String,
      enum: ["vegetarian", "non_vegetarian", "vegan", "eggetarian", "jain"],
    },

    // ── Noise Tolerance ────────────────────────────────────
    noiseTolerance: {
      type: Number,
      min: 1,
      max: 5, // 1 = needs silence, 5 = doesn't mind noise
    },

    // ── Personality ────────────────────────────────────────
    personalityType: {
      type: String,
      enum: ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
             "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"],
    },
    introvertExtrovert: {
      type: Number,
      min: 1,
      max: 5, // 1 = very introvert, 5 = very extrovert
    },

    // ── Lifestyle ──────────────────────────────────────────
    smoking: {
      type: String,
      enum: ["no", "occasionally", "yes"],
      default: "no",
    },
    drinking: {
      type: String,
      enum: ["no", "occasionally", "yes"],
      default: "no",
    },

    // ── Room Preferences ───────────────────────────────────
    roomTemperature: {
      type: String,
      enum: ["cold", "moderate", "warm"],
    },
    lightsOffTime: {
      type: String,
      enum: ["by_10pm", "by_11pm", "by_midnight", "after_midnight"],
    },

    // ── Interests ──────────────────────────────────────────
    musicPreference: {
      type: String,
      enum: ["none", "headphones_only", "soft_music_ok", "any_music_ok"],
    },
    sportsInterest:  { type: Boolean, default: false },
    gamingInterest:  { type: Boolean, default: false },
    readingHabit:    { type: Boolean, default: false },
    fitnessInterest: { type: Boolean, default: false },

    // ── Social ─────────────────────────────────────────────
    guestsInRoom: {
      type: String,
      enum: ["not_ok", "occasionally_ok", "always_ok"],
    },
    languages: [{ type: String }],

    // ── Religious / Cultural (Optional) ───────────────────
    religiousPreference: {
      type: String,
      enum: ["not_important", "moderately_important", "very_important"],
      default: "not_important",
    },

    // ── Profile Status ─────────────────────────────────────
    isComplete: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── Pre-save: Mark Complete ──────────────────────────────────────────────────
compatibilityProfileSchema.pre("save", function (next) {
  const requiredFields = [
    this.sleepTime, this.wakeTime, this.studyHabit,
    this.cleanlinessLevel, this.foodPreference,
    this.noiseTolerance, this.introvertExtrovert, this.smoking,
    this.drinking, this.roomTemperature,
  ];
  this.isComplete = requiredFields.every((f) => f !== undefined && f !== null);
  if (this.isComplete && !this.completedAt) {
    this.completedAt = new Date();
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model("CompatibilityProfile", compatibilityProfileSchema);
