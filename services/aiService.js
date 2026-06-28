import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function groqCall(apiKey, systemPrompt, userPrompt, label = "") {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user",   content: userPrompt }
            ],
            temperature: 0,
            response_format: { type: "json_object" }
        })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0)
        throw new Error(`Groq empty response [${label}]`);

    console.log(` [${label}] Răspuns:`, data.choices[0].message.content);
    return JSON.parse(data.choices[0].message.content);
}

function calculeazaCantitati(jsonKey, squareMeters, camere = [], nr_uis = 3) {
    const suprafataParchet = camere
        .filter(c => c.finisaj === "parchet")
        .reduce((s, c) => s + c.suprafata, 0) || squareMeters * 0.6;

    const suprafataGresie = camere
        .filter(c => c.finisaj === "gresie_faianta")
        .reduce((s, c) => s + c.suprafata * (c.tip === "baie" ? 1.4 : 1.0), 0)
        || squareMeters * 0.4;

    const pereti = Math.round(squareMeters * 3);
    const moloz_mc   = Math.max(1, Math.round(squareMeters * 0.08));
    const moloz_saci = moloz_mc * 15;

    return {
        "parchet":                              Math.round(suprafataParchet),
        "gresie_faianta":                       Math.round(suprafataGresie),
        "Sapa autonivelanta":                   squareMeters,
        "Sapa egalizare":                       squareMeters,
        "Glet de ipsos-finisat":                pereti,
        "Glet de ipsos-încărcare":              pereti,
        "Zugraveli lavabile (2 straturi)":      pereti,
        "tencuiala":                            pereti,
        "Tencuieli interioare driscuite pereti":pereti,
        "Montaj tapet":                         pereti,
        "Tinciuiala decorativa":                pereti,
        "Izolatie cu vata minerala":            squareMeters,
        "Usi interiore":                        nr_uis,
        "Desfacut gresie, faianta, parchet":    Math.round(suprafataGresie),
        "Demontat parchet laminat":             Math.round(suprafataParchet),
        "Demontat parchet masiv":               Math.round(suprafataParchet),
        "Demontat linoleum":                    squareMeters,
        "Desfaceri pardoseli mozaic":           squareMeters,
        "Demolat pereti zidarie":               Math.round(squareMeters * 0.05),
        "Desfacut sape":                        squareMeters,
        "Evacuare moloz":                       moloz_mc,
        "Incarcare moloz in saci/ manipulare":  moloz_saci,
        "Izolație exterioară cu polistiren 10cm": squareMeters,
        "Tencuieli exterioare":                   squareMeters,
        "Placare vata bazaltica 10cm":            squareMeters,
        "Fixare plasa, masa spaclu, adeziv":      squareMeters,
        "Coltar cu plasa":                        Math.round(squareMeters * 0.3),
        "Profil de soclu":                        Math.round(squareMeters * 0.2),
        "pavaj":                                  squareMeters,
        "gazon":                                  squareMeters,
        "sapatura":                               15,
        "beton":                                  Math.round(squareMeters * 0.45),
        "caramida":                               Math.round(squareMeters * 0.45),
        "Zidarie BCA":                            Math.round(squareMeters * 0.45),
        "Preparare mortar zidarie":               Math.round(squareMeters * 0.45),
        "acoperis":                               Math.round(squareMeters * 1.5),
        "tigla metalica":                         Math.round(squareMeters * 1.5),
        "tigla ceramica":                         Math.round(squareMeters * 1.5),
        "Executat panouri cofraj din lemn":       Math.round(squareMeters * 1.2),
        "Decofrat placa beton":                   Math.round(squareMeters * 1.2),
        "Cofrat planseu cu scandura":             Math.round(squareMeters * 1.2),
        "Cofrat planseu cu doka":                 Math.round(squareMeters * 1.2),
        "Armare planseu cu fier beton":           Math.round(squareMeters * 50),
        "Armare planseu cu plasa sudata":         Math.round(squareMeters * 1.2),
        "Hidroizolatie pensulabila (1 mana)":     squareMeters,
        "Umplut pietris si tasat":                squareMeters,
        "Trasat fundatie":                        squareMeters,
        "debitare_pal":    Math.round(squareMeters * 2),
        "montaj_bucatarie":Math.max(1, Math.round(squareMeters * 0.1)),
        "montaj_dulap":    Math.max(1, Math.round(squareMeters * 0.05)),
    };
}

