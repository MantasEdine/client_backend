import express from "express";
import {
  createLaboratoire,
  getLaboratoires,
  updateLaboratoire,
  deleteLaboratoire,
} from "../controllers/laboController.js";
import { protect, rootOnly, canEditOrRoot } from "../middlewares/authMiddlware.js";

const router = express.Router();

router.get("/", protect, getLaboratoires);
router.post("/", protect, canEditOrRoot, createLaboratoire); // Changed
router.put("/:id", protect, canEditOrRoot, updateLaboratoire); // Changed
router.delete("/:id", protect, canEditOrRoot, deleteLaboratoire); // Changed

export default router;