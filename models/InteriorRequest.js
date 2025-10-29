import mongoose from "mongoose";

const interiorRequestSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    squareMeters: { type: Number, required: true },
    county: { type: String, required: true },
    images: [{ type: String }], // link-uri imagini
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional, dacă vrei legătură cu userul
    status: { type: String, default: "noua" },
  },
  { timestamps: true }
);

const InteriorRequest = mongoose.model("InteriorRequest", interiorRequestSchema);
export default InteriorRequest;
