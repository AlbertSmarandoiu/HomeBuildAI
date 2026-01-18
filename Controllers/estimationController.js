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
export async function extractStructuredTasks({ description, squareMeters, category, specificDetails, materialQuality }) {
    console.log("🔥 APELĂM GROQ ACUM...");
    const apiKey = process.env.GROQ_API_KEY;
    const url = "https://api.groq.com/openai/v1/chat/completions";

    // 🛡️ REPARĂ EROAREA: Dacă category e undefined, punem 'interioare' default
    const safeCategory = (category || "interioare").toUpperCase();

    const prompt = `
      Ești un inginer constructor expert în devize. Analizează această cerere de tip: ${safeCategory}.
      
      DATE TEHNICE:
      - Suprafață totală construită (desfășurată): ${squareMeters} mp.
      - Descriere: "${description}".
      - Calitate materiale: ${materialQuality}.
      - Detalii extra: ${JSON.stringify(specificDetails || {})}.

      INSTRUCȚIUNI DE CALCUL SPECIFICE:
      Daca categoria este mobila:
      1. PAL/MDF: Estimează în funcție de metri liniari (aprox 2.5 mp de placă per 1 ml de dulap).
      2. Feronerie: Calculează balamale (aprox 4 per ml) și glisiere.
      3. Manoperă: Aproximativ 30-40% din valoarea materialelor.
      4. Blat (dacă e bucătărie): 1 ml blat per 1 ml mobilă jos.
      Dacă categoria este CASE LA ROSU:
      1. Beton: Calculează aprox. 0.35 mc per mp construit. (Ex: 100mp -> 35mc).
      2. Fier: Calculează aprox. 60-80 kg per mc de beton.
      3. Cărămidă: Calculează aprox. 0.4 mc per mp construit (ziduri ext + int).
      4. Cuie/Sârmă/Distanțieri: Adaugă un pachet estimativ.
      5. Manoperă: Estimează între 40-70 EUR (200-350 RON) per mp construit.

      Dacă categoria este EXTERIOR:
      1. Polistiren: ${specificDetails?.suprafataFatada || 0} mp * 1.05.
      2. Pavele: ${specificDetails?.suprafataPavele || 0} mp * 1.02.
      3. Manoperă exterior: 100-150 RON/mp.

      Dacă categoria este INTERIOARE:
      1. Glet, Lavabilă, Sape (standard mp).

      Returnează STRICT un JSON cu această structură:
      {
        "categorie": "${category}",
        "materiale": [
          {"nume": "Beton B250", "cantitate": 0, "unitate": "mc", "pret_estimat": 0},
          {"nume": "Oțel Beton", "cantitate": 0, "unitate": "kg", "pret_estimat": 0},
          {"nume": "Cărămidă", "cantitate": 0, "unitate": "mc", "pret_estimat": 0},
          {"nume": "Manoperă Structură", "cantitate": 1, "unitate": "lucrare", "pret_estimat": 0}
        ],
        "total_estimat": 0
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
                temperature: 0.1, // Temperatură mică pentru calcule precise
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