import express from "express";
import multer from "multer";
import { uploadExcel, getExcelFiles, downloadExcel } from "../controllers/excelController.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/temp/" });

// 📤 Upload Excel (Root only)
router.post("/upload", protect, rootOnly, upload.single("file"), uploadExcel);

// 📋 Liste des fichiers Excel disponibles
router.get("/files", protect, getExcelFiles);

// 📥 Télécharger un fichier Excel spécifique
router.get("/download/:filename", protect, downloadExcel);

export default router;