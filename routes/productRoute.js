import express from "express";
import {
  createProduit,
  getProduits,
  getProduitsByLaboratoire,
  updateProduit,
  deleteProduit,
} from "../controllers/productController.js";
import { protect, rootOnly, canEditOrRoot } from "../middlewares/authMiddlware.js";

const router = express.Router();

router.get("/", protect, getProduits);
router.get("/laboratoire/:laboratoireId", protect, getProduitsByLaboratoire);
router.post("/", protect, canEditOrRoot, createProduit); // Changed
router.put("/:id", protect, canEditOrRoot, updateProduit); // Changed
router.delete("/:id", protect, canEditOrRoot, deleteProduit); // Changed

export default router;