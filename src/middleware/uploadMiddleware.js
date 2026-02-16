import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const baseUploadPath = path.join(process.cwd(), "src", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    if (req.uploadType === "profile") folder = "profiles";
    if (req.uploadType === "product") folder = "products";
    if (req.uploadType === "storelogo") folder = "storelogo";

    const finalPath = path.join(baseUploadPath, folder);
    ensureDir(finalPath);

    cb(null, finalPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter (security)
const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|webp/;

  const extname = path.extname(file.originalname).toLowerCase();
  const isValidExt = allowedExt.test(extname);

  if (!isValidExt) {
    return cb(new Error("Only image files are allowed"));
  }

  cb(null, true);
};


export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max
  }
});
