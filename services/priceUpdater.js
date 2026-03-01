import fs from 'fs';
import { getDedemanPrice } from '../utils/scraper.js';

const URLS_DEDEMAN = {
    "Beton B250": "https://www.dedeman.ro/ro/beton-premixat-b250...", // Exemplu URL real
    "Fier beton": "https://www.dedeman.ro/ro/otel-beton-pc52...",
    "Glet tencuiala": "https://www.dedeman.ro/ro/glet-pe-baza-de-ipsos..."
};

export async function updateAllPrices() {
    const path = './data/materialPrices.json';
    let currentData = JSON.parse(fs.readFileSync(path, 'utf8'));

    console.log("🔄 Începem actualizarea prețurilor de la Dedeman...");

    for (const [material, url] of Object.entries(URLS_DEDEMAN)) {
        const newPrice = await getDedemanPrice(url);
        if (newPrice) {
            // Căutăm în toate categoriile și actualizăm unde găsim materialul
            for (const categorie in currentData) {
                if (currentData[categorie][material] !== undefined) {
                    currentData[categorie][material] = newPrice;
                }
            }
        }
    }

    fs.writeFileSync(path, JSON.stringify(currentData, null, 2));
    console.log("✅ Toate prețurile au fost sincronizate cu Dedeman!");
}