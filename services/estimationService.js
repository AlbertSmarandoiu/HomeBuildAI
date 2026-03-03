import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { updateAllPrices } from '../services/priceUpdater.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const materialPrices = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/materialPrices.json'), 'utf8')
);
import { getDedemanPrice } from '../utils/scraper.js';

// Definim link-urile pentru materialele de bază
const dedemanLinks = {
    "Beton B250": "https://www.dedeman.ro/ro/beton-premixat-b250-25-kg/p/6042456", 
    "Fier beton": "https://www.dedeman.ro/ro/otel-beton-pc-52-8-mm-bara-12-m/p/6001258",
    "Caramida": "https://www.dedeman.ro/ro/caramida-interior/-exterior-porotherm-30-robust-250-x-300-x-238-mm/p/6031026",
    "Glet tencuiala": "https://www.dedeman.ro/ro/glet-pe-baza-de-ipsos-adeplast-pg-ipsos-20-kg/p/6000213"
};

// services/estimationService.js
// services/estimationService.js
export async function calculateEstimate(materialeAi, squareMeters, category) {
    const safeCategory = (category || "lucrari interioare").toLowerCase().trim();
    const catalogCategorie = materialPrices[safeCategory] || {};
    
    let totalGeneral = 0;
    const detalii = [];

    // Verificăm dacă avem materiale primite de la AI
    if (!materialeAi || !Array.isArray(materialeAi)) {
        return { totalGeneral: 0, detalii: [] };
    }

    for (const mat of materialeAi) {
        const numeMaterialAI = mat.nume.toLowerCase();

        // Căutăm cea mai bună potrivire în catalog
        const keyInCatalog = Object.keys(catalogCategorie).find(key => 
            numeMaterialAI.includes(key.toLowerCase()) || 
            key.toLowerCase().includes(numeMaterialAI)
        );

        const pretUnitar = keyInCatalog ? catalogCategorie[keyInCatalog] : 0;

        if (pretUnitar > 0) {
            const totalSarcina = pretUnitar * mat.cantitate;
            totalGeneral += totalSarcina;

            detalii.push({
                sarcina: keyInCatalog, // Folosim numele profesional din JSON-ul tău
                cantitate: Number(mat.cantitate.toFixed(2)),
                pretUnitar: pretUnitar,
                total: Number(totalSarcina.toFixed(2))
            });
        } else {
            console.log(`⚠️ Lipsă preț în catalogul "${safeCategory}" pentru: "${mat.nume}"`);
        }
    }

    const neprevazute = totalGeneral * 0.1; // Marjă de 10%
    return {
        totalGeneral: Number((totalGeneral + neprevazute).toFixed(2)),
        detalii
    };
}