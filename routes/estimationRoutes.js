export async function calculateEstimate(materialeAi, category) { // <--- Adăugăm category aici
    let totalGeneral = 0;
    const detalii = [];
    const catalogCategorie = materialPrices[category.toLowerCase()] || {};

    for (const mat of materialeAi) {
        // Căutăm prețul în categoria corectă
        const pretUnitar = catalogCategorie[mat.nume] || 0;

        if (pretUnitar > 0) {
            const totalSarcina = pretUnitar * mat.cantitate;
            totalGeneral += totalSarcina;

            detalii.push({
                sarcina: mat.nume,
                manopera: pretUnitar, // În listele tale prețul include manopera
                materiale: 0,
                total: Number(totalSarcina.toFixed(2))
            });
        }
    }

    // Adăugăm o marjă de 10% neprevăzute să pară profesional
    const neprevazute = totalGeneral * 0.1;
    
    return {
        totalGeneral: Number((totalGeneral + neprevazute).toFixed(2)),
        detalii
    };
}