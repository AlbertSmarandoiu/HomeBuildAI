import Request from '../models/WorkRequest.js';
import { extractStructuredTasks, calculateFinalCost } from './estimationController.js';
import sendPriceEstimateEmail from '../utils/emailService.js';
import User from '../models/user.js';
export async function createRequest(req, res) {
    console.log("🚀 A fost apelată funcția createRequest!");

    try {
        // 1️⃣ EXTRAGEREA DATELOR
        const { 
            category, description, squareMeters, county, 
            materialQuality, specificDetails, name, phone, email 
        } = req.body;

        // 2️⃣ GĂSIRE UTILIZATOR (Avem nevoie de email-ul lui pentru Groq și Email Service)
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Utilizator inexistent" });
        const userEmail = user.email; // DEFINIM variabila aici, sus!

        // 3️⃣ SALVAREA ÎN BAZA DE DATE
        const request = await Request.create({
            description,
            squareMeters,
            category: category || "interioare",
            county,
            materialQuality,
            specificDetails: specificDetails || {},
            name,
            phone,
            email, // Email-ul opțional din formular
            userId: req.user.id
        });

        console.log(`📧 Email utilizator: ${userEmail} | Categorie: ${request.category}`);

        // 4️⃣ ESTIMAREA AI (Groq)
        const structured = await extractStructuredTasks({
            description: request.description,
            squareMeters: request.squareMeters,
            category: request.category,
            county: request.county,
            materialQuality: request.materialQuality,
            specificDetails: request.specificDetails
        });

        // 5️⃣ PREGĂTIRE DATE FINALE
        let finalTotal = 0;
        let finalDetails = [];

        if (structured && structured.materiale) {
            console.log("✅ Groq a calculat cu succes!");
            finalTotal = structured.total_estimat;
            finalDetails = structured.materiale.map(m => ({
                sarcina: m.nume,
                manopera: m.nume.toLowerCase().includes('manoperă') ? m.pret_estimat : 0,
                materiale: !m.nume.toLowerCase().includes('manoperă') ? m.pret_estimat : 0,
                total: m.pret_estimat
            }));
        } else {
            console.warn('⚠️ Fallback la logica locală.');
            const fallbackData = {
                sarcini_identificate: request.description.toLowerCase().includes('glet') ? ['Gletuire pereti'] : ['Vopsit lavabil (2 straturi)'],
                suprafata_mp: Number(request.squareMeters),
                calitate: request.materialQuality
            };
            const fallbackCost = calculateFinalCost(fallbackData, request.county);
            finalTotal = fallbackCost.costTotal;
            finalDetails = fallbackCost.detaliiCost;
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

        // 7️⃣ NOTIFICARE REAL-TIME (Socket.io)
        const io = req.app.get('socketio');
        if (io) {
            io.emit('new_job_available', {
                message: "🚀 S-a publicat o nouă lucrare!",
                categorie: request.category,
                detalii: `${request.squareMeters} mp în ${request.county}`
            });
        }

        res.status(201).json({ 
            request, 
            message: "Cererea a fost creată și email trimis.",
            total: finalTotal 
        });

    } catch (error) {
        console.error("❌ Eroare în createRequest:", error);
        res.status(500).json({ message: "Eroare la procesarea cererii." });
    }
}