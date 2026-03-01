// // controllers/estimationController.js
// //import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from 'dotenv';
// dotenv.config();
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url); 
// const pricingData = require('../data/pricingData.json'); 


// //const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// import sendPriceEstimateEmail from '../utils/emailService.js'; 

// // const ListModels = async () => {
// //     try {
// //         const models = await genAI.ListModels();
// //         console.log("modelele tale disponibile:" , models);
// //     }catch(e) {
// //         console.log("nu pot lista modelele");
// //     }
// // };
// import fetch from "node-fetch";


// export async function extractStructuredTasks({ description, squareMeters, category, specificDetails, materialQuality, county }) {
//     console.log("🔥 APELĂM GROQ PENTRU CALCUL DETALIAT...");
//     const apiKey = process.env.GROQ_API_KEY;
//     const url = "https://api.groq.com/openai/v1/chat/completions";

//     const safeCategory = (category || "interioare").toLowerCase();

//     // Definim un context de prețuri medii actualizate (aici putem injecta datele din scraping ulterior)
//     const contextPreturi = `
//         Beton B250: 450 RON/mc, Fier: 5 RON/kg, Caramida: 450 RON/mc, 
//         Manopera Case la Rosu: 250-350 RON/mp, Suruburi/Sarma: 4000 RON/proiect mediu,
//         Inchiriere Popi/Cofraje: 15 RON/mp/luna.
//     `;

//     const prompt = `
//       Ești un inginer constructor expert în devize din România. 
//       Calculează un deviz detaliat pentru: ${safeCategory.toUpperCase()}.
      
//       DATE TEHNICE:
//       - Suprafață: ${squareMeters} mp.
//       - Descriere: "${description}".
//       - Calitate: ${materialQuality}.
//       - Județ: ${county}.

//       CONTEXT PREȚURI REFERINȚĂ: ${contextPreturi}

//       CERINȚE SPECIFICE:
//       1. Dacă e CASE LA ROSU: 
//          - Calculează Beton (0.35mc/mp), Fier (70kg/mc beton), Cărămidă (0.4mc/mp).
//          - ADAUGĂ obligatoriu: "Consumabile (Șuruburi, Sârmă, Distanțieri)" estimat la 3000-5000 RON.
//          - ADAUGĂ obligatoriu: "Logistică și Utilaje (Popi, Cofraje, Excavator)" estimat la 15-20% din manoperă.
//       2. Dacă e MOBILĂ: Calculează PAL/MDF, Feronerie (balamale/glisiere), Blat și Manoperă (40%).

//       Returnează STRICT un JSON:
//       {
//         "materiale": [
//           {"sarcina": "Beton B250", "manopera": 0, "materiale": 0, "total": 0},
//           {"sarcina": "Consumabile și Accesorii", "manopera": 0, "materiale": 4000, "total": 4000}
//         ],
//         "total_general": 0
//       }`;

//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 model: "llama-3.3-70b-versatile",
//                 messages: [{ role: "user", content: prompt }],
//                 temperature: 0.1,
//                 response_format: { type: "json_object" }
//             })
//         });

//         const data = await response.json();
//         return JSON.parse(data.choices[0].message.content);
//     } catch (err) {
//         console.error("❌ Eroare Groq:", err.message);
//         return null;
//     }
// }
// export function calculateFinalCost(structuredData, county) {
//     const { sarcini_identificate, suprafata_mp, calitate } = structuredData;
//     let costTotal = 0;
//     const detaliiCost = [];
    
//     // Asigură-te că folosești county și qualityKey
//     const qualityKey = calitate.charAt(0).toUpperCase() + calitate.slice(1).toLowerCase();
//     const esteJudetScump = pricingData.judete_cu_pret_ridicat.includes(county);
    
//     if (!sarcini_identificate || sarcini_identificate.length === 0) {
//         return { costTotal: 0, detaliiCost: [] };
//     }

//     for (const sarcina of sarcini_identificate) {
//         const pret = pricingData.preturi_unitare[sarcina];
//         if (!pret) continue;
//         const manoperaUnitara = esteJudetScump
//             ? pret.cost_manopera[qualityKey]?.judete_scumpe ?? pret.cost_manopera[qualityKey]?.pret_mediu
//             : pret.cost_manopera[qualityKey]?.pret_mediu;

//         if (!manoperaUnitara) continue;

//         const manoperaTotal = manoperaUnitara * suprafata_mp;
//         const materialUnit = pret.cost_material[qualityKey];
//         const materialeTotal = pret.consum_material_per_m2 * suprafata_mp * materialUnit;

//         const total = manoperaTotal + materialeTotal;
//         costTotal += total;

//         detaliiCost.push({
//             sarcina,
//             manopera: Number(manoperaTotal.toFixed(2)),
//             materiale: Number(materialeTotal.toFixed(2)),
//             total: Number(total.toFixed(2))
//         });
//     }

//     return { costTotal: Number(costTotal.toFixed(2)), detaliiCost };
// }

// export async function getPriceEstimate(req, res) {
//     const { description, squareMeters, county, materialQuality, email, category } = req.query;

//     try {
//         const resultAI = await extractStructuredTasks({
//             description,
//             squareMeters: Number(squareMeters),
//             category,
//             materialQuality,
//             county
//         });

//         if (!resultAI) throw new Error("AI failed to generate data");

//         // Trimitem datele direct către email service
//         const emailSent = await sendPriceEstimateEmail(
//             email,
//             resultAI.total_general,
//             resultAI.materiale,
//             description,
//             squareMeters,
//             county,
//             materialQuality
//         );

