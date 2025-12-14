
import express from "express";
import InteriorRequest from "../models/InteriorRequest.js";

import verifyToken from '../middleware/authMiddleware.js';
// ✅ Salvează o lucrare interioară
// routes/interior.js (Ruta POST "/") - CORECTAT
const router = express.Router();
router.post("/", verifyToken, async (req, res) => {
    try {
        console.log("✅ CERERE PRIMITĂ ȘI AUTENTIFICATĂ CU SUCCES!");
        // Presupunând că obții postingUserId dintr-un middleware (req.user.id)
        const postingUserId = req.user.id;
        console.log("ID UTILIZATOR PENTRU SALVARE:", postingUserId);
        const {
            description,
            squareMeters,
            county,
            materialQuality,
            images,
            name,
            phone,
            email
        } = req.body;

        // 1. VALIDARE (Trebuie să fie prima)
        if (!description || !squareMeters || !county || !materialQuality || !postingUserId) {
            console.error("❌ EROARE 400: Câmpuri obligatorii lipsă. User ID:", postingUserId);
            return res.status(400).json({
                message: "Date incomplete (userul sau câmpurile obligatorii lipsesc)!",
            });
        }

        // 2. CREAREA ȘI SALVAREA CERERII (O SINGURĂ DATĂ)
        const newRequest = new InteriorRequest({
            title: "Lucrare interioară",
            description,
            squareMeters,
            county,
            materialQuality,
            images: images || [],
            category: "interioare",
            name,
            phone,
            email,
            userId: postingUserId, // 👈 Punctul crucial
            date: new Date(),
        });

        await newRequest.save();
        console.log("Cerere salvată:", newRequest);

        res.status(201).json({
            message: "Cererea a fost salvată cu succes!",
            request: newRequest,
        });
        console.log("Datele primite pentru lucrare:", req.body);

    } catch (error) {
        console.error("Eroare la salvare:", error);
        res.status(500).json({
            message: "Eroare la salvare în baza de date!",
            error,
        });
    }
});

router.get("/filtered", async (req, res) => {
    try {
       
        const skillsQuery = req.query.skills; 
        if (!skillsQuery) {
             return res.status(200).json([]); 
        }
        const proSkills = skillsQuery.split(','); 
        const requests = await InteriorRequest.find({
            category: { $in: proSkills }, 
        }).sort({ date: -1 });
        console.log("Număr cereri returnate de DB:", requests.length); // 🚨 Adaugă acest log
        res.status(200).json(requests);

    } catch (error) {
        console.error("Eroare la preluarea cererilor filtrate:", error);
        res.status(500).json({ message: "Eroare server la filtrare." });
    }
});
router.get("/count/:userId", async (req, res) => {
    try {
        const count = await InteriorRequest.countDocuments({ 
            userId: req.params.userId
        });
        res.status(200).json({ count }); // ✅ Răspuns JSON de succes
    } catch (error) {
        // ... (Logică de eroare JSON)
    }
});
export default router;
