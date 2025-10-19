import express from "express";
import {
  createLaboratoire,
  getLaboratoires,
  updateLaboratoire,
  deleteLaboratoire,
} from "../controllers/laboController.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";

const router = express.Router();

// Routes
router.get("/", protect, getLaboratoires); // Any authenticated user
router.post("/", protect, rootOnly, createLaboratoire); // Root only
router.put("/:id", protect, rootOnly, updateLaboratoire); // Root only
router.delete("/:id", protect, rootOnly, deleteLaboratoire); // Root only

export default router;