async function apelArhitect(apiKey, description, squareMeters) {
    const systemPrompt =
        "Ești un arhitect expert din România. Răspunzi EXCLUSIV cu JSON valid, fără markdown.";

    const userPrompt = `
Citește cu atenție descrierea clientului și extrage camerele locuinței.
Descrierea: "${description}"
Suprafața totală: ${squareMeters} mp.

Distribuie suprafața realist:
- Baie: 5–9 mp per baie → finisaj: "gresie_faianta"
- Bucătărie: 10–15% din total → finisaj: "gresie_faianta"
- Dormitor: 12–18 mp → finisaj: "parchet"
- Living/hol: restul → finisaj: "parchet"

Răspunde STRICT cu JSON:
{
  "camere": [
    { "tip": "baie",     "suprafata": 8,  "finisaj": "gresie_faianta" },
    { "tip": "bucatarie","suprafata": 10, "finisaj": "gresie_faianta" },
    { "tip": "dormitor", "suprafata": 14, "finisaj": "parchet" },
    { "tip": "living",   "suprafata": 23, "finisaj": "parchet" }
  ],
  "nr_usi_interioare": 4,
  "are_instalatie_sanitara": true
}`;

    try {
        const plan = await groqCall(apiKey, systemPrompt, userPrompt, "ARHITECT");
        return {
            camere: plan.camere || [],
            nr_uis: plan.nr_usi_interioare || 3,
            are_instalatie_sanitara: plan.are_instalatie_sanitara || false
        };
    } catch (err) {
        console.error("❌ [Arhitect] Eroare:", err.message);
        return {
            camere: [{ tip: "spatiu", suprafata: squareMeters, finisaj: "parchet" }],
            nr_uis: 3,
            are_instalatie_sanitara: false
        };
    }
}

async function apelSelector(apiKey, { description, category, jsonKey, cheileDisponibile, context }) {
    const systemPrompt =
        "Ești un inginer constructor expert. Răspunzi EXCLUSIV cu JSON valid, fără markdown.";

    const excluderi = jsonKey === "caselarosu" ? `
EXCLUDERI OBLIGATORII (alege doar UNA din fiecare pereche):
- Zidărie: alege "caramida" SAU "Zidarie BCA", NICIODATĂ ambele.
- Acoperiș: alege "acoperis" SAU ("tigla metalica"/"tigla ceramica"). Dacă alegi "acoperis", NU adăuga tigla separat.
- Cofraj: alege "Cofrat planseu cu scandura" SAU "Cofrat planseu cu doka", nu ambele.
- Armare: Poți pune AMBELE ("Armare planseu cu fier beton" ȘI "Armare planseu cu plasa sudata") - sunt lucrări diferite.
` : jsonKey === "exterior" ? `
EXCLUDERI OBLIGATORII:
- Izolație: alege "Izolație exterioară cu polistiren 10cm" SAU "Placare vata bazaltica 10cm", NICIODATĂ ambele.
` : "";

    const userPrompt = `
Ești un Inginer Constructor expert. Analizează cu atenție descrierea clientului și selectează EXACT lucrările necesare.

Categoria: "${category}"
Descrierea completă a clientului: "${description}"
${context}

CHEI DISPONIBILE (alege DOAR din această listă):
${cheileDisponibile.map(c => `  - "${c}"`).join("\n")}

${excluderi}

REGULI DE SELECȚIE:
1. Citește TOATĂ descrierea și identifică fiecare lucrare menționată explicit sau implicit.
2. Dacă clientul menționează "varianta albă" → include obligatoriu: tencuiala/glet + sapa.
3. Dacă clientul menționează "renovare completă" sau "demolez" → include lucrări de decopertare.
4. Dacă clientul menționează "gletuire" sau "zugrăveli" → include DOAR Glet și Zugraveli, fără parchet sau gresie.
5. Dacă clientul menționează "rețele" (apă, electricitate) → include Hidroizolatie dacă e cazul.
6. FĂRĂ DUPLICATE: fiecare cheie apare o singură dată.
7. Pune DOAR lucrările care au sens din descriere. Nu inventa lucrări nemenționate.

Răspunde STRICT cu JSON:
{
  "lucrari_selectate": ["cheie1", "cheie2", "cheie3"]
}`;

    try {
        const result = await groqCall(apiKey, systemPrompt, userPrompt, "SELECTOR");
        return result.lucrari_selectate || [];
    } catch (err) {
        console.error("❌ [Selector] Eroare:", err.message);
        return cheileDisponibile.slice(0, 5);
    }
}

