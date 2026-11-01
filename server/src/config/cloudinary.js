/**
 * @file cloudinary.js
 * @description Cloudinary configuration for image uploads.
 * Exports configured multer-cloudinary storage and upload middleware.
 */

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// ─── Cloudinary SDK Configuration ────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ─── Storage Factories ────────────────────────────────────────────────────────

/**
 * Creates a Cloudinary storage engine for a given folder.
 * @param {string} folder - Cloudinary folder path
 * @param {string[]} allowedFormats - Allowed MIME formats
 * @returns {CloudinaryStorage}
 */
const createStorage = (folder, allowedFormats = ["jpg", "jpeg", "png", "webp"]) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `bit-hostel/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
  });

// ─── Upload Middleware ────────────────────────────────────────────────────────

/** Upload single profile picture (max 5MB) */
const uploadAvatar = multer({
  storage: createStorage("avatars"),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("avatar");

/** Upload student documents (PDF + images, max 10MB) */
const uploadDocument = multer({
  storage: createStorage("documents", ["jpg", "jpeg", "png", "pdf"]),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("document");

/** Upload complaint evidence image (max 10MB) */
const uploadComplaintImage = multer({
  storage: createStorage("complaints"),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("image");

/** Upload marketplace item photos (max 5 images, 10MB each) */
const uploadMarketplaceImages = multer({
  storage: createStorage("marketplace"),
  limits: { fileSize: 10 * 1024 * 1024 },
}).array("images", 5);

/** Upload notice attachments (PDF + images) */
const uploadNoticeAttachment = multer({
  storage: createStorage("notices", ["jpg", "jpeg", "png", "pdf"]),
  limits: { fileSize: 20 * 1024 * 1024 },
}).single("attachment");

/** Upload lost & found item photo */
const uploadLostFoundImage = multer({
  storage: createStorage("lost-found"),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("image");

/** Upload chat media (image + PDF) */
const uploadChatMedia = multer({
  storage: createStorage("chat", ["jpg", "jpeg", "png", "pdf"]),
  limits: { fileSize: 15 * 1024 * 1024 },
}).single("media");

// ─── Utility: Delete from Cloudinary ─────────────────────────────────────────

/**
 * Delete an asset from Cloudinary by public ID.
 * @param {string} publicId - Cloudinary public_id
 * @param {string} [resourceType="image"] - "image" | "video" | "raw"
 * @returns {Promise<object>}
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadDocument,
  uploadComplaintImage,
  uploadMarketplaceImages,
  uploadNoticeAttachment,
  uploadLostFoundImage,
  uploadChatMedia,
  deleteFromCloudinary,
};
