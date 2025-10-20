// routes/commandeRoute.js
import express from "express";
import { 
  createCommande, 
  getCommandes, 
  getCommandeById,
  updateCommandeStatus,
  deleteCommande,
  exportCommandesToExcel,
  downloadCommandesExcel,
  getCommandesFiles,
  createCommandesBatch
} from "../controllers/commandController.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";

const router = express.Router();

// ✅ Routes publiques (protégées par authentification)
router.get("/", protect, getCommandes);
router.get("/files", protect, getCommandesFiles);
router.get("/:id", protect, getCommandeById);

// ✅ Création de commandes (admin et root)
router.post("/", protect, createCommande);
router.post("/batch", protect, createCommandesBatch);

// ✅ Export Excel (admin et root)
router.get("/export/excel", protect, exportCommandesToExcel);
router.get("/download/:filename", protect, downloadCommandesExcel);

// ✅ Mise à jour et suppression (root uniquement)
router.put("/:id/status", protect, rootOnly, updateCommandeStatus);
router.delete("/:id", protect, rootOnly, deleteCommande);

export default router;