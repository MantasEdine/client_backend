// controllers/commandeController.js
import Commande from "../models/Commande.js";
import Produit from "../models/Product.js";
import Fournisseur from "../models/Fournisseur.js";
import Laboratoire from "../models/Labo.js";
import Remise from "../models/Remise.js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const commandesDir = path.join(process.cwd(), "uploads/commandes");
if (!fs.existsSync(commandesDir)) fs.mkdirSync(commandesDir, { recursive: true });

// ✅ Créer une nouvelle commande
export const createCommande = async (req, res) => {
  try {
    const { produitId, fournisseurId, quantiteNecessaire } = req.body;
    const userId = req.user._id;

    // Vérifier le produit
    const produit = await Produit.findById(produitId).populate("laboratoire");
    if (!produit) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    // Vérifier le fournisseur
    const fournisseur = await Fournisseur.findById(fournisseurId);
    if (!fournisseur) {
      return res.status(404).json({ message: "Fournisseur introuvable" });
    }

    // Vérifier la remise
    const remise = await Remise.findOne({ 
      produit: produitId, 
      fournisseur: fournisseurId 
    });

    const commande = await Commande.create({
      produit: produitId,
      fournisseur: fournisseurId,
      quantiteNecessaire,
      createdBy: userId,
      remisePourcentage: remise?.pourcentage || 0,
      status: "en attente"
    });

    const commandePopulated = await Commande.findById(commande._id)
      .populate("produit", "name")
      .populate("fournisseur", "name")
      .populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Commande créée avec succès",
      commande: commandePopulated
    });
  } catch (err) {
    console.error("Erreur création commande:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✅ Obtenir toutes les commandes
export const getCommandes = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const commandes = await Commande.find(query)
      .populate("produit", "name")
      .populate({
        path: "produit",
        populate: { path: "laboratoire", select: "name" }
      })
      .populate("fournisseur", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: commandes.length,
      commandes
    });
  } catch (err) {
    console.error("Erreur récupération commandes:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✅ Obtenir une commande par ID
export const getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate("produit")
      .populate("fournisseur")
      .populate("createdBy", "name email");

    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.json({ success: true, commande });
  } catch (err) {
    console.error("Erreur récupération commande:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✅ Mettre à jour le statut d'une commande
export const updateCommandeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ["en attente", "validée", "en cours", "livrée", "annulée"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Statut invalide", 
        validStatuses 
      });
    }

    const commande = await Commande.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate("produit fournisseur createdBy");

    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.json({
      success: true,
      message: "Statut mis à jour",
      commande
    });
  } catch (err) {
    console.error("Erreur mise à jour commande:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✅ Supprimer une commande
export const deleteCommande = async (req, res) => {
  try {
    const commande = await Commande.findByIdAndDelete(req.params.id);
    
    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.json({
      success: true,
      message: "Commande supprimée"
    });
  } catch (err) {
    console.error("Erreur suppression commande:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✅ Exporter les commandes vers Excel
export const exportCommandesToExcel = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const commandes = await Commande.find(query)
      .populate("produit")
      .populate({
        path: "produit",
        populate: { path: "laboratoire", select: "name" }
      })
      .populate("fournisseur", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    if (commandes.length === 0) {
      return res.status(404).json({ message: "Aucune commande à exporter" });
    }

    // Préparer les données pour Excel
    const data = commandes.map((cmd) => ({
      "Date": new Date(cmd.createdAt).toLocaleDateString("fr-FR"),
      "Produit": cmd.produit.name,
      "Laboratoire": cmd.produit.laboratoire?.name || "—",
      "Fournisseur": cmd.fournisseur.name,
      "Quantité Nécessaire": cmd.quantiteNecessaire,
      "Remise (%)": cmd.remisePourcentage,
      "Statut": cmd.status,
      "Créé par": cmd.createdBy.name
    }));

    // Créer le workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");

    // Générer le nom du fichier
    const timestamp = Date.now();
    const fileName = `commandes_${timestamp}.xlsx`;
    const filePath = path.join(commandesDir, fileName);

    // Écrire le fichier
    XLSX.writeFile(wb, filePath);

    console.log(`✅ Fichier de commandes créé: ${fileName}`);

    res.json({
      success: true,
      message: "Commandes exportées avec succès",
      filename: fileName,
      count: commandes.length
    });
  } catch (err) {
    console.error("Erreur export commandes:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ✅ Télécharger un fichier de commandes
export const downloadCommandesExcel = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ message: "Nom de fichier requis" });
    }

    const filePath = path.join(commandesDir, filename);

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

// ✅ Lister les fichiers de commandes
export const getCommandesFiles = async (req, res) => {
  try {
    const files = fs.readdirSync(commandesDir)
      .filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
      .map(f => {
        const filePath = path.join(commandesDir, f);
        const stat = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stat.size,
          date: stat.mtime
        };
      })
      .sort((a, b) => b.date - a.date);

    res.json({ 
      success: true,
      files 
    });
  } catch (err) {
    console.error("❌ Erreur lecture fichiers:", err);
    res.status(500).json({ message: "Erreur lecture fichiers" });
  }
};

// ✅ Créer des commandes en masse à partir d'un tableau
export const createCommandesBatch = async (req, res) => {
  try {
    const { commandes } = req.body; // Array of commande objects
    const userId = req.user._id;

    if (!Array.isArray(commandes) || commandes.length === 0) {
      return res.status(400).json({ message: "Tableau de commandes requis" });
    }

    const createdCommandes = [];
    const errors = [];

    for (let i = 0; i < commandes.length; i++) {
      const cmd = commandes[i];
      try {
        // Trouver le produit par nom
        const produit = await Produit.findOne({ name: cmd.produit })
          .populate("laboratoire");
        
        if (!produit) {
          errors.push(`Ligne ${i + 1}: Produit "${cmd.produit}" introuvable`);
          continue;
        }

        // Trouver le fournisseur par nom
        const fournisseur = await Fournisseur.findOne({ name: cmd.fournisseur });
        
        if (!fournisseur) {
          errors.push(`Ligne ${i + 1}: Fournisseur "${cmd.fournisseur}" introuvable`);
          continue;
        }

        // Trouver la remise
        const remise = await Remise.findOne({ 
          produit: produit._id, 
          fournisseur: fournisseur._id 
        });

        // Créer la commande
        const commande = await Commande.create({
          produit: produit._id,
          fournisseur: fournisseur._id,
          quantiteNecessaire: cmd.quantiteNecessaire || 0,
          createdBy: userId,
          remisePourcentage: remise?.pourcentage || 0,
          status: "en attente"
        });

        createdCommandes.push(commande);
      } catch (err) {
        errors.push(`Ligne ${i + 1}: ${err.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdCommandes.length} commandes créées`,
      count: createdCommandes.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("Erreur création commandes batch:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};