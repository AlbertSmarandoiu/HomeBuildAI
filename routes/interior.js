
import express from "express";
import WorkRequest from "../models/WorkRequest.js";
import { createRequest } from '../Controllers/requestController.js'; 
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Ruta de creare cerere
router.post("/", verifyToken, createRequest);

// 2. Ruta de filtrare
router.get("/filtered", async (req, res) => {
    try {
        const skillsQuery = req.query.skills; 

        if (!skillsQuery) {
             return res.status(200).json([]); 
        }

        const proSkills = skillsQuery.split(',')
            .map(s => s.trim().toLowerCase()); 
        
        const requests = await WorkRequest.find({
            category: { $in: proSkills }, 
            status: 'pending' 
        }).sort({ createdAt: -1 });

        res.status(200).json(requests);

    } catch (error) {
        res.status(500).json({ message: "Eroare server la filtrare." });
    }
});
// 3. Cererile proprii ale beneficiarului (cu ofertele primite)
router.get("/mine", verifyToken, async (req, res) => {
    try {
        const requests = await WorkRequest.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Eroare server." });
    }
});

// 4. Ruta de numărare cereri
router.get("/count/:userId", async (req, res) => {
    try {
        const count = await WorkRequest.countDocuments({ 
            userId: req.params.userId
        });
        res.status(200).json({ count }); 
    } catch (error) {
        res.status(500).json({ message: "Eroare la numărare." });
    }
});

export default router;