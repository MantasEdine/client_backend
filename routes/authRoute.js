import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/authController.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";
import User from "../models/User.js"
import jwt from "jsonwebtoken"
const router = express.Router();
import mongoose from "mongoose";
// Login (public)
router.post("/login", loginUser);

// Register admin (root only)
router.post("/register", protect, rootOnly, registerUser);

// Optional: view all users (root only)
router.get("/users", protect, rootOnly, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});
// authRoute.js
router.get("/check-access/:id", protect, async (req, res) => {
  try {
    let token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Root users always have full access
    const isRoot = decoded.role === "root";

    res.json({
      canEdit: isRoot || user.canEdit || false,
      canUpload: isRoot || user.canUpload || false,
      canDownload: isRoot || user.canDownload || false
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", protect, logoutUser);

export default router;
