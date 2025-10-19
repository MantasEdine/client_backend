import Laboratoire from "../models/Labo.js";

// ➕ Add laboratoire (Root only)
export const createLaboratoire = async (req, res) => {
  try {
    const { name, description, address, contact } = req.body;

    const existing = await Laboratoire.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Ce laboratoire existe déjà" });
    }

    const laboratoire = await Laboratoire.create({
      name,
      description,
      address,
      contact,
    });

    res.status(201).json({ success: true, laboratoire });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// 📋 Get all laboratoires
export const getLaboratoires = async (req, res) => {
  try {
    const laboratoires = await Laboratoire.find();
    res.json(laboratoires);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✏️ Update laboratoire (Root only)
export const updateLaboratoire = async (req, res) => {
  try {
    const laboratoire = await Laboratoire.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!laboratoire)
      return res.status(404).json({ message: "Laboratoire introuvable" });

    res.json(laboratoire);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ❌ Delete laboratoire (Root only)
export const deleteLaboratoire = async (req, res) => {
  try {
    const laboratoire = await Laboratoire.findByIdAndDelete(req.params.id);
    if (!laboratoire)
      return res.status(404).json({ message: "Laboratoire introuvable" });

    res.json({ success: true, message: "Laboratoire supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
