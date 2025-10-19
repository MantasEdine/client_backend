import Produit from "../models/Product.js";
import Laboratoire from "../models/Labo.js";

// ➕ Create a new product (Root only)
export const createProduit = async (req, res) => {
  try {
    const { name, description, laboratoireId, price } = req.body;

    // Verify laboratoire exists
    const laboratoire = await Laboratoire.findById(laboratoireId);
    if (!laboratoire) {
      return res.status(404).json({ message: "Laboratoire introuvable" });
    }

    // Check if product already exists in same laboratoire
    const existing = await Produit.findOne({ name, laboratoire: laboratoireId });
    if (existing) {
      return res.status(400).json({ message: "Ce produit existe déjà dans ce laboratoire" });
    }

    const produit = await Produit.create({
      name,
      description,
      laboratoire: laboratoireId,
      price,
    });

    res.status(201).json({ success: true, produit });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// 📋 Get all products (all users)
export const getProduits = async (req, res) => {
  try {
    const produits = await Produit.find().populate("laboratoire", "name");
    res.status(200).json(produits); // ✅ renvoie un tableau directement
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};


// 📋 Get products by laboratoire
export const getProduitsByLaboratoire = async (req, res) => {
  try {
    const produits = await Produit.find({ laboratoire: req.params.laboratoireId });
    res.json(produits);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✏️ Update product (Root only)
export const updateProduit = async (req, res) => {
  try {
    const produit = await Produit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!produit) return res.status(404).json({ message: "Produit introuvable" });
    res.json(produit);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ❌ Delete product (Root only)
export const deleteProduit = async (req, res) => {
  try {
    const produit = await Produit.findByIdAndDelete(req.params.id);
    if (!produit) return res.status(404).json({ message: "Produit introuvable" });
    res.json({ success: true, message: "Produit supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
