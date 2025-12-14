

import mongoose from "mongoose";

const proSchema = new mongoose.Schema({
    companyName: String,
    contactEmail: { type: String, unique: true },
    // ... (alte câmpuri existente)
    password: String,
    skills: [String],
    date: Date,
    
    // 🚨 NOI CÂMPURI ADĂUGATE
    description: { type: String, default: "Suntem o echipă de profesioniști gata să ajute la proiectul tău." },
    portfolioImages: { type: [String], default: [] }, // Array de URL-uri pentru portofoliu (imagini)
});

export default mongoose.model("Pro", proSchema);