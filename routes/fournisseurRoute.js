import express from "express";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";
import {
  createFournisseur,
  getFournisseurs,
  updateFournisseur,
  deleteFournisseur
} from "../controllers/fournisseurController.js";

const router = express.Router();

// Routes
router.get("/", protect, getFournisseurs);              // Read (any logged user)
router.post("/", protect, rootOnly, createFournisseur); // Create (Root only)
router.put("/:id", protect, rootOnly, updateFournisseur); // Update (Root only)
router.delete("/:id", protect, rootOnly, deleteFournisseur); // Delete (Root only)

export default router;
