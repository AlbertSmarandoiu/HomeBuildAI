import Request from '../models/WorkRequest.js';
import sendPriceEstimateEmail from '../utils/emailService.js';
import User from '../models/user.js';
import { extractMaterialsFromAI } from '../services/aiService.js';
import { calculateEstimate } from '../services/estimationService.js';

export async function createRequest(req, res) {
    console.log("🚀 A fost apelată funcția createRequest!");

    try {
        // 1️⃣ EXTRAGEREA DATELOR
        const { 
            category, description, squareMeters, county, 
            materialQuality, specificDetails, name, phone, email, images
        } = req.body;

        // 2️⃣ GĂSIRE UTILIZATOR
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Utilizator inexistent" });
        const userEmail = user.email;

        // 3️⃣ SALVAREA ÎN BAZA DE DATE (Asigurăm o categorie default)
        const finalCategory = category || "lucrari interioare";

        const request = await Request.create({
            description,
            squareMeters: Number(squareMeters),
            category: finalCategory,
            county,
            materialQuality,
            specificDetails: specificDetails || {},
            name,
            phone,
            email, 
            images: images || [],
            userId: req.user.id
        });

        console.log(`📧 Email utilizator: ${userEmail} | Categorie: ${request.category}`);

        // 4️⃣ EXTRAGEM MATERIALE DIN AI
        let finalTotal = 0;
        let finalDetails = [];

        try {
            const aiResult = await extractMaterialsFromAI({
                description: request.description,
                squareMeters: request.squareMeters,
                category: request.category
            });

            if (aiResult && aiResult.materiale) {
                console.log("✅ AI a extras materialele. Calculăm estimarea...");
                
                // 5️⃣ REPARAT: Trimitem materiale, suprafața ȘI categoria
                const estimate = await calculateEstimate(
                    aiResult.materiale, 
                    request.squareMeters, 
                    request.category,
                    request.materialQuality // 🌟 NOU: Trimitem și calitatea materialelor
                );
                
                finalTotal = estimate.totalGeneral;
                finalDetails = estimate.detalii;
            } else {
                throw new Error("AI nu a returnat materiale valide.");
            }

        } catch (aiError) {
            console.error("⚠️ Eroare la procesarea AI/Estimare:", aiError.message);
            finalTotal = 0;
            finalDetails = [{ sarcina: "Eroare calcul: " + aiError.message, total: 0 }];
        }

        // 6️⃣ TRIMITERE EMAIL
        await sendPriceEstimateEmail(
            userEmail,
            finalTotal,
            finalDetails,
            request.description,
            request.squareMeters,
            request.county,
            request.materialQuality
        );

        // 7️ NOTIFICARE REAL-TIME
        const io = req.app.get('socketio'); 
        if (io) {
            io.emit('new_job_available', {
                title: "Lucrare Nouă!",
                message: `S-a publicat o lucrare de tip ${request.category} în ${request.county}.`,
                category: request.category,
                total: finalTotal
            });
            console.log("Notificare trimisă către toți constructorii!");
        }

        res.status(201).json({ 
            request, 
            message: "Cererea a fost creată și email trimis.",
            total: finalTotal 
        });

    } catch (error) {
        console.error(" Eroare critică în createRequest:", error);
        res.status(500).json({ message: "Eroare la procesarea cererii." });
    }
}