import express from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import db from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), (req, res) => {
  console.log("req.file", req.file);

  if (req.file) {
    console.log("Файл сохранен по пути:", req.file.path);
  } else {
    console.log("Файл не был загружен.");
  }

  const { userId } = req.body;
  console.log("userId", userId);
  if (!req.file || !userId) {
    return res.status(400).json({ error: "File and user ID required" });
  }

  const { filename } = req.file;
  const fileUrl = `/uploads/${filename}`;
  const id = uuidv4();

  try {
    const stmt = db.prepare(
      "INSERT INTO user_files (id, user_id, filename, path) VALUES (?, ?, ?, ?)"
    );
    stmt.run(id, userId, filename, fileUrl);

    res.json({
      message: "File uploaded",
      filename,
      url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Failed to save file" });
  }
});

router.get("/files/user/:userId", (req, res) => {
  const { userId } = req.params;

  const files = db
    .prepare("SELECT id, filename FROM user_files WHERE user_id = ?")
    .all(userId);

  if (!files.length) {
    return res.status(404).json({ error: "No files found" });
  }

  res.json({ files });
});

export default router;
