import mongoose from "mongoose";

const produitSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: String,
  laboratoire: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratoire" },
},{timestamps : true});

export default mongoose.model("Produit", produitSchema);
