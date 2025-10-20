// models/Remise.js
import mongoose from "mongoose";

const remiseSchema = new mongoose.Schema({
  produit: { type: mongoose.Schema.Types.ObjectId, ref: "Produit", required: true },
  fournisseur: { type: mongoose.Schema.Types.ObjectId, ref: "Fournisseur", required: true },
  pourcentage: { type: Number, required: true },
  
  // Gestion des stocks
  quantiteEnStock: { type: Number, default: 0 },
  quantiteVendue: { type: Number, default: 0 },
  quantiteNecessaire: { type: Number, default: 0 }, // Calculé automatiquement
  
  // Métadonnées
  moisReference: { type: Date, default: Date.now },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Index unique composé
remiseSchema.index({ produit: 1, fournisseur: 1 }, { unique: true });

// Middleware pour calculer automatiquement la quantité nécessaire
remiseSchema.pre('save', function(next) {
  // Quantité nécessaire = Quantité vendue ce mois (rotation mensuelle)
  this.quantiteNecessaire = this.quantiteVendue;
  next();
});

// Méthode pour mettre à jour les quantités mensuellement
remiseSchema.statics.updateMonthlyRotation = async function() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Trouver toutes les remises du mois précédent
  const remises = await this.find({
    moisReference: { $lt: firstDayOfMonth }
  });
  
  // Mettre à jour chaque remise
  for (const remise of remises) {
    remise.quantiteNecessaire = remise.quantiteVendue;
    remise.moisReference = now;
    remise.quantiteVendue = 0; // Réinitialiser pour le nouveau mois
    await remise.save();
  }
  
  return remises.length;
};

export default mongoose.model("Remise", remiseSchema);