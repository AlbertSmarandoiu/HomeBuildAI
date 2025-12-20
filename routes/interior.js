
import express from "express";
import InteriorRequest from "../models/InteriorRequest.js";
import { createRequest } from '../Controllers/requestController.js'; // Importă funcția nouă
//import { protect } from '../middleware/authMiddleware.js'; // Middleware-ul de login
import verifyToken from '../middleware/authMiddleware.js';
// ✅ Salvează o lucrare interioară
// routes/interior.js (Ruta POST "/") - CORECTAT
const router = express.Router();
// Importă funcțiile necesare la începutul fișierului de rute
import { extractStructuredTasks, calculateFinalCost } from '../Controllers/estimationController.js';
import sendPriceEstimateEmail from '../utils/emailService.js';
router.post("/", verifyToken, createRequest);
router.post("/", verifyToken, async (req, res) => {
    console.log("!!! AM INTRAT ÎN RUTA CORECTĂ !!!");
    try {
        console.log("✅ CERERE PRIMITĂ ȘI AUTENTIFICATĂ CU SUCCES!");
        const postingUserId = req.user.id;
        const userEmail = req.user.email; // Presupunem că emailul vine din token/middleware

        const {
            description,
            squareMeters,
            county,
            materialQuality,
            images,
            name,
            phone,
            email // Emailul introdus manual în formular (dacă există)
        } = req.body;

        // 1. VALIDARE
        if (!description || !squareMeters || !county || !materialQuality || !postingUserId) {
            return res.status(400).json({ message: "Date incomplete!" });
        }

        // 2. CREAREA ȘI SALVAREA CERERII
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
            userId: postingUserId,
            date: new Date(),
        });

        await newRequest.save();
        console.log("✅ Cerere salvată în DB. Pornesc estimarea AI...");

        // ---------------------------------------------------------
        // 🔥 LOGICA NOUĂ: ESTIMARE ȘI EMAIL
        // ---------------------------------------------------------
        try {
            // A. Extracție sarcini cu Gemini
            const structured = await extractStructuredTasks({
                description,
                squareMeters: parseFloat(squareMeters),
                county,
                materialQuality
            });

            if (structured && structured.sarcini_identificate?.length > 0) {
                // B. Calcul cost
                const cost = calculateFinalCost(structured, county);

                // C. Trimitere email
                // Folosim emailul din contul de utilizator sau cel din formular
                const targetEmail = userEmail || email; 
                
                console.log(`📧 Trimit email către: ${targetEmail}`);
                
                await sendPriceEstimateEmail(
                    targetEmail,
                    cost.costTotal,
                    cost.detaliiCost,
                    description
                );
            } else {
                console.log("⚠️ Gemini nu a putut identifica sarcini clare.");
            }
        } catch (aiError) {
            console.error("❌ Eroare la procesarea AI/Email (cererea a fost totuși salvată):", aiError);
        }
        // ---------------------------------------------------------

        // 3. RĂSPUNS CĂTRE FRONT-END
        res.status(201).json({
            message: "Cererea a fost salvată și estimarea este în curs de trimitere!",
            request: newRequest,
        });

    } catch (error) {
        console.error("Eroare la salvare:", error);
        res.status(500).json({ message: "Eroare la salvare!", error });
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
