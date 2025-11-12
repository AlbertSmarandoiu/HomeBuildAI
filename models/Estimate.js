// models/Estimate.js
import mongoose from "mongoose";

const estimateSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "InteriorRequest", required: true },
  estimate: { type: mongoose.Schema.Types.Mixed }, // stocăm răspunsul LLM
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Estimate", estimateSchema);
