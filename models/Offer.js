import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
    workRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkRequest', required: true },
    proId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Pro', required: true },
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price:         { type: Number, required: true },
    message:       { type: String, default: '' },
    status:        { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt:     { type: Date, default: Date.now }
});

export default mongoose.model('Offer', OfferSchema);
