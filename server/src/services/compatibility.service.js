/**
 * @file compatibility.service.js
 * @description AI Roommate Compatibility Engine.
 *
 * Uses a weighted multi-dimensional scoring algorithm to compute
 * compatibility between two students based on lifestyle parameters.
 *
 * Algorithm: Weighted Cosine Similarity + Rule-Based Hard Filters
 * Score Range: 0–100 (percentage)
 */

const CompatibilityProfile = require("../models/CompatibilityProfile");
const CompatibilityResult  = require("../models/CompatibilityResult");
const Student = require("../models/Student");

// ─── Dimension Weights (must sum to 1.0) ─────────────────────────────────────
const WEIGHTS = {
  sleepSchedule:  0.15,  // Most critical — sleep conflict = major issue
  studyHabits:    0.12,
  cleanliness:    0.12,
  foodPreference: 0.08,
  noiseTolerance: 0.10,
  personality:    0.08,
  lifestyle:      0.10,  // Smoking, drinking
  interests:      0.10,  // Hobbies, gaming, sports, reading
  social:         0.08,  // Introvert/extrovert, guests
  language:       0.05,  // Native language match
  roomPreferences: 0.02, // Temperature, lights-off time
};

// ─── Scoring Helpers ──────────────────────────────────────────────────────────

/**
 * Ordinal distance scoring for enum fields.
 * Returns 1.0 for exact match, reduces by distance.
 */
const ordinalScore = (val1, val2, orderedValues) => {
  const i1 = orderedValues.indexOf(val1);
  const i2 = orderedValues.indexOf(val2);
  if (i1 === -1 || i2 === -1) return 0.5; // Unknown → neutral
  const maxDist = orderedValues.length - 1;
  return 1 - Math.abs(i1 - i2) / maxDist;
};

/**
 * Numeric proximity scoring (1.0 = same, 0 = max distance).
 */
const numericScore = (n1, n2, min = 1, max = 5) => {
  if (!n1 || !n2) return 0.5;
  return 1 - Math.abs(n1 - n2) / (max - min);
};

/**
 * Boolean match scoring.
 */
const boolScore = (b1, b2) => {
  if (b1 === undefined || b2 === undefined) return 0.5;
  return b1 === b2 ? 1.0 : 0.2;
};

/**
 * Array overlap Jaccard similarity.
 */
