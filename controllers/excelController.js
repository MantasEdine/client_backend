import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import Fournisseur from "../models/Fournisseur.js";
import Produit from "../models/Product.js";
import Remise from "../models/Remise.js";
import Laboratoire from "../models/Labo.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ✅ Upload & process Excel
export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });

    const originalName = req.file.originalname;
    const timestamp = Date.now();
    const savedFilename = `${timestamp}_${originalName}`;
    const savedPath = path.join(uploadDir, savedFilename);

    // Déplacer le fichier temporaire vers uploads/
    fs.renameSync(req.file.path, savedPath);
    console.log(`✅ Fichier sauvegardé : ${savedPath}`);

    // Lire et traiter le contenu Excel
    const workbook = XLSX.readFile(savedPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`📊 ${data.length} lignes trouvées dans Excel`);

    let processed = 0;
    let errors = [];

    for (const row of data) {
      try {
        const produitName = row["Produit"] || row["produit"];
        const laboName = row["Laboratoire"] || row["laboratoire"];

        if (!produitName || !laboName) {
          errors.push(`Ligne ignorée (manque produit/labo): ${JSON.stringify(row)}`);
          continue;
        }

        // 1. Créer/récupérer laboratoire
        let labo = await Laboratoire.findOne({ name: laboName });
        if (!labo) {
          labo = await Laboratoire.create({ name: laboName });
        }

        // 2. Créer/récupérer produit
        let produit = await Produit.findOne({ name: produitName, laboratoire: labo._id });
        if (!produit) {
          produit = await Produit.create({ name: produitName, laboratoire: labo._id });
        }

        // 3. Traiter toutes les colonnes de remises (tous les fournisseurs)
        for (const [key, value] of Object.entries(row)) {
          // Ignorer les colonnes système
          if (["Produit", "produit", "Laboratoire", "laboratoire", "MEILLEURE OFFRE", "2ÈME OFFRE", "3ÈME OFFRE"].includes(key)) {
            continue;
          }

          // C'est une colonne fournisseur
          const fournisseurName = key.trim();
          const remiseValue = parseFloat(String(value).replace("%", "").replace(",", ".").trim());

          if (isNaN(remiseValue) || remiseValue <= 0) continue;

          // Créer/récupérer fournisseur
          let fournisseur = await Fournisseur.findOne({ name: fournisseurName });
          if (!fournisseur) {
            fournisseur = await Fournisseur.create({ name: fournisseurName });
          }

          // Créer/mettre à jour remise
          await Remise.findOneAndUpdate(
            { produit: produit._id, fournisseur: fournisseur._id },
            { pourcentage: remiseValue },
            { upsert: true, new: true }
          );
        }

        processed++;
      } catch (err) {
        errors.push(`Erreur ligne: ${JSON.stringify(row)} - ${err.message}`);
      }
    }

    res.json({ 
      success: true,
      message: "Fichier traité et stocké avec succès", 
      filename: savedFilename,
      filepath: savedPath,
      stats: {
        total: data.length,
        processed,
        errors: errors.length
      },
      errors: errors.slice(0, 10) // Limiter à 10 erreurs max
    });

  } catch (err) {
    console.error("❌ Erreur upload Excel:", err);
    res.status(500).json({ message: "Erreur lors du traitement du fichier", error: err.message });
  }
};

// ✅ Download Excel (liste des fichiers disponibles)
export const getExcelFiles = async (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
      .map(f => ({
        name: f,
        path: path.join(uploadDir, f),
        size: fs.statSync(path.join(uploadDir, f)).size,
        date: fs.statSync(path.join(uploadDir, f)).mtime
      }))
      .sort((a, b) => b.date - a.date); // Plus récent en premier

    res.json({ files });
  } catch (err) {
    console.error("❌ Erreur lecture fichiers:", err);
    res.status(500).json({ message: "Erreur lecture fichiers" });
  }
};

// ✅ Download un fichier Excel spécifique
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