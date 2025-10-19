import Fournisseur from "../models/Fournisseur.js";

// ➕ Add fournisseur (Root or allowed Admin)
export const createFournisseur = async (req, res) => {
  try {
    const { name, contact, email, phone } = req.body;
    const existing = await Fournisseur.findOne({ name });
    if (existing) return res.status(400).json({ message: "Fournisseur existe déjà" });

    const fournisseur = await Fournisseur.create({ name, contact, email, phone });
    res.status(201).json({ success: true, fournisseur });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// 📋 Get all fournisseurs
export const getFournisseurs = async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.find();
    res.json(fournisseurs);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✏️ Update fournisseur
export const updateFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(fournisseur);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ❌ Delete fournisseur
export const deleteFournisseur = async (req, res) => {
  try {
    await Fournisseur.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Fournisseur supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
