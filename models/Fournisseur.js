import mongoose from "mongoose";

const fournisseurSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  contact: String,
  adresse: String,
},{timestamps : true});

export default mongoose.model("Fournisseur", fournisseurSchema);
