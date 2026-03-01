// utils/scraper.js
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Păstrăm și logica de fallback pe JSON-ul local
const localPrices = require("../data/materialPrices.json");

/**
 * Extrage prețul unui produs direct de pe site-ul Dedeman
 * @param {string} url - Link-ul produsului
 */
export async function getDedemanPrice(url) {
    try {
        const response = await fetch(url, {
            headers: {
                // Ne prefacem că suntem un browser normal ca să nu fim blocați
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        // Selectorul de preț specific pentru Dedeman
        const priceText = $('.product-price-value').first().text().trim();
        
        if (!priceText) return null;

        // Curățăm textul: eliminăm literele și transformăm virgula în punct
        const cleanPrice = parseFloat(priceText.replace(/[^0-9,]/g, '').replace(',', '.'));
        
        console.log(`✅ Preț extras live: ${cleanPrice} RON`);
        return cleanPrice;
    } catch (error) {
        console.error(`❌ Eroare scraping Dedeman pentru ${url}:`, error.message);
        return null;
    }
}

/**
 * Logica ta originală, dar îmbunătățită să suporte categorii
 */
export function getPriceFromLocalDB(materialName, category) {
    const categoryKey = category?.toLowerCase() || "case la rosu";
    const catalog = localPrices[categoryKey] || {};

    const foundKey = Object.keys(catalog).find(key =>
        materialName.toLowerCase().includes(key.toLowerCase())
    );

    if (!foundKey) return null;
    return catalog[foundKey];
}