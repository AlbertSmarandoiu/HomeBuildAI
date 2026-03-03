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

    const pricingPath = path.join(__dirname, '../data/materialPrices.json');
    const materialPrices = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));

    const catalogCategorie = materialPrices[category.toLowerCase()] || {};
    const listaServicii = Object.keys(catalogCategorie).join(", ");

    const prompt = `
        Ești inginer devizier expert. Categoria: CASE LA ROȘU. 
        Suprafață sol: ${squareMeters} mp.

        CALCULEAZĂ AUTOMAT URMĂTOARELE CANTITĂȚI:
        1. BETON: ${squareMeters} * 0.4 = rezultatul în MC (pentru fundație și plăci).
        2. FIER: (Cantitate Beton) * 75 = rezultatul în KG.
        3. ZIDĂRIE: ${squareMeters} * 0.45 = rezultatul în MC.
        4. COFRAJ (Doka/Lemn): ${squareMeters} * 2.8 = rezultatul în MP.

        EXTRAGE din catalogul meu [${listaServicii}] doar elementele care se potrivesc. 
        Dacă cererea e generală ("vreau casă la roșu"), pune TOATE elementele de mai sus.
        `;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Ești un generator de JSON pentru devize de construcții. Răspunzi DOAR în format JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0, // Setați la 0 pentru precizie maximă
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) throw new Error("Groq empty response");
        
        // Parsăm rezultatul
        const result = JSON.parse(data.choices[0].message.content);
        return result; 
    } catch (err) {
        console.error("❌ AI Error:", err.message);
        return { materiale: [] }; // Returnăm un obiect valid, nu null
    }
}