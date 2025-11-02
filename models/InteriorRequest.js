import mongoose from "mongoose";

const interiorSchema = new mongoose.Schema({
  description: String,
  squareMeters: String,
  county: String,
  materialQuality: String,
  images: [String],
  date: { type: Date, default: Date.now },
});

export default mongoose.model("InteriorRequest", interiorSchema);
