import Remise from "../models/Remise.js";
import Produit from "../models/Product.js";
import Fournisseur from "../models/Fournisseur.js";

// ➕ Create a new Remise (Root only)
export const createRemise = async (req, res) => {
  try {
    const { produitId, fournisseurId, remise } = req.body;

    // Validate Produit
    const produit = await Produit.findById(produitId);
    if (!produit) return res.status(404).json({ message: "Produit introuvable" });

    // Validate Fournisseur
    const fournisseur = await Fournisseur.findById(fournisseurId);
    if (!fournisseur) return res.status(404).json({ message: "Fournisseur introuvable" });

    // Use findOneAndUpdate with upsert to create or update
    const newRemise = await Remise.findOneAndUpdate(
      { produit: produitId, fournisseur: fournisseurId },
      { pourcentage: remise },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, remise: newRemise });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
// 📋 Get all remises (for all users)
export const getRemises = async (req, res) => {
  try {
    const remises = await Remise.find()
      .populate("produit", "name")
      .populate("fournisseur", "name");
    res.json(remises);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// 📋 Get remises by product and sort them by best offer
export const getRemisesByProduit = async (req, res) => {
  try {
    const remises = await Remise.find({ produit: req.params.produitId })
      .populate("fournisseur", "name")
      .sort({ remise: -1 }); // Sort from best to worst percentage

    // Example structure:
    // [
    //   { fournisseur: "A", remise: 6 },
    //   { fournisseur: "B", remise: 5 },
    //   { fournisseur: "C", remise: 4 }
    // ]

    res.json({
      produit: req.params.produitId,
      bestOffers: remises.map((r, i) => ({
        rank: i + 1,
        fournisseur: r.fournisseur.name,
        remise: r.remise,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✏️ Update remise (Root only)
export const updateRemise = async (req, res) => {
  try {
    const remise = await Remise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!remise) return res.status(404).json({ message: "Remise introuvable" });
    res.json(remise);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ❌ Delete remise (Root only)
export const deleteRemise = async (req, res) => {
  try {
    const remise = await Remise.findByIdAndDelete(req.params.id);
    if (!remise) return res.status(404).json({ message: "Remise introuvable" });
    res.json({ success: true, message: "Remise supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
