// controllers/requestController.js
import Request from '../models/InteriorRequest.js'; // Asigură-te că importi modelul!
import { extractStructuredTasks, calculateFinalCost } from './estimationController.js';
import sendPriceEstimateEmail from '../utils/emailService.js';
import User from '../models/user.js';
import { mapIntentiiLaSarcini } from '../utils/taskMapper.js';


export async function createRequest(req, res) {
  console.log("🚀 A fost apelată funcția createRequest!");

  try {
    // 1️⃣ Salvează cererea
    const request = await Request.create({
      ...req.body,
      userId: req.user.id
    });

    // 2️⃣ Preia emailul din DB
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilizator inexistent" });
    const userEmail = user.email;
    console.log("📧 Email găsit în DB:", userEmail);

    // 3️⃣ Extrage intențiile folosind Gemini
    let structured = await extractStructuredTasks({
      description: request.description,
      squareMeters: request.squareMeters,
      county: request.county,
      materialQuality: request.materialQuality
    }).catch(err => {
      console.error("❌ Eroare Gemini:", err);
      return null;
    });

    // 4️⃣ Mapăm intențiile la sarcini reale
    let intentii = structured?.sarcini_identificate || [];
    let sarcini = mapIntentiiLaSarcini(intentii);

    // fallback dacă Gemini nu găsește nimic
    if (sarcini.length === 0) {
      console.warn('⚠️ Gemini nu a returnat nimic, folosim fallback textual.');
      const desc = request.description.toLowerCase();
      if (desc.includes('glet')) sarcini.push('Gletuire pereti');
      if (desc.includes('vopsit')) sarcini.push('Vopsit lavabil (2 straturi)');
    }

    const structuredFinal = {
      sarcini_identificate: sarcini,
      suprafata_mp: Number(request.squareMeters),
      calitate: request.materialQuality
    };

    // 5️⃣ Calculează costul
    const cost = calculateFinalCost(structuredFinal, request.county);

    // 6️⃣ Trimite email
    console.log(`📧 Trimit email către: ${userEmail}`);
    //await sendPriceEstimateEmail(userEmail, cost.costTotal, cost.detaliiCost, request.description);
    await sendPriceEstimateEmail(
    userEmail, 
    cost.costTotal, 
    cost.detaliiCost, 
    request.description,
    request.squareMeters, // Trimitem mp
    request.county,       // Trimitem județul
    request.materialQuality // Trimitem calitatea
);
    // 7️⃣ Răspuns
    res.status(201).json({ request, message: "Cererea a fost creată și email trimis." });

  } catch (error) {
    console.error("❌ Eroare în createRequest:", error);
    res.status(500).json({ message: "Eroare la crearea cererii sau trimiterea emailului." });
  }
}

