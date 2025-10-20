// models/Commande.js
import mongoose from "mongoose";

const commandeSchema = new mongoose.Schema({
  produit: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Produit", 
    required: true 
  },
  fournisseur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Fournisseur", 
    required: true 
  },
  quantiteNecessaire: { 
    type: Number, 
    required: true,
    min: 0
  },
  remisePourcentage: { 
    type: Number, 
    default: 0 
  },
  status: {
    type: String,
    enum: ["en attente", "validée", "en cours", "livrée", "annulée"],
    default: "en attente"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  notes: {
    type: String,
    default: ""
  }
}, { 
  timestamps: true 
});

// Index pour optimiser les recherches
commandeSchema.index({ status: 1, createdAt: -1 });
commandeSchema.index({ produit: 1, fournisseur: 1 });
commandeSchema.index({ createdBy: 1 });

// Méthode pour calculer le total des commandes par fournisseur
commandeSchema.statics.getStatsByFournisseur = async function(fournisseurId, startDate, endDate) {
  const match = { fournisseur: mongoose.Types.ObjectId(fournisseurId) };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalQuantite: { $sum: "$quantiteNecessaire" }
      }
    }
  ]);
};

// Méthode pour obtenir les statistiques par produit
commandeSchema.statics.getStatsByProduit = async function(produitId) {
  return await this.aggregate([
    { $match: { produit: mongoose.Types.ObjectId(produitId) } },
    {
      $group: {
        _id: "$fournisseur",
        totalCommandes: { $sum: 1 },
        totalQuantite: { $sum: "$quantiteNecessaire" },
        averageRemise: { $avg: "$remisePourcentage" }
      }
    },
    {
      $lookup: {
        from: "fournisseurs",
        localField: "_id",
        foreignField: "_id",
        as: "fournisseur"
      }
    },
    { $unwind: "$fournisseur" },
    {
      $project: {
        fournisseurName: "$fournisseur.name",
        totalCommandes: 1,
        totalQuantite: 1,
        averageRemise: 1
      }
    },
    { $sort: { totalCommandes: -1 } }
  ]);
};

export default mongoose.model("Commande", commandeSchema);