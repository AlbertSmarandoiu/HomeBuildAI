import express from "express";
import PortfolioItem from "../models/PortfolioItem.js";
// 🚨 Presupunem că folosești middleware-ul tău de protecție
import verifyToken from '../middleware/authMiddleware.js'; 

const router = express.Router();

// 1. POST: Adaugă o lucrare nouă în portofoliu (Protejat, doar Pro-ul își poate adăuga)
router.post('/', verifyToken, async (req, res) => {
    try {
        // ID-ul Pro-ului este luat din token-ul decodat
        const proId = req.user.id; 
        const { title, description, category, images, dateCompleted } = req.body;

        // Simplă validare a rolului (opțional, dar recomandat)
        if (req.user.role !== 'constructor') {
            return res.status(403).json({ message: "Acces interzis. Doar constructorii pot adăuga portofoliu." });
        }

        const newItem = new PortfolioItem({
            proId,
            title,
            description,
            category,
            images,
            dateCompleted: dateCompleted || Date.now(),
        });

        await newItem.save();
        res.status(201).json(newItem);

    } catch (error) {
        console.error("Eroare la adăugarea portofoliului:", error);
        res.status(500).json({ message: "Eroare server." });
    }
});


// 2. GET: Vizualizează portofoliul unui anumit Pro (Public, pentru clienți)
router.get('/:proId', async (req, res) => {
    try {
        const portfolio = await PortfolioItem.find({ proId: req.params.proId }).sort({ dateCompleted: -1 });
        res.status(200).json(portfolio);
    } catch (error) {
        console.error("Eroare la preluarea portofoliului:", error);
        res.status(500).json({ message: "Eroare server." });
    }
});

export default router;