import Offer from '../models/Offer.js';
import WorkRequest from '../models/WorkRequest.js';
import Pro from '../models/Pro.js';

// Constructor trimite o ofertă la o lucrare
export async function sendOffer(req, res) {
    try {
        const { workRequestId, price, message } = req.body;
        const proId = req.user.id;

        const workRequest = await WorkRequest.findById(workRequestId);
        if (!workRequest)
            return res.status(404).json({ message: "Lucrarea nu a fost găsită." });

        if (workRequest.status !== 'pending')
            return res.status(400).json({ message: "Lucrarea nu mai acceptă oferte." });

        const existing = await Offer.findOne({ workRequestId, proId });
        if (existing)
            return res.status(400).json({ message: "Ai trimis deja o ofertă pentru această lucrare." });

        const offer = await Offer.create({
            workRequestId,
            proId,
            userId: workRequest.userId,
            price,
            message
        });

        res.status(201).json({ message: "Ofertă trimisă cu succes!", offer });
    } catch (error) {
        console.error("Eroare sendOffer:", error);
        res.status(500).json({ message: "Eroare server." });
    }
}

// Beneficiarul vede ofertele pentru una din lucrările lui
export async function getOffersForRequest(req, res) {
    try {
        const { workRequestId } = req.params;

        const workRequest = await WorkRequest.findById(workRequestId);
        if (!workRequest)
            return res.status(404).json({ message: "Lucrarea nu a fost găsită." });

        if (workRequest.userId.toString() !== req.user.id)
            return res.status(403).json({ message: "Nu ai acces la această lucrare." });

        const offers = await Offer.find({ workRequestId })
            .populate('proId', 'companyName contactEmail telefon rating reviewCount portfolioImages description');

        res.status(200).json(offers);
    } catch (error) {
        console.error("Eroare getOffersForRequest:", error);
        res.status(500).json({ message: "Eroare server." });
    }
}

// Beneficiarul acceptă o ofertă
export async function acceptOffer(req, res) {
    try {
        const { offerId } = req.params;

        const offer = await Offer.findById(offerId);
        if (!offer)
            return res.status(404).json({ message: "Oferta nu a fost găsită." });

        const workRequest = await WorkRequest.findById(offer.workRequestId);
        if (!workRequest)
            return res.status(404).json({ message: "Lucrarea nu a fost găsită." });

        if (workRequest.userId.toString() !== req.user.id)
            return res.status(403).json({ message: "Nu ai permisiunea de a accepta această ofertă." });

        if (workRequest.status !== 'pending')
            return res.status(400).json({ message: "Lucrarea are deja o ofertă acceptată." });

        // Acceptă oferta selectată
        offer.status = 'accepted';
        await offer.save();

        // Respinge toate celelalte oferte pentru aceeași lucrare
        await Offer.updateMany(
            { workRequestId: offer.workRequestId, _id: { $ne: offerId } },
            { status: 'rejected' }
        );

        // Actualizează lucrarea
        workRequest.status = 'accepted';
        workRequest.acceptedProId = offer.proId;
        await workRequest.save();

        res.status(200).json({ message: "Ofertă acceptată!", offer, workRequest });
    } catch (error) {
        console.error("Eroare acceptOffer:", error);
        res.status(500).json({ message: "Eroare server." });
    }
}

// Beneficiarul respinge o ofertă
export async function rejectOffer(req, res) {
    try {
        const { offerId } = req.params;

        const offer = await Offer.findById(offerId);
        if (!offer)
            return res.status(404).json({ message: "Oferta nu a fost găsită." });

        const workRequest = await WorkRequest.findById(offer.workRequestId);
        if (workRequest.userId.toString() !== req.user.id)
            return res.status(403).json({ message: "Nu ai permisiunea." });

        offer.status = 'rejected';
        await offer.save();

        res.status(200).json({ message: "Ofertă respinsă.", offer });
    } catch (error) {
        console.error("Eroare rejectOffer:", error);
        res.status(500).json({ message: "Eroare server." });
    }
}

// Beneficiarul marchează lucrarea ca finalizată
export async function completeWork(req, res) {
    try {
        const { workRequestId } = req.params;

        const workRequest = await WorkRequest.findById(workRequestId);
        if (!workRequest)
            return res.status(404).json({ message: "Lucrarea nu a fost găsită." });

        if (workRequest.userId.toString() !== req.user.id)
            return res.status(403).json({ message: "Nu ai permisiunea." });

        if (workRequest.status !== 'accepted')
            return res.status(400).json({ message: "Lucrarea nu este în curs (status incorect)." });

        workRequest.status = 'completed';
        await workRequest.save();

        res.status(200).json({ message: "Lucrare marcată ca finalizată!", workRequest });
    } catch (error) {
        console.error("Eroare completeWork:", error);
        res.status(500).json({ message: "Eroare server." });
    }
}

// Constructorul vede ofertele lui (cu statusul fiecăreia)
export async function getMyOffers(req, res) {
    try {
        const proId = req.user.id;
        const offers = await Offer.find({ proId })
            .populate('workRequestId', 'category description county squareMeters status');

        res.status(200).json(offers);
    } catch (error) {
        console.error("Eroare getMyOffers:", error);
        res.status(500).json({ message: "Eroare server." });
    }
}
