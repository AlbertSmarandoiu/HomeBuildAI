import mongoose from "mongoose";

const portfolioItemSchema = new mongoose.Schema({
    // Referința la profesionistul care a realizat lucrarea
    proId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pro', // Asigură-te că acesta se potrivește cu numele modelului tău Pro (sau Firma)
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    // Domeniul lucrării (ex: 'interioare', 'mobila', 'exterior')
    category: {
        type: String,
        required: true,
    },
    // Array de URL-uri (pentru imaginile stocate pe server sau un serviciu cloud)
    images: {
        type: [String],
        default: [],
    },
    dateCompleted: {
        type: Date,
    },
}, { timestamps: true });

export default mongoose.model("PortfolioItem", portfolioItemSchema);