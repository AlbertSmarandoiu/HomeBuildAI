// controllers/estimationController.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();
import { createRequire } from 'module';
const require = createRequire(import.meta.url); 
const pricingData = require('../data/pricingData.json'); 


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

import sendPriceEstimateEmail from '../utils/emailService.js'; 

const ListModels = async () => {
    try {
        const models = await genAI.ListModels();
        console.log("modelele tale disponibile:" , models);
    }catch(e) {
        console.log("nu pot lista modelele");
    }
};


// export async function extractStructuredTasks({ description }) {
//   const sarciniValide = Object.keys(pricingData.preturi_unitare);

//   const prompt = `Ești un expert în construcții. Analizează cererea: "${description}". 
//   Lista sarcinilor disponibile: ${sarciniValide.join(", ")}. 
//   Returnează STRICT JSON: { "sarcini_identificate": ["Nume Sarcina"] }`;

//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
//     console.log("✅ Gemini RAW:", text);
//     return JSON.parse(text);
//   } catch (err) {
//     console.error("❌ Eroare Gemini reală:", err.message);
//     return null;
//   }
// }


export async function extractStructuredTasks({ description }) {
    // Luăm sarcinile tale din fișierul JSON de prețuri
    const sarciniValide = Object.keys(pricingData.preturi_unitare);

    const apiKey = process.env.GEMINI_API_KEY;
    // Forțăm versiunea stabilă v1, nu v1beta!
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Analizează această cerere de renovare: "${description}".
    Alege sarcinile potrivite doar din această listă: [${sarciniValide.join(", ")}].
    Returnează DOAR un obiect JSON valid: {"sarcini_identificate": ["Nume Sarcina"]}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const text = data.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        console.log("✅ Gemini HTTP RAW:", text);
        return JSON.parse(text);

    } catch (err) {
        console.error("❌ Eroare Gemini HTTP:", err.message);
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