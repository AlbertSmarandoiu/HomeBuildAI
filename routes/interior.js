
import express from "express";
import InteriorRequest from "../models/InteriorRequest.js";

import verifyToken from '../middleware/authMiddleware.js';
// ✅ Salvează o lucrare interioară
// routes/interior.js (Ruta POST "/") - CORECTAT
const router = express.Router();
router.post("/", verifyToken, async (req, res) => {
    try {
        // Presupunând că obții postingUserId dintr-un middleware (req.user.id)
        const postingUserId = req.user.id; // Asigură-te că ai un middleware care setează asta!
        
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

    } catch (error) {
        console.error("Eroare la salvare:", error);
        res.status(500).json({
            message: "Eroare la salvare în baza de date!",
            error,
        });
    }
});

// ✅ Obține toate cererile
// RUTA NOUĂ: GET /api/interior/filtered
// Primește un array de skill-uri din query parameter și filtrează în DB.
router.get("/filtered", async (req, res) => {
    try {
        // 1. Preia skill-urile din URL query (ex: /filtered?skills=Lucrări%20interioare,zugrăvit)
        const skillsQuery = req.query.skills; 
        if (!skillsQuery) {
             return res.status(200).json([]); // Returnează gol dacă nu sunt skill-uri
        }

        // Transformă stringul primit în array (dacă ai trimite un string separat prin virgulă)
        // Sau primești direct un array JSON, depinde de cum îl trimiți din frontend.
        const proSkills = skillsQuery.split(','); 
        
        // 2. Interoghează MongoDB (folosind $in pentru potrivire exactă)
        const requests = await InteriorRequest.find({
            // Caută cererile unde 'category' este IN array-ul de 'proSkills'
            category: { $in: proSkills }, 
        }).sort({ date: -1 });
        console.log("Număr cereri returnate de DB:", requests.length); // 🚨 Adaugă acest log
        res.status(200).json(requests);

    } catch (error) {
        console.error("Eroare la preluarea cererilor filtrate:", error);
        res.status(500).json({ message: "Eroare server la filtrare." });
    }
});

export default router;
