import Review from '../models/Review.js';
import WorkRequest from '../models/WorkRequest.js';
import Pro from '../models/Pro.js';

// Beneficiarul adaugă o recenzie după finalizarea lucrării
export async function addReview(req, res) {
    try {
        const { proId, workRequestId, rating, comment } = req.body;
        const userId = req.user.id;

        const workRequest = await WorkRequest.findById(workRequestId);
        if (!workRequest)
            return res.status(404).json({ message: "Lucrarea nu a fost găsită." });

        if (workRequest.userId.toString() !== userId)
            return res.status(403).json({ message: "Nu poți recenza o lucrare care nu îți aparține." });

        if (workRequest.status !== 'completed')
            return res.status(400).json({ message: "Poți recenza doar lucrările finalizate." });

        if (workRequest.acceptedProId?.toString() !== proId)
            return res.status(400).json({ message: "Constructorul nu corespunde lucrării." });

        const review = await Review.create({ proId, userId, workRequestId, rating, comment });

        // Recalculează media rating-ului constructorului
        const allReviews = await Review.find({ proId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await Pro.findByIdAndUpdate(proId, {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: allReviews.length
        });

        res.status(201).json({ message: "Recenzie adăugată!", review });
    } catch (error) {
        if (error.code === 11000)
            return res.status(400).json({ message: "Ai lăsat deja o recenzie pentru această lucrare." });
        console.error("Eroare addReview:", error);
        res.status(500).json({ message: "Eroare server." });
    }
}

// Preia toate recenziile unui constructor (public)
export async function getReviewsForPro(req, res) {
    try {
        const { proId } = req.params;

        const reviews = await Review.find({ proId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        console.error("Eroare getReviewsForPro:", error);
        res.status(500).json({ message: "Eroare server." });
    }
}
