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

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      try {
        console.log(`\n--- Traitement ligne ${rowIndex + 1} ---`);
        console.log("Données brutes:", JSON.stringify(row));

        // Extract and trim product and laboratory names
        const produitName = (row["Produit"] || row["produit"] || "").trim();
        const laboName = (row["Laboratoire"] || row["laboratoire"] || "").trim();

        console.log(`Produit: "${produitName}", Labo: "${laboName}"`);

        if (!produitName || !laboName) {
          errors.push(`Ligne ${rowIndex + 1}: manque produit ou laboratoire`);
          console.warn("❌ Ligne ignorée: produit ou labo vide");
          continue;
        }

        // 1. Create/retrieve laboratory
        console.log(`Recherche laboratoire: ${laboName}`);
        let labo = await Laboratoire.findOne({ name: laboName });
        
        if (!labo) {
          console.log(`  → Création nouveau laboratoire: ${laboName}`);
          labo = await Laboratoire.create({ name: laboName });
        } else {
          console.log(`  → Laboratoire trouvé: ${labo._id}`);
        }

        if (!labo) {
          errors.push(`Ligne ${rowIndex + 1}: Impossible de créer/trouver laboratoire "${laboName}"`);
          console.error("❌ Labo est null après création");
          continue;
        }

        if (!labo._id) {
          errors.push(`Ligne ${rowIndex + 1}: Laboratoire sans ID`);
          console.error("❌ Labo._id est vide");
          continue;
        }

        // 2. Create/retrieve product
        console.log(`Recherche produit: ${produitName} (labo: ${labo._id})`);
        let produit = await Produit.findOne({ name: produitName, laboratoire: labo._id });
        
        if (!produit) {
          console.log(`  → Création nouveau produit: ${produitName}`);
          produit = await Produit.create({ name: produitName, laboratoire: labo._id });
        } else {
          console.log(`  → Produit trouvé: ${produit._id}`);
        }

        if (!produit) {
          errors.push(`Ligne ${rowIndex + 1}: Impossible de créer/trouver produit "${produitName}"`);
          console.error("❌ Produit est null après création");
          continue;
        }

        if (!produit._id) {
          errors.push(`Ligne ${rowIndex + 1}: Produit sans ID`);
          console.error("❌ Produit._id est vide");
          continue;
        }

        // 3. Process all discount columns (all suppliers)
        const excludedCols = ["Produit", "produit", "Laboratoire", "laboratoire", "MEILLEURE OFFRE", "2ÈME OFFRE", "3ÈME OFFRE"];
        
        for (const [key, value] of Object.entries(row)) {
          // Ignore system columns
          if (excludedCols.includes(key)) {
            continue;
          }

          // Skip empty values
          if (!value || value === "") continue;

          // This is a supplier column
          const fournisseurName = key.trim();
          
          if (!fournisseurName) continue;

          // Parse discount value safely
          const valueStr = String(value).replace("%", "").replace(",", ".").trim();
          const remiseValue = parseFloat(valueStr);

          if (isNaN(remiseValue) || remiseValue <= 0) continue;

          console.log(`  Traitement fournisseur: ${fournisseurName} = ${remiseValue}%`);

          // Create/retrieve supplier
          let fournisseur = await Fournisseur.findOne({ name: fournisseurName });
          
          if (!fournisseur) {
            console.log(`    → Création fournisseur: ${fournisseurName}`);
            fournisseur = await Fournisseur.create({ name: fournisseurName });
          } else {
            console.log(`    → Fournisseur trouvé: ${fournisseur._id}`);
          }

          if (!fournisseur) {
            errors.push(`Ligne ${rowIndex + 1}: Impossible de créer/trouver fournisseur "${fournisseurName}"`);
            console.error(`❌ Fournisseur null pour: ${fournisseurName}`);
            continue;
          }

          if (!fournisseur._id) {
            errors.push(`Ligne ${rowIndex + 1}: Fournisseur sans ID`);
            console.error(`❌ Fournisseur._id vide pour: ${fournisseurName}`);
            continue;
          }

          try {
            // Create/update discount
            const remiseResult = await Remise.findOneAndUpdate(
              { produit: produit._id, fournisseur: fournisseur._id },
              { pourcentage: remiseValue },
              { upsert: true, new: true }
            );
            console.log(`    ✅ Remise créée/mise à jour: ${remiseResult._id}`);
          } catch (remiseErr) {
            errors.push(`Ligne ${rowIndex + 1}: Erreur création remise (${fournisseurName})`);
            console.error(`❌ Erreur Remise.findOneAndUpdate:`, remiseErr.message);
          }
        }

        processed++;
        console.log(`✅ Ligne ${rowIndex + 1} traitée avec succès`);
      } catch (err) {
        errors.push(`Ligne ${rowIndex + 1}: ${err.message}`);
        console.error(`❌ Erreur ligne ${rowIndex + 1}:`, err);
      }
    }

    console.log(`\n📊 RÉSUMÉ: ${processed}/${data.length} lignes traitées, ${errors.length} erreurs`);

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
      errors: errors.slice(0, 20) // Show up to 20 errors
    });

  } catch (err) {
    console.error("❌ Erreur upload Excel:", err);
    res.status(500).json({ 
      message: "Erreur lors du traitement du fichier", 
      error: err.message,
      stack: err.stack
    });
  }
};

// ✅ Download Excel (list of available files)
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
      .sort((a, b) => b.date - a.date); // Most recent first

    res.json({ files });
  } catch (err) {
    console.error("❌ Erreur lecture fichiers:", err);
    res.status(500).json({ message: "Erreur lecture fichiers" });
  }
};

// ✅ Download a specific Excel file
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