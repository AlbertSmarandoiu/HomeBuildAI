// models/InteriorRequest.js
import mongoose from "mongoose";

const InteriorRequestSchema = new mongoose.Schema({
  title: { type: String, default: "Lucrare interioară" },
  description: { type: String, required: true },
  squareMeters: { type: String, required: true },
  county: { type: String, required: true },
  materialQuality: { type: String, required: true },
  images: { type: [String], default: [] },
  category: { type: String, default: "interioare" },
  date: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model("InteriorRequest", InteriorRequestSchema);