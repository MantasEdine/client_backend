// models/Remise.js
import mongoose from "mongoose";

const remiseSchema = new mongoose.Schema({
  produit: { type: mongoose.Schema.Types.ObjectId, ref: "Produit", required: true },
  fournisseur: { type: mongoose.Schema.Types.ObjectId, ref: "Fournisseur", required: true },
  pourcentage: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Create unique compound index to prevent duplicates
remiseSchema.index({ produit: 1, fournisseur: 1 }, { unique: true });

export default mongoose.model("Remise", remiseSchema);