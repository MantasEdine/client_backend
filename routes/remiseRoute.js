import express from "express";
import {
  createRemise,
  getRemises,
  getRemisesByProduit,
  updateRemise,
  deleteRemise,
} from "../controllers/remiseController.js";
import { protect, rootOnly, canEditOrRoot } from "../middlewares/authMiddlware.js";

const router = express.Router();

router.get("/", protect, getRemises);
router.get("/produit/:produitId", protect, getRemisesByProduit);
router.post("/", protect, canEditOrRoot, createRemise); // Changed
router.put("/:id", protect, canEditOrRoot, updateRemise); // Changed
router.delete("/:id", protect, canEditOrRoot, deleteRemise); // Changed

export default router;