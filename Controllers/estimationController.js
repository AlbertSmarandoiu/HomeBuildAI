// controllers/estimationController.js

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// 🚨 SOLUȚIA 1: Importul JSON robust, folosind require
import { createRequire } from 'module';
const require = createRequire(import.meta.url); 
const pricingData = require('../data/pricingData.json'); 

// 🚨 SOLUȚIA 2: Importul serviciului de email (Export Implicit)
import sendPriceEstimateEmail from '../utils/emailService.js'; 

// Configurare Gemini
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY); 
const model = "gemini-2.5-flash"; 
export async function extractStructuredTasks(requestData) {
  const { description, squareMeters, county, materialQuality } = requestData;

  // Lista sarcinilor disponibile (din pricingData)
  const sarciniValide = [
    "Gletuire pereti",
    "Vopsit lavabil (2 straturi)",
    "Montat parchet laminat"
    // poți adăuga toate sarcinile tale
  ];

  // Schema JSON care va fi returnată
  const schema = {
    description: "Schema pentru estimarea costurilor de renovare",
    type: "object",
    properties: {
      sarcini_identificate: {
        type: "array",
        items: { type: "string" },
        description: "Lista sarcinilor de lucru extrase din text"
      }
    },
    required: ["sarcini_identificate"]
  };

  // Prompt pentru Gemini
  const prompt = `
Analizează această cerere de renovare: "${description}".
Identifică toate sarcinile posibile din lista următoare: [${sarciniValide.join(", ")}].
Folosește orice sinonim sau formulare apropiată, dar returnează **numai sarcinile din lista validă**.
Suprafața este ${squareMeters} mp, județul este ${county}, calitatea este ${materialQuality}.
Returnează un obiect JSON valid conform schemei.
Exemplu de răspuns: { "sarcini_identificate": ["Gletuire pereti", "Vopsit lavabil (2 straturi)"] }
  `;

  try {
    // 🚨 SCHIMBĂRILE AICI: 
    // 1. Folosim "ai" (cum ai definit sus), nu "genAI"
    // 2. Folosim "gemini-1.5-flash" (mai stabil pentru JSON)
    const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" })
      .generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

    const responseText = result.response.text();
    console.log("✅ Răspuns Gemini:", responseText);
    return JSON.parse(responseText);
  } catch (error) {
    // Folosim error.message pentru a vedea eroarea reală în terminal, nu doar {}
    console.error("❌ Eroare Gemini reală:", error.message || error);
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

        // Logica de calcul a costului total și a detaliilor
        // ... (Logica ta de calcul) ...
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


/**
 * Functia 3: Ruta API care orchestrează fluxul de estimare și trimite emailul.
 */
export async function getPriceEstimate(req, res) {
    // Preluarea parametrilor
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
        
        // 1. Calculul Costului Final
        const cost = calculateFinalCost(structuredData, county);
        
        // 2. Trimiterea Emailului (se execută înainte de return)
        const emailSent = await sendPriceEstimateEmail(
            email,
            cost.costTotal,
            cost.detaliiCost,
            description
        );

        // 3. Răspunsul HTTP (cu starea trimiterii emailului)
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