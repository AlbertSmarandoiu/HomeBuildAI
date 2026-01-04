// controllers/estimationController.js
//import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();
import { createRequire } from 'module';
const require = createRequire(import.meta.url); 
const pricingData = require('../data/pricingData.json'); 


//const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

import sendPriceEstimateEmail from '../utils/emailService.js'; 

// const ListModels = async () => {
//     try {
//         const models = await genAI.ListModels();
//         console.log("modelele tale disponibile:" , models);
//     }catch(e) {
//         console.log("nu pot lista modelele");
//     }
// };
import fetch from "node-fetch";

// În controllers/estimationController.js

export async function extractStructuredTasks({ description, squareMeters, materialQuality }) {
    console.log("🔥 APELĂM GROQ ACUM...");
    const apiKey = process.env.GROQ_API_KEY;
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const prompt = `
      Ești un expert în devize construcții. Analizează cererea: "${description}" pentru ${squareMeters} mp.
      
      Categorii disponibile:
      1. Case la Roșu: Calculează beton (0.35mc/mp), fier (70kg/mc beton), cărămidă, manoperă structură.
      2. Interioare: Tencuit, gletuit, vopsit, parchet, electrice.
      3. Exterioare: Pavele, izolație polistiren, decorativă, grădină.
      4. Mobilă: Estimare pe metru liniar sau complexitate.

      Identifică categoria corectă și returnează un JSON cu:
      - lista de sarcini
      - materiale necesare (cantități estimate: mc, kg, mp)
      - preț unitar estimat pentru fiecare material conform pieței din România (Beton: 400 lei/mc, Cărămidă: 500 lei/mc, Manoperă: 250 lei/mp la roșu).

      Returnează STRICT JSON:
      {
        "categorie": "Case la Roșu",
        "sarcini": ["Turnare placă", "Zidărie"],
        "materiale": [
          {"nume": "Beton B250", "cantitate": 15, "unitate": "mc", "pret_estimat": 6000},
          {"nume": "Fier BST500", "cantitate": 1200, "unitate": "kg", "pret_estimat": 6000}
        ],
        "total_estimat": 12000
      }`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (err) {
        console.error("❌ Eroare Groq:", err.message);
        return null;
    }
}

export function calculateFinalCost(structuredData, county) {
    const { sarcini_identificate, suprafata_mp, calitate } = structuredData;
    let costTotal = 0;
    const detaliiCost = [];
    
    // Asigură-te că folosești county și qualityKey
    const qualityKey = calitate.charAt(0).toUpperCase() + calitate.slice(1).toLowerCase();
    const esteJudetScump = pricingData.judete_cu_pret_ridicat.includes(county);
    
    if (!sarcini_identificate || sarcini_identificate.length === 0) {
        return { costTotal: 0, detaliiCost: [] };
    }

    for (const sarcina of sarcini_identificate) {
        const pret = pricingData.preturi_unitare[sarcina];
        if (!pret) continue;
        const manoperaUnitara = esteJudetScump
            ? pret.cost_manopera[qualityKey]?.judete_scumpe ?? pret.cost_manopera[qualityKey]?.pret_mediu
            : pret.cost_manopera[qualityKey]?.pret_mediu;

        if (!manoperaUnitara) continue;

        const manoperaTotal = manoperaUnitara * suprafata_mp;
        const materialUnit = pret.cost_material[qualityKey];
        const materialeTotal = pret.consum_material_per_m2 * suprafata_mp * materialUnit;

        const total = manoperaTotal + materialeTotal;
        costTotal += total;

        detaliiCost.push({
            sarcina,
            manopera: Number(manoperaTotal.toFixed(2)),
            materiale: Number(materialeTotal.toFixed(2)),
            total: Number(total.toFixed(2))
        });
    }

    return { costTotal: Number(costTotal.toFixed(2)), detaliiCost };
}
export async function getPriceEstimate(req, res) {
    const { description, squareMeters, county, materialQuality, email } = req.query;

    if (!description || !squareMeters || !county || !materialQuality || !email) {
        return res.status(400).json({ message: 'Parametri lipsă (descriere, mp, județ, calitate, email).' });
    }

    try {
        const structuredData = await extractStructuredTasks({
            description,
            squareMeters: Number(squareMeters),
            materialQuality // Calitatea este trimisă LLM-ului
        });

        if (!structuredData?.sarcini_identificate?.length) {
            return res.status(200).json({ succes: false, message: 'Nu am putut identifica sarcini.' });
        }

        const cost = calculateFinalCost(structuredData, county);
        const emailSent = await sendPriceEstimateEmail(
            email,
            cost.costTotal,
            cost.detaliiCost,
            description
        );
        return res.status(200).json({
            succes: true,
            estimare_totala: cost.costTotal,
            stare_email: emailSent ? 'Trimis' : 'Eroare la trimitere email',
            detalii_cost: cost.detaliiCost
        });
    } catch (err) {
        console.error("Eroare în ruta de estimare:", err);
        // Trimitere eroare 500
        res.status(500).json({ message: 'Eroare server la procesarea estimării.' });
    }
}