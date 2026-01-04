import Request from '../models/InteriorRequest.js';
import { extractStructuredTasks, calculateFinalCost } from './estimationController.js';
import sendPriceEstimateEmail from '../utils/emailService.js';
import User from '../models/user.js';
export async function createRequest(req, res) {
    console.log("🚀 A fost apelată funcția createRequest!");

    try {
        // 1️⃣ Salvează cererea în baza de date
        const request = await Request.create({
            ...req.body,
            userId: req.user.id
        });

        // 2️⃣ Preia emailul utilizatorului
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Utilizator inexistent" });
        const userEmail = user.email;

        console.log("📧 Email găsit în DB:", userEmail);
        console.log("🚀 Pornesc estimarea cu Groq...");

        // 3️⃣ Obține datele de la Groq
        const structured = await extractStructuredTasks({
            description: request.description,
            squareMeters: request.squareMeters,
            county: request.county,
            materialQuality: request.materialQuality
        });

        // --- LOGICĂ DE DECIZIE (AI vs Fallback) ---
        let finalTotal = 0;
        let finalDetails = [];

        if (structured && structured.materiale) {
            console.log("✅ Groq a calculat cu succes:", structured);
            
            finalTotal = structured.total_estimat;
            finalDetails = structured.materiale.map(m => ({
                sarcina: m.nume,
                manopera: m.nume.includes('Manoperă') ? m.pret_estimat : 0,
                materiale: !m.nume.includes('Manoperă') ? m.pret_estimat : 0,
                total: m.pret_estimat
            }));
        } else {
            // 4️⃣ FALLBACK: Dacă Groq eșuează, folosim logica veche locală
            console.warn('⚠️ Groq a eșuat, folosim logica locală de fallback.');
            
            // Reutilizăm funcția ta veche de calcul dacă AI-ul pică
            const fallbackData = {
                sarcini_identificate: request.description.toLowerCase().includes('glet') ? ['Gletuire pereti'] : ['Vopsit lavabil (2 straturi)'],
                suprafata_mp: Number(request.squareMeters),
                calitate: request.materialQuality
            };
            const fallbackCost = calculateFinalCost(fallbackData, request.county);
            
            finalTotal = fallbackCost.costTotal;
            finalDetails = fallbackCost.detaliiCost;
        }

        // 5️⃣ Trimite emailul cu datele finale (fie de la AI, fie Fallback)
        console.log(`📧 Trimit email către: ${userEmail}`);
        
        await sendPriceEstimateEmail(
            userEmail,
            finalTotal,
            finalDetails,
            request.description,
            request.squareMeters,
            request.county,
            request.materialQuality
        );
        const io = req.app.get('socketio'); // Recuperezi "io" setat în server.js
        io.emit('new_job_available', {
          message: "🚀 S-a publicat o nouă lucrare! Intră și fă un preț.",
          categorie: structured.categorie, // Ex: "Case la roșu"
          detalii: `${request.squareMeters} mp în ${request.county}`
        });

        console.log("📢 Notificare trimisă prin Socket.io!");
        // 6️⃣ Răspuns către Front-end
        res.status(201).json({ 
            request, 
            message: "Cererea a fost creată și email trimis.",
            total: finalTotal 
        });

    } catch (error) {
        console.error("❌ Eroare în createRequest:", error);
        res.status(500).json({ message: "Eroare la crearea cererii." });
    }
}
// În requestController.js, după sendPriceEstimateEmail...

