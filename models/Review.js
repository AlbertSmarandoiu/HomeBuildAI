import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    proId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Pro', required: true },
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkRequest', required: true },
    rating:        { type: Number, required: true, min: 1, max: 5 },
    comment:       { type: String, default: '' },
    createdAt:     { type: Date, default: Date.now }
});

// Un beneficiar poate lăsa o singură recenzie per lucrare
ReviewSchema.index({ userId: 1, workRequestId: 1 }, { unique: true });

export default mongoose.model('Review', ReviewSchema);
