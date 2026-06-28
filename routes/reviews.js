import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { addReview, getReviewsForPro } from '../Controllers/reviewController.js';

const router = express.Router();

// Beneficiar: adaugă recenzie (protejat)
router.post('/', verifyToken, addReview);

// Public: preia recenziile unui constructor
router.get('/pro/:proId', getReviewsForPro);

export default router;
