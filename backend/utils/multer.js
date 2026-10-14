
const multer = require("multer");
const path = require("path");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".jpe",
  ".png",
  ".webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per image
    files: 5,                  // Maximum 5 images per request
    fields: 20,
    parts: 25,
  },

  fileFilter: (req, file, callback) => {
    console.log("Upload file:", {
        name: file.originalname,
        mimeType: file.mimetype,
    });

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (
      !allowedMimeTypes.has(file.mimetype) ||
      !allowedExtensions.has(extension)
    ) {
      return callback(
        new Error("Only JPG, PNG, and WEBP images are allowed.")
      );
    }

    callback(null, true);
  },
});

module.exports = upload;
