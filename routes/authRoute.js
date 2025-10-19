import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/authController.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";
import User from "../models/User.js"
const router = express.Router();

// Login (public)
router.post("/login", loginUser);

// Register admin (root only)
router.post("/register", protect, rootOnly, registerUser);

// Optional: view all users (root only)
router.get("/users", protect, rootOnly, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});
router.post("/logout", protect, logoutUser);

export default router;
