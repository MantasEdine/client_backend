// /routes/userRoute.js
import express from "express";
import User from "../models/User.js";
import { protect, rootOnly } from "../middlewares/authMiddlware.js";

const router = express.Router();

router.put("/:id/permissions", protect, rootOnly, async (req, res) => {
  const requester = req.user;
  if (requester.role !== "root")
    return res.status(403).json({ message: "Forbidden" });

  const { id } = req.params;
  const { canEdit, canUpload, canDownload } = req.body;

  try {
    // Use findByIdAndUpdate to skip pre-save hooks
    const user = await User.findByIdAndUpdate(
      id,
      {
        canEdit: !!canEdit,
        canUpload: !!canUpload,
        canDownload: !!canDownload
      },
      { new: true, runValidators: true } // Return updated document
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Emit socket event to notify the user their permissions changed
    req.io.emit("permission-updated", { userId: id });

    res.json({ message: "Permissions updated", user });
  } catch (err) {
    console.error("Error updating permissions:", err); // Add logging
    res.status(500).json({ message: err.message });
  }
});

export default router;