//         return res.status(200).json({ succes: true, total: resultAI.total_general });
//     } catch (err) {
//         res.status(500).json({ succes: false, error: err.message });
//     }
// }
// controllers/estimationController.js
// controllers/estimationController.js
// import dotenv from 'dotenv';
// dotenv.config();
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url); 
// const pricingData = require('../data/pricingData.json'); 
// import sendPriceEstimateEmail from '../utils/emailService.js'; 
// import fetch from "node-fetch";

// export async function extractStructuredTasks({ description, squareMeters, category, materialQuality, county }) {
//     console.log(`🔥 GENERARE DEVIZ PROFESIONAL PENTRU: ${category}`);
//     const apiKey = process.env.GROQ_API_KEY;
//     const url = "https://api.groq.com/openai/v1/chat/completions";

//     const safeCategory = (category || "interioare").toLowerCase();

//     // Injectăm prețuri de referință pentru a evita 0 RON
//     const contextPreturi = `
//         Beton B250: 480 RON/mc, Fier: 5.2 RON/kg, Caramida: 500 RON/mc, 
//         Manopera Case la Rosu: 300 RON/mp, Suruburi/Sarma/Cuie: 4500 RON/total,
//         Inchiriere Popi/Cofraje/Utilaje: 20 RON/mp.
//     `;

//     // În extractStructuredTasks, modifică prompt-ul:
//         const prompt = `
//     Ești inginer constructor.

//     Extrage lista COMPLETĂ de materiale necesare pentru:
//     "${description}"

//     Returnează STRICT JSON:

//     {
//     "materiale": [
//         { "nume": "Beton B250", "unitate": "mc", "cantitate": 35 },
//         { "nume": "Fier beton", "unitate": "kg", "cantitate": 2800 },
//         { "nume": "Cărămidă", "unitate": "mc", "cantitate": 40 }
//     ]
//     }
//     `;

//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 model: "llama-3.3-70b-versatile",
//                 messages: [{ role: "user", content: prompt }],
//                 temperature: 0.1,
//                 response_format: { type: "json_object" }
//             })
//         });

//         const data = await response.json();
//         return JSON.parse(data.choices[0].message.content);
//     } catch (err) {
//         console.error("❌ Eroare Groq:", err.message);
//         return null;
//     }
// }

// export function calculateFinalCost(structuredData, county) {
//     if (!structuredData) return { costTotal: 0, detaliiCost: [] };

//     // Verificăm dacă avem date de la AI, indiferent de categorie
//     const materialeAI = structuredData.materiale_ai || structuredData.materiale || [];

//     if (materialeAI.length > 0) {
//         console.log("✅ Folosim datele calculate de AI pentru deviz.");
//         return {
//             costTotal: Number(structuredData.total_general || structuredData.total_estimat || 0),
//             detaliiCost: materialeAI.map(m => ({
//                 sarcina: m.sarcina || m.nume || "Material/Lucrare",
//                 manopera: Number(m.manopera || 0),
//                 materiale: Number(m.materiale || m.pret_estimat || 0),
//                 total: Number(m.total || (Number(m.manopera || 0) + Number(m.materiale || m.pret_estimat || 0)))
//             }))
//         };
//     }

//     // Mesaj de eroare în consolă dacă ajunge aici
//     console.log("⚠️ Eroare: AI-ul nu a returnat materiale, fallback la 0.");
//     return { costTotal: 0, detaliiCost: [] };
// }
// export async function getPriceEstimate(req, res) {
//     const { description, squareMeters, county, materialQuality, email, category } = req.query;

//     try     county
//         });

//         const cost = calculateFinalCost(resultAI, county);

//         await sendPriceEstimateEmail(
//             email,
//             cost.costTotal,
//             cost.detaliiCost,
//             description,
//             squareMeters,
//             county,
//             materialQuality
//         );

//         return res.status(200).json({ succes: true, total: cost.costTotal });
//     } catch (err) {
//         res.status(500).json({ succes: false, error: err.message });
//     }
// }
//  {
//         const resultAI = await extractStructuredTasks({
//             description,
//             squareMeters: Number(squareMeters),
//             category,
//             materialQuality,
       
// controllers/estimationController.js
import { extractMaterialsFromAI } from "../services/aiService.js";
import { calculateEstimate } from "../services/estimationService.js";
import sendPriceEstimateEmail from "../utils/emailService.js";

export async function getPriceEstimate(req, res) {

    const {
        description,
        squareMeters,
        category,
        email
    } = req.query;

    try {
        console.log("🚀 Pornim estimarea...");

        // 1️⃣ Extragem materiale din AI
        const aiResult = await extractMaterialsFromAI({
            description,
            squareMeters,
            category
        });

        if (!aiResult || !aiResult.materiale) {
            throw new Error("AI nu a returnat materiale.");
        }

        // 2️⃣ Calculăm prețurile reale prin scraping
        const estimate = await calculateEstimate(aiResult.materiale);

        // 3️⃣ Trimitem email
        await sendPriceEstimateEmail(
            email,
            estimate.totalGeneral,
            estimate.detalii,
            description,
            squareMeters
        );

        return res.status(200).json({
            succes: true,
            total: estimate.totalGeneral,
            detalii: estimate.detalii
        });

    } catch (err) {
        console.error("❌ Estimation error:", err.message);

        return res.status(500).json({
            succes: false,
            error: err.message
        });
    }
}