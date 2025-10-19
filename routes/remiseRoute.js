import express from "express";
import {
  createRemise,
  getRemises,
  getRemisesByProduit,
  updateRemise,
  deleteRemise,
} from "../controllers/remiseController.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";

const router = express.Router();

// Routes
router.get("/", protect, getRemises); // All authenticated users
router.get("/produit/:produitId", protect, getRemisesByProduit); // Sorted by product
router.post("/", protect, rootOnly, createRemise); // Root only
router.put("/:id", protect, rootOnly, updateRemise); // Root only
router.delete("/:id", protect, rootOnly, deleteRemise); // Root only

export default router;
