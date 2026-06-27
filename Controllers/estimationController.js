import fs from 'fs';
import path from 'path';
import { extractMaterialsFromAI } from "../services/aiService.js";
import sendPriceEstimateEmail from "../utils/emailService.js";

export async function getPriceEstimate(req, res) {
    const {
        description,
        squareMeters,
        category,
        email
    } = req.query; 

    try {
        console.log(`🚀 Pornim estimarea pentru categoria: ${category}`);

        // 1️⃣ AI-ul analizează descrierea și decide CE LUCRĂRI sunt necesare.
        // Așteptăm să returneze un array de "chei" care se regăsesc în JSON-ul nostru.
        // Ex: { materiale: ["tencuiala", "glet", "lavabila"] }
        const aiResult = await extractMaterialsFromAI({
            description,
            squareMeters,
            category
        });

        if (!aiResult || !aiResult.materiale || aiResult.materiale.length === 0) {
            throw new Error("AI nu a putut deduce materialele necesare din descriere.");
        }

        // 2️⃣ Încărcăm catalogul nostru exact de prețuri
        const pricesPath = path.resolve('./materialPrices.json'); 
        const catalog = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
        
        const cleanCategory = category.toLowerCase().replace(/\s/g, "")
            .replace(/ș/g, "s").replace(/ț/g, "t").replace(/ă/g, "a").replace(/â/g, "a").replace(/î/g, "i");

        // 🌟 MAPAREA AICI LA FEL:
        const categoryMap = {
            "lucrariinterioare": "interioare", "interior": "interioare", "interioare": "interioare",
            "lucrariexterioare": "exterior", "exterior": "exterior", "exterioare": "exterior",
            "caselarosu": "caselarosu", "mobila": "mobila"
        };
        const jsonKey = categoryMap[cleanCategory] || cleanCategory;
        const categoriaSelectata = catalog[jsonKey]; 

        if (!categoriaSelectata) {
            throw new Error(`Categoria '${jsonKey}' nu există în catalogul de prețuri.`);
        }
        let totalGeneralMateriale = 0;
        let totalGeneralManopera = 0;
        let devizDetaliat = [];

        // 3️⃣ Mapăm deciziile AI-ului pe prețurile noastre reale
        aiResult.materiale.forEach(taskKey => {
            const cheie = taskKey.toLowerCase().trim();
            
            // Dacă AI-ul a propus o lucrare care există în catalogul nostru
            if (categoriaSelectata[cheie]) {
                const priceConfig = categoriaSelectata[cheie];
                const cantitate = Number(squareMeters); // Folosim suprafața introdusă

                const costMaterial = cantitate * priceConfig.pret_material;
                const costManopera = cantitate * priceConfig.pret_manopera;

                totalGeneralMateriale += costMaterial;
                totalGeneralManopera += costManopera;

                // Construim linia curată pentru email și Frontend
                devizDetaliat.push({
                    serviciu: priceConfig.nume,
                    cantitate: cantitate,
                    unitate: priceConfig.unitate,
                    cost_materiale: costMaterial,
                    cost_manopera: costManopera,
                    subtotal: costMaterial + costManopera
                });
            }
        });

        const totalGeneral = totalGeneralMateriale + totalGeneralManopera;

        // 4️⃣ Trimitem emailul doar cu datele validate și calculate de noi
        if (email) {
            await sendPriceEstimateEmail(
                email,
                totalGeneral,
                devizDetaliat, // Trimitem lista curată cu servicii
                description,
                squareMeters
            );
            console.log(`✉️ Email de estimare trimis cu succes către: ${email}`);
        }

        // 5️⃣ Returnăm răspunsul către aplicația mobilă
        return res.status(200).json({
            succes: true,
            total_materiale: totalGeneralMateriale,
            total_manopera: totalGeneralManopera,
            total: totalGeneral,
            detalii: devizDetaliat
        });

    } catch (err) {
        console.error("❌ Estimation error:", err.message);

        return res.status(500).json({
            succes: false,
            error: err.message
        });
    }
}