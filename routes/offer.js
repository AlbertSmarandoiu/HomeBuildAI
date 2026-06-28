import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { sendOffer, getOffersForRequest, acceptOffer, rejectOffer, completeWork, getMyOffers } from '../Controllers/offerController.js';

const router = express.Router();

router.post('/', verifyToken, sendOffer);
router.get('/my', verifyToken, getMyOffers);
router.get('/request/:workRequestId', verifyToken, getOffersForRequest);
router.patch('/:offerId/accept', verifyToken, acceptOffer);
router.patch('/:offerId/reject', verifyToken, rejectOffer);
router.patch('/complete/:workRequestId', verifyToken, completeWork);

export default router;