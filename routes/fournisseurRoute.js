import express from "express";
import { protect, rootOnly, canEditOrRoot } from "../middlewares/authMiddlware.js";
import {
  createFournisseur,
  getFournisseurs,
  updateFournisseur,
  deleteFournisseur
} from "../controllers/fournisseurController.js";

const router = express.Router();

router.get("/", protect, getFournisseurs);
router.post("/", protect, canEditOrRoot, createFournisseur); // Changed
router.put("/:id", protect, canEditOrRoot, updateFournisseur); // Changed
router.delete("/:id", protect, canEditOrRoot, deleteFournisseur); // Changed

export default router;