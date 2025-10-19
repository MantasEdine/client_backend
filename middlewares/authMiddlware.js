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
