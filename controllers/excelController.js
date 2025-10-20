import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import Fournisseur from "../models/Fournisseur.js";
import Produit from "../models/Product.js";
import Remise from "../models/Remise.js";
import Laboratoire from "../models/Labo.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ✅ Upload & process Excel avec gestion des quantités
export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });

    const originalName = req.file.originalname;
    const timestamp = Date.now();
    const savedFilename = `${timestamp}_${originalName}`;
    const savedPath = path.join(uploadDir, savedFilename);

    fs.renameSync(req.file.path, savedPath);
    console.log(`✅ Fichier sauvegardé : ${savedPath}`);

    const workbook = XLSX.readFile(savedPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`📊 ${data.length} lignes trouvées dans Excel`);

    let processed = 0;
    let errors = [];

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      try {
        console.log(`\n--- Traitement ligne ${rowIndex + 1} ---`);

        const produitName = (row["Produit"] || row["produit"] || "").trim();
        const laboName = (row["Laboratoire"] || row["laboratoire"] || "").trim();
        
        // Nouvelles colonnes pour les quantités
        const quantiteEnStock = parseFloat(row["Quantité en Stock"] || row["quantiteEnStock"] || 0);
        const quantiteVendue = parseFloat(row["Quantité Vendue"] || row["quantiteVendue"] || 0);

        if (!produitName || !laboName) {
          errors.push(`Ligne ${rowIndex + 1}: manque produit ou laboratoire`);
          continue;
        }

        // Créer/récupérer laboratoire
        let labo = await Laboratoire.findOne({ name: laboName });
        if (!labo) {
          labo = await Laboratoire.create({ name: laboName });
        }

        // Créer/récupérer produit
        let produit = await Produit.findOne({ name: produitName, laboratoire: labo._id });
        if (!produit) {
          produit = await Produit.create({ name: produitName, laboratoire: labo._id });
        }

        // Traiter toutes les colonnes de remise (fournisseurs)
        const excludedCols = [
          "Produit", "produit", 
          "Laboratoire", "laboratoire", 
          "MEILLEURE OFFRE", "2ÈME OFFRE", "3ÈME OFFRE",
          "Quantité en Stock", "quantiteEnStock",
          "Quantité Vendue", "quantiteVendue",
          "Quantité Nécessaire", "quantiteNecessaire"
        ];
        
        for (const [key, value] of Object.entries(row)) {
          if (excludedCols.includes(key)) continue;
          if (!value || value === "") continue;

          const fournisseurName = key.trim();
          if (!fournisseurName) continue;

          const valueStr = String(value).replace("%", "").replace(",", ".").trim();
          const remiseValue = parseFloat(valueStr);

          if (isNaN(remiseValue) || remiseValue <= 0) continue;

          let fournisseur = await Fournisseur.findOne({ name: fournisseurName });
          if (!fournisseur) {
            fournisseur = await Fournisseur.create({ name: fournisseurName });
          }

          try {
            // Créer/mettre à jour la remise avec les quantités
            await Remise.findOneAndUpdate(
              { produit: produit._id, fournisseur: fournisseur._id },
              { 
                pourcentage: remiseValue,
                quantiteEnStock: quantiteEnStock,
                quantiteVendue: quantiteVendue,
                quantiteNecessaire: quantiteVendue, // Auto-calculé
                moisReference: new Date()
              },
              { upsert: true, new: true }
            );
          } catch (remiseErr) {
            errors.push(`Ligne ${rowIndex + 1}: Erreur remise (${fournisseurName})`);
            console.error(`❌ Erreur Remise:`, remiseErr.message);
          }
        }

        processed++;
      } catch (err) {
        errors.push(`Ligne ${rowIndex + 1}: ${err.message}`);
        console.error(`❌ Erreur ligne ${rowIndex + 1}:`, err);
      }
    }

    res.json({
      success: true,
      message: "Fichier traité et stocké avec succès",
      filename: savedFilename,
      stats: {
        total: data.length,
        processed,
        errors: errors.length
      },
      errors: errors.slice(0, 20)
    });

  } catch (err) {
    console.error("❌ Erreur upload Excel:", err);
    res.status(500).json({ 
      message: "Erreur lors du traitement du fichier", 
      error: err.message
    });
  }
};

// ✅ Liste des fichiers Excel
export const getExcelFiles = async (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
      .map(f => {
        const filePath = path.join(uploadDir, f);
        const stat = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stat.size,
          date: stat.mtime
        };
      })
      .sort((a, b) => b.date - a.date);

    res.json({ files });
  } catch (err) {
    console.error("❌ Erreur lecture fichiers:", err);
    res.status(500).json({ message: "Erreur lecture fichiers" });
  }
};

// ✅ Télécharger un fichier Excel spécifique
export const downloadExcel = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ message: "Nom de fichier requis" });
    }

    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Fichier non trouvé" });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("❌ Erreur téléchargement:", err);
        res.status(500).json({ message: "Erreur téléchargement" });
      }
    });
  } catch (err) {
    console.error("❌ Erreur download:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};