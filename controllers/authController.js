import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// ✅ Register (only Root can do this)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Only allow 'admin' role to be created (root already exists manually)
    if (role === "root") {
      return res.status(403).json({ message: "Vous ne pouvez pas créer un autre root." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Cet utilisateur existe déjà." });
    }

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✅ Login (any user)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = generateToken(user._id, user.role);
    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
// controllers/authController.js
export const logoutUser = (req, res) => {
  res.status(200).json({ success: true, message: "Déconnexion réussie (token supprimé côté client)" });
};
