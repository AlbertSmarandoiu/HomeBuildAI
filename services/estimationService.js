import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function calculateEstimate(aiTasks, squareMeters, category, materialQuality = "Standard") {
    try {
        const pricesPath = path.join(__dirname, '../data/materialPrices.json'); 
        const catalog = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));

        const cleanCategory = category.toLowerCase().replace(/\s/g, "")
            .replace(/ș/g, "s").replace(/ț/g, "t").replace(/ă/g, "a").replace(/â/g, "a").replace(/î/g, "i");

        const categoryMap = {
            "lucrariinterioare": "interioare", "interior": "interioare", "interioare": "interioare",
            "lucrariexterioare": "exterior", "exterior": "exterior", "exterioare": "exterior",
            "caselarosu": "caselarosu", "mobila": "mobila"
        };

        const jsonKey = categoryMap[cleanCategory] || cleanCategory;
        const categoriaSelectata = catalog[jsonKey] || {};

        let totalMateriale = 0;
        let totalManopera = 0;
        let detalii = [];

        if (!Array.isArray(aiTasks)) {
            return { totalGeneral: 0, detalii: [{ sarcina: "Nu s-au primit sarcini de la AI", total: 0 }] };
        }
            let tracker = {}; // 🌟 NOU: Tracker pentru a combina duplicatele!
        const intrariCatalog = Object.entries(categoriaSelectata).sort((a, b) => b[0].length - a[0].length);
        let multiplicatorMaterial = 1.0; // Standard

        if (materialQuality && materialQuality.toLowerCase() === "economic") {
            multiplicatorMaterial = 0.9; // Reducere 10%
        } else if (materialQuality && materialQuality.toLowerCase() === "premium") {
            multiplicatorMaterial = 1.2; // Adăugare 20%
        }

        aiTasks.forEach(task => {
            let textAI = "";
            let cantitateEstimata = 1;

            if (typeof task === 'object' && task.cheie) {
                textAI = task.cheie.toLowerCase();
                cantitateEstimata = Number(task.cantitate) || Number(squareMeters); 
            } else {
                textAI = String(task).toLowerCase();
                cantitateEstimata = Number(squareMeters); 
            }

            textAI = textAI.replace(/ș/g, "s").replace(/ț/g, "t").replace(/ă/g, "a").replace(/â/g, "a").replace(/î/g, "i").trim();
            let gasit = false;

            for (const [cheieJson, detaliiPret] of intrariCatalog) {
                let cheieLower = cheieJson.toLowerCase()
                    .replace(/ș/g, "s").replace(/ț/g, "t").replace(/ă/g, "a").replace(/â/g, "a").replace(/î/g, "i").trim();

                const radacinaAI = textAI.substring(0, 5);
                const radacinaJSON = cheieLower.substring(0, 5);

                if (textAI.includes(cheieLower) || cheieLower.includes(textAI) || radacinaAI === radacinaJSON) {
                    
                    // NOU: Dacă există deja în deviz, doar adunăm cantitatea. Dacă nu, îl creăm.
                    if (!tracker[cheieJson]) {
                        tracker[cheieJson] = {
                            sarcina: detaliiPret.nume,
                            pret_material: detaliiPret.pret_material,
                            pret_manopera: detaliiPret.pret_manopera,
                            cantitateTotala: 0
                        };
                    }
                    
                    tracker[cheieJson].cantitateTotala += cantitateEstimata;
                    gasit = true;
                    break;
                }
            }

            if (!gasit && textAI.length > 2) {
                detalii.push({
                    sarcina: `(Necunoscut) ${task.cheie || task}`, lucrare: `(Necunoscut) ${task.cheie || task}`,
                    manopera: 0, costManopera: 0, materiale: 0, costMateriale: 0, total: 0
                });
            }
        });

        // 🌟 NOU: Construim array-ul final din Tracker
        for (const key in tracker) {
            const item = tracker[key];
            const costMat = (item.cantitateTotala * item.pret_material) * multiplicatorMaterial;
            const costMan = item.cantitateTotala * item.pret_manopera;

            totalMateriale += costMat;
            totalManopera += costMan;

            detalii.push({
                sarcina: item.sarcina,
                lucrare: item.sarcina,
                cantitate: item.cantitateTotala,
                manopera: costMan,
                costManopera: costMan,
                materiale: costMat,
                costMateriale: costMat,
                total: costMat + costMan
            });
        }

        return {
            totalGeneral: totalMateriale + totalManopera,
            detalii: detalii
        };

    } catch (err) {
        console.error("❌ Eroare in estimationService:", err.message);
        throw err;
    }
}