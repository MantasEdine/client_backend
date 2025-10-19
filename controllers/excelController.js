import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import Fournisseur from "../models/Fournisseur.js";
import Produit from "../models/Product.js";
import Remise from "../models/Remise.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Upload & process Excel
export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });

    // Keep original file with timestamp in uploads folder
    const originalName = req.file.originalname;
    const timestamp = Date.now();
    const savedFilename = `${timestamp}_${originalName}`;
    const savedPath = path.join(uploadDir, savedFilename);

    fs.renameSync(req.file.path, savedPath); // move temp file to uploads folder

    // Process Excel content as before
    const workbook = XLSX.readFile(savedPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (const row of data) {
      const { Laboratoire, Produit: prodName, Fournisseur: fourName, "Remise (%)": remiseVal } = row;
      if (!Laboratoire || !prodName || !fourName || remiseVal == null) continue;

      const produit = await Produit.findOneAndUpdate(
        { name: prodName },
        { name: prodName, laboratoire: Laboratoire },
        { upsert: true, new: true }
      );

      const fournisseur = await Fournisseur.findOneAndUpdate(
        { name: fourName },
        { name: fourName },
        { upsert: true, new: true }
      );

      await Remise.findOneAndUpdate(
        { produit: produit._id, fournisseur: fournisseur._id },
        { remise: remiseVal },
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Fichier traité et stocké avec succès", filename: savedFilename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors du traitement du fichier" });
  }
};
