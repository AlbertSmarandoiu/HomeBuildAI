import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Un singur apel către Groq
// ─────────────────────────────────────────────────────────────────────────────
async function groqCall(apiKey, systemPrompt, userPrompt, label = "") {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user",   content: userPrompt   }
            ],
            temperature: 0,
            response_format: { type: "json_object" }
        })
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
        throw new Error(`Groq empty response [${label}]`);
    }
    console.log(`🤖 [${label}] Răspuns brut:`, data.choices[0].message.content);
    return JSON.parse(data.choices[0].message.content);
}

// ─────────────────────────────────────────────────────────────────────────────
// APELUL 1 — „Arhitectul": deduce camerele și suprafețele din descriere
// Returnează: { camere, nr_usi, suprafata_totala, are_instalatie_sanitara }
// ─────────────────────────────────────────────────────────────────────────────
async function apelArhitect(apiKey, description, squareMeters) {
    const systemPrompt =
        "Ești un arhitect expert din România. Răspunzi EXCLUSIV cu JSON valid, fără markdown, fără explicații.";

    const userPrompt = `
Clientul descrie o locuință sau o lucrare de construcții.
Descrierea clientului: "${description}"
Suprafața totală declarată: ${squareMeters} mp.

SARCINA TA:
Extrage toate camerele menționate și estimează suprafața fiecăreia.
Dacă clientul menționează dimensiuni (ex: "baie 4x3"), calculează suprafața (4×3 = 12 mp).
Dacă nu menționează suprafețe exacte, distribuie realist cei ${squareMeters} mp astfel:
  - Fiecare baie: 5–9 mp
  - Bucătărie: 10–15% din total
  - Dormitoare: 12–18 mp fiecare
  - Living/hol: restul suprafeței rămas

REGULI DE FINISAJ (atribuie automat):
  - Baie, bucătărie → finisaj: "gresie_faianta"
  - Dormitor, living, hol, birou → finisaj: "parchet"

Răspunde STRICT cu acest JSON (fără nimic altceva):
{
  "camere": [
    { "tip": "baie",      "suprafata": 9,  "finisaj": "gresie_faianta" },
    { "tip": "dormitor",  "suprafata": 14, "finisaj": "parchet" },
    { "tip": "bucatarie", "suprafata": 8,  "finisaj": "gresie_faianta" },
    { "tip": "living",    "suprafata": 24, "finisaj": "parchet" }
  ],
  "nr_usi_interioare": 4,
  "are_instalatie_sanitara": true
}`;

    try {
        const plan = await groqCall(apiKey, systemPrompt, userPrompt, "ARHITECT");
        console.log("🏠 [Arhitect] Plan camere:", plan.camere);
        return {
            camere:               plan.camere               || [],
            nr_usi:               plan.nr_uis_interioare    || plan.nr_usi_interioare || 3,
            are_instalatie_sanitara: plan.are_instalatie_sanitara || false
        };
    } catch (err) {
        console.error("❌ [Arhitect] Eroare:", err.message);
        // Fallback minimal dacă apelul eșuează
        return {
            camere: [{ tip: "spatiu", suprafata: squareMeters, finisaj: "parchet" }],
            nr_usi: 3,
            are_instalatie_sanitara: false
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// APELUL 2 — „Devizierul": generează lista de lucrări cu cantități corecte
// ─────────────────────────────────────────────────────────────────────────────
async function apelDevizier(apiKey, {
    description, squareMeters, category,
    camere, nr_uis, listaServicii,
    suprafataGresie, suprafataParchet, suprafataPeretiTavan
}) {
    const systemPrompt =
        "Ești un devizier expert din România. Răspunzi EXCLUSIV cu JSON valid, fără markdown, fără explicații.";

    // Construim descrierea camerelor pentru prompt
    const descriereCamere = camere.length > 0
        ? camere.map(c => `  - ${c.tip}: ${c.suprafata} mp → finisaj: ${c.finisaj}`).join("\n")
        : `  - Spațiu unic: ${squareMeters} mp`;

    const userPrompt = `
Ești un Devizier expert. Generează un deviz complet și realist pentru această lucrare.

Categoria lucrării: "${category}"
Descrierea clientului: "${description}"
Suprafața totală la sol: ${squareMeters} mp

PLAN CAMERE (dedus de arhitect):
${descriereCamere}

SUPRAFEȚE PRE-CALCULATE (folosește EXACT aceste valori):
  - Suprafață gresie/faianță (baie + bucătărie + pereți baie): ${Math.round(suprafataGresie)} mp
  - Suprafață parchet (dormitoare + living): ${Math.round(suprafataParchet)} mp
  - Suprafață glet + lavabilă (toți pereții + tavan): ${suprafataPeretiTavan} mp
  - Suprafață șapă (toată suprafața): ${squareMeters} mp
  - Număr uși interioare: ${nr_uis} buc

LISTA COMPLETĂ DE SERVICII DISPONIBILE (folosești EXCLUSIV aceste chei, exact cum sunt scrise):
${listaServicii}

REGULI STRICTE (respectă-le în ordine):
1. FINISAJE PE CAMERĂ:
   - Parchetul se pune DOAR în camerele cu finisaj "parchet". Cantitate = ${Math.round(suprafataParchet)} mp.
   - Gresie/faianța se pune DOAR în camerele cu finisaj "gresie_faianta". Cantitate = ${Math.round(suprafataGresie)} mp.
2. LUCRĂRI PREGĂTITOARE (merg ÎNTOTDEAUNA pe toată suprafața):
   - Șapa (autonivelantă sau de egalizare) → cantitate = ${squareMeters} mp.
3. FINISAJE PEREȚI ȘI TAVAN (merg pe suprafața desfășurată, NU pe suprafața la sol):
   - Glet, lavabilă, tencuială, tapet → cantitate = ${suprafataPeretiTavan} mp.
4. UȘI: Număr bucăți = ${nr_uis}. Pune cheia de uși din listă.
5. FĂRĂ DUPLICATE: Fiecare cheie apare o singură dată în JSON.
6. FĂRĂ INVENȚII: Pune DOAR lucrările care au sens din context și din descrierea clientului.
7. ALEGERE LOGICĂ: Nu pune parchet și gresie pe aceeași cameră. Nu pune cărămidă și BCA în același deviz.
8. Dacă renovarea este completă, activează obligatoriu fazele de decopertare! Cantitatea de 'Desfacut gresie, faianta, parchet' sau 'Demontat parchet' trebuie să fie EGALĂ cu suprafețele noi corespunzătoare (${Math.round(suprafataParchet)} mp pentru parchet, respectiv ${Math.round(suprafataGresie)} mp pentru gresie).
9. Adaugă obligatoriu Managementul deșeurilor: 'Evacuare moloz' = ${planArhitect.estimare_moloz_mc} mc și 'Incarcare moloz in saci/ manipulare' = ${planArhitect.estimare_saci_moloz} saci.
10. Turnarea șapei se face pe toată suprafața apartamentului = ${squareMeters} mp.
11. Pregătire pereți: Dacă e renovare completă, include 'Glet de ipsos-încărcare' și 'Zugraveli lavabile (2 straturi)' la valoarea desfășurată de ${suprafataPeretiTavan} mp.
Răspunde STRICT cu JSON, fără markdown, fără explicații:
{
  "materiale": [
    { "cheie": "CheiaExactaDinLista", "cantitate": 123 }
  ]
}`;

    try {
        const result = await groqCall(apiKey, systemPrompt, userPrompt, "DEVIZIER");
        return result.materiale || result.lucrari || [];
    } catch (err) {
        console.error("❌ [Devizier] Eroare:", err.message);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGICĂ PENTRU CATEGORII NON-INTERIOARE (case la roșu, exterior, mobilă)
// Folosește promptul original îmbunătățit — un singur apel e suficient
// ─────────────────────────────────────────────────────────────────────────────
async function apelSimple(apiKey, { description, squareMeters, category, listaServicii }) {
    const systemPrompt =
        "Ești un generator de JSON pentru devize de construcții. Răspunzi DOAR în format JSON valid, fără markdown.";

    const userPrompt = `
Ești un Inginer Constructor și Devizier expert din România.
Extrage lucrările necesare și estimează cantitățile realiste.

Categoria lucrării: "${category}"
Descrierea clientului: "${description}"
Suprafața / lucrarea: ${squareMeters} mp.

Lista COMPLETĂ de servicii disponibile (folosești EXCLUSIV aceste chei):
${listaServicii}

REGULI DE INGINERIE STRICTE:
1. FĂRĂ DUPLICATE: O cheie apare o singură dată. Dacă apare de două ori, adună cantitățile.
2. ALEGERE LOGICĂ STRICTĂ:
   - Structură: Alege DOAR Cărămidă SAU DOAR BCA. Niciodată ambele!
   - Fațade: Alege DOAR Polistiren SAU DOAR Vată bazaltică. Niciodată ambele!
   - Dacă clientul nu specifică, alege cărămida și respectiv polistirenul ca standard.
3. CUBATURĂ ȘI UNITĂȚI LOGICE (case la roșu):
   - Zidărie (mc): aprox 0.45 mc  ${squareMeters} mp = ${Math.round(squareMeters * 0.45)} mc
   - Beton (mc): aprox 0.45 mc  ${squareMeters} mp = ${Math.round(squareMeters * 0.45)} mc
   - Fier beton (kg): aprox 50 kg  ${squareMeters} mp = ${squareMeters * 50} kg
   - Acoperiș (mp): aprox ${Math.round(squareMeters * 1.5)} mp (suprafața la sol  1.5)
   - Cofraje (mp): aprox ${Math.round(squareMeters * 1.2)} mp (suprafața la sol  1.2)
   - Săpătură (ore): max 15 ore
4. EXTERIOARE — ASOCIEREA SUPRAFEȚEI:
   - Dacă clientul cere izolație/fațadă/tencuială exterioară → asociază ${squareMeters} mp cu materialele de fațadă.
   - Dacă clientul cere pavaj/gazon/curte → asociază ${squareMeters} mp cu materialele de sol.
   - NU amesteca fațada cu curtea dacă textul nu le cere explicit pe amândouă.
5. Folosește EXCLUSIV cheile din lista de mai sus, scrise exact cum apar.
REGULI STRICTE DE DIMENSIONARE REALE:
1. Suprafețele plane ('Izolație exterioară cu polistiren 10cm', 'Placare vată bazaltică 10cm', 'Tencuială decorativă') se pun exact la valoarea fațadei: ${squareMeters} mp.
2. ALEGERE MATERIE PRIMĂ: Dacă se cere polistiren, NU pune vată bazaltică sub nicio formă!
3. REGLARE METRI LINARI (ml) PENTRU PROFILE: 
   - 'Montaj profil de soclu pentru tencuială' reprezintă perimetrul de bază al fațadei. Acesta se calculează ca fiind aproximativ 20% din suprafața fațadei! Pentru ${squareMeters} mp, cantitatea corectă este de aprox. ${Math.round(squareMeters * 0.2)} ml. (NU pune ${squareMeters}!).
   - 'Montaj colțar cu plasă pentru tencuială' reprezintă colțurile clădirii și ale geamurilor. Se calculează ca fiind aprox. 30% din suprafața fațadei! Pentru ${squareMeters} mp, cantitatea corectă este de aprox. ${Math.round(squareMeters * 0.3)} ml.
4. Finisajele de fațadă ('Fixare plasă, masă șpaclu și adeziv') se pun la fel ca izolația = ${squareMeters} mp.
Răspunde STRICT cu JSON (fără markdown, fără explicații):
{
  "materiale": [
    { "cheie": "CheiaExactaDinLista", "cantitate": 123 }
  ]
}`;

    try {
        const result = await groqCall(apiKey, systemPrompt, userPrompt, "SIMPLU");
        let arr = result.materiale || result.lucrari || [];
        if (arr.length === 0) {
            const found = Object.values(result).find(v => Array.isArray(v));
            if (found) arr = found;
        }
        return arr;
    } catch (err) {
        console.error("❌ [Simple] Eroare:", err.message);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export async function extractMaterialsFromAI({ description, squareMeters, category }) {
    const apiKey = process.env.GROQ_API_KEY;

    // ── Citim catalogul de prețuri ────────────────────────────────────────────
    const pricingPath = path.join(__dirname, '../data/materialPrices.json');
    const materialPrices = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));

    // ── Normalizăm categoria ──────────────────────────────────────────────────
    const cleanCategory = category.toLowerCase().replace(/\s/g, "")
        .replace(/ș/g, "s").replace(/ț/g, "t")
        .replace(/ă/g, "a").replace(/â/g, "a").replace(/î/g, "i");

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
    const catalogCategorie = materialPrices[jsonKey] || {};

    // Lista cu cheie + descriere completă (ajută AI-ul să înțeleagă ce e fiecare)
    const listaServicii = Object.entries(catalogCategorie)
        .map(([cheie, det]) => `  - Cheie validă: "${cheie}" (Aceasta înseamnă: ${det.nume})`)
        .join("\n");

    console.log(`📋 [DEBUG] Categoria detectată: [${jsonKey}]`);
    console.log(`📋 [DEBUG] Lista servicii trimisă către AI:\n`, listaServicii);

    // ── Ramificăm logica pe tip de categorie ─────────────────────────────────

    // INTERIOARE → două apeluri: Arhitect + Devizier
    if (jsonKey === "interioare") {

        // Apelul 1: Arhitectul deduce camerele
        const { camere, nr_uis, are_instalatie_sanitara } =
            await apelArhitect(apiKey, description, squareMeters);

        // Calculăm suprafețele derivate din planul arhitectului
        const suprafataGresie = camere
            .filter(c => c.finisaj === "gresie_faianta")
            .reduce((sum, c) => {
                // Baia: adăugăm ~40% extra pentru pereții placați cu faianță
                const extra = c.tip === "baie" ? 1.4 : 1.0;
                return sum + c.suprafata * extra;
            }, 0);

        const suprafataParchet = camere
            .filter(c => c.finisaj === "parchet")
            .reduce((sum, c) => sum + c.suprafata, 0);

        // Suprafața desfășurată pereți + tavan ≈ suprafața la sol × 3
        const suprafataPeretiTavan = Math.round(squareMeters * 3);

        console.log(`📐 [Calcule] Gresie/faianță: ${Math.round(suprafataGresie)} mp`);
        console.log(`📐 [Calcule] Parchet: ${Math.round(suprafataParchet)} mp`);
        console.log(`📐 [Calcule] Pereți+tavan: ${suprafataPeretiTavan} mp`);

        // Apelul 2: Devizierul generează lista de lucrări
        const materiale = await apelDevizier(apiKey, {
            description, squareMeters, category,
            camere, nr_uis,
            listaServicii,
            suprafataGresie,
            suprafataParchet,
            suprafataPeretiTavan
        });

        console.log("✅ [DEBUG] Structură finală trimisă la calculatoare:", materiale);
        return { materiale };
    }

    // TOATE CELELALTE CATEGORII → un singur apel optimizat
    const materiale = await apelSimple(apiKey, {
        description, squareMeters, category, listaServicii
    });

    console.log("✅ [DEBUG] Structură finală trimisă la calculatoare:", materiale);
    return { materiale };
}