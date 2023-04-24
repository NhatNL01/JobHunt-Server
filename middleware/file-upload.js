const multer = require("multer");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/vnd.rar": "rar",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "ppt",
};

const fileUpload = multer({
  limits: 500000,
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    console.log(file.mimetype);
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

exports.fileUpload = fileUpload;