const jaccardScore = (arr1 = [], arr2 = []) => {
  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  const set2 = new Set(arr2.map((s) => s.toLowerCase()));
  const intersection = [...set1].filter((x) => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0.5 : intersection / union;
};

// ─── Match/Conflict Reason Generators ────────────────────────────────────────

const SLEEP_ORDER = ["before_9pm", "9pm_11pm", "11pm_1am", "after_1am"];
const WAKE_ORDER  = ["before_5am", "5am_7am", "7am_9am", "after_9am"];
const STUDY_ORDER = ["early_morning", "daytime", "evening", "night_owl", "irregular"];
const MUSIC_ORDER = ["none", "headphones_only", "soft_music_ok", "any_music_ok"];
const TEMP_ORDER  = ["cold", "moderate", "warm"];
const LIGHTS_ORDER= ["by_10pm", "by_11pm", "by_midnight", "after_midnight"];
const GUESTS_ORDER= ["not_ok", "occasionally_ok", "always_ok"];

/**
 * Generate human-readable match and conflict reasons.
 */
const generateReasons = (p1, p2, scores) => {
  const matches   = [];
  const conflicts = [];
  const suggestions = [];

  // Sleep Schedule
  if (scores.sleepSchedule >= 0.8) {
    matches.push("✔ Similar sleep schedules");
  } else if (scores.sleepSchedule < 0.4) {
    conflicts.push("⚠ Very different sleep schedules");
    suggestions.push("Use eye masks and agree on a lights-off time to manage sleep differences.");
  }

  // Study Habits
  if (scores.studyHabits >= 0.8) {
    matches.push("✔ Compatible study habits");
  } else if (scores.studyHabits < 0.4) {
    conflicts.push("⚠ Different study times (one is a night owl, other is an early riser)");
  }

  // Cleanliness
  if (scores.cleanliness >= 0.8) {
    matches.push("✔ Similar cleanliness standards");
  } else if (scores.cleanliness < 0.4) {
    conflicts.push("⚠ Different cleanliness expectations");
    suggestions.push("Create a weekly cleaning schedule to align on room hygiene.");
  }

  // Food Preference
  if (p1.foodPreference === p2.foodPreference) {
    matches.push(`✔ Same food preference (${p1.foodPreference?.replace("_", " ")})`);
  } else if (
    (p1.foodPreference === "vegetarian" || p1.foodPreference === "vegan") &&
    (p2.foodPreference === "non_vegetarian")
  ) {
    conflicts.push("⚠ Food preference conflict (veg vs non-veg)");
    suggestions.push("Designate separate areas for food storage and agree on mess usage.");
  }

  // Noise Tolerance
  if (scores.noiseTolerance >= 0.8) {
    matches.push("✔ Compatible noise tolerance");
  } else if (scores.noiseTolerance < 0.4) {
    conflicts.push("⚠ Different noise tolerance levels");
  }

  // Lifestyle — Smoking/Drinking
  if (p1.smoking === "no" && p2.smoking === "no") {
    matches.push("✔ Both are non-smokers");
  } else if (p1.smoking !== "no" || p2.smoking !== "no") {
    conflicts.push("⚠ Different smoking preferences");
  }

  if (p1.drinking === "no" && p2.drinking === "no") {
    matches.push("✔ Both are non-drinkers");
  }

  // Interests
  if (p1.sportsInterest && p2.sportsInterest) matches.push("✔ Shared sports interest");
  if (p1.gamingInterest  && p2.gamingInterest)  matches.push("✔ Both gaming enthusiasts");
  if (p1.readingHabit    && p2.readingHabit)    matches.push("✔ Both enjoy reading");
  if (p1.fitnessInterest && p2.fitnessInterest) matches.push("✔ Shared fitness interest");

  // Music
  if (p1.musicPreference === "none" && p2.musicPreference !== "none") {
    conflicts.push("⚠ Music preference conflict (one prefers silence)");
  } else if (p1.musicPreference === p2.musicPreference) {
    matches.push("✔ Compatible music preferences");
  }

  // Social
  if (scores.social >= 0.8) {
    matches.push("✔ Similar social preferences");
  } else if (scores.social < 0.4) {
    conflicts.push("⚠ Different social styles (introvert vs extrovert)");
    suggestions.push("Respect each other's alone time and social energy needs.");
  }

  // Room Temperature
  if (p1.roomTemperature === p2.roomTemperature) {
    matches.push("✔ Agree on room temperature");
  } else {
    conflicts.push("⚠ Different room temperature preferences");
  }

  return { matches, conflicts, suggestions };
};

// ─── Core Compatibility Calculator ───────────────────────────────────────────

/**
 * Calculate compatibility score between two compatibility profiles.
 * @param {object} p1 - CompatibilityProfile document for student 1
 * @param {object} p2 - CompatibilityProfile document for student 2
 * @returns {{ score: number, percentage: number, dimensions: object, matches: string[], conflicts: string[], level: string }}
 */
const calculateCompatibility = (p1, p2) => {
  // ── Hard Filters (automatic conflict) ──────────────────
  // Smoking mismatch is a hard conflict — reduce score significantly
  const smokingPenalty =
    (p1.smoking === "no" && p2.smoking === "yes") ||
    (p1.smoking === "yes" && p2.smoking === "no") ? 0.3 : 0;

  const drinkingPenalty =
    (p1.drinking === "no" && p2.drinking === "yes") ||
    (p1.drinking === "yes" && p2.drinking === "no") ? 0.15 : 0;

  // ── Dimension Scores ────────────────────────────────────
  const sleepScore = (
    ordinalScore(p1.sleepTime, p2.sleepTime, SLEEP_ORDER) * 0.6 +
    ordinalScore(p1.lightsOffTime, p2.lightsOffTime, LIGHTS_ORDER) * 0.4
  );

  const studyScore = (
    ordinalScore(p1.studyHabit, p2.studyHabit, STUDY_ORDER) * 0.7 +
    numericScore(p1.studyIntensity === "very_intense" ? 4 : p1.studyIntensity === "moderate" ? 3 : 2,
                 p2.studyIntensity === "very_intense" ? 4 : p2.studyIntensity === "moderate" ? 3 : 2,
                 1, 4) * 0.3
  );

  const cleanlinessScore = numericScore(p1.cleanlinessLevel, p2.cleanlinessLevel);

  const foodScore = p1.foodPreference === p2.foodPreference ? 1.0 :
    ((p1.foodPreference === "vegan" || p2.foodPreference === "vegan") &&
     (p1.foodPreference === "vegetarian" || p2.foodPreference === "vegetarian")) ? 0.8 :
    ((p1.foodPreference === "vegetarian" || p1.foodPreference === "vegan") &&
     p2.foodPreference === "non_vegetarian") ? 0.3 : 0.6;

  const noiseScore = numericScore(p1.noiseTolerance, p2.noiseTolerance);

  const personalityScore = (
    numericScore(p1.introvertExtrovert, p2.introvertExtrovert) * 0.7 +
    (p1.personalityType && p2.personalityType ?
      (p1.personalityType[0] === p2.personalityType[0] ? 1 : 0.5) * 0.3 : 0.3)
  );

  const lifestyleScore = Math.max(0,
    1 -
    (p1.smoking !== p2.smoking ? 0.5 : 0) -
    (p1.drinking !== p2.drinking ? 0.3 : 0) -
    smokingPenalty - drinkingPenalty
  );

  const interestScore = (
    boolScore(p1.sportsInterest,  p2.sportsInterest)  * 0.25 +
    boolScore(p1.gamingInterest,  p2.gamingInterest)   * 0.25 +
    boolScore(p1.readingHabit,    p2.readingHabit)     * 0.25 +
    boolScore(p1.fitnessInterest, p2.fitnessInterest)  * 0.25
  );

  const socialScore = (
    numericScore(p1.introvertExtrovert, p2.introvertExtrovert) * 0.5 +
    ordinalScore(p1.guestsInRoom, p2.guestsInRoom, GUESTS_ORDER) * 0.5
  );

  const languageScore = jaccardScore(p1.languages || [], p2.languages || []);

  const roomPrefScore = (
    ordinalScore(p1.roomTemperature, p2.roomTemperature, TEMP_ORDER) * 0.5 +
    ordinalScore(p1.musicPreference, p2.musicPreference, MUSIC_ORDER) * 0.5
  );

  // ── Weighted Final Score ────────────────────────────────
  const dimensionScores = {
    sleepSchedule:  Math.round(sleepScore * 100),
    studyHabits:    Math.round(studyScore * 100),
    cleanliness:    Math.round(cleanlinessScore * 100),
    foodPreference: Math.round(foodScore * 100),
    noiseTolerance: Math.round(noiseScore * 100),
    personality:    Math.round(personalityScore * 100),
    lifestyle:      Math.round(lifestyleScore * 100),
    interests:      Math.round(interestScore * 100),
    social:         Math.round(socialScore * 100),
    language:       Math.round(languageScore * 100),
    roomPreferences: Math.round(roomPrefScore * 100),
  };

  const rawScore =
    sleepScore      * WEIGHTS.sleepSchedule +
    studyScore      * WEIGHTS.studyHabits +
    cleanlinessScore * WEIGHTS.cleanliness +
    foodScore       * WEIGHTS.foodPreference +
    noiseScore      * WEIGHTS.noiseTolerance +
    personalityScore * WEIGHTS.personality +
    lifestyleScore  * WEIGHTS.lifestyle +
    interestScore   * WEIGHTS.interests +
    socialScore     * WEIGHTS.social +
    languageScore   * WEIGHTS.language +
    roomPrefScore   * WEIGHTS.roomPreferences;

  const percentage = Math.round(Math.max(0, Math.min(100, rawScore * 100)));

  // ── Compatibility Level ─────────────────────────────────
  const level =
    percentage >= 85 ? "excellent" :
    percentage >= 70 ? "good" :
    percentage >= 50 ? "fair" : "poor";

  // ── Reasons ─────────────────────────────────────────────
  const { matches, conflicts, suggestions } = generateReasons(p1, p2, {
    sleepSchedule: sleepScore,
    studyHabits:   studyScore,
    cleanliness:   cleanlinessScore,
    noiseTolerance: noiseScore,
    social:        socialScore,
  });

  return {
    score:      percentage,
    percentage,
    dimensionScores,
    matchReasons:    matches,
    conflictReasons: conflicts,
    suggestions,
    compatibilityLevel: level,
  };
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Calculate and persist compatibility between two students.
 * @param {string} studentId1
 * @param {string} studentId2
 * @returns {object} Compatibility result
 */
const computeAndSave = async (studentId1, studentId2) => {
  const [p1, p2] = await Promise.all([
    CompatibilityProfile.findOne({ student: studentId1 }),
    CompatibilityProfile.findOne({ student: studentId2 }),
  ]);

  if (!p1 || !p2) {
    throw new Error("Both students must complete their compatibility profiles.");
  }
  if (!p1.isComplete || !p2.isComplete) {
    throw new Error("Both students must complete all required profile fields.");
  }

  const result = calculateCompatibility(p1, p2);

  // Ensure consistent ordering (smaller ID first)
  const [s1, s2] = [studentId1.toString(), studentId2.toString()].sort();

  const saved = await CompatibilityResult.findOneAndUpdate(
    { student1: s1, student2: s2 },
    {
      student1: s1, student2: s2,
      overallScore:       result.score,
      overallPercentage:  result.percentage,
      dimensionScores:    result.dimensionScores,
      matchReasons:       result.matchReasons,
      conflictReasons:    result.conflictReasons,
      suggestions:        result.suggestions,
      compatibilityLevel: result.compatibilityLevel,
      calculatedAt:       new Date(),
      isValid:            true,
    },
    { upsert: true, new: true }
  );

  return saved;
};

/**
 * Get top N recommended roommates for a student.
 * @param {string} studentId - The requesting student's ID
 * @param {number} limit - Number of recommendations (default 10)
 * @param {object} filters - { gender, department, year }
 * @returns {Array} Ranked list of compatible students with scores
 */
const getRecommendations = async (studentId, limit = 10, filters = {}) => {
  const myProfile = await CompatibilityProfile.findOne({ student: studentId });
  if (!myProfile || !myProfile.isComplete) {
    throw new Error("Please complete your compatibility profile first.");
  }

  const myStudent = await Student.findById(studentId);

  // Build filter query for candidate students
  const candidateQuery = {
    _id: { $ne: studentId },
    hostelStatus: { $in: ["not_applied", "pending", "approved", "waitlisted"] },
  };

  // Match gender for hostel allocation
  if (myStudent.gender) candidateQuery.gender = myStudent.gender;
  if (filters.department) candidateQuery.department = filters.department;
  if (filters.year) candidateQuery.year = parseInt(filters.year);

  const candidates = await Student.find(candidateQuery)
    .select("_id user registerNumber department year gender")
    .populate("user", "name avatar")
    .limit(100); // Score top 100 candidates

  const candidateProfiles = await CompatibilityProfile.find({
    student: { $in: candidates.map((c) => c._id) },
    isComplete: true,
  });

  const profileMap = {};
  candidateProfiles.forEach((p) => (profileMap[p.student.toString()] = p));

  // Score all candidates
  const scored = candidates
    .filter((c) => profileMap[c._id.toString()])
    .map((c) => {
      const result = calculateCompatibility(myProfile, profileMap[c._id.toString()]);
      return { student: c, ...result };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
};

module.exports = { computeAndSave, getRecommendations, calculateCompatibility };
