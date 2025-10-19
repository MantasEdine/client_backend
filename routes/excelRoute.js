import express from "express";
import multer from "multer";
import { uploadExcel, downloadExcel } from "../controllers/excelController.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Root can upload & download
router.post("/upload", protect, rootOnly, upload.single("file"), uploadExcel);
router.get("/download", protect, rootOnly, downloadExcel);

export default router;
