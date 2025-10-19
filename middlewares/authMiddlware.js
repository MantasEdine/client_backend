import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect route (requires token)
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      
      
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Pas de token fourni" });
  }
};

// Only Root can access
export const rootOnly = (req, res, next) => {
     let token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded && decoded.role === "root") {
    console.log("✅ Access granted (root)");

    next();
  } else {
    console.log("❌ Access denied:", req.user?.role);
    console.log(req.user);
    res.status(403).json({ message: "Accès refusé (Root uniquement)" });
  }
};
export const canEditOrRoot = (req, res, next) => {
  
  if (req.user.name === "Houssam Benani" || req.user.canEdit) {
    console.log("✅ Edit access granted:", req.user.role, req.user.canEdit);
    next();
  } else {
    console.log("❌ Edit access denied");
    res.status(403).json({ message: "Vous n'avez pas la permission de modifier" });
  }
};

// NEW: Check if user can upload (Root OR admin with canUpload permission)
export const canUploadOrRoot = (req, res, next) => {
  
  if (req.role ==="root" || req.user.canUpload) {
    console.log("✅ Upload access granted");
    next();
  } else {
    console.log("❌ Upload access denied");
    res.status(403).json({ message: "Vous n'avez pas la permission d'importer" });
  }
};

// NEW: Check if user can download (Root OR admin with canDownload permission)
export const canDownloadOrRoot = (req, res, next) => {
  if (req.user.name === "Houssam Benani"|| req.user.canDownload) {
    console.log("✅ Download access granted");
    next();
  } else {
    console.log("❌ Download access denied");
    res.status(403).json({ message: "Vous n'avez pas la permission de télécharger" });
  }
};