export async function extractMaterialsFromAI({ description, squareMeters, category }) {
    const apiKey = process.env.GROQ_API_KEY;

    const pricingPath = path.join(__dirname, '../data/materialPrices.json');
    const materialPrices = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));

    const cleanCategory = category.toLowerCase().replace(/\s/g, "")
        .replace(/ș/g,"s").replace(/ț/g,"t")
        .replace(/ă/g,"a").replace(/â/g,"a").replace(/î/g,"i");

    const categoryMap = {
        "lucrariinterioare": "interioare",
        "interior":          "interioare",
        "interioare":        "interioare",
        "lucrariexterioare": "exterior",
        "exterior":          "exterior",
        "exterioare":        "exterior",
        "caselarosu":        "caselarosu",
        "mobila":            "mobila"
    };

    const jsonKey = categoryMap[cleanCategory] || cleanCategory;
    let catalogCategorie = { ...(materialPrices[jsonKey] || {}) };

    const esteVariantaAlba = /variant[aă]\s*alb[aă]|tencuial[aă].*glet|glet.*tencuial[aă]|finisa[tj].*interior|interior.*finisa[tj]/i.test(description);
    if (jsonKey === "caselarosu" && esteVariantaAlba) {
        const int = materialPrices["interioare"] || {};
        const itemsExtra = ["tencuiala", "Tencuieli interioare driscuite pereti", "Glet de ipsos-încărcare", "Zugraveli lavabile (2 straturi)", "Sapa autonivelanta", "Sapa egalizare"];
        itemsExtra.forEach(k => { if (int[k]) catalogCategorie[k] = int[k]; });
        console.log("📋 [DEBUG] Varianta albă detectată → adăugat finisaje interioare");
    }

    const cheileDisponibile = Object.keys(catalogCategorie);
    const cheileDescrise    = Object.entries(catalogCategorie)
        .map(([k, v]) => `  - "${k}" = ${v.nume}`)
        .join("\n");

    console.log(` [DEBUG] Categoria: [${jsonKey}], Varianta albă: ${esteVariantaAlba}`);

    if (jsonKey === "interioare") {
        const { camere, nr_uis } = await apelArhitect(apiKey, description, squareMeters);

        const suprafataParchet = camere.filter(c => c.finisaj === "parchet").reduce((s,c) => s + c.suprafata, 0);
        const suprafataGresie  = camere.filter(c => c.finisaj === "gresie_faianta").reduce((s,c) => s + c.suprafata * (c.tip === "baie" ? 1.4 : 1.0), 0);
        const pereti = Math.round(squareMeters * 3);
        const moloz_mc = Math.max(1, Math.round(squareMeters * 0.08));

        console.log(` Parchet: ${Math.round(suprafataParchet)} mp | Gresie: ${Math.round(suprafataGresie)} mp | Pereți: ${pereti} mp | Moloz: ${moloz_mc} mc`);

        const context = `
Plan camere dedus:
${camere.map(c => `  - ${c.tip}: ${c.suprafata} mp (${c.finisaj})`).join("\n")}
Uși interioare: ${nr_uis} buc
Suprafață la sol: ${squareMeters} mp`;

        const cheiiSelectate = await apelSelector(apiKey, {
            description, category, jsonKey,
            cheileDisponibile, cheileDescrise, context
        });

        const cantitati = calculeazaCantitati(jsonKey, squareMeters, camere, nr_uis);
        const materiale = cheiiSelectate
            .filter(k => catalogCategorie[k] !== undefined)
            .map(k => ({ cheie: k, cantitate: cantitati[k] ?? squareMeters }));

        console.log("✅ Deviz final:", materiale);
        return { materiale };
    }

    const context = jsonKey === "caselarosu"
        ? `Suprafață la sol: ${squareMeters} mp. Cantități de referință pentru inginerie:
  - Zidărie: ${Math.round(squareMeters * 0.45)} mc
  - Beton: ${Math.round(squareMeters * 0.45)} mc
  - Fier beton: ${Math.round(squareMeters * 50)} kg
  - Acoperiș: ${Math.round(squareMeters * 1.5)} mp
  - Cofraj: ${Math.round(squareMeters * 1.2)} mp`
        : `Suprafață: ${squareMeters} mp.`;

    const cheiiSelectate = await apelSelector(apiKey, {
        description, category, jsonKey,
        cheileDisponibile, cheileDescrise, context
    });

    const cantitati = calculeazaCantitati(jsonKey, squareMeters, [], 3);
    const materiale = cheiiSelectate
        .filter(k => catalogCategorie[k] !== undefined)
        .map(k => ({ cheie: k, cantitate: cantitati[k] ?? squareMeters }));

    console.log("✅ Deviz final:", materiale);
    return { materiale };
}