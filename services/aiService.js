// services/aiService.js
import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function extractMaterialsFromAI({ description, squareMeters, category }) {
    const apiKey = process.env.GROQ_API_KEY;
    const url = "https://api.groq.com/openai/v1/chat/completions";

    // 1. Citim prețurile
    const pricingPath = path.join(__dirname, '../data/materialPrices.json');
    const materialPrices = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));

    // 2. DECLARĂM variabila care lipsea
    const catalogCategorie = materialPrices[category.toLowerCase()] || {};
    const listaServicii = Object.keys(catalogCategorie).join(", "); // <--- ASTA LIPSEA!

    const prompt = `
    Ești inginer devizier expert. Calculezi pentru categoria: ${category.toUpperCase()}.
    Suprafața utilă (podea): ${squareMeters} mp.
    
    REGULI MATEMATICE DE CALCUL (STRICT):
    1. Dacă categoria este INTERIOARE:
       - Suprafață Pereți = ${squareMeters} * 2.8.
       - Glet/Lavabilă: Se aplică pe Suprafață Pereți + ${squareMeters} (tavan).
       - Consum saci: 1 sac glet (20kg) la fiecare 12 mp de perete.
    2. Dacă categoria este CASE LA ROȘU:
       - Beton: ${squareMeters} * 0.35 mc.
       - Cofraj: ${squareMeters} * 2.5 mp.
       - Zidărie: ${squareMeters} * 0.4 mc.
       - Fier: Cantitate Beton * 75 kg.
       - IGNORĂ complet gletul, lavabila sau gresia.

    SARCINA:
    Analizează: "${description}". 
    Alege DOAR denumiri din acest catalog: [${listaServicii}].

    Răspunde STRICT JSON:
    {
      "materiale": [
        { "nume": "Nume exact din catalog", "cantitate": 123, "unitate": "mp/mc/kg/saci" }
      ]
    }`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) throw new Error("Groq empty response");
        
        return JSON.parse(data.choices[0].message.content);
    } catch (err) {
        console.error("❌ AI Error:", err.message);
        return null;
    }
}