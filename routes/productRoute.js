import express from "express";
import {
  createProduit,
  getProduits,
  getProduitsByLaboratoire,
  updateProduit,
  deleteProduit,
} from "../controllers/productController.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";

const router = express.Router();

// Routes
router.get("/", protect, getProduits); // All authenticated users
router.get("/laboratoire/:laboratoireId", protect, getProduitsByLaboratoire);
router.post("/", protect, rootOnly, createProduit); // Root only
router.put("/:id", protect, rootOnly, updateProduit); // Root only
router.delete("/:id", protect, rootOnly, deleteProduit); // Root only

export default router;
