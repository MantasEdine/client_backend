import express from "express";
import multer from "multer";
import { uploadExcel, getExcelFiles, downloadExcel } from "../controllers/excelController.js";
import { protect, rootOnly, canUploadOrRoot, canDownloadOrRoot } from "../middlewares/authMiddlware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/temp/" });

router.post("/upload", protect, upload.single("file"), uploadExcel); // Changed
router.get("/files", protect, getExcelFiles);
router.get("/download/:filename", protect, downloadExcel); // Changed

export default router;